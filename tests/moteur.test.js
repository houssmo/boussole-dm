// Tests unitaires du moteur et de l'interpréteur de conditions (node:test, sans dépendance).
// Les règles utilisées ici sont factices : on teste la mécanique, pas le droit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluerCondition, testerReponse, normaliser } from '../src/conditions.js';
import { evaluer, prochaineQuestion, nouvelleSaisie, rapprocherExemples } from '../src/moteur.js';

const ON = [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }];
const src = [{ document: 'test', reference: '-', version: '-', url: 'https://health.ec.europa.eu/x', extrait: null, consulte_le: null }];

/** Jeu de règles minimal : deux questions de qualification, une de classe, l'agrégation et une conséquence par classe. */
function jeu() {
  return {
    meta: { ordre_classes: ['I', 'IIa', 'IIb', 'III'], ordre_evaluation: ['qualification', 'perimetre', 'classification', 'consequences', 'destination'] },
    etapes: ['destination', 'qualification', 'perimetre', 'classification', 'consequences'].map((id, i) => ({ id, ordre: i + 1 })),
    regles: [
      { id: 'A', etape: 'qualification', type: 'question', portee: 'module', options: ON, effets: [{ si: 'non', alors: [{ type: 'qualification', valeur: 'non_dm' }, { type: 'fin_module' }] }], sources: src },
      { id: 'B', etape: 'qualification', type: 'question', portee: 'module', options: ON, effets: [{ si: 'oui', alors: [{ type: 'qualification', valeur: 'dm_mdr' }] }, { si: 'non', alors: [{ type: 'qualification', valeur: 'non_dm' }] }], sources: src },
      { id: 'P', etape: 'perimetre', type: 'deduction', portee: 'module', condition: { qualification_dans: ['dm_mdr'] }, effets: [{ type: 'perimetre', valeur: 'dm' }], sources: src },
      { id: 'C', etape: 'classification', type: 'question', portee: 'module', condition: { qualification_dans: ['dm_mdr'] }, options: ['I', 'IIa', 'IIb', 'III'].map((v) => ({ valeur: v })), effets: ['I', 'IIa', 'IIb', 'III'].map((v) => ({ si: v, alors: [{ type: 'classe', valeur: v }] })), zones_grises: ['Z'], sources: src },
      { id: 'MAX', etape: 'classification', type: 'deduction', portee: 'produit', condition: { modules: 'au_moins_un', condition: { perimetre_dans: ['dm'] } }, effets: [{ type: 'agregation_classes', methode: 'maximum' }], sources: src },
      { id: 'K', etape: 'consequences', type: 'deduction', portee: 'produit', condition: { classe_dans: ['IIa', 'IIb', 'III'] }, effets: [{ type: 'consequence', id: 'ON' }], sources: src },
      { id: 'D', etape: 'destination', type: 'deduction', portee: 'produit', condition: { tous: [{ texte: 'revendications', contient_un_de: ['diagnostic'] }, { modules: 'aucun', condition: { qualification_dans: ['dm_mdr'] } }] }, effets: [{ type: 'signal', gravite: 'avertissement', message: 'incohérence' }], sources: src },
    ],
    consequences: [{ id: 'ON', titre: 'Organisme notifié', organisme_notifie: true, sources: src }],
    zones_grises: [{ id: 'Z', titre: 'Zone', lectures: [], sources: src }],
  };
}
const saisie = (modules, revendications = []) => ({ ...nouvelleSaisie('T'), modules, revendications });

test('normaliser retire les accents et la casse', () => {
  assert.equal(normaliser('Prévention ÉLÈVE'), 'prevention eleve');
});

test('testerReponse : égal, dans, contient_un_de, egal_exactement', () => {
  assert.ok(testerReponse('oui', { egal: 'oui' }));
  assert.ok(testerReponse('b', { dans: ['a', 'b'] }));
  assert.ok(testerReponse(['x', 'y'], { contient_un_de: ['y'] }));
  assert.ok(testerReponse(['aucune'], { egal_exactement: ['aucune'] }));
  assert.ok(!testerReponse(['aucune', 'x'], { egal_exactement: ['aucune'] }));
  assert.ok(!testerReponse(undefined, { egal: 'oui' }));
});

test('une condition inconnue lève une erreur (faute de frappe dans les données)', () => {
  assert.throws(() => evaluerCondition({ qualificaton_dans: ['dm_mdr'] }, {}), /Condition inconnue/);
});

test('combinaisons logiques et quantificateurs', () => {
  const ctx = { modules: [{ qualification: 'dm_mdr' }, { qualification: 'non_dm' }], revendications: [{ texte: 'Aide au DIAGNOSTIC' }], reponse: () => undefined };
  assert.ok(evaluerCondition({ modules: 'au_moins_un', condition: { qualification_dans: ['dm_mdr'] } }, ctx));
  assert.ok(!evaluerCondition({ modules: 'tous', condition: { qualification_dans: ['dm_mdr'] } }, ctx));
  assert.ok(evaluerCondition({ tous: [{ texte: 'revendications', contient_un_de: ['diagnostic'] }, { non: { modules: 'aucun', condition: { qualification_dans: ['non_dm'] } } }] }, ctx));
  assert.ok(evaluerCondition({ tous: [] }, ctx));
});

test('fin_module arrête la qualification du module', () => {
  const res = evaluer(jeu(), saisie([{ id: 'm', reponses: { A: 'non', B: 'oui' } }]));
  assert.equal(res.modules[0].qualification, 'non_dm');
  assert.deepEqual(res.reponses_ignorees, [{ regle: 'B', module: 'm' }]);
});

test('les questions sans réponse sont listées dans l’ordre des étapes', () => {
  const regles = jeu();
  const res = evaluer(regles, saisie([{ id: 'm', reponses: { A: 'oui' } }]));
  assert.equal(res.complet, false);
  assert.deepEqual(res.en_attente.map((q) => q.regle), ['B']);
  assert.equal(prochaineQuestion(regles, saisie([{ id: 'm', reponses: { A: 'oui', B: 'oui' } }])).regle, 'C');
});

test('classe du produit : maximum des modules du DM, conséquence et zone grise', () => {
  const res = evaluer(jeu(), saisie([
    { id: 'a', reponses: { A: 'oui', B: 'oui', C: 'IIa' } },
    { id: 'b', reponses: { A: 'oui', B: 'oui', C: 'IIb' } },
    { id: 'c', reponses: { A: 'oui', B: 'non' } },
  ]));
  assert.equal(res.complet, true);
  assert.deepEqual(res.modules.map((m) => m.classe), ['IIa', 'IIb', null]);
  assert.equal(res.classe, 'IIb');
  assert.equal(res.organisme_notifie, true);
  assert.deepEqual(res.zones_grises.map((z) => z.id), ['Z']);
  assert.equal(res.zones_grises[0].declenchee_par.length, 2);
});

test('sans règle d’agrégation, la classe du produit n’est pas inventée', () => {
  const regles = jeu();
  regles.regles = regles.regles.filter((r) => r.id !== 'MAX');
  const une = evaluer(regles, saisie([{ id: 'a', reponses: { A: 'oui', B: 'oui', C: 'IIa' } }]));
  assert.equal(une.classe, 'IIa', 'une classe unique se passe d’agrégation');
  const deux = evaluer(regles, saisie([{ id: 'a', reponses: { A: 'oui', B: 'oui', C: 'IIa' } }, { id: 'b', reponses: { A: 'oui', B: 'oui', C: 'III' } }]));
  assert.equal(deux.classe, null);
  assert.ok(deux.signaux.some((s) => s.gravite === 'bloquant'));
});

test('le contrôle de destination voit les qualifications (évalué en dernier)', () => {
  const res = evaluer(jeu(), saisie([{ id: 'm', reponses: { A: 'oui', B: 'non' } }], [{ support: 'notice', texte: 'Aide au diagnostic' }]));
  assert.ok(res.signaux.some((s) => s.regle === 'D'));
  const res2 = evaluer(jeu(), saisie([{ id: 'm', reponses: { A: 'oui', B: 'oui', C: 'I' } }], [{ support: 'notice', texte: 'Aide au diagnostic' }]));
  assert.ok(!res2.signaux.some((s) => s.regle === 'D'));
});

test('rapprochement d’exemples : mots-clés en début de mot seulement', () => {
  const ex = { exemples: [{ id: 'E1', mots_cles: ['ecg'] }, { id: 'E2', mots_cles: ['dose', 'insuline'] }] };
  const res = rapprocherExemples(ex, { description: 'Lecture de bécg et calcul de dose d’insuline', modules: [] });
  assert.deepEqual(res.map((e) => e.id), ['E2']);
  assert.deepEqual(res[0].mots_trouves, ['dose', 'insuline']);
});

test('les vraies données se chargent et une saisie vide ne plante pas', () => {
  const regles = JSON.parse(readFileSync(new URL('../data/regles.json', import.meta.url), 'utf8'));
  const res = evaluer(regles, nouvelleSaisie('vide'));
  assert.equal(res.classe, null);
  assert.ok(res.en_attente.some((q) => q.regle === 'D-1'));
});

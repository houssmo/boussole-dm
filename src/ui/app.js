// Interface de Boussole DM. Les questions affichées viennent toutes de data/regles.json, via le moteur.
import { evaluer, nouvelleSaisie } from '../moteur.js';
import { h, idSur, dateFr } from './dom.js';
import { encadreSources, pastilleStatut } from './sources.js';
import { schemaPerimetre } from './perimetre-svg.js';
import { rapport, descriptionEffets } from './rapport.js';
import * as stockage from './stockage.js';

const SUPPORTS = [['notice', 'Notice'], ['etiquetage', 'Étiquetage'], ['site', 'Site internet'], ['boutique', "Boutique d'applications"], ['plaquette', 'Plaquette'], ['autre', 'Autre']];
const CAS_DEMO = [
  ['01-podometre-bien-etre', 'Podomètre et bien-être'],
  ['02-avc-imagerie', "Imagerie de l'AVC (3 modules, IA)"],
  ['03-fertilite-conception', 'Fertilité et conception (cas limite)'],
];

const etat = { regles: null, exemples: null, passage: null, res: null, etape: 'accueil', stockageOk: true, replies: new Set() };
const main = document.getElementById('contenu');
const nav = document.getElementById('etapes');
const annonce = document.getElementById('annonce');

/* ---------- Démarrage ---------- */
async function demarrer() {
  try {
    const [regles, exemples] = await Promise.all(['data/regles.json', 'data/exemples-mdcg.json'].map(async (u) => {
      const r = await fetch(u, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`${u} : ${r.status}`);
      return r.json();
    }));
    Object.assign(etat, { regles, exemples });
  } catch (e) {
    main.replaceChildren(h('p', { class: 'alerte alerte--bloquant' },
      'Les règles n’ont pas pu être chargées (', e.message, '). Si vous avez ouvert le fichier directement depuis votre disque, lancez plutôt un petit serveur local : ', h('code', {}, 'npm start'), ', puis ouvrez http://localhost:8080.'));
    return;
  }
  allerA('accueil', false); // au chargement, le focus reste en haut de page (lien d'évitement)
}

/* ---------- Passage courant ---------- */
function ouvrirPassage(passage, etape = 'destination') {
  etat.passage = passage;
  recalculer(false);
  allerA(etape);
}

function recalculer(sauver = true) {
  const avant = etat.res?.classe;
  etat.res = evaluer(etat.regles, etat.passage.saisie, etat.exemples);
  if (sauver) {
    const ok = stockage.enregistrerPassage(etat.passage);
    if (!ok && etat.stockageOk) { etat.stockageOk = false; dire("Enregistrement local indisponible dans ce navigateur : pensez à exporter le passage en JSON."); }
  }
  if (etat.res.classe !== avant && etat.res.classe) dire(`Classe obtenue : ${etat.res.classe}.`);
}

function dire(message) {
  annonce.textContent = '';
  setTimeout(() => { annonce.textContent = message; }, 50);
}

/** Modifie la saisie, recalcule et réaffiche l'étape en gardant le focus. */
function modifier(fn) {
  fn(etat.passage.saisie);
  recalculer();
  afficher();
}

function definirReponse(module, id, valeur) {
  modifier((saisie) => {
    const cible = module ? saisie.modules.find((m) => m.id === module).reponses : saisie.reponses;
    const vide = valeur === undefined || valeur === '' || (Array.isArray(valeur) && valeur.length === 0);
    if (vide) delete cible[id]; else cible[id] = valeur;
  });
}

/* ---------- Navigation ---------- */
function listeEtapes() {
  return [...etat.regles.etapes.map((e) => ({ id: e.id, titre: `${e.ordre}. ${e.titre}` })), { id: 'rapport', titre: 'Rapport' }];
}

function allerA(etape, focus = true) {
  etat.etape = etape;
  afficher(true);
  if (focus) { main.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }
}

function afficherNav() {
  if (!etat.passage || etat.etape === 'accueil') { nav.hidden = true; return; }
  nav.hidden = false;
  const attente = (id) => etat.res.en_attente.filter((q) => q.etape === id).length;
  nav.replaceChildren(h('ol', {},
    h('li', {}, h('button', { type: 'button', onclick: () => allerA('accueil') }, 'Passages')),
    listeEtapes().map((e) => h('li', {}, h('button', {
      type: 'button', 'aria-current': etat.etape === e.id ? 'step' : null, onclick: () => allerA(e.id),
    }, e.titre, attente(e.id) ? h('span', { class: 'pastille', title: 'Questions sans réponse' }, attente(e.id), h('span', { class: 'annonce' }, ' question(s) sans réponse')) : null)))));
}

function afficher(nouvelleEtape = false) {
  const focusId = nouvelleEtape ? null : document.activeElement?.id;
  afficherNav();
  const vues = { accueil: vueAccueil, destination: vueDestination, qualification: vueQualification, perimetre: vuePerimetre, classification: vueClassification, consequences: vueConsequences, zones_grises: vueZonesGrises, rapport: vueRapport };
  main.replaceChildren(vues[etat.etape]());
  document.title = `${etat.etape === 'accueil' ? '' : (listeEtapes().find((e) => e.id === etat.etape)?.titre + ' · ')}Boussole DM`;
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
}

/* ---------- Briques communes ---------- */
const regle = (id) => etat.regles.regles.find((r) => r.id === id);
const rangRegle = (id) => etat.regles.regles.findIndex((r) => r.id === id);
const zoneTitre = (id) => etat.regles.zones_grises.find((z) => z.id === id)?.titre ?? id;

function gabaritEtape(titre, intro, contenu) {
  const liste = listeEtapes();
  const i = liste.findIndex((e) => e.id === etat.etape);
  return h('div', {},
    h('h1', {}, titre),
    intro ? h('p', { class: 'intro' }, intro) : null,
    h('div', { class: 'etape' },
      h('div', {}, contenu,
        h('div', { class: 'navigation-etape' },
          i > 0 ? h('button', { type: 'button', class: 'btn btn--secondaire', onclick: () => allerA(liste[i - 1].id) }, '← ', liste[i - 1].titre) : h('span'),
          i < liste.length - 1 ? h('button', { type: 'button', class: 'btn', onclick: () => allerA(liste[i + 1].id) }, liste[i + 1].titre, ' →') : null)),
      resume()));
}

function resume() {
  const r = etat.res;
  const dm = r.modules.filter((m) => m.perimetre === 'dm').length;
  return h('aside', { class: 'resume', 'aria-label': 'Résultat en cours' },
    h('div', { class: 'carte' },
      h('div', { class: 'resume__icone icone-boussole' }, h('img', { src: 'assets/logo/source/icone.jpg', alt: '', width: 2000, height: 1116 })),
      h('p', { class: 'resume__classe' }, r.classe ? `Classe ${r.classe}` : '—', h('small', {}, r.classe ? 'classe du produit' : dm ? 'classe non encore déterminée' : 'aucun module dans le DM pour l’instant')),
      h('dl', {},
        h('dt', {}, 'Organisme notifié'), h('dd', {}, r.organisme_notifie === true ? 'Oui' : r.organisme_notifie === false ? 'Non' : '—'),
        h('dt', {}, 'Modules'), h('dd', {}, `${r.modules.length} saisi(s), ${dm} dans le DM`),
        h('dt', {}, 'Zones grises'), h('dd', {}, r.zones_grises.length || 'aucune'),
        h('dt', {}, 'Questions sans réponse'), h('dd', {}, r.en_attente.length || 'aucune')),
      h('button', { type: 'button', class: 'btn btn--secondaire', style: 'margin-top:8px', onclick: () => allerA('rapport') }, 'Voir le rapport')));
}

/** Une question tirée des données, avec ses options, son aide, ses zones grises et ses sources. */
function vueQuestion(r, moduleId) {
  const saisie = etat.passage.saisie;
  const valeur = moduleId ? saisie.modules.find((m) => m.id === moduleId).reponses[r.id] : saisie.reponses[r.id];
  const enAttente = etat.res.en_attente.some((q) => q.regle === r.id && q.module === moduleId);
  const base = idSur('q', moduleId ?? 'produit', r.id);
  const entete = [h('span', { class: 'id-regle' }, r.id), r.question];
  const pied = [
    r.aide ? h('p', { class: 'aide' }, r.aide) : null,
    (r.zones_grises ?? []).length ? h('p', { class: 'aide' }, 'Zone grise associée : ', r.zones_grises.map((z, i) => [i ? ', ' : '', h('a', { href: '#', onclick: (ev) => { ev.preventDefault(); allerA('zones_grises'); } }, `${z} · ${zoneTitre(z)}`)])) : null,
    encadreSources(r),
  ];

  if (r.type === 'saisie') {
    return h('div', { class: 'question' + (enAttente ? ' question--attente' : '') },
      h('label', { for: base }, ...entete),
      h('div', { class: 'champ' }, h('textarea', { id: base, onchange: (e) => definirReponse(moduleId, r.id, e.target.value.trim()) }, valeur ?? '')),
      ...pied);
  }
  const multiple = r.choix_multiple;
  const choisies = multiple ? (valeur ?? []) : [valeur];
  return h('fieldset', { class: 'question' + (enAttente ? ' question--attente' : '') },
    h('legend', {}, ...entete, enAttente ? h('span', { class: 'annonce' }, ' (sans réponse)') : null),
    h('div', { class: 'options' }, r.options.map((o) => {
      const id = idSur(base, o.valeur);
      return h('label', { class: 'option', for: id },
        h('input', {
          type: multiple ? 'checkbox' : 'radio', id, name: base, value: o.valeur, checked: choisies.includes(o.valeur),
          onchange: (e) => {
            if (!multiple) return definirReponse(moduleId, r.id, o.valeur);
            let liste = (valeur ?? []).filter((v) => v !== o.valeur);
            if (e.target.checked) {
              // Une option « exclusive » (ex. « aucune ») ne se combine pas avec les autres.
              liste = o.exclusive ? [o.valeur] : [...liste.filter((v) => !r.options.find((x) => x.valeur === v)?.exclusive), o.valeur];
            }
            definirReponse(moduleId, r.id, liste);
          },
        }),
        h('span', {}, o.libelle ?? o.valeur));
    })),
    ...pied);
}

/** Questions posées (répondues ou non) et constats d'une étape, pour un module ou pour le produit. */
function contenuEtape(etape, moduleId) {
  const r = etat.res;
  const ids = new Set([
    ...r.trace.filter((t) => t.etape === etape && t.module === moduleId && t.type !== 'deduction').map((t) => t.regle),
    ...r.en_attente.filter((q) => q.etape === etape && q.module === moduleId).map((q) => q.regle),
  ]);
  const questions = [...ids].map(regle).filter((x) => !x.champ_saisie).sort((a, b) => rangRegle(a.id) - rangRegle(b.id));
  const constats = r.trace.filter((t) => t.etape === etape && t.module === moduleId && t.type === 'deduction');
  return [
    questions.map((q) => vueQuestion(q, moduleId)),
    constats.map((t) => {
      const rg = regle(t.regle);
      const signal = t.effets.find((e) => e.type === 'signal');
      return h('div', { class: `alerte alerte--${signal?.gravite ?? 'info'}` },
        h('span', { class: 'id-regle' }, rg.id), descriptionEffets(t.effets, etat.regles).join(' · '), encadreSources(rg, { titre: 'Fondement' }));
    }),
  ];
}

function badgeQualification(m) {
  if (!m.qualification) return h('span', { class: 'badge' }, 'Qualification en cours');
  return h('span', { class: 'badge ' + (m.qualification === 'non_dm' ? 'badge--non' : 'badge--dm') }, etat.regles.qualifications[m.qualification]);
}

/* ---------- Vues ---------- */
function vueAccueil() {
  const passages = stockage.listerPassages();
  const champRef = h('input', { type: 'text', id: 'nouvelle-ref', placeholder: 'Ex. : CAS-04 Télésurveillance', autocomplete: 'off' });
  const importer = h('input', { type: 'file', id: 'import-json', accept: 'application/json,.json', class: 'annonce',
    onchange: async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const p = await stockage.importerFichier(f); stockage.enregistrerPassage(p); dire('Passage importé.'); ouvrirPassage(p); }
      catch (err) { dire(err.message); alert(err.message); }
      e.target.value = '';
    } });

  return h('div', {},
    h('h1', {}, 'Bienvenue dans Boussole DM'),
    h('p', { class: 'intro' }, 'Boussole DM vous guide pas à pas : destination revendiquée, qualification de chaque module, périmètre du dispositif médical, classe, conséquences et zones grises. Chaque question affiche sa source officielle. À la fin, un rapport imprimable reprend le raisonnement.'),
    h('p', { class: 'alerte alerte--avertissement' }, h('strong', {}, 'Outil pédagogique, sans valeur réglementaire. '), 'Le résultat ne remplace ni l’analyse du fabricant ni l’avis d’un organisme notifié ou de l’ANSM. Les données de l’outil sont « à valider par l’équipe » ; une partie des sources reste à lire (voir la documentation).'),

    h('section', { class: 'carte', 'aria-labelledby': 'titre-nouveau' },
      h('h2', { id: 'titre-nouveau' }, 'Nouveau passage'),
      h('form', { onsubmit: (e) => {
        e.preventDefault();
        const p = { id: stockage.nouvelId(), cree_le: new Date().toISOString(), saisie: nouvelleSaisie(champRef.value.trim()) };
        stockage.enregistrerPassage(p); ouvrirPassage(p);
      } },
        h('div', { class: 'champ' }, h('label', { for: 'nouvelle-ref' }, 'Référence du cas'), champRef),
        h('button', { class: 'btn', type: 'submit' }, 'Commencer'))),

    h('section', { class: 'carte', 'aria-labelledby': 'titre-passages' },
      h('h2', { id: 'titre-passages' }, 'Reprendre un passage'),
      passages.length ? h('ul', { class: 'passages' }, passages.map((p) => h('li', {},
        h('div', {}, h('strong', {}, p.saisie.reference_cas || 'Sans référence'),
          h('div', { class: 'meta' }, `Modifié le ${dateFr(p.modifie_le)} · ${p.saisie.modules.length} module(s)`)),
        h('div', { class: 'actions', style: 'margin:0' },
          h('button', { type: 'button', class: 'btn', onclick: () => ouvrirPassage(p) }, 'Reprendre'),
          h('button', { type: 'button', class: 'btn btn--discret', onclick: () => stockage.exporterPassage(p, etat.regles.meta.version_donnees) }, 'Exporter'),
          h('button', { type: 'button', class: 'btn btn--discret', onclick: () => {
            if (confirm(`Supprimer définitivement le passage « ${p.saisie.reference_cas || 'sans référence'} » de ce navigateur ?`)) { stockage.supprimerPassage(p.id); afficher(); dire('Passage supprimé.'); }
          } }, 'Supprimer'))))) : h('p', {}, 'Aucun passage enregistré dans ce navigateur.'),
      h('div', { class: 'actions' },
        h('label', { for: 'import-json', class: 'btn btn--secondaire', tabindex: 0, role: 'button',
          onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); importer.click(); } } }, 'Importer un fichier JSON'),
        importer)),

    h('section', { class: 'carte', 'aria-labelledby': 'titre-demo' },
      h('h2', { id: 'titre-demo' }, 'Partir d’un cas d’exemple'),
      h('p', {}, 'Ces cas servent de tests à l’outil. En ouvrir un crée un nouveau passage modifiable.'),
      h('div', { class: 'actions' }, CAS_DEMO.map(([fichier, titre]) => h('button', { type: 'button', class: 'btn btn--secondaire', onclick: async () => {
        try {
          const cas = await (await fetch(`tests/cas/${fichier}.json`)).json();
          const p = { id: stockage.nouvelId(), cree_le: new Date().toISOString(), saisie: structuredClone(cas.saisie) };
          stockage.enregistrerPassage(p); ouvrirPassage(p);
        } catch { dire('Impossible de charger ce cas.'); }
      } }, titre)))),
  );
}

function vueDestination() {
  const s = etat.passage.saisie;
  const d1 = regle('D-1');
  const ligne = (rv, i) => h('div', { class: 'ligne-revendication' },
    h('div', { class: 'champ', style: 'margin:0' },
      h('label', { for: `rev-sup-${i}`, class: 'annonce' }, `Support de la revendication ${i + 1}`),
      h('select', { id: `rev-sup-${i}`, onchange: (e) => modifier((x) => { x.revendications[i].support = e.target.value; }) },
        SUPPORTS.map(([v, l]) => h('option', { value: v, selected: rv.support === v }, l)))),
    h('div', { class: 'champ', style: 'margin:0' },
      h('label', { for: `rev-txt-${i}`, class: 'annonce' }, `Texte de la revendication ${i + 1}`),
      h('textarea', { id: `rev-txt-${i}`, rows: 2, onchange: (e) => modifier((x) => { x.revendications[i].texte = e.target.value; }) }, rv.texte)),
    h('button', { type: 'button', class: 'btn btn--discret', id: `rev-sup-btn-${i}`, 'aria-label': `Retirer la revendication ${i + 1}`, onclick: () => modifier((x) => { x.revendications.splice(i, 1); }) }, 'Retirer'));

  return gabaritEtape('Destination revendiquée', 'Recopiez ce que le fabricant affirme de son logiciel, sur chaque support. La destination revendiquée détermine la qualification et la classe : le contrôle de cohérence ci-dessous la compare aux modules qualifiés à l’étape suivante.', [
    h('section', { class: 'carte' },
      h('h2', {}, 'Le cas'),
      h('div', { class: 'champ' }, h('label', { for: 'ref-cas' }, 'Référence du cas'),
        h('input', { type: 'text', id: 'ref-cas', value: s.reference_cas, onchange: (e) => modifier((x) => { x.reference_cas = e.target.value.trim(); }) })),
      h('div', { class: 'champ' }, h('label', { for: 'desc-cas' }, 'Description de l’application'),
        h('textarea', { id: 'desc-cas', rows: 3, onchange: (e) => modifier((x) => { x.description = e.target.value; }) }, s.description))),
    h('section', { class: 'carte' + (etat.res.en_attente.some((q) => q.regle === 'D-1') ? ' question--attente' : '') },
      h('h2', {}, h('span', { class: 'id-regle' }, d1.id), 'Revendications du fabricant'),
      h('p', { class: 'aide' }, d1.question),
      s.revendications.map(ligne),
      h('button', { type: 'button', class: 'btn btn--secondaire', id: 'rev-ajout', onclick: () => modifier((x) => { x.revendications.push({ support: 'notice', texte: '' }); }) }, '+ Ajouter une revendication'),
      encadreSources(d1)),
    h('section', {}, h('h2', {}, 'Contrôle de cohérence'),
      contenuEtape('destination', null),
      etat.res.trace.some((t) => t.etape === 'destination' && t.type === 'deduction') ? null : h('p', {}, 'Aucune incohérence détectée pour l’instant. Le contrôle se met à jour à mesure que les modules sont qualifiés.')),
  ]);
}

function carteModule(m) {
  const res = etat.res.modules.find((x) => x.id === m.id);
  const champ = (cle, libelle, multi) => h('div', { class: 'champ' },
    h('label', { for: idSur('mod', m.id, cle) }, libelle),
    h(multi ? 'textarea' : 'input', { type: multi ? null : 'text', id: idSur('mod', m.id, cle), rows: multi ? 2 : null, value: multi ? null : m[cle] ?? '',
      onchange: (e) => modifier((x) => { x.modules.find((y) => y.id === m.id)[cle] = e.target.value; }) }, multi ? m[cle] ?? '' : null));
  // Repliable : un module sans question en attente peut être replié pour alléger la page.
  const enAttente = etat.res.en_attente.some((q) => q.module === m.id && q.etape === 'qualification');
  return h('details', { class: 'carte carte--module', open: enAttente || !etat.replies.has(m.id),
    ontoggle: (e) => { if (e.target.open) etat.replies.delete(m.id); else etat.replies.add(m.id); } },
    h('summary', { class: 'carte__titre', id: idSur('titre-mod', m.id) },
      h('h2', { style: 'margin:0' }, m.nom || 'Module sans nom'), badgeQualification(res)),
    h('div', { class: 'grille-2' }, champ('nom', 'Nom du module'), champ('donnees', 'Données traitées'), champ('fonction', 'Fonction', true), champ('finalite', 'Finalité revendiquée', true)),
    contenuEtape('qualification', m.id),
    res.motifs.length ? h('p', { class: 'alerte' }, h('strong', {}, 'Conclusion : '), res.motifs.at(-1).motif) : null,
    h('button', { type: 'button', class: 'btn btn--discret', id: idSur('suppr', m.id), onclick: () => {
      if (confirm(`Retirer le module « ${m.nom || 'sans nom'} » et ses réponses ?`)) modifier((x) => { x.modules = x.modules.filter((y) => y.id !== m.id); });
    } }, 'Retirer ce module'));
}

function vueQualification() {
  const s = etat.passage.saisie;
  return gabaritEtape('Qualification module par module', 'Découpez le produit en modules (une fonction, un écran, un service…). Pour chacun, répondez aux questions : elles suivent l’arbre de décision du guide MDCG 2019-11. Les questions suivantes apparaissent selon vos réponses.', [
    contenuEtape('qualification', null),
    s.modules.map(carteModule),
    h('button', { type: 'button', class: 'btn', id: 'mod-ajout', onclick: () => {
      modifier((x) => { x.modules.push({ id: stockage.nouvelId().replace('p-', 'm-'), nom: '', fonction: '', donnees: '', finalite: '', reponses: {} }); });
      main.querySelectorAll('.carte--module input[id$="-nom"]').item(s.modules.length - 1)?.focus();
    } }, '+ Ajouter un module'),
  ]);
}

function vuePerimetre() {
  const modules = etat.passage.saisie.modules.filter((m) =>
    etat.res.trace.some((t) => t.etape === 'perimetre' && t.module === m.id) || etat.res.en_attente.some((q) => q.etape === 'perimetre' && q.module === m.id));
  return gabaritEtape('Périmètre du dispositif médical', 'Le schéma sépare les modules à finalité médicale, les modules sans finalité propre mais nécessaires à leur fonctionnement, et les modules hors périmètre, avec leurs interfaces.', [
    h('section', { class: 'carte' }, schemaPerimetre(etat.res, etat.regles)),
    modules.map((m) => h('section', { class: 'carte carte--module' }, h('h2', { style: 'margin-top:0' }, m.nom || 'Module sans nom'), contenuEtape('perimetre', m.id))),
    contenuEtape('perimetre', null),
  ]);
}

function vueClassification() {
  const r = etat.res;
  const modules = etat.passage.saisie.modules.filter((m) =>
    r.trace.some((t) => t.etape === 'classification' && t.module === m.id) || r.en_attente.some((q) => q.etape === 'classification' && q.module === m.id));
  return gabaritEtape('Classification', 'Les questions appliquent la règle 11 de l’annexe VIII, ses règles d’application et les autres règles pouvant concerner un logiciel. Le tableau IMDRF ne donne qu’une orientation : seule la règle détermine la classe.', [
    modules.length ? modules.map((m) => {
      const rm = r.modules.find((x) => x.id === m.id);
      return h('section', { class: 'carte carte--module' },
        h('div', { style: 'display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center' },
          h('h2', { style: 'margin:0' }, m.nom || 'Module sans nom'),
          rm.classe ? h('span', { class: 'badge badge--classe' }, `Classe ${rm.classe}`) : h('span', { class: 'badge' }, 'Classe en cours')),
        contenuEtape('classification', m.id),
        rm.classes_indicatives.length ? h('p', { class: 'alerte' }, rm.classes_indicatives.at(-1).message) : null);
    }) : h('p', { class: 'alerte' }, 'Aucun module à classer : qualifiez d’abord les modules (étape 2).'),
    contenuEtape('classification', null),
    h('section', { class: 'carte' }, h('h2', {}, 'Classe du produit'),
      h('p', { class: 'resume__classe', style: 'text-align:left' }, r.classe ? `Classe ${r.classe}` : 'Non déterminée')),
    r.exemples.length ? h('section', { class: 'carte' }, h('h2', {}, 'Exemples des guides proches de votre cas'),
      h('p', { class: 'aide' }, 'Rapprochement par mots-clés : à lire comme une piste de comparaison, pas comme une preuve.'),
      h('ul', {}, r.exemples.map((e) => h('li', {}, h('strong', {}, e.id), ' · ', e.description,
        e.classe_indiquee ? ` → classe ${e.classe_indiquee}` : ` → ${etat.regles.qualifications[e.qualification_indiquee]}`,
        h('details', { class: 'source' }, h('summary', {}, 'Source ', pastilleStatut(e.statut)),
          h('blockquote', { lang: e.source.langue }, e.source.extrait),
          h('p', { class: 'source__meta' }, `${e.source.document} — ${e.source.reference} · `, h('a', { href: e.source.url, target: '_blank', rel: 'noopener' }, 'texte officiel'))))))) : null,
  ]);
}

function vueConsequences() {
  const r = etat.res;
  return gabaritEtape('Conséquences réglementaires', 'Selon la classe obtenue : intervention ou non d’un organisme notifié, obligations du fabricant et articulation avec l’AI Act si le produit contient de l’IA.', [
    contenuEtape('consequences', null).slice(0, 1),
    r.signaux.filter((x) => regle(x.regle ?? '')?.etape === 'consequences').map((x) => h('p', { class: `alerte alerte--${x.gravite}` }, x.message)),
    r.consequences.length ? r.consequences.map((c) => h('section', { class: 'carte' },
      h('h2', { style: 'margin-top:0' }, c.titre),
      c.organisme_notifie !== undefined ? h('p', {}, h('span', { class: 'badge ' + (c.organisme_notifie ? 'badge--classe' : '') }, c.organisme_notifie ? 'Organisme notifié : oui' : 'Organisme notifié : non')) : null,
      h('p', {}, c.texte), encadreSources(c))) : h('p', { class: 'alerte' }, 'Aucune conséquence pour l’instant : le produit ne contient pas de module DM classé, ou des questions restent sans réponse.'),
  ]);
}

function vueZonesGrises() {
  const z = etat.res.zones_grises;
  const nomModule = (id) => etat.res.modules.find((m) => m.id === id)?.nom ?? id;
  return gabaritEtape('Zones grises', 'Quand les textes laissent un débat, l’outil le signale et présente les lectures possibles, avec leur fondement. À discuter en équipe : l’outil ne tranche pas.', [
    z.length ? z.map((x) => h('section', { class: 'carte', id: idSur('zg', x.id) },
      h('h2', { style: 'margin-top:0' }, h('span', { class: 'id-regle' }, x.id), x.titre),
      h('p', {}, x.description),
      h('div', { class: 'lectures' }, x.lectures.map((l, i) => h('div', { class: 'lecture' }, h('p', {}, h('strong', {}, `Lecture ${i + 1}. `), l.lecture), h('p', { class: 'source__meta' }, l.fondement)))),
      h('p', { class: 'source__meta' }, 'Signalée par : ', x.declenchee_par.map((d) => `${d.regle}${d.module ? ` (${nomModule(d.module)})` : ''}`).join(', ')),
      encadreSources(x))) : h('p', { class: 'alerte' }, 'Aucune zone grise signalée pour ce passage.'),
  ]);
}

function vueRapport() {
  return h('div', {},
    h('div', { class: 'actions ne-pas-imprimer' },
      h('button', { type: 'button', class: 'btn', onclick: () => window.print() }, 'Imprimer ou enregistrer en PDF'),
      h('button', { type: 'button', class: 'btn btn--secondaire', onclick: () => stockage.exporterPassage(etat.passage, etat.regles.meta.version_donnees) }, 'Exporter le passage (JSON)'),
      h('button', { type: 'button', class: 'btn btn--discret', onclick: () => allerA('destination') }, 'Modifier une réponse')),
    rapport(etat.passage, etat.res, etat.regles));
}

demarrer();

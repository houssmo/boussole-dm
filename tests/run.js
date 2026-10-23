// Rejoue les cas de tests/cas/*.json et affiche un tableau attendu / obtenu / écart.
// Usage : node tests/run.js [--vague=N] [--cas=CAS-02] [--detail]
// Code de sortie 1 si au moins un écart.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { evaluer } from '../src/moteur.js';

const racine = fileURLToPath(new URL('..', import.meta.url));
const lire = (chemin) => JSON.parse(readFileSync(racine + chemin, 'utf8'));
const regles = lire('data/regles.json');
const exemples = lire('data/exemples-mdcg.json');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [cle, valeur = true] = a.replace(/^--/, '').split('=');
  return [cle, valeur];
}));

const affiche = (v) => (v === null || v === undefined ? '—' : Array.isArray(v) ? v.join(', ') || '—' : String(v));

/** Compare l'attendu d'un cas au résultat du moteur ; renvoie des lignes { controle, attendu, obtenu, ok }. */
export function comparer(attendu, res) {
  const lignes = [];
  const egal = (controle, a, o) => lignes.push({ controle, attendu: affiche(a), obtenu: affiche(o), ok: (a ?? null) === (o ?? null) });
  const inclus = (controle, a, o) => {
    const manquants = a.filter((x) => !o.includes(x));
    lignes.push({ controle, attendu: affiche(a), obtenu: manquants.length ? `manque : ${manquants.join(', ')}` : 'présents', ok: manquants.length === 0 });
  };

  for (const [id, att] of Object.entries(attendu.modules ?? {})) {
    const m = res.modules.find((x) => x.id === id);
    if (!m) { lignes.push({ controle: `module ${id}`, attendu: 'présent', obtenu: 'absent', ok: false }); continue; }
    for (const champ of ['qualification', 'perimetre', 'classe']) if (champ in att) egal(`${id} › ${champ}`, att[champ], m[champ]);
  }
  if ('classe_produit' in attendu) egal('classe du produit', attendu.classe_produit, res.classe);
  if ('organisme_notifie' in attendu) egal('organisme notifié', attendu.organisme_notifie, res.organisme_notifie);
  if (attendu.zones_grises) inclus('zones grises', attendu.zones_grises, res.zones_grises.map((z) => z.id));
  if (attendu.consequences) inclus('conséquences', attendu.consequences, res.consequences.map((c) => c.id));
  // Un cas doit répondre à toutes les questions posées : sinon une règle a changé ou le cas est incomplet.
  lignes.push({ controle: 'questions sans réponse', attendu: '—', obtenu: affiche(res.en_attente.map((q) => (q.module ? `${q.module}:${q.regle}` : q.regle))), ok: res.complet });
  return lignes;
}

function tableau(lignes) {
  const entetes = ['Cas', 'Contrôle', 'Attendu', 'Obtenu', 'Écart'];
  const rangees = lignes.map((l) => [l.cas, l.controle, l.attendu, l.obtenu, l.ok ? '' : '✗ ÉCART']);
  const largeurs = entetes.map((e, i) => Math.min(48, Math.max(e.length, ...rangees.map((r) => r[i].length))));
  const coupe = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t.padEnd(n));
  const ligne = (r) => '│ ' + r.map((c, i) => coupe(c, largeurs[i])).join(' │ ') + ' │';
  const trait = (g, m, d) => g + largeurs.map((n) => '─'.repeat(n + 2)).join(m) + d;
  return [trait('┌', '┬', '┐'), ligne(entetes), trait('├', '┼', '┤'), ...rangees.map(ligne), trait('└', '┴', '┘')].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fichiers = readdirSync(racine + 'tests/cas').filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort();
  const lignes = [];
  const bilan = [];
  for (const f of fichiers) {
    const cas = lire('tests/cas/' + f);
    if (args.vague && String(cas.vague) !== String(args.vague)) continue;
    if (args.cas && cas.id !== args.cas) continue;
    let comp;
    try {
      const res = evaluer(regles, cas.saisie, exemples);
      comp = comparer(cas.attendu, res);
      if (args.detail) console.log(`\n${cas.id} : ${res.trace.length} règles appliquées, exemples rapprochés : ${res.exemples.map((e) => e.id).join(', ') || 'aucun'}`);
    } catch (e) {
      comp = [{ controle: 'exécution du moteur', attendu: 'sans erreur', obtenu: e.message, ok: false }];
    }
    const ecarts = comp.filter((l) => !l.ok).length;
    bilan.push({ id: cas.id, titre: cas.titre, vague: cas.vague, limite: cas.cas_limite, ecarts });
    for (const l of (args.detail ? comp : comp.filter((x) => !x.ok).length ? comp : comp.slice(0, 0))) lignes.push({ cas: cas.id, ...l });
    if (!args.detail && ecarts === 0) lignes.push({ cas: cas.id, controle: `${comp.length} contrôles`, attendu: '', obtenu: 'conformes', ok: true });
  }

  console.log(`Boussole DM : rejeu des cas (${bilan.length} cas${args.vague ? `, vague ${args.vague}` : ''})\n`);
  console.log(tableau(lignes));
  const enEcart = bilan.filter((b) => b.ecarts > 0);
  console.log(`\n${bilan.length - enEcart.length}/${bilan.length} cas conformes · ${bilan.filter((b) => b.limite).length} cas limite(s)`);
  for (const b of enEcart) console.log(`  ✗ ${b.id} (${b.titre}) : ${b.ecarts} écart(s)`);
  if (!enEcart.length && bilan.length) console.log('  ✓ aucun écart');
  if (!bilan.length) console.log('  ⚠ aucun cas trouvé');
  process.exitCode = enEcart.length || !bilan.length ? 1 : 0;
}

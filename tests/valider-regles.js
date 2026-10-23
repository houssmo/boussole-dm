// Valide data/regles.json et data/exemples-mdcg.json : structure, références croisées, sources officielles.
// Usage : node tests/valider-regles.js   (code de sortie 1 en cas d'erreur)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const racine = fileURLToPath(new URL('..', import.meta.url));
const lire = (chemin) => JSON.parse(readFileSync(racine + chemin, 'utf8'));

export function validerRegles(doc, exemples = { exemples: [] }) {
  const erreurs = [];
  const avert = [];
  const { meta, etapes, regles, consequences, zones_grises: zones, qualifications, perimetres } = doc;
  const statuts = new Set(meta.statuts);
  const domaines = meta.domaines_officiels;
  const idsEtapes = new Set(etapes.map((e) => e.id));
  const idsRegles = new Map();
  const idsConseq = new Set(consequences.map((c) => c.id));
  const idsZones = new Set(zones.map((z) => z.id));

  for (const r of regles) {
    if (idsRegles.has(r.id)) erreurs.push(`Identifiant en double : ${r.id}`);
    idsRegles.set(r.id, r);
  }

  const verifierSources = (ou, sources) => {
    if (!Array.isArray(sources) || sources.length === 0) return erreurs.push(`${ou} : aucune source`);
    for (const s of sources) {
      for (const champ of ['document', 'reference', 'version', 'url']) {
        if (!s[champ]) erreurs.push(`${ou} : source sans « ${champ} »`);
      }
      let hote = '';
      try { hote = new URL(s.url).hostname; } catch { erreurs.push(`${ou} : URL invalide ${s.url}`); continue; }
      if (!domaines.some((d) => hote === d || hote.endsWith('.' + d))) erreurs.push(`${ou} : domaine non officiel ${hote}`);
      if (!('extrait' in s) || !('consulte_le' in s)) erreurs.push(`${ou} : champs « extrait » et « consulte_le » attendus (null si non lus)`);
    }
  };
  // « à valider » exige au moins une source lue (extrait + date) ; une source non lue doit être signalée dans la note.
  const verifierStatut = (ou, objet) => {
    if (!statuts.has(objet.statut)) erreurs.push(`${ou} : statut inconnu « ${objet.statut} »`);
    const sources = (objet.sources ?? [objet.source]).filter(Boolean);
    for (const s of sources) if (Boolean(s.extrait) !== Boolean(s.consulte_le)) erreurs.push(`${ou} : « extrait » et « consulte_le » doivent être renseignés ensemble`);
    const lues = sources.filter((s) => s.extrait);
    if (objet.statut === "à valider par l'équipe") {
      if (lues.length === 0) erreurs.push(`${ou} : statut « à valider » sans aucune source lue`);
      if (lues.length < sources.length && !objet.note_verification) erreurs.push(`${ou} : source non lue sans « note_verification »`);
    }
  };

  // Parcourt une condition et vérifie les références qu'elle contient.
  const verifierCondition = (ou, c) => {
    if (!c || typeof c !== 'object') return;
    if (c.reponse && !idsRegles.has(c.reponse)) erreurs.push(`${ou} : condition sur une règle inconnue ${c.reponse}`);
    for (const q of c.qualification_dans ?? []) if (!(q in qualifications)) erreurs.push(`${ou} : qualification inconnue ${q}`);
    for (const p of c.perimetre_dans ?? []) if (!(p in perimetres)) erreurs.push(`${ou} : périmètre inconnu ${p}`);
    for (const k of ['classe']) if (c[k] && !meta.ordre_classes.includes(c[k])) erreurs.push(`${ou} : classe inconnue ${c[k]}`);
    for (const k of c.classe_dans ?? []) if (!meta.ordre_classes.includes(k)) erreurs.push(`${ou} : classe inconnue ${k}`);
    for (const sous of [...(c.tous ?? []), ...(c.un_de ?? [])]) verifierCondition(ou, sous);
    if (c.non) verifierCondition(ou, c.non);
    if (c.condition) verifierCondition(ou, c.condition);
  };
  const verifierEffet = (ou, e) => {
    if (e.type === 'qualification' && !(e.valeur in qualifications)) erreurs.push(`${ou} : qualification inconnue ${e.valeur}`);
    if (e.type === 'perimetre' && !(e.valeur in perimetres)) erreurs.push(`${ou} : périmètre inconnu ${e.valeur}`);
    if ((e.type === 'classe' || e.type === 'classe_indicative') && !meta.ordre_classes.includes(e.valeur)) erreurs.push(`${ou} : classe inconnue ${e.valeur}`);
    if (e.type === 'consequence' && !idsConseq.has(e.id)) erreurs.push(`${ou} : conséquence inconnue ${e.id}`);
    if (e.type === 'zone_grise' && !idsZones.has(e.id)) erreurs.push(`${ou} : zone grise inconnue ${e.id}`);
  };

  for (const r of regles) {
    const ou = `Règle ${r.id}`;
    if (!idsEtapes.has(r.etape)) erreurs.push(`${ou} : étape inconnue ${r.etape}`);
    if (!['question', 'deduction', 'saisie'].includes(r.type)) erreurs.push(`${ou} : type inconnu ${r.type}`);
    if (!['module', 'produit'].includes(r.portee)) erreurs.push(`${ou} : portée inconnue ${r.portee}`);
    if (r.type !== 'deduction' && !r.question) erreurs.push(`${ou} : question manquante`);
    if (r.type === 'question' && !Array.isArray(r.options)) erreurs.push(`${ou} : options manquantes`);
    if (r.type === 'deduction' && !r.condition) erreurs.push(`${ou} : une déduction doit avoir une condition`);
    if (r.champ_saisie && (r.type !== 'saisie' || r.champ_saisie !== 'revendications')) erreurs.push(`${ou} : « champ_saisie » réservé aux saisies, valeur admise : revendications`);
    if (!Array.isArray(r.effets)) erreurs.push(`${ou} : « effets » doit être une liste`);
    const valeurs = new Set((r.options ?? []).map((o) => o.valeur));
    for (const eff of r.effets ?? []) {
      if (eff.si !== undefined) {
        const cites = typeof eff.si === 'string' ? [eff.si] : [...(eff.si.contient_un_de ?? []), ...(eff.si.egal_exactement ?? [])];
        for (const v of cites) if (!valeurs.has(v)) erreurs.push(`${ou} : effet sur une option inexistante « ${v} »`);
        for (const e of eff.alors ?? []) verifierEffet(ou, e);
      } else {
        verifierEffet(ou, eff);
      }
    }
    for (const z of r.zones_grises ?? []) if (!idsZones.has(z)) erreurs.push(`${ou} : zone grise inconnue ${z}`);
    verifierCondition(ou, r.condition);
    verifierSources(ou, r.sources);
    verifierStatut(ou, r);
  }
  for (const c of consequences) { verifierSources(`Conséquence ${c.id}`, c.sources); verifierStatut(`Conséquence ${c.id}`, c); }
  for (const z of zones) {
    verifierSources(`Zone grise ${z.id}`, z.sources); verifierStatut(`Zone grise ${z.id}`, z);
    if (!Array.isArray(z.lectures) || z.lectures.length < 2) erreurs.push(`Zone grise ${z.id} : au moins deux lectures attendues`);
  }
  for (const ex of exemples.exemples) {
    verifierSources(`Exemple ${ex.id}`, [{ version: '-', ...ex.source }]);
    verifierStatut(`Exemple ${ex.id}`, ex);
    if (ex.regle && !idsRegles.has(ex.regle)) erreurs.push(`Exemple ${ex.id} : règle inconnue ${ex.regle}`);
  }

  const tout = [...regles, ...consequences, ...zones, ...exemples.exemples];
  const nonVerifies = tout.filter((o) => o.statut === 'non vérifié').map((o) => o.id);
  if (nonVerifies.length) avert.push(`${nonVerifies.length}/${tout.length} entrées « non vérifié » : ${nonVerifies.join(', ')}`);
  const aLire = tout.flatMap((o) => (o.sources ?? [o.source]).filter((s) => !s.extrait).map((s) => s.cle));
  if (aLire.length) avert.push(`${aLire.length} références de sources encore à lire (${[...new Set(aLire)].join(', ')})`);
  return { erreurs, avert, total: tout.length, nonVerifies };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { erreurs, avert, total } = validerRegles(lire('data/regles.json'), lire('data/exemples-mdcg.json'));
  console.log(`Validation des données : ${total} entrées contrôlées`);
  for (const a of avert) console.log(`  ⚠ ${a}`);
  for (const e of erreurs) console.log(`  ✗ ${e}`);
  console.log(erreurs.length ? `${erreurs.length} erreur(s)` : '  ✓ aucune erreur de structure');
  process.exitCode = erreurs.length ? 1 : 0;
}

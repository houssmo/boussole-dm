// Vérifie que les extraits recopiés dans les données figurent mot pour mot dans le document officiel.
// Usage :
//   node tests/verifier-extraits.mjs <CLE> <fichier>
//     CLE     : clé de la source dans les données (ex. MDCG2019-11, ANSM-QUALIF, MDR)
//     fichier : le document officiel téléchargé, en .pdf (nécessite pdftotext) ou en .txt / .html
// Exemple : node tests/verifier-extraits.mjs MDCG2021-24 ~/Téléchargements/mdcg_2021-24_en.pdf
// Les espaces, retours à la ligne et apostrophes typographiques sont ignorés dans la comparaison.
// Un extrait recomposé (champ « forme_extrait ») est vérifié par ses « fragments_verification », ou découpé sur « […] ».
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [cle, fichier] = process.argv.slice(2);
if (!cle || !fichier) {
  console.log('Usage : node tests/verifier-extraits.mjs <CLE> <fichier.pdf|.txt|.html>');
  process.exit(2);
}

function texteDuDocument(chemin) {
  if (/\.pdf$/i.test(chemin)) {
    try {
      return execFileSync('pdftotext', ['-layout', chemin, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch {
      console.log('Impossible de lire le PDF : installez pdftotext (paquet poppler-utils), ou enregistrez le texte du document en .txt.');
      process.exit(2);
    }
  }
  const brut = readFileSync(chemin, 'utf8');
  return /\.html?$/i.test(chemin) ? decoderEntites(brut.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')) : brut;
}

// Entités HTML : numériques, plus les entités nommées courantes en français (lettres accentuées comprises).
const ENTITES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', laquo: '«', raquo: '»',
  hellip: '…', mdash: '—', ndash: '–', times: '×', euro: '€', oelig: 'œ', OElig: 'Œ', aelig: 'æ', AElig: 'Æ', szlig: 'ß', deg: '°' };
for (const [nom, marque] of Object.entries({ grave: '\u0300', acute: '\u0301', circ: '\u0302', uml: '\u0308', cedil: '\u0327', tilde: '\u0303' })) {
  for (const l of 'aeiouycnAEIOUYCN') ENTITES[l + nom] = (l + marque).normalize('NFC');
}
function decoderEntites(t) {
  return t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITES[e] ?? m;
  });
}

// Même normalisation que lors de la vérification initiale des données.
const normaliser = (t) => t
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
  .replace(/\s+/g, ' ')
  .replace(/\s+([,.;:])/g, '$1')
  .trim();

// Retire les guillemets ajoutés autour de l'extrait dans les données.
const sansGuillemets = (e) => e.replace(/^«\s*|\s*»$/g, '').replace(/^“|”$/g, '');

const racine = fileURLToPath(new URL('..', import.meta.url));
const regles = JSON.parse(readFileSync(racine + 'data/regles.json', 'utf8'));
const exemples = JSON.parse(readFileSync(racine + 'data/exemples-mdcg.json', 'utf8'));
const texte = normaliser(texteDuDocument(fichier));

const aVerifier = [];
for (const groupe of ['regles', 'consequences', 'zones_grises']) {
  for (const o of regles[groupe]) for (const s of o.sources) if (s.cle === cle) aVerifier.push({ id: o.id, s });
}
for (const ex of exemples.exemples) if (ex.source.cle === cle) aVerifier.push({ id: ex.id, s: ex.source });

let trouves = 0, absents = 0, aLire = 0;
for (const { id, s } of aVerifier) {
  if (!s.extrait) { aLire++; console.log(`  · ${id} — ${s.reference} : pas encore d'extrait`); continue; }
  // Extrait recomposé : on vérifie les fragments enregistrés, ou à défaut les morceaux séparés par « […] ».
  const morceaux = s.fragments_verification ?? (s.forme_extrait ? sansGuillemets(s.extrait).split(/\s*\[…\]\s*/) : [sansGuillemets(s.extrait)]);
  const manquants = morceaux.filter((m) => m && !texte.includes(normaliser(m)));
  if (manquants.length) {
    absents++;
    console.log(`  ✗ ${id} — ${s.reference} : introuvable « ${manquants[0].slice(0, 90)}… »`);
  } else trouves++;
}
console.log(`\n${cle} : ${trouves} extrait(s) retrouvé(s), ${absents} introuvable(s), ${aLire} sans extrait (sur ${aVerifier.length} citation(s)).`);
if (absents) console.log('Un extrait « introuvable » peut venir d’une faute de recopie, d’une autre version du document, ou d’un tableau dont la mise en page sépare les cellules (voir « forme_extrait »).');
process.exitCode = absents ? 1 : 0;

// Rapport imprimable d'un passage : réponses, qualification, périmètre, classe, conséquences, étapes suivies et sources.
import { h, dateFr } from './dom.js';
import { pastilleStatut } from './sources.js';
import { schemaPerimetre } from './perimetre-svg.js';

/** Libellé lisible d'une réponse (valeur d'option → libellé). */
export function libelleReponse(regle, valeur) {
  if (valeur === undefined || valeur === null) return '—';
  const lib = (v) => regle?.options?.find((o) => o.valeur === v)?.libelle ?? v;
  return Array.isArray(valeur) ? valeur.map(lib).join(' ; ') : lib(valeur);
}

/** Phrase décrivant ce qu'une déduction a produit. */
export function descriptionEffets(effets, regles) {
  return effets.map((e) => {
    switch (e.type) {
      case 'signal': return e.message;
      case 'qualification': return `Qualification : ${regles.qualifications[e.valeur]}`;
      case 'perimetre': return `Périmètre : ${regles.perimetres[e.valeur]}`;
      case 'classe': return `Classe candidate : ${e.valeur}`;
      case 'classe_indicative': return e.message;
      case 'agregation_classes': return 'Les classes se combinent en retenant la plus élevée.';
      case 'consequence': return `Conséquence : ${regles.consequences.find((c) => c.id === e.id)?.titre ?? e.id}`;
      case 'zone_grise': return `Zone grise signalée : ${regles.zones_grises.find((z) => z.id === e.id)?.titre ?? e.id}`;
      default: return null;
    }
  }).filter(Boolean);
}

const logoRapport = () => h('div', { class: 'rapport__logo' },
  h('span', { class: 'logo logo--clair' }, h('img', { src: 'assets/logo/source/logo-complet.jpg', alt: 'Boussole DM', width: 2000, height: 1116 })),
  h('span', { class: 'logo logo--sombre' }, h('img', { src: 'assets/logo/source/logo-complet-sombre.jpg', alt: 'Boussole DM', width: 2000, height: 1116 })));

/** Registre des sources citées : références numérotées dans le corps, extraits regroupés en annexe. */
function registreSources() {
  const entrees = new Map();
  const numero = (src) => {
    const cle = `${src.cle}|${src.reference}|${src.extrait ?? ''}`;
    if (!entrees.has(cle)) entrees.set(cle, { n: entrees.size + 1, src });
    return entrees.get(cle).n;
  };
  const refs = (objet) => h('p', { class: 'source__meta' }, 'Sources : ',
    objet.sources.map((src, i) => [i ? ' ; ' : '', `[${numero(src)}] ${src.document.split(',')[0]} — ${src.reference}`, src.extrait ? '' : ' (à lire)']),
    ' · ', pastilleStatut(objet.statut));
  // Version complète : extrait de chaque source. Version courte : une ligne par source (document, référence, lien).
  const annexe = (complet) => h('ol', { class: 'source__liste annexe-sources' + (complet ? '' : ' annexe-sources--courte') }, [...entrees.values()].map(({ n, src }) => complet
    ? h('li', { value: n, class: 'source__item' },
        h('div', {}, h('strong', {}, src.document), ' — ', src.reference),
        src.extrait ? h('blockquote', { lang: src.langue ?? 'fr' }, src.extrait) : h('p', { class: 'a-lire' }, 'Texte non encore lu.'),
        h('div', { class: 'source__meta' }, `Version : ${src.version}`, src.consulte_le ? ` · consulté le ${new Date(src.consulte_le).toLocaleDateString('fr-FR')}` : '', ' · ', h('a', { href: src.url }, src.url)))
    : h('li', { value: n }, h('strong', {}, src.document.split(',')[0]), ` — ${src.reference} (${src.version})`, src.extrait ? '' : ' — texte à lire', ' · ', h('a', { href: src.url }, 'lien officiel'))));
  return { refs, annexe, numero };
}

export function rapport(passage, res, regles, { complet = false } = {}) {
  const saisie = passage.saisie;
  const reg = registreSources();
  const parId = new Map(regles.regles.map((r) => [r.id, r]));
  const nomModule = (id) => res.modules.find((m) => m.id === id)?.nom ?? id;
  const etapeTitre = Object.fromEntries(regles.etapes.map((e) => [e.id, e.titre]));
  const signauxEtape = (etape) => res.signaux.filter((x) => parId.get(x.regle)?.etape === etape);
  const alerte = (x) => h('p', { class: `alerte alerte--${x.gravite}` }, x.module ? `${nomModule(x.module)} : ` : '', x.message);

  return h('article', { class: 'rapport', 'aria-labelledby': 'rapport-titre' },
    h('header', { class: 'rapport__entete' },
      logoRapport(),
      h('div', {},
        h('h2', { id: 'rapport-titre', style: 'margin:0;border:0' }, 'Rapport de passage'),
        h('p', { class: 'source__meta', style: 'margin:0' }, `Cas : ${saisie.reference_cas || 'sans référence'} · édité le ${dateFr(new Date().toISOString())} · données v${regles.meta.version_donnees} du ${new Date(regles.meta.mis_a_jour_le).toLocaleDateString('fr-FR')}`))),
    h('p', { class: 'rapport__bandeau' }, 'Outil pédagogique, sans valeur réglementaire'),

    h('h2', {}, 'Synthèse'),
    h('table', {}, h('tbody', {},
      h('tr', {}, h('th', { scope: 'row' }, 'Classe du produit'), h('td', {}, res.classe ? h('span', { class: 'badge badge--classe' }, `Classe ${res.classe}`) : 'Aucune classe calculée')),
      h('tr', {}, h('th', { scope: 'row' }, 'Organisme notifié'), h('td', {}, res.organisme_notifie === true ? 'Oui, intervention requise' : res.organisme_notifie === false ? 'Non' : '—')),
      h('tr', {}, h('th', { scope: 'row' }, 'Modules dans le DM'), h('td', {}, res.modules.filter((m) => ['dm', 'necessaire'].includes(m.perimetre)).map((m) => m.nom).join(', ') || 'Aucun')),
      h('tr', {}, h('th', { scope: 'row' }, 'Zones grises'), h('td', {}, res.zones_grises.map((z) => z.id).join(', ') || 'Aucune')),
      h('tr', {}, h('th', { scope: 'row' }, 'État du passage'), h('td', {}, res.complet ? 'Toutes les questions posées ont une réponse.' : `Incomplet : ${res.en_attente.length} question(s) sans réponse.`)),
    )),
    !res.complet ? h('p', { class: 'alerte alerte--avertissement' }, 'Questions sans réponse : ', res.en_attente.map((q) => `${q.regle}${q.module ? ` (${nomModule(q.module)})` : ''}`).join(', ')) : null,
    res.signaux.filter((x) => x.gravite === 'bloquant').map(alerte),

    h('h2', {}, '1. Destination'),
    saisie.description ? h('p', {}, saisie.description) : null,
    saisie.revendications.length
      ? h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Support'), h('th', {}, 'Revendication'))),
          h('tbody', {}, saisie.revendications.map((r) => h('tr', {}, h('td', {}, r.support), h('td', {}, r.texte)))))
      : h('p', {}, 'Aucune revendication saisie.'),
    signauxEtape('destination').map(alerte),

    h('h2', {}, '2. Qualification des modules'),
    h('div', { class: 'tableau-defilant' }, h('table', {},
      h('thead', {}, h('tr', {}, ['Module', 'Fonction', 'Données', 'Finalité revendiquée', 'Qualification'].map((t) => h('th', {}, t)))),
      h('tbody', {}, saisie.modules.map((m) => {
        const r = res.modules.find((x) => x.id === m.id);
        return h('tr', {}, h('td', {}, m.nom), h('td', {}, m.fonction), h('td', {}, m.donnees), h('td', {}, m.finalite),
          h('td', {}, r?.qualification ? regles.qualifications[r.qualification] : 'Incomplète', r?.motifs.length ? h('div', { class: 'source__meta' }, r.motifs.at(-1).motif) : null));
      })))),

    h('h2', {}, '3. Périmètre du dispositif médical'),
    schemaPerimetre(res, regles, 'perim-rapport'),

    h('h2', {}, '4. Classification'),
    h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Module'), h('th', {}, 'Classe'), h('th', {}, 'Règles appliquées'), h('th', {}, 'Orientation indicative'))),
      h('tbody', {}, res.modules.filter((m) => m.classes.length || m.classes_indicatives.length).map((m) => h('tr', {},
        h('td', {}, m.nom), h('td', {}, m.classe ?? '—'),
        h('td', {}, m.classes.map((c) => `${c.regle} → ${c.valeur}`).join(' ; ')),
        h('td', {}, m.classes_indicatives.map((c) => c.valeur).join(', ') || '—'))))),
    h('p', {}, h('strong', {}, 'Classe du produit : '), res.classe ?? 'non calculée'),

    h('h2', {}, '5. Conséquences'),
    res.consequences.length ? res.consequences.map((c) => h('section', { class: 'etape-trace' },
      h('h3', {}, c.titre), h('p', {}, c.texte), reg.refs(c))) : h('p', {}, 'Aucune conséquence : le produit ne relève pas du dispositif médical, ou le passage est incomplet.'),
    signauxEtape('consequences').map(alerte),

    h('h2', {}, '6. Zones grises'),
    res.zones_grises.length ? res.zones_grises.map((z) => h('section', { class: 'etape-trace' },
      h('h3', {}, `${z.id} · ${z.titre}`), h('p', {}, z.description),
      h('ul', {}, z.lectures.map((l) => h('li', {}, l.lecture, h('div', { class: 'source__meta' }, l.fondement)))),
      reg.refs(z))) : h('p', {}, 'Aucune zone grise signalée.'),

    h('h2', {}, 'Étapes suivies et sources'),
    h('p', { class: 'source__meta' }, 'Une ligne par règle appliquée, dans l’ordre des étapes. Les numéros renvoient aux extraits en annexe.'),
    h('div', { class: 'tableau-defilant' }, h('table', { class: 'trace' },
      h('colgroup', {}, ['13%', '9%', '43%', '27%', '8%'].map((l) => h('col', { style: `width:${l}` }))),
      h('thead', {}, h('tr', {}, ['Étape', 'Règle', 'Question et réponse', 'Effet', 'Sources'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, res.trace.map((t) => {
        const r = parId.get(t.regle);
        const reponse = r.champ_saisie ? `${saisie.revendications.length} revendication(s)` : libelleReponse(r, t.reponse);
        return h('tr', {},
          h('td', {}, etapeTitre[t.etape], t.module ? h('div', { class: 'source__meta' }, nomModule(t.module)) : null),
          h('td', {}, h('span', { class: 'id-regle' }, t.regle), complet ? h('div', {}, pastilleStatut(r.statut)) : null),
          h('td', {}, r.question ? [r.question, h('div', {}, h('strong', {}, '→ '), reponse)] : h('em', {}, 'Déduction automatique')),
          h('td', {}, descriptionEffets(t.effets, regles).join(' · ') || '—'),
          h('td', {}, r.sources.map((src) => `[${reg.numero(src)}]`).join(' ')));
      })))),

    res.exemples.length ? [h('h2', {}, 'Exemples des guides rapprochés du cas'),
      h('ul', {}, res.exemples.map((e) => h('li', {}, `${e.id} · ${e.description}`,
        e.classe_indiquee ? ` (classe ${e.classe_indiquee})` : ` (${regles.qualifications[e.qualification_indiquee]})`,
        h('div', { class: 'source__meta' }, `${e.source.document.split(',')[0]} — ${e.source.reference} · mots communs : ${e.mots_trouves.join(', ')} · `, pastilleStatut(e.statut)))))] : null,

    res.reponses_ignorees.length ? [h('h2', {}, 'Réponses non utilisées'),
      h('p', {}, 'Ces réponses ont été saisies, mais les questions correspondantes ne se posent plus dans ce chemin : ',
        res.reponses_ignorees.map((x) => `${x.regle}${x.module ? ` (${nomModule(x.module)})` : ''}`).join(', '))] : null,

    h('h2', {}, complet ? 'Annexe : extraits des sources citées' : 'Sources citées'),
    h('p', { class: 'source__meta' }, complet
      ? 'Chaque extrait est numéroté une seule fois ; les numéros entre crochets renvoient ici.'
      : 'Les numéros entre crochets renvoient à cette liste. Les extraits exacts figurent dans la version complète du rapport et sous chaque question de l’outil.'),
    reg.annexe(complet),

    h('p', { class: 'rapport__bandeau' }, 'Outil pédagogique, sans valeur réglementaire. Ce rapport ne constitue ni une qualification ni une classification opposable.'),
  );
}

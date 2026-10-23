// Affichage des sources d'une règle, d'une conséquence ou d'une zone grise.
import { h } from './dom.js';

export function pastilleStatut(statut) {
  const valide = statut === "à valider par l'équipe";
  return h('span', { class: 'statut ' + (valide ? 'statut--valider' : 'statut--nv') }, statut);
}

/** Une source : document, référence, version, lien officiel, extrait (ou mention « à lire »). */
export function elementSource(src) {
  return h('li', { class: 'source__item' },
    h('div', {}, h('strong', {}, src.document), ' — ', src.reference),
    src.extrait
      ? h('blockquote', { lang: src.langue ?? 'fr' }, src.extrait)
      : h('p', { class: 'a-lire' }, 'Texte non encore lu : extrait à recopier depuis la source officielle.'),
    h('div', { class: 'source__meta' },
      `Version : ${src.version}`,
      src.consulte_le ? ` · consulté le ${new Date(src.consulte_le).toLocaleDateString('fr-FR')}` : '',
      src.forme_extrait ? ` · ${src.forme_extrait}` : '',
      ' · ', h('a', { href: src.url, target: '_blank', rel: 'noopener' }, 'texte officiel', h('span', { class: 'annonce' }, ' (nouvel onglet)'))),
  );
}

/** Encadré repliable « Source » sous une question. */
export function encadreSources(objet, { ouvert = false, titre = 'Source' } = {}) {
  const n = objet.sources.length;
  return h('details', { class: 'source', open: ouvert },
    h('summary', {}, `${titre}${n > 1 ? 's' : ''} (${n}) `, pastilleStatut(objet.statut)),
    objet.note_verification ? h('p', { class: 'a-lire' }, objet.note_verification) : null,
    h('ul', { class: 'source__liste' }, objet.sources.map(elementSource)),
  );
}

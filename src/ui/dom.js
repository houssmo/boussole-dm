// Petit utilitaire de création d'éléments. Le texte passe par createTextNode : aucune saisie n'est interprétée comme du HTML.

/** h('p', { class: 'x', onclick: f }, 'texte', autreNoeud, [liste]) */
export function h(tag, attrs = {}, ...enfants) {
  const el = document.createElement(tag);
  for (const [cle, val] of Object.entries(attrs ?? {})) {
    if (val === undefined || val === null || val === false) continue;
    if (cle.startsWith('on') && typeof val === 'function') el.addEventListener(cle.slice(2), val);
    else if (cle === 'class') el.className = val;
    else if (cle === 'dataset') Object.assign(el.dataset, val);
    else if (val === true) el.setAttribute(cle, '');
    else el.setAttribute(cle, String(val));
  }
  ajouter(el, enfants);
  return el;
}

function ajouter(el, enfants) {
  for (const e of enfants.flat(Infinity)) {
    if (e === undefined || e === null || e === false) continue;
    el.append(e instanceof Node ? e : document.createTextNode(String(e)));
  }
}

const NS = 'http://www.w3.org/2000/svg';
/** Équivalent de h() pour le SVG. */
export function s(tag, attrs = {}, ...enfants) {
  const el = document.createElementNS(NS, tag);
  for (const [cle, val] of Object.entries(attrs ?? {})) {
    if (val === undefined || val === null || val === false) continue;
    el.setAttribute(cle, String(val));
  }
  ajouter(el, enfants);
  return el;
}

/** Identifiant utilisable dans un attribut id. */
export const idSur = (...parts) => parts.join('-').replace(/[^a-zA-Z0-9_-]/g, '_');

/** Date lisible en français. */
export const dateFr = (iso) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

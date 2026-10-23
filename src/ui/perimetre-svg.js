// Schéma du périmètre du dispositif médical : modules dans le DM, modules nécessaires, modules hors périmètre, interfaces.
import { s, h, idSur } from './dom.js';

const L = 210, HM = 50, ESP = 12;          // largeur, hauteur et espacement d'un module
const tronquer = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

function boite(m, x, y, classe, libelleQualif) {
  return s('g', {},
    s('title', {}, `${m.nom} : ${libelleQualif}`),
    s('rect', { class: 'mod ' + classe, x, y, width: L, height: HM, rx: 8 }),
    s('text', { x: x + 10, y: y + 21, 'font-size': 14, 'font-weight': 600 }, tronquer(m.nom, 26)),
    s('text', { x: x + 10, y: y + 39, 'font-size': 11.5, class: 'legende' }, tronquer(libelleQualif, 32)),
  );
}

/** @param res résultat du moteur, @param regles données (pour les libellés), @param prefixe pour des id uniques */
export function schemaPerimetre(res, regles, prefixe = 'perim') {
  const q = regles.qualifications;
  const dm = res.modules.filter((m) => m.perimetre === 'dm');
  const nec = res.modules.filter((m) => m.perimetre === 'necessaire');
  const hors = res.modules.filter((m) => m.perimetre === 'hors' || (m.perimetre === null && m.qualification === 'non_dm'));
  const attente = res.modules.filter((m) => !dm.includes(m) && !nec.includes(m) && !hors.includes(m));

  const lignes = Math.max(dm.length, nec.length, 1);
  const hDm = 56 + lignes * (HM + ESP) + 8;
  const hHors = 56 + Math.max(hors.length, 1) * (HM + ESP) + 8;
  const hAtt = attente.length ? 56 + attente.length * (HM + ESP) : 0;
  const H = Math.max(hDm, hHors) + (hAtt ? hAtt + 16 : 0) + 30;
  const W = 760;
  const xDm = 10, wDm = 2 * L + 3 * 16, xHors = xDm + wDm + 40, wHors = L + 32;

  const titre = idSur(prefixe, 'titre'), desc = idSur(prefixe, 'desc');
  const description = [
    `Dans le dispositif médical : ${dm.map((m) => m.nom).join(', ') || 'aucun module'}.`,
    `Nécessaires au fonctionnement : ${nec.map((m) => m.nom).join(', ') || 'aucun'}.`,
    `Hors périmètre : ${hors.map((m) => m.nom).join(', ') || 'aucun'}.`,
    attente.length ? `À qualifier : ${attente.map((m) => m.nom).join(', ')}.` : '',
    hors.some((m) => m.interfaces.length) ? `Interfaces décrites : ${hors.filter((m) => m.interfaces.length).map((m) => m.nom).join(', ')}.` : '',
  ].join(' ');

  const svg = s('svg', { class: 'perimetre-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-labelledby': `${titre} ${desc}` },
    s('title', { id: titre }, 'Schéma du périmètre du dispositif médical'),
    s('desc', { id: desc }, description),
    s('defs', {}, s('marker', { id: idSur(prefixe, 'fleche'), viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
      s('path', { d: 'M0 0L10 5L0 10z', fill: 'currentColor', class: 'legende' }))),
    // Zone du dispositif médical
    s('rect', { class: 'zone-dm', x: xDm, y: 10, width: wDm, height: hDm, rx: 14 }),
    s('text', { class: 'zone-titre', x: xDm + 16, y: 34, 'font-size': 16 }, 'Dispositif médical'),
    s('text', { class: 'legende', x: xDm + 16, y: 52 }, 'Finalité médicale'),
    s('text', { class: 'legende', x: xDm + 32 + L, y: 52 }, 'Nécessaires (sans finalité propre)'),
    dm.map((m, i) => boite(m, xDm + 16, 62 + i * (HM + ESP), '', q[m.qualification] ?? '')),
    nec.map((m, i) => boite(m, xDm + 32 + L, 62 + i * (HM + ESP), 'mod--necessaire', 'Nécessaire au DM')),
    // Hors périmètre
    s('rect', { class: 'zone-hors', x: xHors, y: 10, width: wHors, height: hHors, rx: 14 }),
    s('text', { class: 'zone-titre', x: xHors + 16, y: 34, 'font-size': 16 }, 'Hors périmètre'),
    hors.map((m, i) => boite(m, xHors + 16, 62 + i * (HM + ESP), '', q[m.qualification] ?? '')),
    // Interfaces : flèche du module hors périmètre vers la zone du DM
    hors.flatMap((m, i) => m.interfaces.length ? [
      s('path', { class: 'lien', d: `M${xHors + 16} ${62 + i * (HM + ESP) + HM / 2} H${xDm + wDm + 4}`, 'marker-end': `url(#${idSur(prefixe, 'fleche')})`, 'marker-start': `url(#${idSur(prefixe, 'fleche')})` },
        s('title', {}, `Interface : ${m.interfaces.join(' ; ')}`)),
    ] : []),
    // Modules pas encore qualifiés
    attente.length ? [
      s('text', { class: 'zone-titre', x: xDm + 6, y: Math.max(hDm, hHors) + 40, 'font-size': 15 }, 'À qualifier'),
      attente.map((m, i) => boite(m, xDm + 16 + (i % 3) * (L + 16), Math.max(hDm, hHors) + 52 + Math.floor(i / 3) * (HM + ESP), 'mod--attente', 'Qualification incomplète')),
    ] : null,
  );
  // La hauteur réelle dépend du nombre de lignes de « À qualifier ».
  if (attente.length) svg.setAttribute('viewBox', `0 0 ${W} ${Math.max(hDm, hHors) + 60 + Math.ceil(attente.length / 3) * (HM + ESP)}`);

  const interfaces = hors.filter((m) => m.interfaces.length);
  return h('figure', { class: 'schema' }, svg,
    interfaces.length ? h('figcaption', {}, h('h4', {}, 'Interfaces avec le dispositif médical'),
      h('ul', {}, interfaces.map((m) => h('li', {}, h('strong', {}, m.nom), ' : ', m.interfaces.join(' ; '))))) : null);
}

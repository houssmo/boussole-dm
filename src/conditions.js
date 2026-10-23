// Interpréteur des conditions de data/regles.json (format décrit dans docs/format-regles.md).
// Aucune règle de droit ici : uniquement la grammaire des conditions.

/** Minuscules sans accents, pour comparer des textes saisis librement. */
export function normaliser(texte) {
  return String(texte ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const enListe = (v) => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);

/** Compare une réponse à un test : { egal }, { dans }, { contient_un_de }, { egal_exactement }. */
export function testerReponse(reponse, test) {
  if (reponse === undefined || reponse === null) return false;
  if ('egal' in test) return reponse === test.egal;
  if ('dans' in test) return test.dans.includes(reponse);
  if ('contient_un_de' in test) return enListe(reponse).some((v) => test.contient_un_de.includes(v));
  if ('egal_exactement' in test) {
    const r = enListe(reponse);
    return r.length === test.egal_exactement.length && test.egal_exactement.every((v) => r.includes(v));
  }
  throw new Error(`Test de réponse inconnu : ${JSON.stringify(test)}`);
}

/** Le « si » d'un effet de question : une valeur simple ou un test. */
export function effetCorrespond(si, reponse) {
  return typeof si === 'string' ? reponse === si : testerReponse(reponse, si);
}

/**
 * Évalue une condition.
 * ctx = { reponse(id, module), module, modules, revendications, classe }
 *   - reponse(id, module) renvoie la réponse à la règle id (dans le module si la règle est de portée module) ;
 *   - module est l'état du module courant (qualification, perimetre…) ou null au niveau produit.
 */
export function evaluerCondition(cond, ctx) {
  if (cond === undefined || cond === null) return true;
  const cles = Object.keys(cond);
  if (cles.length === 0) return true;

  if ('tous' in cond) return cond.tous.every((c) => evaluerCondition(c, ctx));
  if ('un_de' in cond) return cond.un_de.some((c) => evaluerCondition(c, ctx));
  if ('non' in cond) return !evaluerCondition(cond.non, ctx);

  if ('reponse' in cond) {
    const { reponse: id, ...test } = cond;
    return testerReponse(ctx.reponse(id, ctx.module), test);
  }
  if ('qualification_dans' in cond) return Boolean(ctx.module) && cond.qualification_dans.includes(ctx.module.qualification);
  if ('perimetre_dans' in cond) return Boolean(ctx.module) && cond.perimetre_dans.includes(ctx.module.perimetre);
  if ('classe' in cond) return ctx.classe === cond.classe;
  if ('classe_dans' in cond) return cond.classe_dans.includes(ctx.classe);

  if ('texte' in cond) {
    if (cond.texte !== 'revendications') throw new Error(`Champ de texte inconnu : ${cond.texte}`);
    const texte = normaliser(ctx.revendications.map((r) => r.texte).join(' \n '));
    return cond.contient_un_de.some((mot) => texte.includes(normaliser(mot)));
  }

  if ('modules' in cond) {
    const vrai = (m) => evaluerCondition(cond.condition, { ...ctx, module: m });
    if (cond.modules === 'aucun') return !ctx.modules.some(vrai);
    if (cond.modules === 'au_moins_un') return ctx.modules.some(vrai);
    if (cond.modules === 'tous') return ctx.modules.length > 0 && ctx.modules.every(vrai);
    throw new Error(`Quantificateur inconnu : ${cond.modules}`);
  }

  throw new Error(`Condition inconnue : ${JSON.stringify(cond)}`);
}

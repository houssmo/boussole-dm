// Moteur de décision de Boussole DM.
// Il interprète data/regles.json : aucune règle de droit n'est écrite ici. Fonctionne dans le navigateur et sous Node.
import { evaluerCondition, effetCorrespond, normaliser } from './conditions.js';

export const FORMAT_SAISIE = 'boussole-dm/saisie';
export const VERSION_SAISIE = 1;

/** Saisie vide, point de départ d'un passage. */
export function nouvelleSaisie(reference = '') {
  return { format: FORMAT_SAISIE, version: VERSION_SAISIE, reference_cas: reference, description: '', revendications: [], modules: [], reponses: {} };
}

function etatModule(m) {
  return {
    id: m.id, nom: m.nom ?? m.id,
    qualification: null, motifs: [], fin: false, perimetre: null,
    classes: [], classe: null, classes_indicatives: [], interfaces: [],
  };
}

/**
 * Évalue une saisie.
 * @param {object} regles   contenu de data/regles.json
 * @param {object} saisie   passage de l'utilisateur (voir nouvelleSaisie)
 * @param {object} [exemples] contenu de data/exemples-mdcg.json
 * @returns résultat : modules, classe, conséquences, zones grises, signaux, questions en attente, trace
 */
export function evaluer(regles, saisie, exemples = null) {
  const parId = new Map(regles.regles.map((r) => [r.id, r]));
  const ordreClasses = regles.meta.ordre_classes;
  const modulesSaisis = saisie.modules ?? [];
  const reponsesProduit = saisie.reponses ?? {};

  const modules = modulesSaisis.map(etatModule);
  const saisieDe = new Map(modulesSaisis.map((m) => [m.id, m]));
  const res = {
    modules, classe: null, agregation: null, organisme_notifie: null,
    consequences: [], zones_grises: [], signaux: [], en_attente: [], reponses_ignorees: [], trace: [], exemples: [],
  };
  const zonesVues = new Set();
  const conseqVues = new Set();
  const utilisees = new Set(); // réponses effectivement prises en compte, « module:regle » ou « :regle »

  const reponse = (id, module) => {
    const r = parId.get(id);
    if (!r) throw new Error(`Règle inconnue dans une condition : ${id}`);
    if (r.portee === 'module') return module ? saisieDe.get(module.id)?.reponses?.[id] : undefined;
    return reponsesProduit[id];
  };
  const contexte = (module) => ({ reponse, module, modules, revendications: saisie.revendications ?? [], classe: res.classe });

  const ajouterZone = (id, regle, module) => {
    if (zonesVues.has(id)) {
      res.zones_grises.find((z) => z.id === id).declenchee_par.push({ regle, module: module?.id ?? null });
      return;
    }
    const zone = regles.zones_grises.find((z) => z.id === id);
    if (!zone) throw new Error(`Zone grise inconnue : ${id}`);
    zonesVues.add(id);
    res.zones_grises.push({ ...zone, declenchee_par: [{ regle, module: module?.id ?? null }] });
  };

  const appliquer = (effet, regle, module) => {
    switch (effet.type) {
      case 'qualification': module.qualification = effet.valeur; module.motifs.push({ regle: regle.id, motif: effet.motif }); break;
      case 'fin_module': module.fin = true; break;
      case 'perimetre': module.perimetre = effet.valeur; break;
      case 'interface': break; // le texte saisi est repris tel quel dans module.interfaces
      case 'classe': module.classes.push({ valeur: effet.valeur, regle: regle.id }); break;
      case 'classe_indicative': module.classes_indicatives.push({ valeur: effet.valeur, regle: regle.id, message: effet.message }); break;
      case 'agregation_classes': res.agregation = { methode: effet.methode, regle: regle.id }; break;
      case 'consequence': {
        if (conseqVues.has(effet.id)) break;
        const c = regles.consequences.find((x) => x.id === effet.id);
        if (!c) throw new Error(`Conséquence inconnue : ${effet.id}`);
        conseqVues.add(effet.id);
        res.consequences.push({ ...c, regle: regle.id });
        if (c.organisme_notifie !== undefined) res.organisme_notifie = c.organisme_notifie;
        break;
      }
      case 'zone_grise': ajouterZone(effet.id, regle.id, module); break;
      case 'signal': res.signaux.push({ ...effet, regle: regle.id, module: module?.id ?? null }); break;
      default: throw new Error(`Effet inconnu dans ${regle.id} : ${effet.type}`);
    }
  };

  // Applique une règle dans un contexte (module ou produit) et l'inscrit dans la trace.
  const traiter = (regle, module) => {
    if (module && regle.etape === 'qualification' && module.fin) return;
    if (!evaluerCondition(regle.condition, contexte(module))) return;

    const entree = { regle: regle.id, etape: regle.etape, type: regle.type, module: module?.id ?? null, effets: [] };
    const cle = `${module?.id ?? ''}:${regle.id}`;
    for (const z of regle.zones_grises ?? []) ajouterZone(z, regle.id, module);

    if (regle.type === 'deduction') {
      for (const e of regle.effets) { appliquer(e, regle, module); entree.effets.push(e); }
    } else {
      const valeur = regle.champ_saisie ? saisie[regle.champ_saisie]
        : regle.portee === 'module' ? saisieDe.get(module.id)?.reponses?.[regle.id] : reponsesProduit[regle.id];
      const vide = valeur === undefined || valeur === null || valeur === '' || (Array.isArray(valeur) && valeur.length === 0);
      if (vide) {
        res.en_attente.push({ regle: regle.id, etape: regle.etape, module: module?.id ?? null, question: regle.question });
        return;
      }
      utilisees.add(cle);
      entree.reponse = valeur;
      if (regle.type === 'saisie') {
        for (const e of regle.effets) {
          if (e.type === 'interface') module?.interfaces.push(String(valeur));
          else { appliquer(e, regle, module); entree.effets.push(e); }
        }
      } else {
        for (const e of regle.effets) {
          if (!effetCorrespond(e.si, valeur)) continue;
          for (const a of e.alors) { appliquer(a, regle, module); entree.effets.push(a); }
        }
      }
    }
    res.trace.push(entree);
  };

  // Plusieurs classes ne se combinent que selon une règle d'agrégation issue des données.
  const agreger = (classes, ou) => {
    const distinctes = [...new Set(classes)];
    if (distinctes.length === 0) return null;
    if (distinctes.length === 1) return distinctes[0];
    if (!res.agregation) {
      res.signaux.push({ type: 'signal', gravite: 'bloquant', message: `Plusieurs classes possibles (${distinctes.join(', ')}) pour ${ou}, et aucune règle d'agrégation ne s'applique : classe non calculée.`, regle: null, module: null });
      return null;
    }
    if (res.agregation.methode !== 'maximum') throw new Error(`Méthode d'agrégation inconnue : ${res.agregation.methode}`);
    return classes.reduce((a, b) => (ordreClasses.indexOf(b) > ordreClasses.indexOf(a) ? b : a));
  };

  for (const etape of regles.meta.ordre_evaluation) {
    const delEtape = regles.regles.filter((r) => r.etape === etape);
    for (const module of modules) for (const r of delEtape.filter((x) => x.portee === 'module')) traiter(r, module);
    for (const r of delEtape.filter((x) => x.portee === 'produit')) traiter(r, null);

    if (etape === 'classification') {
      for (const m of modules) m.classe = agreger(m.classes.map((c) => c.valeur), `le module « ${m.nom} »`);
      res.classe = agreger(modules.filter((m) => m.perimetre === 'dm' && m.classe).map((m) => m.classe), 'le produit');
    }
  }

  // Réponses saisies mais sans effet (question non posée dans ce chemin) : utiles pour repérer une réponse devenue obsolète.
  for (const m of modulesSaisis) {
    for (const id of Object.keys(m.reponses ?? {})) if (!utilisees.has(`${m.id}:${id}`)) res.reponses_ignorees.push({ regle: id, module: m.id });
  }
  for (const id of Object.keys(reponsesProduit)) if (!utilisees.has(`:${id}`)) res.reponses_ignorees.push({ regle: id, module: null });

  // Ordre d'affichage : celui des étapes.
  const rang = Object.fromEntries(regles.etapes.map((e) => [e.id, e.ordre]));
  res.trace.sort((a, b) => rang[a.etape] - rang[b.etape]);
  res.en_attente.sort((a, b) => rang[a.etape] - rang[b.etape]);
  res.complet = res.en_attente.length === 0;
  if (exemples) res.exemples = rapprocherExemples(exemples, saisie);
  return res;
}

/** Prochaine question à poser (la première en attente dans l'ordre des étapes), ou null. */
export function prochaineQuestion(regles, saisie) {
  return evaluer(regles, saisie).en_attente[0] ?? null;
}

/** Exemples des guides dont les mots-clés apparaissent dans la saisie (revendications, description, modules). */
export function rapprocherExemples(exemples, saisie, max = 5) {
  const texte = normaliser([
    saisie.description,
    ...(saisie.revendications ?? []).map((r) => r.texte),
    ...(saisie.modules ?? []).flatMap((m) => [m.nom, m.fonction, m.donnees, m.finalite]),
  ].filter(Boolean).join(' \n '));
  // Un mot-clé doit commencer un mot du texte (« ecg » ne correspond pas à « baecg »).
  const debutDeMot = (mot) => new RegExp(`(^|[^a-z0-9])${normaliser(mot).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(texte);
  return exemples.exemples
    .map((ex) => ({ ex, mots: ex.mots_cles.filter(debutDeMot) }))
    .filter((x) => x.mots.length > 0)
    .sort((a, b) => b.mots.length - a.mots.length)
    .slice(0, max)
    .map(({ ex, mots }) => ({ ...ex, mots_trouves: mots }));
}

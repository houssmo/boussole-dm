// Enregistrement des passages dans le navigateur (localStorage), export et import en JSON. Aucun serveur.
import { FORMAT_SAISIE, VERSION_SAISIE } from '../moteur.js';

const CLE = 'boussole-dm:passages';

function lireTout() {
  try {
    const brut = localStorage.getItem(CLE);
    const val = brut ? JSON.parse(brut) : {};
    return val && typeof val === 'object' ? val : {};
  } catch {
    return {};
  }
}

function ecrireTout(passages) {
  try {
    localStorage.setItem(CLE, JSON.stringify(passages));
    return true;
  } catch {
    return false; // navigation privée, stockage plein ou bloqué : l'export JSON reste possible
  }
}

/** Liste des passages, du plus récent au plus ancien. */
export function listerPassages() {
  return Object.values(lireTout()).sort((a, b) => (b.modifie_le ?? '').localeCompare(a.modifie_le ?? ''));
}

export function chargerPassage(id) {
  return lireTout()[id] ?? null;
}

/** Enregistre (ou met à jour) un passage. Renvoie false si le stockage est indisponible. */
export function enregistrerPassage(passage) {
  const tout = lireTout();
  tout[passage.id] = { ...passage, modifie_le: new Date().toISOString() };
  return ecrireTout(tout);
}

export function supprimerPassage(id) {
  const tout = lireTout();
  delete tout[id];
  return ecrireTout(tout);
}

export function nouvelId() {
  return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

/** Fichier JSON d'export : le passage et la version des données utilisées. */
export function exporterPassage(passage, versionDonnees) {
  const contenu = {
    format: FORMAT_SAISIE + '/export', version: VERSION_SAISIE, version_donnees: versionDonnees,
    exporte_le: new Date().toISOString(), avertissement: 'Outil pédagogique, sans valeur réglementaire.',
    passage,
  };
  const blob = new Blob([JSON.stringify(contenu, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const nom = (passage.saisie.reference_cas || 'passage').replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 60);
  a.href = url;
  a.download = `boussole-dm-${nom}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lit un fichier exporté et renvoie un passage valide, ou lève une erreur lisible. */
export async function importerFichier(fichier) {
  let contenu;
  try {
    contenu = JSON.parse(await fichier.text());
  } catch {
    throw new Error("Ce fichier n'est pas un JSON lisible.");
  }
  const passage = contenu?.passage ?? null;
  const saisie = passage?.saisie;
  if (contenu?.format !== FORMAT_SAISIE + '/export' || !saisie || saisie.format !== FORMAT_SAISIE) {
    throw new Error("Ce fichier n'est pas un export de Boussole DM.");
  }
  if (saisie.version > VERSION_SAISIE) throw new Error('Ce fichier provient d’une version plus récente de l’outil.');
  if (!Array.isArray(saisie.modules) || !Array.isArray(saisie.revendications) || typeof saisie.reponses !== 'object') {
    throw new Error('Le contenu du passage est incomplet.');
  }
  // Nouvel identifiant : un import ne remplace jamais un passage existant.
  return { ...passage, id: nouvelId(), importe_le: new Date().toISOString() };
}

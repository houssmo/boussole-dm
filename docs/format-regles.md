# Format de `data/regles.json`

> Outil pédagogique, sans valeur réglementaire.

Ce document décrit le contrat entre les données et le moteur. Le moteur (`src/moteur.js`, étape 3) ne contient aucune règle de droit : il interprète ce fichier. Le guide pas à pas « ajouter ou modifier une règle » viendra à l'étape 5.

## Structure générale

```json
{
  "meta": { "statuts": [...], "ordre_classes": ["I", "IIa", "IIb", "III"], "domaines_officiels": [...] },
  "etapes": [ { "id": "destination", "ordre": 1, "titre": "...", "description": "..." } ],
  "qualifications": { "dm_mdr": "libellé", ... },
  "perimetres": { "dm": "libellé", "necessaire": "...", "hors": "..." },
  "regles": [ ... ],
  "consequences": [ ... ],
  "zones_grises": [ ... ]
}
```

## Une règle

| Champ | Obligatoire | Rôle |
|---|---|---|
| `id` | oui | Identifiant unique et stable (`R11-2`, `Q-6`…). Les cas de test y font référence. |
| `etape` | oui | Id d'une étape (`destination`, `qualification`, `perimetre`, `classification`, `consequences`). |
| `type` | oui | `question` (choix parmi des options), `saisie` (texte libre) ou `deduction` (pas de question : appliquée dès que sa condition est vraie). |
| `champ_saisie` | non | Pour une `saisie` dont la réponse est un champ de la saisie plutôt qu'une réponse : seule valeur admise, `revendications` (règle D-1). |
| `portee` | oui | `module` : posée ou évaluée pour chaque module. `produit` : une seule fois. |
| `question` | sauf déduction | Texte affiché. |
| `options` | pour `question` | Liste de `{ "valeur", "libelle" }`. `choix_multiple: true` autorise plusieurs réponses ; une option `"exclusive": true` (ex. « aucune ») décoche les autres. |
| `condition` | non (oui pour une déduction) | Quand la question est posée ou la déduction appliquée (voir plus bas). |
| `effets` | oui | Ce que la règle produit (voir plus bas). |
| `zones_grises` | non | Ids de zones grises à signaler quand la question est posée. |
| `sources` | oui | Au moins une source (voir plus bas). |
| `statut` | oui | « à valider par l'équipe » si au moins une source a été lue (extrait et date renseignés), sinon « non vérifié ». |
| `note_verification` | non | Ce qu'il reste à vérifier. |

### Source

```json
{ "document": "Règlement (UE) 2017/745 (MDR)", "cle": "MDR",
  "reference": "Annexe VIII, chapitre III, règle 11, premier alinéa",
  "version": "Version consolidée FR du 01/01/2026",
  "url": "https://eur-lex.europa.eu/...", "langue": "fr",
  "consulte_le": "2026-11-02",
  "extrait": "« Les logiciels destinés à fournir des informations… »" }
```

- `url` doit appartenir à un domaine de `meta.domaines_officiels` (le validateur refuse les autres).
- `extrait` : citation fidèle et courte, dans la langue de la source. Vaut `null` tant que le texte n'a pas été lu.
- `extrait` et `consulte_le` se renseignent ensemble.
- Une entrée passe à « à valider par l'équipe » dès qu'**au moins une** source officielle a été lue. Toute source encore non lue (par exemple le texte du MDR sur EUR-Lex) doit alors être signalée dans `note_verification`. Ces deux règles sont contrôlées automatiquement.
- `forme_extrait` (facultatif) signale un extrait recomposé : ligne de tableau dont la mise en page sépare les cellules, ou passage coupé par une note de bas de page et marqué « […] ».
- `fragments_verification` (facultatif, avec `forme_extrait`) : liste des morceaux, tels qu'ils figurent dans le document, que `tests/verifier-extraits.mjs` doit retrouver pour valider un extrait recomposé.

### Conditions

| Forme | Vraie si… |
|---|---|
| `{ "reponse": "Q-4", "egal": "oui" }` | la réponse à Q-4 (du même module si Q-4 est de portée module) vaut `oui` |
| `{ "reponse": "Q-2", "dans": ["non", "avec_finalite"] }` | la réponse est l'une des valeurs |
| `{ "reponse": "Q-6", "contient_un_de": [...] }` | (choix multiple) au moins une des valeurs a été cochée |
| `{ "qualification_dans": ["dm_mdr", "accessoire"] }` | la qualification du module courant est dans la liste |
| `{ "perimetre_dans": ["hors"] }` | le périmètre du module courant est dans la liste |
| `{ "classe": "IIa" }` / `{ "classe_dans": [...] }` | la classe finale du produit vaut cette classe ou figure dans la liste |
| `{ "texte": "revendications", "contient_un_de": [...] }` | une revendication contient un des termes (sans tenir compte de la casse ni des accents) |
| `{ "modules": "aucun" \| "au_moins_un" \| "tous", "condition": {...} }` | quantificateur sur les modules du produit |
| `{ "tous": [...] }`, `{ "un_de": [...] }`, `{ "non": {...} }` | combinaisons logiques |

### Effets

Pour une question, chaque effet est rattaché à une réponse : `{ "si": "oui", "alors": [ ... ] }`. Pour un choix multiple, `si` peut être `{ "contient_un_de": [...] }` ou `{ "egal_exactement": [...] }`. Pour une déduction, les effets sont donnés directement.

| Effet | Signification |
|---|---|
| `{ "type": "qualification", "valeur": "dm_mdr", "motif": "..." }` | qualifie le module (la dernière qualification appliquée l'emporte) |
| `{ "type": "fin_module" }` | plus aucune question de qualification pour ce module |
| `{ "type": "perimetre", "valeur": "necessaire" }` | place le module dans le schéma du périmètre |
| `{ "type": "interface" }` | la saisie décrit une interface entre le DM et un module hors périmètre |
| `{ "type": "classe", "valeur": "IIb" }` | classe candidate pour le module |
| `{ "type": "classe_indicative", "valeur": "IIb", "message": "..." }` | classe d'orientation (tableau IMDRF) : affichée à côté, jamais retenue dans le calcul |
| `{ "type": "agregation_classes", "methode": "maximum" }` | règle de combinaison des classes candidates (fondée sur l'annexe VIII, point 3.5) |
| `{ "type": "consequence", "id": "PROC-IIa" }` | ajoute une conséquence (texte dans `consequences`) |
| `{ "type": "zone_grise", "id": "ZG-1" }` | signale une zone grise |
| `{ "type": "signal", "gravite": "info" \| "avertissement" \| "bloquant", "message": "..." }` | message affiché dans le rapport |

## Vérifier ses modifications

```
npm test
```

Cette commande contrôle la structure du fichier, les identifiants en double, les références croisées (règles, conséquences, zones grises, options), les domaines des URL et la cohérence entre statut et extrait. Elle liste aussi les entrées « non vérifié » et les sources encore à lire.

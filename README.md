# Boussole DM

> **Outil pédagogique, sans valeur réglementaire.** Aucune donnée réelle de patient ou d'entreprise.

Outil web qui aide à qualifier un logiciel au regard du règlement (UE) 2017/745 (MDR), à délimiter la partie du produit qui relève du dispositif médical, à le classer et à en tirer les conséquences réglementaires. Chaque étape affiche sa source officielle. Projet de TD du Master SNPS (UE Réglementation des DM et du numérique en santé, UPJV Amiens).

## Organisation

| Dossier | Contenu |
|---|---|
| `data/regles.json` | Toutes les règles, leurs sources, extraits et statuts |
| `data/exemples-mdcg.json` | Exemples tirés des guides MDCG et de l'ANSM |
| `src/moteur.js`, `src/conditions.js` | Moteur de décision : il lit les données, sans règle de droit écrite en dur |
| `src/ui/` | Interface (en cours, étape 4) |
| `tests/` | Validation des données, tests du moteur, cas de test (`tests/cas/`) |
| `docs/` | Journal des sources, points à vérifier, format des règles, guide des cas de test |
| `assets/logo/` | Logo (JPEG d'origine dans `source/`) et favicons |

## Commandes

```
npm test            # données + moteur + rejeu de tous les cas
npm run test:cas    # rejeu des cas seulement (options : --vague=N, --cas=ID, --detail)
```

Node 18 ou plus récent, aucune dépendance à installer.

# Boussole DM

**Site : https://houssmo.github.io/boussole-dm/** (après activation de GitHub Pages, voir [docs/mise-en-ligne.md](docs/mise-en-ligne.md))

> **Outil pédagogique, sans valeur réglementaire.** Aucune donnée réelle de patient ou d'entreprise.

Outil web qui aide à qualifier un logiciel au regard du règlement (UE) 2017/745 (MDR), à délimiter la partie du produit qui relève du dispositif médical, à le classer et à en tirer les conséquences réglementaires. Chaque étape affiche sa source officielle. Projet de TD du Master SNPS (UE Réglementation des DM et du numérique en santé, UPJV Amiens).

## Organisation

| Dossier | Contenu |
|---|---|
| `data/regles.json` | Toutes les règles, leurs sources, extraits et statuts |
| `data/exemples-mdcg.json` | Exemples tirés des guides MDCG et de l'ANSM |
| `src/moteur.js`, `src/conditions.js` | Moteur de décision : il lit les données, sans règle de droit écrite en dur |
| `index.html`, `src/ui/`, `src/styles.css` | Interface : étapes, schéma du périmètre, rapport imprimable, enregistrement local, export et import JSON |
| `tests/` | Validation des données, tests du moteur, cas de test (`tests/cas/`) |
| `docs/` | Journal des sources, points à vérifier, format des règles, guide des cas de test |
| `assets/logo/` | Logo (JPEG d'origine dans `source/`) et favicons |

## Utiliser l'outil sur son ordinateur

```
npm start           # puis ouvrir http://localhost:8080
```

L'outil doit être servi par un serveur web, même local : ouvrir `index.html` par un double-clic ne fonctionne pas, car le navigateur bloque alors le chargement des règles. Sans Node : `python3 -m http.server 8080`.

## Commandes de test

```
npm test            # données + moteur + rejeu de tous les cas
npm run test:cas    # rejeu des cas seulement (options : --vague=N, --cas=ID, --detail)
npm run test:ui     # test de fumée de l'interface (Playwright ; lancer npm start avant)
```

Node 18 ou plus récent, aucune dépendance à installer.

## Documentation

- [Ajouter ou modifier une règle](docs/ajouter-une-regle.md) : le guide de l'équipe
- [Format de regles.json](docs/format-regles.md)
- [Rédiger et rejouer les cas de test](docs/cas-de-test.md)
- [Mise en ligne](docs/mise-en-ligne.md)
- [Journal des sources](docs/journal-sources.md) et [points à vérifier](docs/points-a-verifier.md)

Vérifier un extrait recopié contre le document officiel : `node tests/verifier-extraits.mjs <CLE> <document.pdf|.html|.txt>`

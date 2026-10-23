# Journal des sources

> Outil pédagogique, sans valeur réglementaire.

Pour chaque source : URL officielle, date, ce qui a été fait et ce qui a été retenu.

## Méthode

- Les documents sont téléchargés depuis leur URL officielle, puis leur texte est extrait (`pdftotext -layout` pour les PDF ; texte de la page HTML pour l'ANSM).
- Chaque extrait de `data/regles.json` et `data/exemples-mdcg.json` a été **contrôlé automatiquement** : il doit figurer mot pour mot dans le texte extrait du document, aux espaces et apostrophes typographiques près.
- Deux formes d'extraits sont signalées dans le champ `forme_extrait` :
  - les lignes du tableau 1 de MDCG 2025-6, recomposées parce que la mise en page du PDF sépare les cellules (chaque fragment a été vérifié) ;
  - un passage de MDCG 2019-11 coupé par une note de bas de page, marqué « […] ».
- Les documents MDCG sont en anglais : leurs extraits restent en anglais. Les questions de l'outil en sont des traductions de travail, à relire.

## Session du 2026-10-23 (2e passage, réseau ouvert)

### Sources lues

| Clé | Document | Version | URL | Empreinte SHA-256 (début) | Ce qui a été retenu |
|---|---|---|---|---|---|
| MDCG2019-11 | MDCG 2019-11 rev.1, qualification et classification des logiciels | rev.1, juin 2025 (PDF créé le 17/06/2025) | https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf | `ed60b2084a91648b` | Lu en entier. Définitions (section 2), arbre de décision figure 1 (étapes 1 à 5) et figure 2 (MDR ou IVDR), règles d'application 3.3 et 3.5 citées, règle 11 citée et sous-règles 11a, 11b, 11c, règles 12, 13, 15 et 22, modules (section 7), annexes I à IV (exemples et tableau IMDRF). Base de la plupart des règles. |
| MDCG2021-24 | MDCG 2021-24 rev.1, classification des DM | rev.1, avril 2026 (PDF créé le 20/04/2026) | https://health.ec.europa.eu/document/download/cbb19821-a517-4e13-bf87-fdc6ddd1782e_en?filename=mdcg_2021-24_en.pdf | `6bd1d1f4f6733ba3` | Lu : sections 2.1 à 2.6 (obligations selon la classe), 3.1 (le logiciel est un dispositif actif), 3.2 (application des règles, exemple pratique), règles 11, 12, 15 et 22. URL du PDF trouvée sur la page d'annonce du 20/04/2026. |
| MDCG2025-6 | MDCG 2025-6 / AIB 2025-1, articulation MDR/IVDR et AI Act | juin 2025 | https://health.ec.europa.eu/system/files/2025-06/mdcg_2025-6_en.pdf | `48db859581fb5f16` | Lu : questions 1 à 4 (définition du système d'IA, conditions de haut risque, tableau 1, absence d'effet sur la classe MDR) et date d'application du 2 août 2027. |
| MDCG2023-4 | MDCG 2023-4, logiciel DM et matériel | octobre 2023 | https://health.ec.europa.eu/system/files/2023-10/md_mdcg_2023-4_software_en.pdf | `8bd969695fe7e60b` | Lu : le guide traite du matériel (capteurs, objets connectés) qui fournit des données à un logiciel DM, pas du logiciel qui pilote un DM. **Retiré des sources de Q-2**, où il avait été mis par erreur au premier passage. |
| MDCG2020-1 | MDCG 2020-1, évaluation clinique des logiciels DM | mars 2020 | https://health.ec.europa.eu/system/files/2020-09/md_mdcg_2020_1_guidance_clinic_eva_md_software_en_0.pdf | `9d46e8caaee4ca95` | Consulté (section 4) : trois composantes des preuves cliniques. Le premier téléchargement a renvoyé HTTP 429 ; le second a réussi. |
| MDCG2019-16 | MDCG 2019-16 rev.1, cybersécurité | rev.1, PDF du 12/01/2022 | https://health.ec.europa.eu/system/files/2022-01/md_cybersecurity_en.pdf | `89d9871fa7fe30d9` | Consulté (sections 1.2 et 1.3) : objet du guide (exigences de l'annexe I relatives à la cybersécurité). Numéros des points de l'annexe I non relevés : la figure 1 est une image. |
| ANSM-QUALIF | ANSM, « Le logiciel… relève-t-il du statut de DM ou de DM DIV ? » | mise à jour du 06/01/2026 | https://ansm.sante.fr/documents/reference/le-logiciel-ou-lapplication-sante-que-je-vais-mettre-sur-le-marche-releve-t-il-du-statut-de-dispositif-medical-dm-ou-de-dispositif-medical-de-diagnostic-in-vitro-dm-div | — | Lu en entier : critères cumulatifs, exemples « DM » et « Pas DM », analyse module par module, logiciel qui pilote un DM vu comme un accessoire, risque non pris en compte pour la qualification. |
| ANSM-CLASSIF | ANSM, « Impact des nouveaux règlements européens sur la classification des logiciels » | mise à jour du 06/01/2026 | https://ansm.sante.fr/documents/reference/impact-des-nouveaux-reglements-europeens-sur-la-classification-des-logiciels | — | Lu : la plupart des logiciels DM sont au minimum en IIa ; les logiciels DM DIV passent en classe B, C ou D. |
| ANSM-CONSEQ | ANSM, « Je qualifie mon logiciel… quelles sont les conséquences ? » | publiée le 21/09/2022 | https://ansm.sante.fr/documents/reference/je-qualifie-mon-logiciel-ou-mon-application-de-dm-ou-dmdiv-quelles-sont-les-consequences-et-la-marche-a-suivre-pour-commercialiser-mon-produit | — | Lu : obligations du fabricant (démarche qualité, analyse de risque, normes, vigilance, surveillance après commercialisation). |
| ANSM-LOG | ANSM, « Logiciels et applications mobiles en santé » | mise à jour du 04/06/2026 | https://ansm.sante.fr/documents/reference/reglementation-relative-aux-dispositifs-medicaux-dm-et-aux-dispositifs-medicaux-de-diagnostic-in-vitro-dmdiv/logiciels-et-applications-mobiles-en-sante | — | Page d'index : elle renvoie vers les trois pages ci-dessus. |

Le PDF de MDCG 2019-11 rev.1 téléchargé sur le site de la Commission est identique (même empreinte) à celui que l'utilisateur avait déposé avant l'ouverture du réseau. Conformément à sa demande, seuls les fichiers téléchargés depuis les URL officielles ont servi de source.

### Sources toujours inaccessibles

| Clé | Document | Problème constaté le 2026-10-23 | Conséquence |
|---|---|---|---|
| MDR, IVDR, AIA | Règlements sur EUR-Lex | `eur-lex.europa.eu` répond **HTTP 202 avec `x-amzn-waf-action: challenge`** : un défi JavaScript anti-robot (AWS WAF). Le navigateur headless tente de le résoudre, mais l'accès à `*.token.awswaf.com` est refusé par le proxy (403). | Aucun extrait en français des règlements. Les règles s'appuient sur les passages des guides MDCG qui **citent** le règlement (en anglais). Le texte du MDR reste à lire pour 27 références. |
| IMDRF-N12 | IMDRF/SaMD WG/N12 | Le tunnel vers `www.imdrf.org` s'ouvre, puis la connexion est coupée (HTTP/2 `INTERNAL_ERROR`, rien en HTTP/1.1). | Le tableau IMDRF est utilisé tel que reproduit dans MDCG 2019-11, annexe III. N12 reste à lire. |

**Pour débloquer EUR-Lex :** ajouter le domaine `token.awswaf.com` (avec ses sous-domaines) aux domaines autorisés de l'environnement. Autre solution : télécharger soi-même la version consolidée du MDR (PDF ou HTML) et la déposer dans le projet.

## Session du 2026-10-23 (1er passage, réseau fermé)

Aucun texte n'a pu être lu (proxy : `403 CONNECT` vers les quatre domaines officiels). La recherche web a seulement permis d'identifier les URL et les dates de version. Toutes les entrées étaient alors au statut « non vérifié ».

Versions repérées par la recherche et non encore confirmées :

- **MDR :** version consolidée FR du 01/01/2026, https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:02017R0745-20260101. L'index mentionne une version « courante » du 19/07/2026.
- **IVDR :** version consolidée du 10/01/2025.
- **AI Act :** version consolidée FR du 27/07/2026, https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:02024R1689-20260727. Elle est postérieure à MDCG 2025-6.

# Rédiger et rejouer les cas de test

> Outil pédagogique, sans valeur réglementaire.

## Commandes

| Commande | Effet |
|---|---|
| `npm test` | Tout vérifier : données, moteur, puis rejeu de tous les cas. À lancer après chaque correction. |
| `npm run test:cas` | Rejouer seulement les cas. |
| `node tests/run.js --vague=2` | Rejouer les cas d'une vague. |
| `node tests/run.js --cas=CAS-02` | Rejouer un seul cas. |
| `node tests/run.js --detail` | Afficher tous les contrôles, même conformes, et les exemples MDCG rapprochés. |

Le tableau affiche, pour chaque contrôle, l'**attendu**, l'**obtenu** et l'**écart**. Le code de sortie vaut 1 dès qu'un cas présente un écart.

## Ajouter un cas

1. Copier `tests/cas/_gabarit.json` sous un nom numéroté et parlant, par exemple `tests/cas/04-telesurveillance-insuffisance-cardiaque.json`.
2. Renseigner `id` (`CAS-04`), `titre`, `vague`, `auteur` et `cas_limite` (`true` pour un cas limite).
3. Décrire l'application et ses revendications, puis découper le produit en modules.
4. Pour chaque module, répondre aux questions dans `reponses` avec les identifiants de `data/regles.json` :
   - question à choix : la `valeur` de l'option (`"oui"`) ;
   - choix multiple : une liste (`["diag_maladie"]`) ;
   - saisie libre (P-3) : du texte.
   Les réponses portant sur le produit entier (IA-1) vont dans `saisie.reponses`.
5. Remplir `attendu` avec seulement ce que le cas doit vérifier, et `justification` avec l'extrait exact de la source qui fonde chaque point attendu.
6. Lancer `npm run test:cas`.

Le contrôle « questions sans réponse » échoue si le moteur pose une question à laquelle le cas ne répond pas. Ce n'est pas une erreur du moteur : c'est le signe qu'il faut compléter le cas, ou qu'une règle a changé depuis sa rédaction.

## Objectif de l'équipe

Au moins 12 cas, dont 4 cas limites. Les trois cas fournis (`CAS-01` à `CAS-03`) sont des exemples. Pistes tirées des sources lues (voir `data/exemples-mdcg.json`) : télésurveillance avec alertes (ANSM), application d'observance (zone grise ZG-10), questionnaire qui oriente vers les urgences (ANSM, « Pas DM »), thérapie cognitive en boucle fermée (règle 22), logiciel qui pilote un analyseur (règle d'application 3.3), score de risque mêlant données in vitro et cliniques (ZG-7).

# Ajouter ou modifier une règle

> Outil pédagogique, sans valeur réglementaire.

Ce guide s'adresse à chaque membre de l'équipe, sans prérequis en programmation. Toutes les règles de l'outil se trouvent dans **un seul fichier**, `data/regles.json`. Le moteur (`src/moteur.js`) ne contient aucune règle de droit : il lit ce fichier. On n'a donc jamais besoin de toucher au code JavaScript pour corriger une question, ajouter une source ou créer une règle.

Pour le détail de chaque champ, voir [`format-regles.md`](format-regles.md). Ce guide-ci donne la marche à suivre.

---

## 1. Les trois règles d'or

1. **Une règle s'appuie sur une source officielle lue**, jamais sur un blog, un forum, un cabinet de conseil ou un souvenir. Sources admises : EUR-Lex (MDR, IVDR, AI Act), site de la Commission européenne (guides MDCG), IMDRF, ANSM. Le test refuse toute autre adresse.
2. **L'extrait est recopié mot pour mot**, court, dans la langue de la source, entre guillemets : `« … »` en français, `“…”` en anglais. On n'en coupe une partie qu'avec `[…]`.
3. **En cas de doute, le statut reste « non vérifié »** et le doute est noté dans `note_verification` et dans [`points-a-verifier.md`](points-a-verifier.md). Si deux sources se contredisent, on ne tranche pas : on crée ou on complète une **zone grise** (section 6).

Statuts possibles :

| Statut | Quand |
|---|---|
| `"à valider par l'équipe"` | Au moins une source officielle a été lue, avec un extrait exact et une date de consultation. |
| `"non vérifié"` | Aucune source n'a pu être lue. |

---

## 2. Où modifier : deux façons de faire

### A. Dans le navigateur, sur GitHub (sans rien installer)

1. Ouvrir https://github.com/houssmo/boussole-dm/blob/main/data/regles.json
2. Cliquer sur l'icône **crayon** (*Edit this file*).
3. Faire la modification. Utiliser **Ctrl+F** pour retrouver une règle par son identifiant, par exemple `"id": "R11-1"`.
4. Cliquer sur **Commit changes…**, choisir **Create a new branch for this commit and start a pull request**, puis donner un titre clair (« R11-1 : extrait français du MDR »).
5. Sur la *pull request*, attendre la coche verte : les tests se lancent tout seuls (onglet **Checks**). Une croix rouge signale une erreur ; l'onglet **Checks** dit laquelle (section 8).
6. Faire relire par un autre membre de l'équipe, puis cliquer sur **Merge pull request**.

### B. Sur son ordinateur

```
git clone https://github.com/houssmo/boussole-dm.git
cd boussole-dm
git switch -c regle-r11-mdr        # une branche par modification
# … modifier data/regles.json …
npm test                           # doit afficher « aucune erreur » et « aucun écart »
npm start                          # vérifier dans le navigateur : http://localhost:8080
git commit -am "R11-1 : extrait français du MDR"
git push -u origin regle-r11-mdr   # puis ouvrir la pull request sur GitHub
```

Il faut Node.js 18 ou plus récent. Aucune autre installation n'est nécessaire.

---

## 3. Tâche la plus fréquente : compléter une source avec son extrait

Exemple réel : la règle 11 est aujourd'hui fondée sur sa **citation en anglais** dans MDCG 2019-11, car EUR-Lex n'était pas accessible. Il faut ajouter l'extrait **français** du MDR.

1. Ouvrir le MDR en version consolidée française sur EUR-Lex : https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:02017R0745-20260101. Si EUR-Lex propose une version plus récente (« version actuelle »), prendre celle-là et noter sa date.
2. Aller à l'annexe VIII, chapitre III, règle 11, et copier le passage utile.
3. Dans `regles.json`, chercher `"id": "R11-1"`, puis dans `"sources"` la source dont `"cle"` vaut `"MDR"`. Elle ressemble à ceci :

```json
{
  "document": "Règlement (UE) 2017/745 (MDR)",
  "cle": "MDR",
  "reference": "Annexe VIII, chapitre III, règle 11",
  "version": "Version consolidée FR du 01/01/2026 (version courante à confirmer sur EUR-Lex)",
  "url": "https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:02017R0745-20260101",
  "langue": "fr",
  "consulte_le": null,
  "extrait": null
}
```

4. La compléter. Le texte entre `« »` ci-dessous est à remplacer par **votre copie exacte** du règlement : ne pas recopier cet exemple tel quel.

```json
  "version": "Version consolidée FR du JJ/MM/AAAA",
  "consulte_le": "2026-11-05",
  "extrait": "« … texte exact copié depuis EUR-Lex … »"
```

5. Dans la même règle, mettre à jour `"note_verification"` : retirer la phrase sur EUR-Lex inaccessible si toutes les sources sont maintenant lues.
6. Si le texte français emploie un autre mot que la question (par exemple « contrôler » au lieu de « surveiller »), corriger aussi `"question"` pour coller au règlement.
7. **Vérifier l'extrait automatiquement** (sur ordinateur) : enregistrer la page EUR-Lex (*Fichier › Enregistrer sous*, format HTML ou texte), puis lancer :

```
node tests/verifier-extraits.mjs MDR chemin/vers/la-page-eurlex.html
```

L'outil indique chaque extrait de cette source « retrouvé » ou « introuvable ». Il ignore les espaces, les retours à la ligne et les apostrophes typographiques. Il accepte un PDF (si `pdftotext` est installé), un `.txt` ou un `.html`. Les clés des sources sont `MDR`, `IVDR`, `AIA`, `MDCG2019-11`, `MDCG2021-24`, `MDCG2025-6`, `MDCG2023-4`, `MDCG2020-1`, `MDCG2019-16`, `IMDRF-N12`, `ANSM-QUALIF`, `ANSM-CLASSIF`, `ANSM-CONSEQ` et `ANSM-LOG`.

8. Ajouter une ligne au [journal des sources](journal-sources.md) : date, URL, version, ce qui a été retenu.

La liste de toutes les sources encore à lire est dans [`points-a-verifier.md`](points-a-verifier.md). `npm test` en donne aussi le nombre (« références de sources encore à lire »).

---

## 4. Modifier une question existante

| Je veux… | Je modifie… |
|---|---|
| reformuler la question | `"question"` (et `"aide"` si besoin) |
| changer le libellé d'une réponse | `"libelle"` dans `"options"`, **jamais** `"valeur"` |
| changer ce qu'entraîne une réponse | `"effets"` (ex. `{ "type": "classe", "valeur": "IIb" }`) |
| changer quand la question est posée | `"condition"` |

⚠️ **Ne jamais renommer un `"id"` ni une `"valeur"` d'option existants.** Les cas de test et les passages enregistrés par les utilisateurs y font référence : une réponse dont l'identifiant a disparu ne compte plus dans le résultat (le rapport la relègue dans « Réponses non utilisées »), et la question renommée réapparaît sans réponse. Pour remplacer une question, en créer une nouvelle et supprimer l'ancienne, puis mettre à jour les cas de test (section 7).

---

## 5. Ajouter une nouvelle question

### 5.1 Choisir l'emplacement

L'**ordre des règles dans le fichier compte** : à l'intérieur d'une étape, les questions s'affichent et s'évaluent dans cet ordre. Pour la qualification, si deux règles fixent la qualification d'un module, la dernière appliquée l'emporte. Placer la nouvelle règle à côté de celles de la même étape (`"etape"`), à l'endroit logique du raisonnement.

### 5.2 Modèle commenté

Voici la règle réelle `R15`, avec ce que fait chaque partie. Elle sert de modèle à copier puis adapter.

```json
{
  "id": "R15",                          // unique, court, stable
  "etape": "classification",            // destination | qualification | perimetre | classification | consequences
  "type": "question",                   // question (choix) | saisie (texte libre) | deduction (sans question)
  "portee": "module",                   // module : posée pour chaque module ; produit : une seule fois
  "question": "Le module est-il destiné à la contraception ou à la prévention de la transmission de maladies sexuellement transmissibles ?",
  "options": [
    { "valeur": "oui", "libelle": "Oui" },
    { "valeur": "non", "libelle": "Non" }
  ],
  "choix_multiple": false,
  "condition": {                        // posée seulement si…
    "tous": [
      { "qualification_dans": ["dm_mdr", "accessoire"] },                          // …le module est un DM ou un accessoire
      { "reponse": "Q-6", "contient_un_de": ["conception", "diag_maladie", "anatomie"] } // …et Q-6 a l'une de ces finalités
    ]
  },
  "effets": [
    { "si": "oui", "alors": [ { "type": "classe", "valeur": "IIb" } ] }             // « oui » → classe IIb candidate
  ],
  "zones_grises": ["ZG-9"],             // zones grises signalées quand la question est posée
  "sources": [ { … une source complète, voir section 3 … } ],
  "statut": "à valider par l'équipe"
}
```

Attention : le vrai fichier JSON n'accepte **pas** de commentaires (`// …`). Ils ne figurent ici que pour l'explication et doivent être retirés.

### 5.3 Conditions et effets disponibles

- **Conditions** : `reponse` (avec `egal`, `dans` ou `contient_un_de`), `qualification_dans`, `perimetre_dans`, `classe`, `classe_dans`, `texte` (dans les revendications), quantificateurs `modules: "aucun" | "au_moins_un" | "tous"`, et les combinaisons `tous`, `un_de`, `non`.
- **Effets** : `qualification`, `fin_module`, `perimetre`, `classe`, `classe_indicative`, `consequence`, `zone_grise`, `signal` (message `info`, `avertissement` ou `bloquant`).

Le tableau complet, avec un exemple pour chacun, est dans [`format-regles.md`](format-regles.md).

### 5.4 Une déduction (sans question)

Une déduction s'applique toute seule dès que sa condition est vraie, par exemple pour afficher un constat ou déclencher une conséquence :

```json
{
  "id": "K-IIa",
  "etape": "consequences",
  "type": "deduction",
  "portee": "produit",
  "condition": { "classe": "IIa" },
  "effets": [ { "type": "consequence", "id": "PROC-II-III" } ],
  "sources": [ … ],
  "statut": "à valider par l'équipe"
}
```

---

## 6. Ajouter une conséquence, une zone grise ou un exemple

- **Conséquence** (tableau `"consequences"`) : `id`, `titre`, `texte`, et `organisme_notifie` (`true` ou `false`) s'il y a lieu, plus les `sources` et le `statut`. Elle n'apparaît que si une règle la déclenche par `{ "type": "consequence", "id": "…" }`.
- **Zone grise** (tableau `"zones_grises"`) : `id`, `titre`, `description`, **au moins deux** `lectures` (chacune avec `lecture` et `fondement`), plus les `sources` et le `statut`. Chaque lecture doit s'appuyer sur un passage réel ; l'outil présente les lectures sans trancher. On la déclenche par `"zones_grises": ["ZG-…"]` dans une question, ou par un effet `{ "type": "zone_grise", "id": "…" }`.
- **Exemple de guide** (fichier `data/exemples-mdcg.json`) : `description`, `mots_cles` (mots qui doivent apparaître dans la saisie pour rapprocher l'exemple ; éviter les mots trop généraux comme « calcul »), `qualification_indiquee`, `classe_indiquee`, `regle`, et une `source` avec l'extrait.

---

## 7. Vérifier son travail

1. **`npm test`**, ou la coche verte sur la *pull request*. La commande vérifie trois choses :
   - les données : structure, identifiants en double, renvois entre règles, domaines officiels, cohérence entre statut et extrait ;
   - le moteur ;
   - le rejeu de **tous** les cas de `tests/cas/`, avec un tableau attendu / obtenu / écart.
2. **Vérifier les extraits** avec `node tests/verifier-extraits.mjs <CLE> <document>` (section 3).
3. **Regarder dans l'outil** (`npm start`) : la question apparaît-elle au bon moment ? La source s'affiche-t-elle ?
4. **Mettre à jour ou ajouter un cas de test** qui passe par la règle modifiée (voir [`cas-de-test.md`](cas-de-test.md)). Après une correction, rejouer toutes les vagues : `npm run test:cas`.

Si un cas échoue, ce n'est pas forcément une erreur. Soit la modification a un effet imprévu, soit le cas doit être mis à jour parce que la règle a changé à bon droit. Dans ce second cas, corriger `attendu` dans le cas **et** expliquer pourquoi dans sa `justification`.

---

## 8. Messages d'erreur fréquents

| Message | Cause probable | Correction |
|---|---|---|
| `SyntaxError: Expected ',' or '}' … in JSON at position … (line 2302 column 7)` | virgule manquante ou en trop, guillemet non fermé | Aller à la ligne indiquée (ou juste avant). Pas de virgule après le dernier élément d'une liste. Un guillemet droit `"` dans un texte s'écrit `\"`. Les guillemets typographiques `« »` et `“ ”` ne posent pas de problème. |
| `domaine non officiel` | URL d'une source non admise | Utiliser l'URL du document sur EUR-Lex, health.ec.europa.eu, imdrf.org ou ansm.sante.fr. |
| `statut « à valider » sans aucune source lue` | statut changé sans extrait | Ajouter l'extrait et `consulte_le`, ou remettre `"non vérifié"`. |
| `source non lue sans « note_verification »` | une source sans extrait, non signalée | Expliquer dans `note_verification` ce qui reste à lire. |
| `condition sur une règle inconnue` / `zone grise inconnue` | faute de frappe dans un identifiant | Recopier l'identifiant exact. |
| `effet sur une option inexistante` | `"si"` ne correspond à aucune `"valeur"` d'option | Aligner les deux. |
| `condition de forme inconnue` / `type d'effet inconnu` / `« si » de forme inconnue` | clé ou type mal orthographié (ex. `qualificaton_dans`, `clase`) | Comparer avec la liste de la section 5.3. |
| `questions sans réponse` dans le tableau des cas | une nouvelle question se pose dans un cas existant | Ajouter la réponse dans le cas concerné (`reponses`). |

---

## 9. Liste de contrôle avant de fusionner

- [ ] La source est officielle, l'URL pointe vers le document, la version et la date de consultation sont renseignées.
- [ ] L'extrait est exact (vérifié avec `verifier-extraits`), court, entre guillemets, dans la langue de la source.
- [ ] Le statut est juste ; ce qui reste douteux est noté dans `note_verification` et dans `points-a-verifier.md`.
- [ ] Aucun `id` ni aucune `valeur` d'option existants n'ont été renommés.
- [ ] `npm test` passe (coche verte), et un cas de test couvre la règle.
- [ ] Le journal des sources est à jour.
- [ ] Un autre membre de l'équipe a relu.

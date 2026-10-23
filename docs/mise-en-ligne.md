# Mise en ligne

> Outil pédagogique, sans valeur réglementaire.

L'outil est un site statique (HTML, CSS, JavaScript, JSON) : aucun serveur applicatif ni base de données.

## GitHub Pages (dépôt public)

### Activer le site (une seule fois)

1. Ouvrir https://github.com/houssmo/boussole-dm/settings/pages
2. Dans **Build and deployment › Source**, choisir **Deploy from a branch**.
3. Dans **Branch**, choisir `main` et le dossier `/ (root)`, puis cliquer sur **Save**.
4. Attendre une à deux minutes. Le site est alors en ligne à l'adresse **https://houssmo.github.io/boussole-dm/** (elle s'affiche en haut de la page des réglages).

Le fichier vide `.nojekyll`, à la racine du dépôt, demande à GitHub de servir les fichiers tels quels.

### Vérifier

- La page d'accueil affiche le bandeau « Outil pédagogique, sans valeur réglementaire » et le logo.
- « Partir d'un cas d'exemple » › « Imagerie de l'AVC » doit aboutir à la classe III.
- En cas de page blanche ou de message « Les règles n'ont pas pu être chargées », vérifier l'onglet **Actions** du dépôt (déploiement *pages build and deployment*).

### Mettre à jour

Toute modification fusionnée sur `main` est republiée automatiquement en une à deux minutes. Si l'ancienne version reste affichée, recharger la page sans le cache (Ctrl+Maj+R).

Les passages enregistrés restent dans le navigateur de chaque utilisateur : une mise à jour du site ne les efface pas. Une réponse à une question supprimée apparaît dans « Réponses non utilisées » du rapport.

## Netlify (autre possibilité)

1. Sur https://app.netlify.com, choisir **Add new site › Import an existing project › GitHub**, puis le dépôt `houssmo/boussole-dm`.
2. Laisser la commande de build vide et indiquer `.` comme dossier de publication (*publish directory*).
3. Cliquer sur **Deploy**. Netlify republie à chaque push sur `main`.

## Sur son ordinateur

```
npm start      # puis http://localhost:8080
```

Sans Node : `python3 -m http.server 8080`. Ouvrir `index.html` par un double-clic ne fonctionne pas, car le navigateur bloque alors le chargement des règles.

## Tests automatiques

Le fichier `.github/workflows/tests.yml` lance `npm test` à chaque push et à chaque pull request (onglet **Actions**). Une croix rouge signale une erreur dans les données ou un écart dans les cas de test.

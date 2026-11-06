# FreshDesk V4 — identité Fruits & Légumes

Version visuelle rénovée dans l'esprit de l'outil planning Carrefour City, avec symbole Carrefour recoloré vert/orange pour différencier FreshDesk. Le symbole est une variante graphique interne et n'est pas la signature officielle de la marque.

## Mise à jour sur GitHub Pages

Dépôt : https://github.com/Ironakatina33/freshdesk

1. Par sécurité, ouvrez FreshDesk et téléchargez une sauvegarde JSON de vos produits/commandes.
2. Dans votre dépôt GitHub, branche `main`, remplacez **`index.html`** par celui de cette archive.
3. Ajoutez **`brand-fresh.svg`** à la racine du dépôt.
4. Remplacez **`manifest.webmanifest`** par celui de cette archive (facultatif mais recommandé pour l'icône de l'application).
5. Conservez votre **`config.js`** actuel, ainsi que `.nojekyll`. Ne modifiez pas la base SQL ni les fonctions Supabase.
6. Attendez la publication via GitHub Pages puis rechargez le site avec `Ctrl+F5`.

L'archive contient uniquement les nouveaux fichiers nécessaires. Les anciens `app.js` et `style.css` peuvent rester dans le dépôt : FreshDesk V4 n'en dépend pas, son CSS et JavaScript sont intégrés à `index.html`.

## Fonctions conservées

- Catalogue, commande, recherche, catégories, saisons, statut et unités
- Trois affichages : tableau, liste et cartes
- Ajustement des quantités, gestion des produits, import/export JSON
- Synchronisation Supabase existante + contrôle d'accès gestion existant (`0000` si le code de votre base est toujours celui configuré auparavant)
- Impression A4 portrait compacte, sans espace inutile

## Vérifications locales

- Rendu desktop (1440 px) et mobile (390 px) vérifié
- Affichage des 16 produits, commutation des trois vues et bouton quantité testés
- Préparation du bon de commande en mode impression testée
- Le test local n'a pas écrit de données dans votre Supabase. La connexion réelle sera validée lors de la publication.

## Sécurité

Ne publiez jamais de clé `sb_secret_` dans GitHub. Un code de gestion `0000` est très faible et ne doit pas être utilisé pour des données confidentielles.

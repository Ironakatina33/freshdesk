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

## Mobile V6

- Catalogue et commandes optimisés pour smartphone (320–700 px).
- **Liste par défaut** sur un nouvel appareil mobile, avec boutons de quantité
  de 46 px ; l'utilisateur peut toujours choisir Tableau ou Cartes.
- Navigation fixe à quatre entrées : Catalogue, Commande avec badge, Recherche,
  Imprimer ; zone sûre pour les téléphones à encoche.
- Barre de recherche toujours utilisable ; contrôles adaptés à l'ouverture du clavier.
- Fenêtres modales présentées comme panneaux remontant du bas.
- Installable en application via menu du navigateur / bouton « Installer »,
  avec support PWA et cache des seuls fichiers statiques.
- La synchronisation Supabase, la validation du code de gestion, la structure
  du bon A4 et l'impression restent inchangées. **Le cache n'archive pas les
  données de commandes provenant de Supabase.**
- Les écrans d'ordinateur conservent l'interface V5 existante.

## Stock magasin — version 1.1 (novembre 2026)

L'écran **Stock** est accessible depuis le menu sur ordinateur ou la navigation du bas sur mobile.

- **Tous les employés** peuvent consulter le stock enregistré, les ruptures, les références sous le seuil et le stock restant à côté des quantités d'un bon de commande.
- **Accès gestion** : faire le premier inventaire d'un produit, corriger un comptage, noter une entrée ou une sortie et définir un seuil d'alerte. Les derniers mouvements sont enregistrés dans chaque fiche produit.
- **Ma commande** : les quantités commandées et le stock réel sont distincts. La commande montre le stock actuel et le stock prévu après réception.
- **Réceptionner la commande** : une confirmation volontaire ajoute au stock les quantités commandées puis remet ces quantités à zéro. Elle est également accessible depuis l'onglet « Ma commande » pour la gestion. L'opération est refusée si le stock initial d'un des produits commandés n'a pas été renseigné.
- **Impression** : aucune modification du stock ; le bon A4 existant reste inchangé.
- **Rupture** : stock égal à zéro ; seuils configurables par référence, 0 désactive uniquement le seuil personnalisé.
- **Sauvegarde et historique** : les champs `stock`, `stockMin`, `stockUpdatedAt` et les 30 derniers mouvements sont inclus dans le JSON `products` que FreshDesk synchronise déjà. L'historique local conserve jusqu'à 10 mouvements par référence et reste **propre à l'appareil**.
- **Compatibilité** : les anciennes références sans quantité de stock affichent « À inventorier », pas un faux stock de zéro. L'importation et la restauration des anciens JSON préservent les stocks déjà enregistrés pour les références existantes. Le changement d'unité demande une réinitialisation de l'inventaire.

### Synchronisation et prudence

La fonction utilise la sauvegarde versionnée actuelle de `freshdesk_state.products` avec le même accès PIN (RPC `freshdesk_save_with_pin`). Aucune nouvelle table SQL n'est censée être nécessaire **si le backend accepte les propriétés supplémentaires du JSONB**, mais la base Supabase de production n'a pas été accessible depuis cette session pour le confirmer.

Avant de l'utiliser pour le stock réel du magasin :

1. Fais une sauvegarde JSON du catalogue.
2. Vérifie que FLE indique « En ligne » et active l'accès gestion.
3. Fais un inventaire de test sur un seul produit.
4. Attends la confirmation de sauvegarde, recharge sur un autre appareil et vérifie le même stock.
5. Teste une entrée et une sortie de faible quantité, puis vérifie l'historique.
6. N'utilise la réception d'une commande réelle qu'après cette vérification.

Un FLE en mode local ne partage pas le stock entre appareils. L'application ne suit pas les ventes de caisse automatiquement : les sorties de stock doivent être saisies manuellement. Ne conserve pas un code de gestion par défaut ou trop facile à deviner.

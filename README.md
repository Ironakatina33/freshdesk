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

## Fiches produit et statistiques — Insights 1.0 (novembre 2026)

Depuis **Stock**, clique sur le nom d'un produit pour ouvrir sa fiche dédiée. Sur téléphone, elle occupe l'écran entier et garde trois onglets :

- **Aperçu** : quantité physique actuelle, commandes *marquées envoyées*, réceptions, sorties manuelles, pertes et estimation de rotation FIFO seulement si les dates sont connues.
- **Statistiques** : volumes commandés et réceptionnés par mois, sorties/pertes, comparaison par saison. Filtre : 3 mois, 12 mois, année en cours, tout l'historique disponible.
- **Historique** : dernière chronologie des événements datés de la référence, avec nature et quantité.

### Comment alimenter les statistiques

1. Saisis le stock initial dans l'inventaire (sa date d'entrée initiale reste **inconnue**).
2. Prépare la commande comme d'habitude, puis, en **Accès gestion**, clique **« Marquer comme envoyée »** dans **Ma commande**. Cette action enregistre les quantités pour les statistiques mais **n'envoie rien au fournisseur**, ne modifie pas le stock et n'imprime pas à elle seule un bon.
   Si les quantités ont été marquées envoyées par erreur, le bouton **« Annuler l’envoi enregistré »** retire leur contribution aux statistiques (en conservant une trace de l'annulation), sans modifier le stock. Tant que la commande est marquée envoyée, ses quantités ne peuvent pas être modifiées ni remises à zéro.
3. Lors de l'arrivée réelle des produits, **« Réceptionner la commande »** : ce geste enregistre des réceptions datées, ajoute le stock et remet les quantités commandées à zéro. La commande peut être réceptionnée même si elle n'a pas été marquée envoyée ; dans ce cas seules les quantités *réceptionnées* sont comptées.
4. Enregistre les sorties via l'inventaire. La nouvelle action **« Perte / casse »** est comptée séparément des autres sorties. Un changement de stock par inventaire/correction n'est pas comptabilisé comme une vente ou une perte.

**Aucune donnée historique imaginaire** : les métriques commencent avec les événements connus dans FLE, parfois les derniers mouvements de stock déjà enregistrés, et ne reconstituent pas de commandes ou de ventes antérieures. La « rotation » est un délai **estimé** entre une réception datée et une sortie saisie, avec hypothèse FIFO (premier entré, premier sorti), jamais un relevé des ventes caisses. Les stocks initiaux sans date n'entrent pas dans cette moyenne.

Les totaux par mois sont conservés dans les données partagées de chaque produit (`analytics.months`, 120 derniers mois au maximum), même lorsque la chronologie détaillée (`analytics.events`, 200 derniers mouvements) est réduite. La liste de lots courants (`analytics.lots`) permet l'estimation FIFO. Il n'y a pas de nouvelle table Supabase : ces informations utilisent la sauvegarde JSON existante du catalogue et son contrôle de version, sous réserve de validation sur la base de production.

Les fiches sont consultables par tous. Les mouvements de stock, l'enregistrement d'une commande comme envoyée et les réceptions demandent toujours l'**accès gestion** dans la version synchronisée. Les modifications ne sont pas considérées comme enregistrées sur le serveur tant que FLE n'affiche pas **En ligne**.

Attention : l'historique de sauvegardes local de FreshDesk n'est pas un journal d'audit partagé. Les statistiques détaillées de produits sont enregistrées dans le JSON catalogue partagé, mais doivent être vérifiées entre deux appareils avant tout usage réel. Les modifications d'unités (colis/pièces) ne fusionnent pas les statistiques d'unités incompatibles.

## Remplissage du rayon — indépendamment du stock de réserve

Un article possède deux informations **différentes** :

- `stock` : le nombre de colis/unités physiquement enregistrés en réserve (saisie de l'inventaire).
- `shelfFill` : un **état visuel approximatif** du rayon, indépendant des colis, choisi par l'équipe.

Dans **Stock**, l'accès gestion permet de choisir directement : **Non renseigné**, **Rayon vide (0 %)**, **Moins de 50 %**, **50 à 99 %**, **Rayon plein (100 %)**. Ces catégories sont représentées par `null`, `0`, `25`, `75` et `100` dans le JSON produit ; `25` et `75` sont des codes de catégorie et non des pourcentages mesurés précisément. La date de dernière déclaration est conservée dans `shelfUpdatedAt`.

La nouvelle observation est consultable sans accès gestion, à côté des quantités sur le catalogue et les bons, et sur la fiche statistique de chaque produit. Des **filtres de remplissage** sont proposés dans **Catalogue / Ma commande** et dans **Stock**. Ils n'entraînent **aucune modification des quantités** ; la visibilité des produits à imprimer suit les filtres actifs, comme pour les filtres existants.

**Exemple** : 0 colis en réserve et un rayon rempli à 100 % sont affichés **« Réserve vide · rayon rempli »**, et non comme une rupture totale. Les alertes urgentes de stock prennent en compte le remplissage : un rayon bien garni n'est pas considéré critique simplement parce que la réserve est à zéro. Le stock de réserve continue d'être affiché honnêtement, même lorsque le rayon est rempli.

L'observation du rayon ne provoque ni commande, ni sortie de stock, ni vente calculée, ni réception. Les anciennes références sans donnée de rayon sont « Non renseigné », **pas** « Rayon vide ». Les sauvegardes JSON anciennes ne doivent pas effacer une observation plus récente lors d'un import ou d'une restauration. La chronologie locale conserve les changements de statut après sauvegarde.

**Attention** : le taux de remplissage est une estimation saisie manuellement. Il ne correspond pas à une comptabilisation des unités vendues en caisse et ne peut pas servir seul à prévoir précisément les ventes.

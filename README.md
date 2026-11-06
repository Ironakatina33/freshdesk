# FreshDesk V2 — tableau visible et lisible

## Mettre à jour le site EXISTANT (sans perdre les données)

1. Ouvre ton dépôt GitHub Pages actuel.
2. Remplace `index.html`, `app.js`, `style.css` par les fichiers de ce ZIP (et `config.js` si nécessaire, en gardant tes paramètres actuels).
3. GitHub Pages republiera automatiquement les changements. Recharge la page sur PC et téléphone (Ctrl+F5 si besoin).
4. **Ne relance pas le script SQL et ne supprime pas la table Supabase.** Les produits et quantités existants sont conservés.

## Ce qui change
- Correction d'une erreur de rendu qui empêchait d'afficher les lignes (variable `disabled` manquante).
- Tableau immédiatement visible et plus lisible.
- Onglets « Tous les produits » / « Ma commande » et impression accessible directement.
- Vue téléphone simplifiée : produit, quantité, action ; plus besoin de faire défiler 7 colonnes.
- Filtres, saisons, ajout de produits, code gestion et synchronisation existants préservés.

## Accès
- Lecture libre, modification uniquement avec le code de gestion côté Edge Function.
- La configuration n'utilise que la clé Supabase PUBLIQUE. Révoque la clé secrète que tu avais partagée précédemment.
- L'impression utilise la vue affichée. Pour n'imprimer que les produits commandés, ouvre d'abord « Ma commande ».

## Vérification
Après publication, le tableau doit montrer les 16 produits initiaux ou tes références enregistrées dans Supabase. Si le serveur est indisponible, l'application affiche une copie locale avec un état « Connexion interrompue ».

# FreshDesk — sans compte, synchronisé, gratuit

**Projet déjà configuré avec l'URL Supabase et la clé PUBLIQUE** dans `config.js`. La clé `sb_secret_…` communiquée dans la conversation n'a PAS été placée dans les fichiers. **Révoque-la et remplace-la** dans Supabase > Settings > API Keys (elle a été divulguée).

## Installation

1. Dans https://supabase.com/dashboard/project/okurdvnqsalulfnvkyqg/sql/new, colle le contenu de `INSTALLATION_SUPABASE.sql` puis exécute-le. Ceci garde les produits existants (si le tableau est déjà installé) et rend les commandes **publiquement lisibles**. Cela supprime les droits de modification directs depuis le navigateur.
2. Dans Supabase > Edge Functions > Secrets, crée une variable **`FRESHDESK_EDIT_CODE`** avec un **code long et difficile à deviner (minimum 10 caractères, 16+ recommandé)**. Ce code reste seulement dans Supabase, jamais dans les fichiers GitHub. Ne partage pas ce code ici.
3. Dans Supabase > Edge Functions, crée une fonction `freshdesk-save`, colle le code du fichier `supabase/functions/freshdesk-save/index.ts` et **désactive l'option Verify JWT** (cette fonction vérifie elle-même le code secret sur chaque écriture). Déploie la fonction. En cas de doute, voir https://supabase.com/docs/guides/functions/quickstart-dashboard.
4. Teste la lecture avec `index.html`. Le bouton `Accès gestion` ouvre le code. Si le code est correct, tu peux modifier, ajouter, supprimer et importer des produits ; sinon on peut consulter / filtrer / imprimer / exporter uniquement.
5. Pour publier : crée un dépôt **PUBLIC** sur https://github.com/new, mets à sa racine `index.html`, `style.css`, `app.js`, `config.js`, `manifest.webmanifest` (ne publie **pas** de fichier contenant des secrets). Dans Settings > Pages, choisis `Deploy from a branch`, `main` et `/(root)` ; l'adresse sera `https://TONPSEUDO.github.io/NOM-DU-DEPOT/`.

## Sécurité et fonctionnement

- **Toute personne qui connaît l'URL (ou retrouve la clé publique) peut consulter les commandes**, sans connexion. Un lien difficile à deviner n'est pas une protection. N'utilise pas ce projet pour des informations confidentielles.
- Le code de gestion est vérifié côté serveur, sur une Edge Function et jamais exposé par `config.js`. **Toute modification passe par cette fonction**, contrôlée par ce code.
- Un code partagé peut être divulgué ou essayé automatiquement. Choisis un code long, change-le si nécessaire, et n'utilise pas le mot de passe d'un autre compte. Cette solution n'a pas d'identification individuelle, ni de journaux par employé, ni une protection anti-bruteforce distribuée complète. Pour un vrai contrôle d'accès, ajoute des comptes ou un service d'authentification.
- La synchronisation inter-appareils se fait par Realtime et vérification périodique. Un conflit d'édition simultanée est détecté, et non écrasé silencieusement.
- Supabase Free peut suspendre le projet après inactivité. **Exporte régulièrement un JSON depuis FreshDesk** pour garder une copie. Les limites et tarifs peuvent évoluer.
- Si l'option de publication Realtime indique une erreur, la vérification toutes les 15 secondes assurera quand même l'actualisation.
- Utilise uniquement un projet Supabase **dédié** à FreshDesk : ce script configure l'accès public en lecture au catalogue.
- Le projet est indépendant, non affilié à Carrefour.

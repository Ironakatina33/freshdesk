# FreshDesk — hébergement gratuit et commandes partagées

Cette version fonctionne avec **GitHub Pages (site statique gratuit)** + **Supabase Free (stockage partagé + comptes)**. Elle ne nécessite **ni serveur Node.js, ni carte bancaire pour démarrer dans les offres gratuites**, sous réserve des conditions des services. La première version locale continue de fonctionner comme démonstration tant que `config.js` n'est pas renseigné.

## Étape 1 — Créer la base Supabase

1. Ouvre https://supabase.com/dashboard et crée un **nouveau projet dédié à FreshDesk** sur le plan **Free**. Conserve précieusement le mot de passe de la base dans ton gestionnaire de mots de passe (il ne va **jamais** dans les fichiers du site).
2. Dans **SQL Editor**, ouvre le fichier `INSTALLATION_SUPABASE.sql` de ce dossier, copie tout son contenu, colle-le dans une nouvelle requête et clique **Run**. Ce script crée le catalogue partagé, ses 16 références initiales, les droits d'accès et la gestion des modifications simultanées.
3. Dans **Authentication → Providers → Email** (ou l'écran de configuration de l'inscription), **désactive la possibilité de s'inscrire publiquement** (« Allow new users to sign up » / « Enable sign ups » selon l'interface). C'est **important** : tous les comptes autorisés de ce projet peuvent consulter et modifier le catalogue. N'utilise pas un projet Supabase qui contient déjà d'autres utilisateurs.
4. Dans **Authentication → Users**, crée manuellement les comptes de l'équipe avec **Add user**. Attribue un mot de passe différent et fort à chaque personne. Si tu envoies des invitations par e-mail, vérifie les réglages de redirection de ton application (Authentication → URL Configuration) et la disponibilité de l'envoi de mails. Pour un premier essai, crée simplement **ton propre utilisateur confirmé avec e-mail et mot de passe**, depuis le tableau de bord.
5. Dans **Project Settings → API Keys** (ou **Connect** / configuration API), copie l'**URL du projet** et sa **clé publishable** (`sb_publishable_...`). Les anciennes clés `anon` peuvent aussi fonctionner. **Ne prends jamais la clé `service_role`, une clé `secret`, le mot de passe de base de données ou un jeton personnel.**

## Étape 2 — Brancher le site à la base

1. Ouvre `config.js` avec le Bloc-notes, VS Code ou un autre éditeur de texte.
2. Remplace `https://VOTRE-PROJET.supabase.co` par l'URL exacte du projet Supabase.
3. Remplace `VOTRE_CLE_PUBLISHABLE` par la clé publique (`sb_publishable_...` ou une ancienne clé `anon` si utilisée).
4. Enregistre le fichier. Il est normal que cette clé soit présente dans le site public : les données restent sécurisées par la connexion et les politiques RLS.

## Étape 3 — Publier gratuitement avec GitHub Pages

1. Crée un dépôt **Public** à l'adresse https://github.com/new, par exemple `freshdesk-commandes`. Sur GitHub Free, GitHub Pages est fourni pour les dépôts publics. **Le code du site sera visible publiquement, pas les commandes stockées dans Supabase.** Ne mets aucune donnée confidentielle dans les fichiers du dépôt.
2. Sur GitHub, utilise **Add file → Upload files** pour ajouter directement **à la racine** du dépôt :
   - `index.html`
   - `style.css`
   - `app.js`
   - `config.js`
   - `manifest.webmanifest`
   - éventuellement `README.md` et `INSTALLATION_SUPABASE.sql` (ces fichiers ne contiennent pas de mot de passe).
3. Dans **Settings → Pages**, choisis **Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
4. GitHub affichera l'adresse `https://TON-PSEUDO.github.io/freshdesk-commandes/`. Ouvre-la sur PC et téléphone, connecte-toi avec le compte Supabase créé.

## Utilisation

- **Catalogue** : clic sur le nom d'un produit pour modifier sa catégorie, ses saisons, son unité ou son statut.
- **Commande** : change les quantités (+, − ou saisie), puis ouvre **Bon de commande** et **Imprimer** (A4 paysage).
- **Collaboratif** : les changements sont enregistrés dans Supabase, les autres appareils les reçoivent via Realtime ou une vérification toutes les 15 secondes. En cas de modifications simultanées, FreshDesk **évite d'écraser silencieusement** les données et demande de sauvegarder puis d'actualiser.
- **Sauvegardes** : utilise régulièrement **Exporter les données** pour obtenir un fichier JSON local. Pour restaurer, utilise **Importer une sauvegarde** en étant connecté.
- **Mode local** : si `config.js` contient toujours les exemples, le site reste utilisable en démonstration sur un appareil, sans synchronisation.
- **Si tu avais déjà ajouté des références sur l'ancienne version** : exporte-les en JSON depuis l'ancien FreshDesk, connecte-toi au nouveau, puis importe le JSON.

## Limites à connaître (gratuit)

- Les projets **Supabase Free peuvent être mis en pause après une semaine de faible activité**. Les données restent stockées et la reprise se fait depuis Supabase. Ce n'est pas une garantie de service permanent.
- Les quotas et offres peuvent évoluer ; vérifie https://supabase.com/pricing et la page GitHub Pages. Une base gratuite ne remplace pas une politique de sauvegardes : **exporte tes données régulièrement**.
- GitHub Pages est un **hébergement de site statique public**, ce n'est pas un espace privé. Les données de commande ne doivent vivre **que** dans Supabase.
- La synchronisation utilise un **catalogue commun**. Si deux personnes modifient exactement en même temps, une opération peut être refusée : il faut exporter la version locale avant de recharger et réappliquer manuellement si nécessaire.
- Il s'agit d'un outil indépendant, non affilié à Carrefour. Vérifie les règles internes de ton magasin avant d'y saisir des informations professionnelles.

## Dépannage rapide

- **Mode démonstration / non synchronisé** : `config.js` est encore vide ou a une URL/clé invalide.
- **Connexion impossible** : vérifie e-mail, mot de passe, utilisateur confirmé et Supabase non suspendu.
- **Erreur de chargement** : assure-toi d'avoir exécuté le SQL, sur le bon projet, et d'utiliser sa clé publishable.
- **Erreur de sauvegarde** : vérifie que la fonction `save_freshdesk` existe et que la session est active.
- **Le site est blanc** : vérifie la console du navigateur et l'accès internet à la bibliothèque Supabase via jsDelivr.
- **Mises à jour** : remplace les fichiers sur GitHub ; les données restent dans Supabase.

Documentation de référence : https://supabase.com/docs/guides/realtime/postgres-changes ; https://supabase.com/docs/reference/javascript/auth-signinwithpassword ; https://docs.github.com/en/pages/getting-started-with-github-pages

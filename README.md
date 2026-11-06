# FreshDesk — mode gestion PIN fixe 0000 (sans Edge Function)

## Installation (2 actions)
1. Ouvre https://supabase.com/dashboard/project/okurdvnqsalulfnvkyqg/sql/new, copie tout le fichier `CODE_0000_SUPABASE.sql` dans SQL Editor puis clique **Run**. **Ne supprime pas** les anciennes tables ni les commandes : ce script conserve le catalogue existant. Si la table est absente, exécute d'abord `INSTALLATION_SUPABASE.sql` puis réessaie.
2. Sur ton dépôt GitHub Pages actuel, remplace **uniquement `app.js`** par le fichier fourni (ou tous les fichiers du site si tu veux repartir de cette V2). Force l’actualisation (Ctrl+F5).

Dans FreshDesk, clique **Accès gestion** puis saisis **0000**. La lecture reste sans compte ; l'ajout, la modification et la suppression de produits utilisent désormais un RPC Supabase au lieu d'une Edge Function. Plus besoin de créer `freshdesk-save` ni le secret `FRESHDESK_EDIT_CODE`.

### Important
- **0000 est extrêmement facile à deviner**. Toute personne qui connaît l'adresse du projet peut essayer ce code, et toute personne qui le connaît peut modifier les commandes. Ne mets aucune information sensible dans ce site.
- La logique vérifie le code dans la base de données (pas seulement en JavaScript). Le code est fixe ; pour le modifier, il faudra remplacer `0000` dans le fichier SQL et réexécuter le bloc `create or replace function`.
- Si tu avais déjà publié la clé `sb_secret_...`, révoque-la dans Supabase > Settings > API Keys. Le site n'utilise que la clé publique.
- La synchronisation et la prévention des écrasements de versions sont conservées.
- Pour sauvegarder tes données, utilise régulièrement **Exporter** dans le site.

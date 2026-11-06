FRESHDESK V3 — TABLEAU / LISTE / CARTES + IMPRESSION A4 COMPACTE

Cette mise à jour conserve la structure SQL et la procédure de code gestion
existantes sur votre Supabase (RPC freshdesk_save_with_pin).

DÉPLOIEMENT :
1. Faites une sauvegarde JSON depuis le site actuel.
2. Sur GitHub Ironakatina33/freshdesk, remplacez index.html et config.js
   par ceux de ce dossier (ou uniquement index.html si config.js est déjà correct).
3. Conservez les autres fichiers actuels : ils n'ont pas besoin d'être supprimés.
4. Si GitHub Pages reste sur une version antérieure, rechargez en Ctrl+F5.

FONCTIONS :
- 3 modes d'affichage : tableau, liste compacte, cartes. Choix conservé sur l'appareil.
- Recherche et filtres par catégorie, saison et statut dans toutes les vues.
- Mode gestion protégé par le même code Supabase, quantités +/- et formulaire produits.
- Impression uniquement de la vue et des filtres en cours, A4 portrait, lignes serrées.
  Pour imprimer uniquement les articles commandés, ouvrez « Ma commande » avant d'imprimer.
- Les données restent stockées dans la même table Supabase. Pas de migration SQL.

ATTENTION : ne publiez jamais la clé Supabase sb_secret_ dans GitHub.

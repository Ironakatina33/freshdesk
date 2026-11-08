# FreshDesk · Domaine court
## Adresse cible : fle.city-ornano.fr

FreshDesk V5 continue à être disponible sur
https://ironakatina33.github.io/freshdesk/ pendant la configuration du domaine.

Le lien court provisoire fourni par City Hub est
https://city-ornano.fr/fle/ (redirige vers le GitHub Pages existant).

## Activation du sous-domaine définitif

**À faire dans la zone DNS Cloudflare de city-ornano.fr** :

| Type | Nom | Cible | Proxy |
| --- | --- | --- | --- |
| CNAME | fle | ironakatina33.github.io | DNS only (nuage gris) |

Ne pas inclure `/freshdesk` dans la cible CNAME.

Après propagation DNS, dans
https://github.com/Ironakatina33/freshdesk/settings/pages
définir *Custom domain* = `fle.city-ornano.fr`, cliquer *Save* et
activer *Enforce HTTPS* une fois le certificat disponible.

Si GitHub Pages publie depuis la branche `main`, enregistrer le domaine
ajoute automatiquement un fichier `CNAME` contenant `fle.city-ornano.fr`.
Ne pas l'ajouter sur la branche de production **avant** que le DNS soit prêt,
afin d'éviter que l'adresse GitHub Pages actuelle ne renvoie vers un
domaine inaccessible.

Une fois le HTTPS fonctionnel, changer la carte FreshDesk du Hub
(`city-hub/apps.js`) pour pointer directement sur
https://fle.city-ornano.fr/ et supprimer la redirection provisoire.

**Important** : le projet de base de données Supabase, ses politiques,
ses fonctions et ses clés ne sont pas modifiés par cette refonte graphique.

Documentation GitHub Pages :
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

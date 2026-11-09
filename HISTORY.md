# Historique local — FreshDesk FLE

FreshDesk V8 introduit un bouton **Historique** dans la zone catalogue.

- Conserve jusqu'à 45 versions de catalogue sur **ce navigateur/appareil** via le stockage local.
- Enregistre les versions reçues depuis Supabase et les versions **confirmées après sauvegarde** depuis cet appareil.
- Compare les produits et quantités avec la version précédente et avec la version actuelle.
- Permet d'exporter le journal complet en JSON.
- Permet une restauration du catalogue avec confirmation, copie préalable, contrôle du code de gestion et détection des conflits de version Supabase.

## Limites importantes

L'historique n'est **pas centralisé** : il ne récupère pas les opérations effectuées depuis un autre appareil si celui-ci n'a pas synchronisé une version ici. Il n'indique pas quel salarié a réalisé une modification. Il commence à la première synchronisation enregistrée **après** l'installation de V8. Il n'est pas garanti si le navigateur efface son stockage : exporter régulièrement les sauvegardes.

Une restauration remplace le catalogue entier, pas seulement la quantité d'un produit. Elle reste protégée par l'autorisation de gestion existante et par la version Supabase. Si un conflit est signalé, exporter les données et actualiser avant toute nouvelle tentative.

Pour disposer d'un historique partagé exhaustif et durable, il faudra créer une journalisation côté Supabase. Cette migration **n'est pas déployée** et n'est pas prétendue active.

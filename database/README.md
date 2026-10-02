# Database

Ce dossier contiendra les éléments liés à la base de données PostgreSQL.

## Éléments prévus

Il pourra contenir :

- les scripts SQL ;
- les schémas de tables ;
- les migrations ;
- les données de test ;
- la documentation de la structure des données.

#Travail effectuer par MOUYEDI :

annalyse vue les spécifications du projet :

*Les différentes tables: 

 -Administrateur
 -Client
 -professionnel ----> professionnel_zone(qui est une table relier à la table proffesionnel c'est là au l'on vas réccuper les informations pour remplir le champ zone c'est une liste déroulante qui regroupe les différents arrondissement du Congo)
 -photo

 *Règle : 
 
 a- Les tables qui vont recevoire les clé étrangère sont les tables proffessionnel_zone par ce qu'il dépend du professionnel donc il reçois la clé primaire du professionnel qui devien pour lui une clé étrangère.

b-La table photo par ce qu'il dépend de photo ici la contrainte qui existe est que losrque l'on supprime un professionnel ces photo sont supprimer avec lui.

*les champs : Ici les champs sont remplis par rapport au document des BA et chaque champs a été défini comme not null pour qu'il soit obligatoire à remplire et pour que l'on ne se retrouve pas avec un formulair imcomplet.

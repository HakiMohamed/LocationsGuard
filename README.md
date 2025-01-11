Plateforme de Gestion pour Entreprise de Location d'Automobiles

1. Introduction
1.1 Contexte et Objectifs
Ce projet vise à concevoir une plateforme complète et intuitive permettant aux entreprises de location d’automobiles de gérer efficacement leurs opérations internes.
 Elle doit inclure :
Une interface administrateur pour gérer les voitures, les clients, les réservations, et les finances.
Une interface publique où les clients peuvent consulter les offres, réserver des voitures et suivre leurs demandes.
L'objectif principal est de simplifier la gestion quotidienne en automatisant des tâches essentielles (suivi des entretiens, paiements d’assurance, calculs de coûts, etc.) et d’offrir une expérience utilisateur fluide.

2. Portée du Projet
2.1 Partie Administrateur (Interface de Gestion)
Gestion des Voitures : Ajout, modification et suivi des véhicules (disponibilité, maintenance, assurance).
Gestion des Clients : Création, suivi, et gestion des historiques de location.
Gestion des Réservations : Suivi des réservations, génération automatique des contrats, annulations.
Notifications Automatiques : Alertes pour :
Entretien des voitures (basé sur la dernière date ou kilométrage).
Renouvellement des assurances.
Paiements impayés.
Analyses et Finances : Calcul des profits/pertes, visualisation des revenus.(optional)

2.2 Partie Publique (Site Client)
Catalogue Dynamique : Liste des voitures disponibles avec filtres (prix, catégorie, transmission, etc.)--(optional)
Détails des Offres : Informations détaillées sur chaque voiture et ses conditions de location.
Réservations : Réservation en ligne avec génération de confirmation.

3. Fonctionnalités Détailées
3.1 Authentification et Gestion des Rôles
Pour les Administrateurs :
Système de connexion sécurisé basé sur JWT.
Gestion des rôles : Accès réservé uniquement aux administrateurs.
Pour les Clients :
Création de compte.
Suivi des réservations.

3.2 Gestion des Voitures
Ajout et Modification :
Informations nécessaires :
Marque, modèle, année, prix par jour, transmission, état (disponible, louée, en maintenance).
Documents : Assurance, papiers légaux.
Suivi d'Entretien :
Calcul automatique de la prochaine date d'entretien selon :
Date du dernier entretien.
Kilométrage (par exemple : entretien chaque 10 000 km).
Notifications automatiques pour alerter les gestionnaires.
Suivi d’Assurance :
Saisie de la date de début et de fin de l’assurance.
Notifications de rappel avant expiration.

3.3 Gestion des Clients et Contrats (optional)
Création d’un profil client avec :
Informations personnelles (nom, téléphone, email).
Historique des réservations.
Génération automatique des contrats de location.

3.4 Gestion des Réservations
Affichage des réservations en cours, confirmées ou annulées.
Réservation automatique des voitures disponibles.
Gestion des conflits de disponibilités.

3.5 Finances et Statistiques (optional)
Calcul des profits et pertes.
Visualisation des revenus mensuels et annuels.
Statistiques sur les voitures les plus louées.

3.6 Notifications Automatiques (optional)
Entretien des voitures :
Notification basée sur le dernier entretien ou le kilométrage atteint.
Assurance :
Alertes automatiques avant l'expiration.
Paiements en retard :
Rappels automatiques pour les clients ayant des factures impayées.

3.7 Catalogue Public (optional)
Affichage des voitures disponibles avec :
Image, description, prix par jour, disponibilité.
Moteur de recherche et filtres avancés :
Par prix, catégorie, transmission, marque, etc.
Réservation en ligne avec :
Sélection des dates et calcul automatique du coût.

4. Architecture Technique
4.1 Backend
Framework : NestJS
API REST modulaire.
Gestion des services pour la logique métier (voitures, clients, réservations).
Base de Données : MongoDB
Collections principales : voitures, clients, réservations, notifications.
Authentification : JWT.

4.2 Frontend
Framework : React.js
Application SPA (Single Page Application).
Utilisation de Redux pour la gestion de l’état global.
Design : Tailwind CSS
Interface moderne et responsive.

4.3 Hébergement
Backend : AWS.
Frontend : Vercel ou Netlify.
Base de Données : MongoDB Atlas.

5. Modèles de Données
Voitures
{
  "_id": "ObjectId",
  "marque": "string",
  "modele": "string",
  "annee": "number",
  "prix_par_jour": "number",
  "transmission": "string",
  "kilometrage": "number",
  "date_dernier_entretien": "date",
  "intervalle_entretien_km": "number", // ex : 10000 km
  "documents": ["string"], // URLs
  "assurance": {
    "date_debut": "date",
    "date_fin": "date"
  },
  "statut": "string" // disponible, louée, en maintenance
}

Clients
{
  "_id": "ObjectId",
  "nom": "string",
  "email": "string",
  "telephone": "string",
  "historique_reservations": ["ObjectId"]
}

Réservations
{
  "_id": "ObjectId",
  "voiture_id": "ObjectId",
  "client_id": "ObjectId",
  "date_debut": "date",
  "date_fin": "date",
  "prix_total": "number",
  "statut": "string" // confirmée, annulée
}


6. Arborescence des Pages
6.1 Partie Administrateur
Tableau de bord : Vue globale des voitures, revenus et alertes.
Gestion des voitures : Liste, ajout, modification.
Gestion des réservations : Historique et suivi des réservations.
Gestion des Clients : Profils clients et contrats.
Statistiques : Profits, pertes, analyses.
Notifications : Entretien, assurance, paiements.
6.2 Partie Publique
Accueil : Présentation de l’entreprise.
Catalogue : Recherche et liste des voitures.
Réservation : Formulaire et calcul des coûts.
Contact : Informations de contact.

7. Livrables
API REST NestJS documentée .
Frontend React.js déployé.
Base de données MongoDB prête à l’emploi.
Documentation utilisateur.

8. Contraintes Techniques
Performances optimisées pour gérer un grand nombre de données.
Interface utilisateur ergonomique et responsive.
Sécurité des données (hash des mots de passe, HTTPS).














































1. Fonctionnalités Clés
Module
Fonctionnalités
Description
Authentification
- Connexion sécurisée avec JWT- Gestion des rôles
L'accès au tableau de bord est réservé aux administrateurs.
Gestion des voitures
- Ajouter/modifier des voitures- Suivi des entretiens- Notification d'entretien basé sur date/kilométrage- Suivi des assurances et renouvellements
Permet de suivre les informations essentielles pour chaque véhicule.
Réservations
- Création de réservations- Gestion des conflits de disponibilités- Génération automatique de contrats
Les réservations sont enregistrées et liées aux véhicules et clients.
Gestion des clients
- Ajout/modification de clients- Historique des réservations- Notifications des paiements
Suivi complet des interactions des clients avec l'entreprise.
Statistiques
- Calcul des profits et pertes- Visualisation des revenus- Analyse des performances des voitures
Aide les gestionnaires à comprendre la rentabilité de l'entreprise.
Notifications
- Alertes pour entretiens- Rappel des paiements impayés- Expiration des assurances
Automatisation des rappels pour éviter les oublis.
Catalogue Public
- Liste des voitures disponibles- Recherche avancée- Réservation en ligne
Permet aux clients de voir les offres et de réserver directement depuis le site public.















2. Modèles de Données
Entité
Attributs Clés
Description
Voiture
- Marque, modèle, année- Prix par jour- Kilométrage- Date du dernier entretien- Assurance (date début/fin)- Statut (disponible, louée)
Contient les informations principales sur chaque véhicule.
Client
- Nom, email, téléphone- Historique des réservations
Regroupe les informations des clients et leurs interactions avec l'entreprise.
Réservation
- ID voiture- ID client- Dates début/fin- Prix total- Statut (confirmée, annulée)
Enregistre les réservations effectuées par les clients.
Notification
- Type (entretien, assurance, paiement)- Contenu- Date de rappel
Sert à gérer et déclencher les alertes pour les gestionnaires.


3. Flux des Utilisateurs
Rôle
Actions Disponibles
Description
Administrateur
- Gérer les voitures- Suivre les réservations- Ajouter des clients- Analyser les performances- Recevoir des notifications
Interface complète pour gérer toutes les opérations de l'entreprise.
Client (Public)
- Consulter le catalogue- Réserver une voiture- Consulter ses réservations
Interface simplifiée pour permettre aux clients d’interagir facilement avec l’entreprise.

















4. Technologie et Architecture
Composant
Technologie
Description
Backend
NestJS
Fournit une API REST modulaire et performante pour la logique métier.
Base de Données
MongoDB
Stocke les informations sur les voitures, clients, réservations, et notifications.
Frontend
React.js + Tailwind CSS
Permet de créer une interface utilisateur moderne, responsive, et intuitive.
Notifications
Cron Jobs + Node.js
Automatisation des rappels (entretien, assurance, paiements).


5. Notifications Automatisées
Type de Notification
Condition de Déclenchement
Message Exemple
Entretien
Date ou kilométrage atteint
"La voiture Toyota Corolla doit subir un entretien le 15/01/2024."
Assurance
Date d’expiration approchant (ex : 30 jours avant)
"L’assurance pour la voiture Peugeot 208 expire le 10/02/2024."
Paiement
Paiement impayé depuis 7 jours
"Le client John Doe a une facture impayée de 150€ pour la voiture Renault Clio."



















6. Organisation des Pages
Page
Contenu
Public/Admin
Tableau de Bord
- Vue globale des voitures, réservations, clients, et notifications.- Statistiques des profits et pertes.
Admin
Gestion des Voitures
- Liste des voitures avec recherche et filtres.- Formulaire d’ajout/modification des voitures.- Détails d'entretien et d’assurance.
Admin
Réservations
- Liste des réservations en cours et passées.- Détails des réservations et génération des contrats.- Ajout manuel de nouvelles réservations.
Admin
Catalogue
- Liste des voitures disponibles.- Filtres avancés (catégorie, prix, transmission).- Formulaire de réservation.
Public
Clients
- Liste des clients.- Historique des réservations pour chaque client.- Notifications liées aux paiements.
Admin
Statistiques
- Graphiques et tableaux sur les revenus, pertes, et performances des voitures.
Admin





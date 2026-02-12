# API Gestion de Films (Hapi.js)

Ce projet est une API REST développée avec Hapi.js permettant la gestion d'utilisateurs, de films et de favoris. Elle intègre un système d'export CSV asynchrone via RabbitMQ et l'envoi d'emails transactionnels.

## Pre-requis

Assurez-vous d'avoir les versions suivantes installées sur votre machine :

- Node.js : 22.13.1
- NPM : 10.9.2
- Docker (indispensable pour la base de données et le message broker)

## Installation

1. Cloner le projet.
2. Installer les dépendances :

```bash
npm install
```

## Configuration
Créez un fichier nommé `.env` à la racine du projet et collez-y la configuration suivante pour que l'application fonctionne immédiatement :

### Base de données
- DB_CLIENT=mysql
- DB_HOST=0.0.0.0
- DB_PORT=3307
- DB_USER=root
- DB_PASSWORD=hapi
- DB_DATABASE=user

### Authentification (JWT)
- JWT_SECRET=[Votre secret]

### Configuration SMTP (Ethereal)
- SMTP_HOST=smtp.ethereal.email
- SMTP_PORT=587
- SMTP_NAME='Shanelle Larson'
- SMTP_USER=shanelle83@ethereal.email
- SMTP_PASS=NyP9HY9cFD9tphfaz2

*Il faut générer un nouveau compte*

### RabbitMQ (Message Broker)
- AMQP_URL='amqp://localhost'
- RABBITMQ_ENABLED=true *(pour les tests)*

## Démarrage de l'infrastructure
1. Lancer MySQL

Cette commande lance le conteneur MySQL et mappe le port 3307 de votre machine vers le port 3306 du conteneur (afin de correspondre au fichier .env).
```bash
docker run -d --name hapi-mysql -p 3307:3306 -e MYSQL_ROOT_PASSWORD=hapi -e MYSQL_DATABASE=user mysql:8.0 --default-authentication-plugin=mysql_native_password
```

2. Lancer RabbitMQ

Cette commande lance le message broker nécessaire pour l'export CSV.
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```
L'interface d'administration RabbitMQ est accessible sur : http://localhost:15672 (Login: guest / Mdp: guest).

3. Lancer une migration (si premier lancement)

```bash
npx knex migrate:latest
```

4. Lancer le worker

```bash
node worker.js
```

5. Lancer l'API

```bash
npm start
```

## Tests
Pour lancer la suite de tests unitaires et fonctionnels :
```bash
npm test
```

## Fonctionnalités
- CRUD Utilisateurs (Inscription, Login JWT, Admin).
- CRUD Films (Notification mail à la création/édition).
- Favoris (Ajout/Suppression).
- Export CSV (Admin) : Route GET /export/movies. La demande est traitée de manière asynchrone par le worker RabbitMQ qui envoie le fichier par email.

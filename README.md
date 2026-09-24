# NEXUS Formations

## Installation (3 étapes)

### 1. Installer les dépendances
```
npm install
```

### 2. Créer le compte owner
```
node setup.js
```
→ Email : piidaniel3@gmail.com
→ Password : Daniel2025!

### 3. Lancer le site
```
npm start
```
Ouvre http://localhost:3000

---

## PayPal (pour les ventes réelles)
Dans le fichier `.env`, remplace :
- PAYPAL_CLIENT_ID → ton Client ID (developer.paypal.com)
- PAYPAL_CLIENT_SECRET → ton Secret
- PAYPAL_MODE → live (pour la prod)

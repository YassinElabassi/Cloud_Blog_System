# 🌥️ Cloud Blog System

Un système complet de blog développé avec **Laravel (Backend)** et **Frontend moderne**, avec gestion des utilisateurs, rôles, articles, commentaires, et panneau d'administration.

---

## 🚀 Fonctionnalités principales

### 👤 Authentification & rôles
- Gestion des comptes utilisateurs
- Login / Register
- Deux rôles disponibles :
  - **ADMIN** : gestion complète du système (posts, commentaires, utilisateurs)
  - **USER** : commenter et consulter les articles

### 📝 Gestion des articles (Posts)
- CRUD complet pour les Administrateurs
- Upload d’images
- Catégorisation des articles
- Gestion via dashboard admin

### 💬 Système de commentaires
- Ajouter des commentaires sur les articles
- Suppression par admin ou propriétaire du commentaire

### 🌐 Frontend moderne
- Liste des posts
- Page détail d’un article
- Affichage dynamique des commentaires
- Connexion avec API Backend

---

## 📁 Structure du projet

```
/Cloud_Blog_System
 ├── cloudblog-backend/        # Backend Laravel
 ├── public/ or src/           # Frontend (selon votre structure)
 ├── README.md
 └── LICENSE (MIT)
```

---

# 🛠️ Backend — Installation (Laravel)

1. Aller dans le dossier backend :
```bash
cd cloudblog-backend
```

2. Installer les dépendances Laravel :
```bash
composer install
```

3. Copier le fichier d’environnement :
```bash
cp .env.example .env
```

4. Générer la clé de l’application :
```bash
php artisan key:generate
```

5. Configurer la base de données dans `.env` :
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cloudblog
DB_USERNAME=root
DB_PASSWORD=your_password
```

6. Lancer les migrations :
```bash
php artisan migrate
```

7. Lier le storage (pour uploader les images) :
```bash
php artisan storage:link
```

8. Démarrer le serveur local :
```bash
php artisan serve
```

---

# 🖥️ Frontend — Installation

1. Aller au dossier frontend :
```bash
cd public
# ou
cd src
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer le fichier `.env.local` :
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. Lancer le serveur frontend :
```bash
npm run dev
```

Puis ouvrir :

👉 http://localhost:3000

---

# 🔗 API Endpoints (exemples)

> Les routes exactes se trouvent dans `routes/api.php`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Posts
- `GET /api/posts`
- `GET /api/posts/{id}`
- `POST /api/posts` (admin)
- `PUT /api/posts/{id}` (admin)
- `DELETE /api/posts/{id}` (admin)

### Commentaires
- `POST /api/posts/{id}/comments`
- `DELETE /api/comments/{id}`

---

# 🛡️ Sécurité

- Toutes les routes sensibles doivent être protégées par `auth:sanctum`
- Le fichier `.env` ne doit **jamais** être ajouté dans le repo
- Toujours vérifier les permissions pour les actions (admin vs user)

---

# 🚀 Déploiement

### Backend (Laravel)
- Hébergement sur : VPS, cPanel, Laravel Forge, Heroku, ou Docker
- `php artisan config:cache`
- `php artisan route:cache`
- Utiliser S3 ou storage public pour les images

### Frontend
- Hébergement : Vercel, Netlify ou serveur Node
- Build de production :
```bash
npm run build
npm run start
```

---

# 🤝 Contribution

1. Fork le repo
2. Créer une branche :
```bash
git checkout -b feature/new-feature
```
3. Commit & Push
4. Ouvrir une Pull Request

---

# 📜 License

Projet sous licence **MIT** — utilisation libre.

---

# ⭐ Merci d'utiliser Cloud Blog System !
N'hésitez pas à ajouter une étoile ⭐ au repo !


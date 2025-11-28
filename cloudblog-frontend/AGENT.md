# Cloud Deployment Playbook

This document summarizes the agreed workflow for deploying **Cloud Blog System** to AWS Free Tier. It is the reference that future assistant sessions should reread before helping with cloud integration work.

---

## Current Status & Assumptions

- AWS account exists but no resources created yet; work begins tomorrow.
- Local dev DB is PostgreSQL; prod DB will also be PostgreSQL running on the EC2 host (no managed RDS).
- Deployment target is a single Ubuntu 22.04 LTS EC2 `t2.micro` (free tier) that hosts:
  - Laravel backend via PHP-FPM.
  - Next.js frontend via PM2 (or static export).
- Domain is optional; the Elastic IP or default AWS hostname is acceptable for school demo. TLS will be added only if a domain is available.
- GitHub repo is the source of truth; the EC2 instance will clone from this repo.

---

## Responsibilities Split (6 teammates)

1. **Infrastructure/IAM & DNS**
   - Create AWS account/project, set billing alerts.
   - Launch Ubuntu 22.04 `t2.micro` with security group (22/80/443), key pair, Elastic IP, optional Route 53 record.
2. **Backend Deployment**
   - After base packages are installed, configure `.env` for Postgres, run `composer install`, `php artisan` commands.
3. **Frontend Deployment**
   - Install Node/npm (already covered in base package step), run `npm install`, set `NEXT_PUBLIC_API_URL`, `npm run build`, manage PM2 or static export.
4. **Web Server/Reverse Proxy**
   - Write Nginx config routing `/api` → PHP-FPM, `/` → Next.js (PM2) or static export.
   - Reload/test Nginx.
5. **Storage & Media**
   - `php artisan storage:link`, test uploads.
   - Optional S3 bucket + IAM policy if local disk becomes insufficient.
6. **QA & Automation**
   - Cron for `schedule:run`, queue worker, smoke tests, documentation of commands.

---

## Detailed Step Checklist

### 1. Provision & Connect
1. Launch EC2 (Ubuntu 22.04 LTS AMI, `t2.micro`, 20 GB gp3). Security group inbound: TCP 22/80/443 open to team/demo network.
2. Allocate Elastic IP and associate with the instance (prevents IP changes after stop/start).
3. **Optional**: create Route 53 hosted zone and A record pointing to Elastic IP.
4. SSH from local machine: `ssh -i <key>.pem ubuntu@<elastic-ip>`.

### 2. Base Packages on EC2
```
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx postgresql postgresql-contrib php8.2 php8.2-fpm php8.2-pgsql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-gd unzip git nodejs npm certbot python3-certbot-nginx
sudo npm install -g pm2
```

### 3. PostgreSQL Setup
```
sudo -u postgres psql
CREATE DATABASE cloudblog;
CREATE USER cloudblog WITH PASSWORD 'StrongPasswordHere';
GRANT ALL PRIVILEGES ON DATABASE cloudblog TO cloudblog;
\q
```

### 4. Deploy Backend (Laravel API)
```
cd /var/www
sudo git clone <repo-url> Cloud_Blog_System
sudo chown -R ubuntu:ubuntu Cloud_Blog_System
cd Cloud_Blog_System/cloudblog-backend
cp .env.example .env
# edit .env with APP_URL, DB creds (pgsql), queue/mail settings
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache && php artisan route:cache
```
_Secrets to decide before editing `.env`:_
- `APP_URL` (`https://<domain>` or `http://<elastic-ip>` if no domain).
- `DB_HOST=127.0.0.1`, `DB_DATABASE=cloudblog`, `DB_USERNAME=cloudblog`, `DB_PASSWORD=<same as Postgres step>`.
- `QUEUE_CONNECTION=sync` (or `database` if you plan to run workers).
- Mail driver if email needed; otherwise keep `log`.

### 5. Deploy Frontend (Next.js App)
```
cd /var/www/Cloud_Blog_System
npm install
echo "NEXT_PUBLIC_API_URL=https://<domain-or-hostname>/api" > .env.production.local
npm run build
pm2 start npm --name cloudblog-frontend -- start
pm2 save
```
_If static export is preferred: run `npm run export` and point Nginx root to `/var/www/Cloud_Blog_System/out`._

### 6. Nginx Configuration
- Create `/etc/nginx/sites-available/cloudblog` containing:
  ```
  server {
      server_name <domain-or-ec2-hostname>;

      # Frontend (PM2 on port 3000)
      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
      }

      # Backend API (Laravel)
      location ~ ^/api(?:/.*)?$ {
          include snippets/fastcgi-php.conf;
          fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
          fastcgi_param SCRIPT_FILENAME /var/www/Cloud_Blog_System/cloudblog-backend/public/index.php;
      }

      root /var/www/Cloud_Blog_System/public;
  }
  ```
- Enable site: `sudo ln -s /etc/nginx/sites-available/cloudblog /etc/nginx/sites-enabled/`.
- Test and reload: `sudo nginx -t && sudo systemctl reload nginx`.
_Adjust `root` and `location /` block if using static export instead of PM2._

### 7. TLS (optional if no domain)
```
sudo certbot --nginx -d <domain>
```
If using only Elastic IP / AWS hostname, skip TLS or use self-signed cert for demo.

### 8. Post-Deploy Validation
- Visit `https://<domain>/` and `https://<domain>/api/posts`.
- Test login/register/comment flows.
- Ensure file uploads appear under `storage/app/public` and are accessible via symlink.
- Verify PM2 (`pm2 status`), PHP-FPM (`systemctl status php8.2-fpm`), Nginx (`systemctl status nginx`).
- Add cron: `crontab -e` → `* * * * * php /var/www/Cloud_Blog_System/cloudblog-backend/artisan schedule:run`.
- If using queues: create systemd service or supervisor config to run `php artisan queue:work`.

---

## Action Items for Next Session

1. Confirm AWS account + credits ready.
2. Decide on repo URL (public clone or private token).
3. Decide whether to buy/borrow a domain or use EC2 hostname.
4. When ready, follow the checklist above; at each step, ask Codex for detailed commands or file contents (especially `.env` and Nginx templates).

Reading this file before new work sessions ensures context continuity. Future assistants should update this document if plans change.

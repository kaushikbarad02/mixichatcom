# MixiChat Deployment Guide (DigitalOcean + Apache)

This guide explains how to host your WebRTC video chat on a DigitalOcean Droplet using Apache as a reverse proxy.

## 1. Server Preparation
Create an Ubuntu Droplet on DigitalOcean and run the following:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs apache2

# Install PM2 to keep the app running
sudo npm install pm2 -g
```

## 2. Apache Configuration
Enable the necessary proxy modules:
```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl
sudo systemctl restart apache2
```

Create a configuration file: `/etc/apache2/sites-available/mixichat.conf`

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/mixichat

    # Reverse Proxy for Socket.io (WebSocket support is critical)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule ^/socket.io/(.*) ws://localhost:3000/socket.io/$1 [P,L]
    ProxyPass /socket.io/ http://localhost:3000/socket.io/
    ProxyPassReverse /socket.io/ http://localhost:3000/socket.io/

    # Reverse Proxy for the Express App
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

Enable the site:
```bash
sudo a2ensite mixichat.conf
sudo systemctl reload apache2
```

## 3. SSL (REQUIRED for Camera/Mic)
WebRTC will NOT work on a public server without HTTPS. Use Certbot:
```bash
sudo apt install python3-certbot-apache
sudo certbot --apache -d yourdomain.com
```

## 4. Run the App
Upload your files to `/var/www/mixichat`, then:
```bash
cd /var/www/mixichat
npm install
pm2 start server.js --name "mixichat"
pm2 save
pm2 startup
```

---

# How to Test Locally

Since `node` and `npm` were not detected in your current environment, follow these steps on your Windows machine:

### Step 1: Install Node.js
Go to [nodejs.org](https://nodejs.org/) and download the **LTS (Recommended)** version. Install it using defaults.

### Step 2: Open Terminal
Open **PowerShell** or **Command Prompt** and navigate to your project folder:
```powershell
cd "C:\Users\Kaushik Barad\Desktop\mixichatcom"
```

### Step 3: Install Dependencies
Run the following command to download `Express` and `Socket.io`:
```bash
npm install
```

### Step 4: Start the Server
Run the server file:
```bash
node server.js
```
You should see: `Server running on http://localhost:3000`

### Step 5: Start Chatting
1. Open your browser and go to `http://localhost:3000`.
2. Open a **second tab** (or an Incognito window) and go to `http://localhost:3000` as well.
3. Click **"Start Chatting"** on both tabs.
4. You will be paired automatically and should see your own camera in both windows (one as "You", one as the "Partner").

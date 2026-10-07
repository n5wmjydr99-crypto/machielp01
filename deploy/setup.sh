#!/bin/bash
# Instalación en Ubuntu 22.04/24.04 (como root):   bash setup.sh tu-dominio.com.py
set -euo pipefail
DOMAIN="${1:?Uso: bash setup.sh tu-dominio.com.py}"
REPO="${REPO:-https://github.com/n5wmjydr99-crypto/machielp01.git}"
BRANCH="${BRANCH:-claude/clever-babbage-5qpyn3}"

apt-get update -y && apt-get install -y curl git ufw debian-keyring debian-archive-keyring apt-transport-https gpg
# Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs
# Caddy
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy.list
apt-get update -y && apt-get install -y caddy

id nexus &>/dev/null || useradd --system --home /opt/nexustech --shell /usr/sbin/nologin nexus
[ -d /opt/nexustech/.git ] || git clone --branch "$BRANCH" "$REPO" /opt/nexustech
mkdir -p /opt/nexustech/data && chown -R nexus:nexus /opt/nexustech/data

if [ ! -f /etc/nexustech.env ]; then
  ADMINPW=$(head -c 24 /dev/urandom | base64 | tr -d '/+=' | head -c 20)
  cat > /etc/nexustech.env <<ENV
NODE_ENV=production
PORT=3000
TRUST_PROXY=1
PUBLIC_URL=https://$DOMAIN
ADMIN_USER=HOST
ADMIN_PASSWORD=$ADMINPW
SEED_DEMO=0
# Completá estas cuando las tengas (ver .env.example). Sin Bancard no se puede vender en producción.
# BANCARD_ENV=staging
# BANCARD_PUBLIC_KEY=
# BANCARD_PRIVATE_KEY=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
ENV
  chmod 600 /etc/nexustech.env
  echo ">>> Clave del panel generada: $ADMINPW   (guardala; está en /etc/nexustech.env)"
fi

install -m 644 /opt/nexustech/deploy/nexustech.service /etc/systemd/system/nexustech.service
sed "s/tu-dominio.com.py/$DOMAIN/" /opt/nexustech/deploy/Caddyfile > /etc/caddy/Caddyfile
install -m 755 /opt/nexustech/deploy/backup.sh /usr/local/bin/nexustech-backup
echo "17 3 * * * root /usr/local/bin/nexustech-backup" > /etc/cron.d/nexustech-backup

ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
systemctl daemon-reload && systemctl enable --now nexustech && systemctl restart caddy
sleep 2; systemctl --no-pager status nexustech | head -5
echo "Listo: https://$DOMAIN   (el DNS del dominio debe apuntar a esta IP)"

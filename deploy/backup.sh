#!/bin/bash
# Copia consistente de la base (SQLite online backup) y rotación de 14 días. Corre a diario por cron.
set -euo pipefail
DEST=/var/backups/nexustech; mkdir -p "$DEST"
/usr/bin/node --disable-warning=ExperimentalWarning -e "
const {DatabaseSync}=require('node:sqlite');
const d=new DatabaseSync('/opt/nexustech/data/nexustech.db');
d.exec(\"VACUUM INTO '$DEST/nexustech-$(date +%F).db'\");"
find "$DEST" -name 'nexustech-*.db' -mtime +14 -delete

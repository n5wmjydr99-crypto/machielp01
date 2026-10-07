#!/bin/bash
# Actualizar a la última versión:  bash /opt/nexustech/deploy/update.sh
set -euo pipefail
cd /opt/nexustech && git pull --ff-only && systemctl restart nexustech && systemctl --no-pager status nexustech | head -4

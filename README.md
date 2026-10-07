# NEXUSTECH · e-commerce 3D (negro y rojo)

Tienda con escena 3D guiada por scroll, cuentas de cliente, checkout (dirección casa/depto/oficina, RUC + Razón Social, tarjeta)
y panel de dueños (estadísticas por año/mes/semana/día, inventario, pedidos). Servidor Node 22 **sin dependencias** + SQLite.

## Correr
```bash
npm start            # http://localhost:3000  (pago simulado, sin Google/Apple hasta configurar claves)
```
Datos en `data/nexustech.db` (no se versiona). Variables de entorno: ver `.env.example`.
Panel: pie de página → "Acceso tienda". Usuario `HOST`; la clave sale de `ADMIN_PASSWORD` (por defecto la que pediste: **cambiala antes de publicar**).

## Qué es real y qué no (leer antes de publicar)
| Parte | Estado |
|---|---|
| Cuentas con correo (scrypt), sesiones HttpOnly, panel con sesión de servidor, stock/precios validados en el servidor | Probado |
| Pedidos, reserva y devolución de stock, estadísticas por SQL, CRUD de inventario | Probado |
| Webhook de Bancard (token, monto) | Probado con unit test; **no probado contra Bancard real** |
| Google / Apple OAuth, Bancard `single_buy` + iframe | Implementado según la documentación pública, **sin probar**: requieren tus credenciales y dominio HTTPS. Verificá cada campo contra la documentación que te dé Bancard/Apple |
| Sin claves de Bancard | Pago **simulado**: no cobra nada |

## Pendiente para producción real
- HTTPS y dominio propio (`PUBLIC_URL`); Apple y Bancard lo exigen.
- Alta de comercio en Bancard (staging → producción) y registrar la URL de confirmación.
- Facturación legal (SET/e-Kuatia'i): hoy el pedido guarda RUC y Razón Social, pero no emite factura electrónica.
- Un solo usuario dueño; el rate-limit y las sesiones viven en un solo proceso (no escalar a varias instancias sin moverlos a un almacén compartido).

## Desplegar en un VPS (Ubuntu 22.04/24.04)
1. Comprá/alquilá el VPS y apuntá el DNS del dominio (registro **A**) a su IP. Sin dominio no hay HTTPS, y Apple/Bancard lo exigen.
2. Entrá por SSH como root y corré:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/n5wmjydr99-crypto/machielp01/claude/clever-babbage-5qpyn3/deploy/setup.sh -o setup.sh
   bash setup.sh tu-dominio.com.py
   ```
   Instala Node 22 + Caddy (HTTPS automático), crea el servicio `nexustech` (se reinicia solo), abre solo los puertos 22/80/443,
   genera una clave de dueño aleatoria y programa un backup diario en `/var/backups/nexustech` (14 días).
   (Si el repo es privado, cloná primero con una clave de deploy y exportá `REPO=`.)
3. Las claves van en `/etc/nexustech.env` (`nano /etc/nexustech.env`, luego `systemctl restart nexustech`). Cambiar `ADMIN_PASSWORD` ahí rota la clave del panel y cierra las sesiones de dueño.
4. Actualizar: `bash /opt/nexustech/deploy/update.sh` · Logs: `journalctl -u nexustech -f`.

**Importante:** en producción, sin claves de Bancard los pagos quedan **deshabilitados** (la tienda se ve y navega, pero no vende). El pago simulado solo corre fuera de producción.

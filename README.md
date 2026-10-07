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

# Automatizaciones en Zernio

Zernio reemplaza a ChatPlace para los DM automáticos: la cuenta de Instagram **tekorei.ai** está
conectada ahí (perfil “Default”). Cada palabra clave es una “comment automation”: cuando alguien la
comenta en cualquier publicación (o la manda por DM), Zernio le envía el DM con el recurso y responde
su comentario. Corre en los servidores de Zernio las 24 horas; no hace falta tener Claude abierto.

| Día | Palabra | Estado | ID en Zernio |
| --- | --- | --- | --- |
| 1 | EXAMEN (también “exámen”, “exámenes”) | Activa desde el 20/11/2026 | `6affb66457d3ed72a640e91f` |

Configuración usada (día 1):

- Disparador: comentario que contiene la palabra, en cualquier publicación de la cuenta.
- DM: el texto de `contenido.json` (día 1), con `{{username}}` en vez de `{{ username }}`.
- Respuesta pública: 3 variantes al azar, solo si el DM salió bien (`public_reply_policy: after_dm`).
- También responde si la palabra llega por DM (`also_match_in_dms`), útil para quien viene de TikTok o YouTube.
- Una sola vez por persona (`repeat_policy: once`).

Para los días siguientes se crea una automatización igual por palabra, con el DM y las respuestas
de ese día en `contenido.json`, idealmente el mismo día que se publica el video.

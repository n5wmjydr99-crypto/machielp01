# Automatizaciones en Zernio

Zernio reemplaza a ChatPlace para los DM automáticos: la cuenta de Instagram **tekorei.ai** está
conectada ahí (perfil “Default”, cuenta `6affac0c4f0125480f7187e5`). Cada palabra clave es una
“comment automation” activa desde el 20/11/2026 en **todas** las publicaciones: según la palabra que
la persona comente (o mande por DM), Zernio le envía el DM de ese video y responde su comentario.
Corre en los servidores de Zernio las 24 horas; no hace falta tener Claude abierto.

| Día | Palabra | Recurso | Cómo detecta la palabra | ID en Zernio |
| --- | --- | --- | --- | --- |
| 1 | EXAMEN | Exam Cram Coach | contiene “examen” o “exámen” | `6affb66457d3ed72a640e91f` |
| 2 | FACELESS | MoneyPrinterTurbo | palabra suelta, tolera errores de tipeo | `6affb71353cdaa96a3c985c4` |
| 3 | SKILLS | Skills oficiales de Anthropic | palabra suelta, tolera errores de tipeo | `6affb7167df3b1c4ecc91493` |
| 4 | OFFLINE | Ollama + Open WebUI | palabra suelta, tolera errores de tipeo | `6affb71953cdaa96a3c985c9` |
| 5 | PDF | MarkItDown de Microsoft | palabra suelta | `6affb71d37effd9493d9442f` |
| 6 | PODERES | Superpowers para Claude Code | palabra suelta, tolera errores de tipeo | `6affb72253cdaa96a3c985cf` |
| 7 | CUADERNO | Open Notebook | palabra suelta, tolera errores de tipeo | `6affb72c7df3b1c4ecc914a4` |
| 8 | MEMORIA | Claude-Mem | palabra suelta, tolera errores de tipeo, ignora si dice “ram” o “gb” | `6affb73037effd9493d94433` |
| 9 | FOTOS | Upscayl + Rembg | palabra suelta | `6affb7357df3b1c4ecc914a7` |
| 10 | EDITOR | Remotion + skills | palabra suelta, tolera errores de tipeo | `6affb73e37effd9493d9443b` |
| 11 | NAVEGADOR | Playwright MCP | palabra suelta, tolera errores de tipeo | `6affb7417df3b1c4ecc914ab` |
| 12 | DOCS | Context7 | palabra suelta | `6affb74a37effd9493d94442` |
| 13 | PLANO | Spec Kit de GitHub | palabra suelta | `6affb74f7df3b1c4ecc914b4` |
| 14 | AUTOMATIZAR | n8n | palabra suelta, tolera errores de tipeo | `6affb754a3ee28ddaa662193` |
| 15 | KIT | El kit completo | palabra suelta | `6affb75953cdaa96a3c985eb` |
| – | AVISAME | Lista para avisar lanzamientos (respuesta al DM del KIT) | palabra suelta | `6affb75c1dd209748396bbec` |

Configuración común:

- DM: el texto del día en `contenido.json`, con `{{username}}` (Zernio pone el usuario de quien comenta).
- Respuesta pública: 2 o 3 variantes al azar, solo si el DM salió bien (`public_reply_policy: after_dm`).
- También responde si la palabra llega por DM (`also_match_in_dms`): sirve para quien viene de TikTok o YouTube.
- Una sola vez por persona y por palabra (`repeat_policy: once`).
- Sin botones: el texto plano es lo que Instagram entrega más seguro a quien no te sigue.

`automatizaciones.json` tiene la configuración exacta de cada una, con su ID.

Cambios de palabra para evitar disparos por error: el día 7 usa **CUADERNO** (en Argentina y
Paraguay “notebook” es la laptop) y el día 14 usa **AUTOMATIZAR** (Kori es un robot en todos los
videos, así que “robot” saldría en muchos comentarios).

## YouTube

El canal **tekoreiai** también está conectado (cuenta `6affb9f48dc88f7a3edefd89`, mismo perfil).
YouTube no tiene mensajes privados, así que ahí Zernio **responde en público** debajo del comentario
con el link y los pasos (el mismo texto del DM, sin el nombre de usuario) y cierra con
“Más repos gratis cada día en Instagram: @tekorei.ai”. Son 15 automatizaciones activas desde el
20/11/2026 que miran **todos** los videos del canal, Shorts incluidos.

| Día | Palabra | Cómo detecta la palabra | ID en Zernio |
| --- | --- | --- | --- |
| 1 | EXAMEN | contiene “examen” o “exámen” | `6affba48faa5ec2934785df0` |
| 2 | FACELESS | palabra suelta, tolera errores de tipeo | `6affba5309306514540c2f9d` |
| 3 | SKILLS | palabra suelta, tolera errores de tipeo | `6affba5b1dd209748396be26` |
| 4 | OFFLINE | palabra suelta, tolera errores de tipeo | `6affba661dd209748396be29` |
| 5 | PDF | palabra suelta | `6affba6bb7a8bb141d14b34d` |
| 6 | PODERES | palabra suelta, tolera errores de tipeo | `6affba6eee19a59c20a26197` |
| 7 | CUADERNO | palabra suelta, tolera errores de tipeo | `6affba7f18f1bcffdfafe053` |
| 8 | MEMORIA | palabra suelta, tolera errores de tipeo, ignora si dice “ram” o “gb” | `6affba826203ea29645dc4d1` |
| 9 | FOTOS | palabra suelta | `6affba84ee19a59c20a261a5` |
| 10 | EDITOR | palabra suelta, tolera errores de tipeo | `6affba8bfaa5ec2934785e1e` |
| 11 | NAVEGADOR | palabra suelta, tolera errores de tipeo | `6affba921dd209748396be39` |
| 12 | DOCS | palabra suelta | `6affbb18a3ee28ddaa662457` |
| 13 | PLANO | palabra suelta | `6affbb1bf918f2a1ef6615fb` |
| 14 | AUTOMATIZAR | palabra suelta, tolera errores de tipeo | `6affbb1e18f1bcffdfafe0c9` |
| 15 | KIT | palabra suelta | `6affbb20cc3c473de89b36d7` |

- Dos versiones del texto que se alternan (“¡Aquí está!” y “¡Listo, acá va!”), para que no se vean
  todas iguales.
- Una sola respuesta por persona y por palabra (`repeat_policy: once`).
- No hay AVISAME en YouTube: el texto del KIT invita a escribir AVISAME por Instagram.

`youtube.json` tiene el texto exacto de cada una, con su ID.

## Cómo probarlo

Desde **otra** cuenta (no la de tekorei.ai), comenta la palabra del video, por ejemplo “EXAMEN”:

- En Instagram llega el DM (si esa cuenta no te sigue, aparece en “Solicitudes de mensajes”) y el
  comentario recibe una respuesta corta.
- En YouTube aparece una respuesta debajo del comentario con el link y los pasos. Puede tardar unos
  minutos.

Cada cuenta de prueba recibe una sola respuesta por palabra; para repetir la prueba usa otra cuenta u
otra palabra.

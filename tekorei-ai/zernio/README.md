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

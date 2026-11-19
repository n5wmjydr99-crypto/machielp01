# tekorei.ai · Temporada 1

Plan de 15 videos verticales (Reels y Shorts) sobre repos, skills y plugins de IA,
con un DM automático por palabra clave y un agente de IA para el resto de los comentarios.

Página del plan: https://claude.ai/artifact/9gGubRMeXgSxBQzxpjL6cD

## Archivos

| Archivo | Qué es |
| --- | --- |
| `contenido.json` | Fuente única: personajes, y por día el repo, gancho, guion con planos, palabra clave, DM, respuestas, textos de IG y YouTube. |
| `plantilla.html` | Diseño de la página del plan. |
| `generar.py` | Valida el contenido y genera todo lo de abajo. |
| `plan-tekorei.html` | La página publicada (generada). |
| `chatplace/automatizaciones.json` | 16 flujos para `automations_create_from_schema` (15 palabras + AVISAME). Se crean pausados. |
| `chatplace/respuestas-comentarios.json` | Respuestas públicas para `comments_create`. |
| `chatplace/agente-ia.json` | Reglas, ajustes y base de conocimiento del agente de IA. |

Si cambias algo en `contenido.json`, corre `python3 generar.py`: revisa que ningún DM pase de
1.000 caracteres, que los botones tengan hasta 20 caracteres y que ninguna palabra clave esté
dentro de otra (por eso el día 13 usa PLANO y no SPEC: “espectacular” contiene “spec”).

## Cada flujo de palabra clave

1. Alguien comenta la palabra (o la escribe por DM).
2. Respuesta pública al comentario (rotan 3 textos).
3. DM con botón “¡Lo quiero! 🔥” → etiquetas `tekorei` y `kw_<palabra>`.
4. ¿Sigue a @tekorei.ai? Si no, le pide seguir y tocar “Ya te sigo ✅”.
5. Entrega: pasos de instalación + botón al repo (el clic suma la etiqueta `kw_<palabra>_click`).

## Para cargarlo en ChatPlace

Estado al 19/11/2026: la única cuenta conectada en ChatPlace es otra (no tekorei.ai) y el saldo
de IA es 0. No se tocó nada.

1. Conectar el Instagram de tekorei.ai en ChatPlace como bot nuevo.
2. Pedirle a Claude “carga tekorei”: crea los flujos (pausados), las respuestas y el agente.
3. Probar comentando desde otra cuenta y activar.

## Repos verificados (estrellas al 19/11/2026)

ZeKaiNie/universal-examprep-skill (398) · harry0703/MoneyPrinterTurbo (144.695) ·
anthropics/skills (197.644) · ollama/ollama (187.649) · open-webui/open-webui (159.096) ·
microsoft/markitdown (196.991) · obra/superpowers (321.961) · lfnovo/open-notebook (42.085) ·
thedotmack/claude-mem (118.401) · upscayl/upscayl (52.937) · danielgatis/rembg (25.588) ·
remotion-dev/remotion (74.334) · remotion-dev/skills (7.562) · microsoft/playwright-mcp (39.903) ·
upstash/context7 (65.133) · github/spec-kit (150.674) · n8n-io/n8n (211.422) · vercel-labs/skills (40.074)

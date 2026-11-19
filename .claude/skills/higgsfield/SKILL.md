---
name: higgsfield
description: Genera imágenes y videos con IA usando Higgsfield (texto→imagen, imagen→video, edición, etc.) a través del conector MCP "higgsfield". Úsala cuando el usuario pida crear, animar o editar imágenes o videos con Higgsfield, generar assets para la web/tienda (banners, fotos de producto, clips para el hero), o mencione Higgsfield, Seedream, Kling, Soul u otros modelos de Higgsfield.
---

# Higgsfield

Genera medios con la API de Higgsfield mediante las herramientas del conector MCP `higgsfield`
(`higgsfield/mcp-server/server.mjs`, registrado en `.mcp.json`).

## Herramientas

| Herramienta | Para qué |
|---|---|
| `higgsfield_models` | Catálogo actual de modelos (slug, operación, tipo de salida). Filtra por `output_type`, `operation` o `search`. |
| `higgsfield_generate` | Lanza una generación. `model` = slug del modelo, `arguments` = JSON del modelo. Espera el resultado por defecto (`wait: true`) y devuelve `output_urls`. |
| `higgsfield_status` | Estado de un `request_id`: `queued`, `in_progress`, `completed`, `failed`, `nsfw`, `canceled`. |
| `higgsfield_wait` | Espera a que un `request_id` termine. |
| `higgsfield_cancel` | Cancela una petición aún en cola. |
| `higgsfield_upload` | Sube un archivo local y devuelve `public_url` (para `image_url`, etc.). |
| `higgsfield_download` | Guarda una URL de salida en disco. |

Si las herramientas no aparecen, el conector no está activo: revisa la sección **Configuración**.

## Flujo de trabajo

1. **Aclara el encargo** solo si falta algo esencial: qué se genera (imagen o video), para qué uso
   (eso define la relación de aspecto: 16:9 hero/banner, 1:1 producto/feed, 9:16 stories/reels) y estilo.
2. **Redacta un buen prompt** (ver abajo). Muestra el prompt al usuario en una línea.
3. **Entradas locales**: si el usuario da una imagen del proyecto (p. ej. `assets/…png`), súbela con
   `higgsfield_upload` y usa el `public_url` devuelto.
4. **Elige el modelo** con `higgsfield_models` (p. ej. `output_type: "image"`, `operation: "text2image"`),
   salvo que el usuario ya haya indicado uno. **Genera** con `higgsfield_generate`.
   - Imágenes: `wait: true` (tardan segundos).
   - Videos: suelen tardar minutos. Usa `wait: true` con `timeout_seconds: 900`, o `wait: false` y luego
     `higgsfield_wait` si quieres seguir trabajando mientras tanto.
5. **Entrega**: muestra las `output_urls`. Si el resultado es para el proyecto, descárgalo con
   `higgsfield_download` a la carpeta adecuada (p. ej. `assets/`) y referéncialo desde el código.
6. **Estados finales distintos de `completed`**:
   - `nsfw`: el contenido fue bloqueado; reformula el prompt sin el elemento conflictivo.
   - `failed`: muestra el error; revisa parámetros (nombres de campo, valores admitidos) y reintenta una vez.
   - `not_enough_credits` / error 402: avisa al usuario de que recargue créditos en Higgsfield Cloud; no reintentes.
   - `model_not_found`: el slug no existe; consulta `higgsfield_models` y no adivines.
   - Error de validación (422): lee qué campo falta o sobra, corrige y reintenta (no consume créditos).

## Modelos

El slug del modelo forma parte de la URL (`POST https://api.higgsfield.ai/<slug>`). El catálogo cambia a
menudo (los ejemplos de los SDK oficiales ya no existen), así que **consúltalo siempre con `higgsfield_models`**
en lugar de fiarte de la memoria. Algunos slugs vistos en noviembre de 2026:

| Uso | Slug |
|---|---|
| Texto → imagen | `bytedance/seedream/v5.0/pro/text-to-image`, `kling-image/v4.0/text-to-image`, `recraft/v4.1/pro/text-to-image`, `higgsfield-ai/soul/v2/standard`, `z-image/turbo` |
| Editar imagen | `bytedance/seedream/v5.0/pro/edit`, `kling-image/v4.0/edit`, `alibaba/qwen-image-3/edit` |
| Imagen → video | `kling-video/v3.0/pro/image-to-video`, `bytedance/seedance-2.5/image-to-video`, `wan/v2.7/image-to-video` |
| Texto → video | `kling-video/v3.0/pro/text-to-video`, `bytedance/seedance-2.5/text-to-video`, `minimax/h3-lite/text-to-video` |
| Anuncios / marketing | `higgsfield/ads-studio/v1.0`, `marketing-studio/image` |

Ejemplo:

```json
{
  "model": "bytedance/seedream/v5.0/pro/text-to-image",
  "arguments": { "prompt": "Matte black gaming headphones on a stone pedestal, cyan rim light", "aspect_ratio": "16:9" }
}
```

La salida de imágenes viene en `images[].url`; la de video, en `video.url`. El conector las reúne en `output_urls`.

La API no publica los campos de entrada de cada modelo. Empieza con `prompt` (+ `image_url` para entradas de
imagen) y `aspect_ratio`; si la API devuelve un error de validación, ajusta según lo que indique. Otros campos
habituales: `resolution`, `duration`, `seed`. Detalle por modelo en <https://docs.higgsfield.ai>.

## Cómo escribir prompts

- Estructura: **sujeto + acción + entorno + iluminación + encuadre/cámara + estilo**.
  Ej.: "Auriculares inalámbricos negro mate sobre pedestal de piedra, luz de estudio suave con contraluz
  cian, plano 3/4 macro, fondo degradado oscuro, fotografía de producto, ultra detallado".
- Video: describe **un solo movimiento de cámara** y la acción principal ("travelling lento hacia
  adelante mientras el producto gira 90°"). Menos es más.
- Escribe los prompts en inglés para mejores resultados, aunque converses en español.
- Mantén coherencia de marca en una serie: reutiliza la misma frase de estilo y paleta, y fija `seed` si el modelo lo admite.

## Configuración

1. Crea una credencial en <https://cloud.higgsfield.ai/> (API Keys). Cada credencial tiene **key ID** y **secret**.
2. Expórtalas antes de abrir Claude Code (nunca las subas al repo):
   ```bash
   export HF_API_KEY="tu-key-id"
   export HF_API_SECRET="tu-secret"
   ```
   (o `HF_KEY="key-id:secret"`).
3. El conector ya está declarado en `.mcp.json`; Claude Code pedirá aprobarlo la primera vez. Comprueba con `/mcp`.
4. En Claude Code en la nube, guarda la credencial como secreto del entorno o variable de entorno y permite
   el host `api.higgsfield.ai` en la red del entorno.

Detalles de la API: autenticación `Authorization: Key <id>:<secret>` (no Bearer); estado en
`GET /requests/{id}/status`; cancelación en `POST /requests/{id}/cancel`; subida vía
`POST /files/generate-upload-url` + `PUT` al `upload_url`; webhook opcional con `?hf_webhook=<url>`.

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
| `higgsfield_generate` | Lanza una generación. `model` = ruta del modelo, `arguments` = JSON del modelo. Espera el resultado por defecto (`wait: true`) y devuelve `output_urls`. |
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
4. **Genera** con `higgsfield_generate`.
   - Imágenes: `wait: true` (tardan segundos).
   - Videos: suelen tardar minutos. Usa `wait: true` con `timeout_seconds: 900`, o `wait: false` y luego
     `higgsfield_wait` si quieres seguir trabajando mientras tanto.
5. **Entrega**: muestra las `output_urls`. Si el resultado es para el proyecto, descárgalo con
   `higgsfield_download` a la carpeta adecuada (p. ej. `assets/`) y referéncialo desde el código.
6. **Estados finales distintos de `completed`**:
   - `nsfw`: el contenido fue bloqueado; reformula el prompt sin el elemento conflictivo.
   - `failed`: muestra el error; revisa parámetros (nombres de campo, valores admitidos) y reintenta una vez.
   - Error 402 / créditos: avisa al usuario, no reintentes.

## Modelos

La ruta del modelo forma parte de la URL (`POST https://api.higgsfield.ai/<modelo>`).
Ejemplo verificado en el SDK oficial:

```json
{
  "model": "bytedance/seedream/v4/text-to-image",
  "arguments": {
    "prompt": "A serene lake at sunset with mountains",
    "resolution": "2K",
    "aspect_ratio": "16:9",
    "camera_fixed": false
  }
}
```

La salida de imágenes viene en `images[].url`; la de video, en `video.url`. El conector las reúne en `output_urls`.

Para otros modelos (imagen→video, Kling, Soul, etc.) la ruta exacta y sus campos están en el catálogo de
[Higgsfield Cloud](https://cloud.higgsfield.ai/) y en <https://docs.higgsfield.ai>. **No inventes rutas ni
campos**: si el usuario no da la ruta y no la conoces con certeza, pídesela (se copia desde la página del
modelo en Higgsfield Cloud) o consulta la documentación. Campos habituales: `prompt`, `image_url`,
`aspect_ratio`, `resolution`, `duration`, `seed`.

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

# NEXUSTECH · e-commerce 3D (negro y rojo)

Abrir `index.html` (o `python3 -m http.server` y entrar a `localhost:8000`). Sin build ni dependencias (Three.js va incluido).

- **Tienda**: escena 3D con Three.js que se recorre con el scroll, catálogo en Guaraníes, carrito, WhatsApp flotante.
- **Clientes**: cuenta con correo/Google/Apple (Google y Apple simulados), checkout con dirección (casa/depto/oficina), tarjeta (Luhn, solo se guarda marca + últimos 4) y factura con RUC + Razón Social.
- **Dueños**: pie de página → "Acceso tienda" (usuario `HOST`). Estadísticas por año/mes/semana/día, inventario (precio, imagen, artículos, stock) y pedidos.

Proyecto demostrativo: los datos viven en `localStorage` (sin servidor); el historial 2024–hoy es de demostración.

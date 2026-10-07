/* NEXUSTECH · catálogo inicial + generador de ilustraciones de producto (SVG) */
window.NX = window.NX || {};

NX.WHATSAPP = 'https://wa.link/g5hw55';

NX.DEPARTAMENTOS = ['Asunción', 'Central', 'Alto Paraná', 'Itapúa', 'Concepción', 'San Pedro', 'Cordillera', 'Guairá',
  'Caaguazú', 'Caazapá', 'Misiones', 'Paraguarí', 'Ñeembucú', 'Amambay', 'Canindeyú', 'Presidente Hayes',
  'Boquerón', 'Alto Paraguay'];

NX.CATEGORIES = ['Celulares', 'Laptops', 'Tablets', 'Audio', 'Monitores', 'Periféricos', 'Relojes'];
NX.BRANDS = ['Apple', 'Samsung', 'Acer', 'HP', 'Logitech', 'Sony', 'ASUS'];

NX.PRODUCTS = [
  { id: 'p01', name: 'iPhone 16 Pro Max 256GB', brand: 'Apple', cat: 'Celulares', art: 'phone', price: 9800000, stock: 14, desc: 'Titanio, chip A18 Pro, cámara de 48MP con zoom óptico 5x y pantalla Super Retina XDR de 6,9".' },
  { id: 'p02', name: 'MacBook Pro 14" M4 Pro', brand: 'Apple', cat: 'Laptops', art: 'laptop', price: 18900000, stock: 6, desc: 'Chip M4 Pro, 24GB de memoria unificada, SSD 512GB y pantalla Liquid Retina XDR.' },
  { id: 'p03', name: 'iPad Pro 13" M4 OLED', brand: 'Apple', cat: 'Tablets', art: 'tablet', price: 12400000, stock: 8, desc: 'Pantalla Ultra Retina XDR tandem OLED, chip M4 y soporte para Apple Pencil Pro.' },
  { id: 'p04', name: 'AirPods Pro 2 USB-C', brand: 'Apple', cat: 'Audio', art: 'headphones', price: 1950000, stock: 30, desc: 'Cancelación activa de ruido, audio espacial personalizado y estuche MagSafe.' },
  { id: 'p05', name: 'Apple Watch Ultra 2', brand: 'Apple', cat: 'Relojes', art: 'watch', price: 6900000, stock: 9, desc: 'Caja de titanio de 49mm, GPS de doble frecuencia y hasta 36 horas de batería.' },
  { id: 'p06', name: 'Galaxy S25 Ultra 512GB', brand: 'Samsung', cat: 'Celulares', art: 'phone', price: 11200000, stock: 12, desc: 'Snapdragon 8 Elite, S Pen integrado, cámara de 200MP y Galaxy AI.' },
  { id: 'p07', name: 'Galaxy Z Fold6', brand: 'Samsung', cat: 'Celulares', art: 'phone', price: 14500000, stock: 4, desc: 'Pantalla plegable Dynamic AMOLED 2X de 7,6", el celular que se vuelve tablet.' },
  { id: 'p08', name: 'Galaxy Tab S10 Ultra', brand: 'Samsung', cat: 'Tablets', art: 'tablet', price: 9600000, stock: 7, desc: 'Pantalla de 14,6" AMOLED, MediaTek Dimensity 9300+ y S Pen incluido.' },
  { id: 'p09', name: 'Odyssey OLED G9 49"', brand: 'Samsung', cat: 'Monitores', art: 'monitor', price: 13800000, stock: 3, desc: 'Ultrapanorámico curvo DQHD, 240Hz, 0,03ms y HDR True Black.' },
  { id: 'p10', name: 'Predator Helios 18 RTX 4080', brand: 'Acer', cat: 'Laptops', art: 'laptop', price: 21500000, stock: 3, desc: 'Intel Core i9, RTX 4080, pantalla Mini-LED de 18" a 250Hz y 32GB DDR5.' },
  { id: 'p11', name: 'Swift Edge 16 OLED', brand: 'Acer', cat: 'Laptops', art: 'laptop', price: 9900000, stock: 10, desc: 'Ultraliviana de 1,23 kg, Ryzen 7 con pantalla OLED 3.2K de 16".' },
  { id: 'p12', name: 'Predator X32 Mini-LED 4K', brand: 'Acer', cat: 'Monitores', art: 'monitor', price: 12700000, stock: 5, desc: 'Monitor gamer 4K 160Hz con 1152 zonas Mini-LED y DisplayHDR 1000.' },
  { id: 'p13', name: 'Spectre x360 14 OLED', brand: 'HP', cat: 'Laptops', art: 'laptop', price: 14900000, stock: 6, desc: 'Convertible premium Intel Core Ultra 7, OLED 2.8K táctil y chasis de aluminio.' },
  { id: 'p14', name: 'OMEN 16 RTX 4070', brand: 'HP', cat: 'Laptops', art: 'laptop', price: 15800000, stock: 5, desc: 'Gaming de alto rendimiento, Ryzen 9, RTX 4070 y refrigeración OMEN Tempest.' },
  { id: 'p15', name: 'Z27k G3 4K USB-C', brand: 'HP', cat: 'Monitores', art: 'monitor', price: 4200000, stock: 11, desc: 'Monitor profesional 4K con USB-C 100W y calibración de color de fábrica.' },
  { id: 'p16', name: 'MX Master 3S', brand: 'Logitech', cat: 'Periféricos', art: 'mouse', price: 1100000, stock: 25, desc: 'Mouse ergonómico inalámbrico, sensor 8K DPI y clics silenciosos.' },
  { id: 'p17', name: 'G PRO X Superlight 2', brand: 'Logitech', cat: 'Periféricos', art: 'mouse', price: 1450000, stock: 18, desc: 'Mouse gamer de 60g, sensor HERO 2 y conexión LIGHTSPEED.' },
  { id: 'p18', name: 'MX Keys S Teclado', brand: 'Logitech', cat: 'Periféricos', art: 'keyboard', price: 1250000, stock: 16, desc: 'Teclado inalámbrico retroiluminado con teclas esféricas y multi-dispositivo.' },
  { id: 'p19', name: 'WH-1000XM5', brand: 'Sony', cat: 'Audio', art: 'headphones', price: 2900000, stock: 13, desc: 'Auriculares con la mejor cancelación de ruido de su clase y 30 horas de batería.' },
  { id: 'p20', name: 'ROG Zephyrus G14', brand: 'ASUS', cat: 'Laptops', art: 'laptop', price: 19800000, stock: 4, desc: 'Gaming ultracompacto, Ryzen 9, RTX 4070 y pantalla OLED 3K a 120Hz.' }
];

/* ---------- Ilustraciones de producto (negro / rojo) ---------- */
NX.productArt = function (art, brand) {
  const defs = `<defs>
    <radialGradient id="g" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#ff1f3d" stop-opacity=".42"/><stop offset="1" stop-color="#050506" stop-opacity="0"/></radialGradient>
    <linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a30"/><stop offset=".5" stop-color="#0d0d10"/><stop offset="1" stop-color="#26262c"/></linearGradient>
    <linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff1f3d"/><stop offset=".6" stop-color="#5c0010"/><stop offset="1" stop-color="#14040a"/></linearGradient>
  </defs>`;
  const stroke = 'stroke="#ff1f3d" stroke-opacity=".55" stroke-width="2"';
  let s = '';
  switch (art) {
    case 'phone':
      s = `<rect x="215" y="90" width="170" height="360" rx="30" fill="url(#m)" ${stroke}/>
        <rect x="225" y="102" width="150" height="336" rx="22" fill="url(#s)"/>
        <rect x="278" y="110" width="44" height="12" rx="6" fill="#050506"/>
        <circle cx="352" cy="140" r="0"/>`; break;
    case 'laptop':
      s = `<rect x="140" y="150" width="320" height="205" rx="14" fill="url(#m)" ${stroke}/>
        <rect x="152" y="162" width="296" height="181" rx="6" fill="url(#s)"/>
        <path d="M95 372h410l-26 30H121z" fill="url(#m)" ${stroke}/>
        <rect x="262" y="378" width="76" height="6" rx="3" fill="#ff1f3d" fill-opacity=".5"/>`; break;
    case 'tablet':
      s = `<rect x="130" y="130" width="340" height="250" rx="24" fill="url(#m)" ${stroke}/>
        <rect x="143" y="143" width="314" height="224" rx="14" fill="url(#s)"/>`; break;
    case 'headphones':
      s = `<path d="M170 330V290C170 205 225 150 300 150S430 205 430 290v40" fill="none" stroke="#2a2a30" stroke-width="22" stroke-linecap="round"/>
        <path d="M170 330V290C170 205 225 150 300 150S430 205 430 290v40" fill="none" stroke="#ff1f3d" stroke-opacity=".55" stroke-width="3"/>
        <rect x="135" y="285" width="70" height="125" rx="32" fill="url(#m)" ${stroke}/>
        <rect x="395" y="285" width="70" height="125" rx="32" fill="url(#m)" ${stroke}/>
        <circle cx="170" cy="348" r="14" fill="#ff1f3d"/><circle cx="430" cy="348" r="14" fill="#ff1f3d"/>`; break;
    case 'monitor':
      s = `<rect x="95" y="140" width="410" height="235" rx="12" fill="url(#m)" ${stroke}/>
        <rect x="106" y="151" width="388" height="213" rx="5" fill="url(#s)"/>
        <path d="M268 375h64l12 46H256z" fill="url(#m)" ${stroke}/>
        <rect x="215" y="421" width="170" height="10" rx="5" fill="url(#m)" ${stroke}/>`; break;
    case 'mouse':
      s = `<path d="M300 110c-62 0-98 48-98 120v90c0 62 40 100 98 100s98-38 98-100v-90c0-72-36-120-98-120z" fill="url(#m)" ${stroke}/>
        <path d="M300 110v120M202 235h196" stroke="#ff1f3d" stroke-opacity=".6" stroke-width="2" fill="none"/>
        <rect x="288" y="150" width="24" height="52" rx="12" fill="#ff1f3d"/>`; break;
    case 'keyboard':
      s = `<rect x="85" y="210" width="430" height="180" rx="16" fill="url(#m)" ${stroke}/>` +
        [0, 1, 2, 3].map(r => Array.from({ length: 11 }, (_, c) =>
          `<rect x="${103 + c * 37}" y="${228 + r * 36}" width="29" height="27" rx="6" fill="#050506" stroke="#ff1f3d" stroke-opacity="${r === 3 && c > 2 && c < 8 ? .9 : .3}"/>`).join('')).join(''); break;
    case 'watch':
      s = `<rect x="250" y="70" width="100" height="120" rx="20" fill="url(#m)" ${stroke}/>
        <rect x="250" y="410" width="100" height="120" rx="20" fill="url(#m)" ${stroke}/>
        <rect x="225" y="170" width="150" height="260" rx="44" fill="url(#m)" ${stroke}/>
        <rect x="241" y="186" width="118" height="228" rx="30" fill="url(#s)"/>
        <rect x="372" y="260" width="14" height="48" rx="6" fill="#ff1f3d"/>`; break;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">${defs}
    <rect width="600" height="600" fill="#08080a"/><circle cx="300" cy="320" r="270" fill="url(#g)"/>
    ${s}
    <text x="300" y="568" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="22" letter-spacing="8" fill="#ffffff" fill-opacity=".35">${(brand || '').toUpperCase()}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

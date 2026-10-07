/* NEXUSTECH · panel de dueños: estadísticas, inventario y pedidos */
(function () {
  'use strict';
  const NX = window.NX, { $, $$, fmt, esc, store, toast } = NX;
  const st = { tab: 'stats', period: 'month' };
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const PERIODS = { year: 'Año', month: 'Mes', week: 'Semana', day: 'Día' };

  /* ---------- períodos ---------- */
  function buckets(p) {
    const now = new Date(), out = [], d0 = (y, m, d) => new Date(y, m, d).getTime();
    if (p === 'year') for (let y = 2024; y <= now.getFullYear(); y++) out.push({ label: String(y), s: d0(y, 0, 1), e: d0(y + 1, 0, 1) });
    if (p === 'month') for (let i = 11; i >= 0; i--) { const y = now.getFullYear(), m = now.getMonth() - i, a = new Date(y, m, 1); out.push({ label: MES[a.getMonth()] + " '" + String(a.getFullYear()).slice(2), s: a.getTime(), e: d0(y, m + 1, 1) }); }
    if (p === 'week') { const dow = (now.getDay() + 6) % 7; for (let i = 11; i >= 0; i--) { const s = d0(now.getFullYear(), now.getMonth(), now.getDate() - dow - 7 * i), a = new Date(s); out.push({ label: a.getDate() + ' ' + MES[a.getMonth()], s, e: s + 7 * 864e5 }); } }
    if (p === 'day') for (let i = 29; i >= 0; i--) { const s = d0(now.getFullYear(), now.getMonth(), now.getDate() - i), a = new Date(s); out.push({ label: a.getDate() + '/' + (a.getMonth() + 1), s, e: d0(a.getFullYear(), a.getMonth(), a.getDate() + 1) }); }
    return out;
  }
  function compute() {
    const bs = buckets(st.period), orders = store.get('orders', []).filter((o) => o.status !== 'Cancelado'), users = store.get('users', []);
    bs.forEach((b) => {
      const os = orders.filter((o) => o.date >= b.s && o.date < b.e);
      b.orders = os; b.rev = os.reduce((a, o) => a + o.total, 0); b.n = os.length;
      b.newC = users.filter((u) => u.createdAt >= b.s && u.createdAt < b.e).length;
      b.lostC = users.filter((u) => u.deletedAt && u.deletedAt >= b.s && u.deletedAt < b.e).length;
      b.active = users.filter((u) => u.createdAt < b.e && (!u.deletedAt || u.deletedAt >= b.e)).length;
    });
    return bs;
  }
  const delta = (a, b, inv) => { if (!b) return a ? '<span class="delta up">▲ nuevo</span>' : '<span class="delta">—</span>'; const p = ((a - b) / b) * 100, good = inv ? p <= 0 : p >= 0; return `<span class="delta ${good ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(1)}% vs. anterior</span>`; };

  /* ---------- gráfico canvas con animación y tooltip ---------- */
  function chart(wrap, labels, series, money) {
    wrap.innerHTML = '<canvas></canvas><div class="tip"></div>';
    const cv = $('canvas', wrap), tip = $('.tip', wrap), ctx = cv.getContext('2d');
    let prog = 0, hover = -1, W, H;
    const max = Math.max(1, ...series.flatMap((s) => s.data)) * 1.12, pad = { l: money ? 74 : 40, r: 14, t: 14, b: 30 };
    const X = (i) => pad.l + ((W - pad.l - pad.r) / labels.length) * (i + 0.5), Y = (v) => H - pad.b - ((H - pad.t - pad.b) * v) / max;
    const short = (v) => (money ? (v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + ' M' : v >= 1e3 ? Math.round(v / 1e3) + ' k' : v) : Math.round(v));
    function draw() {
      const r = wrap.getBoundingClientRect(), dpr = devicePixelRatio || 1; W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H); ctx.font = '11px Space Grotesk, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#7d7d86'; ctx.strokeStyle = 'rgba(255,255,255,.07)';
      for (let g = 0; g <= 4; g++) { const v = (max / 4) * g, y = Y(v); ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke(); ctx.fillText(short(v), pad.l - 8, y + 4); }
      ctx.textAlign = 'center'; const step = Math.ceil(labels.length / Math.max(1, Math.floor((W - pad.l) / 56)));
      labels.forEach((l, i) => { if (i % step === 0) ctx.fillText(l, X(i), H - 10); });
      const bars = series.filter((s) => s.type === 'bar'), bw = Math.min(34, ((W - pad.l - pad.r) / labels.length) * 0.62 / Math.max(1, bars.length));
      series.forEach((s, si) => {
        if (s.type === 'bar') { const bi = bars.indexOf(s); s.data.forEach((v, i) => { const x = X(i) - (bw * bars.length) / 2 + bi * bw, h = (Y(0) - Y(v)) * prog, g = ctx.createLinearGradient(0, Y(0) - h, 0, Y(0)); g.addColorStop(0, s.color); g.addColorStop(1, 'rgba(120,0,20,.45)'); ctx.fillStyle = i === hover ? '#fff' : g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, Y(0) - h, bw - 2, h, 4) : ctx.rect(x, Y(0) - h, bw - 2, h); ctx.fill(); }); }
        else {
          ctx.beginPath(); s.data.forEach((v, i) => { const y = Y(0) - (Y(0) - Y(v)) * prog; i ? ctx.lineTo(X(i), y) : ctx.moveTo(X(i), y); });
          ctx.strokeStyle = s.color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.shadowColor = s.color; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
          if (s.fill) { ctx.lineTo(X(labels.length - 1), Y(0)); ctx.lineTo(X(0), Y(0)); const g = ctx.createLinearGradient(0, pad.t, 0, Y(0)); g.addColorStop(0, s.color + '55'); g.addColorStop(1, s.color + '00'); ctx.fillStyle = g; ctx.fill(); }
          s.data.forEach((v, i) => { const y = Y(0) - (Y(0) - Y(v)) * prog; ctx.fillStyle = i === hover ? '#fff' : s.color; ctx.beginPath(); ctx.arc(X(i), y, i === hover ? 5 : 3, 0, 7); ctx.fill(); });
        }
      });
      ctx.lineWidth = 1;
    }
    const t0 = performance.now();
    (function anim(t) { prog = Math.min(1, (t - t0) / 900); prog = 1 - Math.pow(1 - prog, 3); if (!cv.isConnected) return; draw(); if (prog < 1) requestAnimationFrame(anim); })(t0);
    cv.addEventListener('pointermove', (e) => {
      const r = cv.getBoundingClientRect(), i = Math.floor(((e.clientX - r.left - pad.l) / (W - pad.l - pad.r)) * labels.length);
      if (i < 0 || i >= labels.length) { hover = -1; tip.style.opacity = 0; return draw(); }
      hover = i; draw(); tip.style.opacity = 1; tip.style.left = Math.min(W - 150, Math.max(0, X(i) - 60)) + 'px'; tip.style.top = '4px';
      tip.innerHTML = `<b>${esc(labels[i])}</b><br>` + series.map((s) => `<span style="color:${s.color}">●</span> ${esc(s.name)}: ${money ? fmt(s.data[i]) : s.data[i]}`).join('<br>');
    });
    cv.addEventListener('pointerleave', () => { hover = -1; tip.style.opacity = 0; draw(); });
  }
  const RED = '#ff1f3d', PINK = '#ff8a9b', GREY = '#9a9aa3', WHITE = '#ffffff';
  const legend = (items) => `<span class="legend">${items.map(([c, n]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')}</span>`;

  /* ---------- vistas ---------- */
  function render() {
    const v = $('#view-admin');
    v.innerHTML = `<div class="adm-top"><h1>PANEL <em>NEXUSTECH</em></h1><div class="adm-actions">
      <div class="seg" id="tabs">${[['stats', 'Estadísticas'], ['inv', 'Inventario'], ['ord', 'Pedidos']].map(([k, n]) => `<button data-tab="${k}" class="${st.tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <button class="btn btn-ghost btn-sm" id="admOut">Salir</button></div></div><div id="admBody"></div>`;
    $('#tabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (b) { st.tab = b.dataset.tab; render(); } };
    $('#admOut').onclick = () => NX.logoutAdmin();
    ({ stats: statsView, inv: invView, ord: ordView })[st.tab]();
  }
  NX.renderAdmin = render;

  function statsView() {
    const bs = compute(), cur = bs[bs.length - 1], prev = bs[bs.length - 2] || { rev: 0, n: 0, newC: 0, lostC: 0 };
    const users = store.get('users', []), activeNow = users.filter((u) => !u.deletedAt).length;
    const tot = (k) => bs.reduce((a, b) => a + b[k], 0), avg = cur.n ? cur.rev / cur.n : 0, pavg = prev.n ? prev.rev / prev.n : 0;
    const K = [['Ingresos', fmt(cur.rev), delta(cur.rev, prev.rev)], ['Pedidos', cur.n, delta(cur.n, prev.n)], ['Ticket promedio', fmt(avg), delta(avg, pavg)],
      ['Clientes nuevos', cur.newC, delta(cur.newC, prev.newC)], ['Clientes perdidos', cur.lostC, delta(cur.lostC, prev.lostC, true)], ['Clientes activos', activeNow, `<span class="delta">Saldo del período: ${cur.newC - cur.lostC >= 0 ? '+' : ''}${cur.newC - cur.lostC}</span>`]];
    const labels = bs.map((b) => b.label), unit = { year: 'año', month: 'mes', week: 'semana', day: 'día' }[st.period];
    const range = bs[0].s, tp = {}; bs.forEach((b) => b.orders.forEach((o) => o.items.forEach((i) => { tp[i.name] = (tp[i.name] || 0) + i.qty; })));
    const top = Object.entries(tp).sort((a, b) => b[1] - a[1]).slice(0, 7), topMax = top[0] ? top[0][1] : 1;
    const low = NX.products().filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock);
    $('#admBody').innerHTML = `<div class="adm-top"><p class="note">Período actual (${unit}) comparado con el anterior · ${new Date(range).toLocaleDateString('es-PY')} → hoy</p>
      <div class="seg" id="per">${Object.entries(PERIODS).map(([k, n]) => `<button data-p="${k}" class="${st.period === k ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <div class="kpis">${K.map(([t, val, d], i) => `<div class="kpi" style="--i:${i}"><small>${t}</small><b>${val}</b>${d}</div>`).join('')}</div>
      <div class="panels"><div class="panel"><h3>Ingresos por ${unit} ${legend([[RED, 'Gs.']])}</h3><div class="chart-wrap" id="c1"></div></div>
      <div class="panel"><h3>Pedidos por ${unit} ${legend([[WHITE, 'Pedidos']])}</h3><div class="chart-wrap" id="c2"></div></div>
      <div class="panel"><h3>Incremento vs. disminución de clientes ${legend([[RED, 'Nuevos'], [GREY, 'Perdidos']])}</h3><div class="chart-wrap" id="c3"></div></div>
      <div class="panel"><h3>Clientes activos ${legend([[PINK, 'Activos']])}</h3><div class="chart-wrap" id="c4"></div></div>
      <div class="panel"><h3>Más vendidos (${labels[0]} – ${labels[labels.length - 1]})</h3><div class="bar-list">${top.map(([n, q]) => `<div class="bar-row"><span>${esc(n)}</span><b>${q} u.</b><i><b data-w="${(q / topMax) * 100}"></b></i></div>`).join('') || '<p class="note">Sin ventas en el rango.</p>'}</div></div>
      <div class="panel"><h3>Alertas de stock</h3>${low.length ? `<div class="tbl-wrap"><table>${low.map((p) => `<tr><td>${esc(p.name)}</td><td><span class="pill ${p.stock <= 0 ? 'out' : 'low'}">${p.stock <= 0 ? 'Agotado' : p.stock + ' u.'}</span></td></tr>`).join('')}</table></div>` : '<p class="note">Todo el inventario está sano.</p>'}</div></div>
      <p class="demo-note">Los datos de 2024–hoy incluyen historial de demostración generado para ilustrar el panel; las compras y registros nuevos se suman en tiempo real. Totales del rango: ${fmt(tot('rev'))} · ${tot('n')} pedidos · +${tot('newC')} / −${tot('lostC')} clientes.</p>`;
    $('#per').onclick = (e) => { const b = e.target.closest('[data-p]'); if (b) { st.period = b.dataset.p; render(); } };
    chart($('#c1'), labels, [{ name: 'Ingresos', type: 'bar', color: RED, data: bs.map((b) => b.rev) }], true);
    chart($('#c2'), labels, [{ name: 'Pedidos', type: 'line', color: WHITE, fill: true, data: bs.map((b) => b.n) }]);
    chart($('#c3'), labels, [{ name: 'Nuevos', type: 'bar', color: RED, data: bs.map((b) => b.newC) }, { name: 'Perdidos', type: 'bar', color: GREY, data: bs.map((b) => b.lostC) }]);
    chart($('#c4'), labels, [{ name: 'Activos', type: 'line', color: PINK, fill: true, data: bs.map((b) => b.active) }]);
    requestAnimationFrame(() => $$('[data-w]').forEach((b) => (b.style.width = b.dataset.w + '%')));
  }

  /* ---------- inventario ---------- */
  function saveProducts(ps) { if (store.set('products', ps)) NX.refreshShop(); }
  function invView() {
    const ps = NX.products();
    $('#admBody').innerHTML = `<div class="adm-top"><p class="note">Editá precio y stock directo en la tabla. Los cambios se ven al instante en la tienda.</p><button class="btn btn-red btn-sm" id="newP">+ Agregar artículo</button></div>
      <div class="panel"><div class="tbl-wrap"><table><thead><tr><th></th><th>Artículo</th><th>Marca</th><th>Categoría</th><th>Precio (Gs.)</th><th>Stock</th><th></th></tr></thead><tbody>
      ${ps.map((p) => `<tr data-id="${p.id}"><td><img src="${esc(NX.productImg(p))}" alt=""></td><td>${esc(p.name)}</td><td>${esc(p.brand)}</td><td>${esc(p.cat)}</td>
        <td><input type="number" min="0" step="1000" data-f="price" value="${p.price}"></td><td><input class="sm" type="number" min="0" data-f="stock" value="${p.stock}"> ${p.stock <= 0 ? '<span class="pill out">Agotado</span>' : p.stock <= 5 ? '<span class="pill low">Bajo</span>' : ''}</td>
        <td><div class="adm-actions"><button class="btn btn-ghost btn-sm" data-edit="${p.id}">Editar</button><button class="btn btn-ghost btn-sm" data-del="${p.id}" style="color:#ff5d73">Borrar</button></div></td></tr>`).join('')}</tbody></table></div></div>`;
    $('#newP').onclick = () => editor();
    $('#admBody').onchange = (e) => {
      const i = e.target.closest('input[data-f]'); if (!i) return; const id = i.closest('tr').dataset.id, list = NX.products(), p = list.find((x) => x.id === id), v = Math.max(0, Math.round(+i.value || 0));
      p[i.dataset.f] = v; saveProducts(list); toast('Guardado: ' + p.name); if (i.dataset.f === 'stock') invView();
    };
    $('#admBody').onclick = (e) => {
      const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
      if (ed) editor(ed.dataset.edit);
      if (del && confirm('¿Eliminar este artículo del catálogo?')) { saveProducts(NX.products().filter((p) => p.id !== del.dataset.del)); invView(); toast('Artículo eliminado'); }
    };
  }
  const ART = { Celulares: 'phone', Laptops: 'laptop', Tablets: 'tablet', Audio: 'headphones', Monitores: 'monitor', Periféricos: 'mouse', Relojes: 'watch' };
  function shrink(file, cb) {
    const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const m = 640, k = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', 0.82)); }; im.onerror = () => toast('No se pudo leer la imagen'); im.src = fr.result; }; fr.readAsDataURL(file);
  }
  function editor(id) {
    const list = NX.products(), p = id ? list.find((x) => x.id === id) : { name: '', brand: '', cat: 'Celulares', price: 0, stock: 0, desc: '', img: '' };
    let img = p.img || '';
    NX.openModal(`<div class="mhead"><h3>${id ? 'EDITAR' : 'NUEVO'} ARTÍCULO</h3><button class="x" data-close>✕</button></div>
      <form class="form" id="pf" novalidate>
        <div class="two"><label>Nombre<input name="name" value="${esc(p.name)}" required></label><label>Marca<input name="brand" list="bl" value="${esc(p.brand)}" required><datalist id="bl">${NX.BRANDS.map((b) => `<option>${b}</option>`).join('')}</datalist></label></div>
        <div class="two"><label>Categoría<input name="cat" list="cl" value="${esc(p.cat)}" required><datalist id="cl">${NX.CATEGORIES.map((b) => `<option>${b}</option>`).join('')}</datalist></label><label>Precio (Gs.)<input name="price" type="number" min="0" value="${p.price}" required></label></div>
        <div class="two"><label>Stock<input name="stock" type="number" min="0" value="${p.stock}" required></label><label>Imagen (subir archivo)<input name="file" type="file" accept="image/*"></label></div>
        <label>…o URL de imagen<input name="url" placeholder="https://…" value="${img.startsWith('http') ? esc(img) : ''}"></label>
        <label>Descripción<textarea name="desc" rows="3">${esc(p.desc || '')}</textarea></label>
        <div class="row"><img id="pv" alt="" style="width:90px;height:90px;border-radius:12px;object-fit:cover" src="${esc(NX.productImg({ ...p, img }))}"><button type="button" class="btn btn-ghost btn-sm" id="noImg">Usar ilustración por defecto</button></div>
        <div class="err" id="pe"></div><button class="btn btn-red btn-block">Guardar</button></form>`);
    const f = $('#pf'), pv = $('#pv');
    f.file.onchange = () => f.file.files[0] && shrink(f.file.files[0], (d) => { img = d; f.url.value = ''; pv.src = d; });
    f.url.onchange = () => { img = f.url.value.trim(); pv.src = img || NX.productArt(ART[f.cat.value] || 'phone', f.brand.value); };
    $('#noImg').onclick = () => { img = ''; f.url.value = ''; pv.src = NX.productArt(ART[f.cat.value] || p.art || 'phone', f.brand.value); };
    f.onsubmit = (e) => {
      e.preventDefault(); const v = Object.fromEntries(new FormData(f));
      if (!v.name.trim() || !v.brand.trim() || !v.cat.trim()) return ($('#pe').textContent = 'Completá nombre, marca y categoría.');
      if (!(+v.price > 0)) return ($('#pe').textContent = 'El precio debe ser mayor a 0.');
      const data = { name: v.name.trim(), brand: v.brand.trim(), cat: v.cat.trim(), price: Math.round(+v.price), stock: Math.max(0, Math.round(+v.stock || 0)), desc: v.desc.trim(), img, art: (id && p.art) || ART[v.cat.trim()] || 'phone' };
      const ps = NX.products();
      if (id) Object.assign(ps.find((x) => x.id === id), data); else ps.unshift({ id: 'p' + Date.now().toString(36), ...data });
      saveProducts(ps); NX.closeModal(); invView(); toast('Artículo guardado');
    };
  }

  /* ---------- pedidos ---------- */
  function ordView() {
    const os = store.get('orders', []).slice().sort((a, b) => b.date - a.date).slice(0, 80);
    $('#admBody').innerHTML = `<div class="panel"><h3>Últimos pedidos (${os.length})</h3><div class="tbl-wrap"><table><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody>
      ${os.map((o) => `<tr data-id="${o.id}"><td><b>${o.id}</b></td><td>${new Date(o.date).toLocaleDateString('es-PY')}</td><td>${esc(o.customer || '')}</td><td>${fmt(o.total)}</td>
        <td><select data-st>${['Pendiente', 'Enviado', 'Entregado', 'Cancelado'].map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td><td><button class="btn btn-ghost btn-sm" data-view="${o.id}">Ver</button></td></tr>`).join('')}</tbody></table></div></div>`;
    $('#admBody').onchange = (e) => { const s = e.target.closest('[data-st]'); if (!s) return; const all = store.get('orders', []), o = all.find((x) => x.id === s.closest('tr').dataset.id); o.status = s.value; store.set('orders', all); toast(o.id + ' → ' + o.status); };
    $('#admBody').onclick = (e) => {
      const b = e.target.closest('[data-view]'); if (!b) return; const o = store.get('orders', []).find((x) => x.id === b.dataset.view), d = o.delivery, bl = o.billing;
      NX.openModal(`<div class="mhead"><h3>${o.id}</h3><button class="x" data-close>✕</button></div><div class="summary">
        <div><b>Entrega (${esc(d.type)})</b><br>${esc(d.calle)} ${esc(d.nro)}${d.piso ? ', ' + esc(d.piso) : ''} · ${esc(d.barrio)}, ${esc(d.ciudad)} (${esc(d.depto)})<br>Tel: ${esc(d.tel)}${d.ref ? '<br>Ref: ' + esc(d.ref) : ''}</div>
        <div><b>Factura</b><br>RUC ${esc(bl.ruc)} · ${esc(bl.razon)}</div><div><b>Pago</b><br>${esc(o.pay.brand)} •••• ${esc(o.pay.last4)}</div>
        <div><b>Artículos</b><br>${o.items.map((i) => `${i.qty} × ${esc(i.name)} — ${fmt(i.price * i.qty)}`).join('<br>')}</div>
        <div class="row"><span>Envío ${o.shipping ? fmt(o.shipping) : 'gratis'}</span><b class="total">${fmt(o.total)}</b></div></div>`);
    };
  }
})();

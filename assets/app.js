/* NEXUSTECH · tienda (cuentas, carrito, checkout, transiciones).
   Sin backend: los datos viven en localStorage del navegador (proyecto demostrativo). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = (n) => 'Gs. ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('nx_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('nx_' + k, JSON.stringify(v)); return true; } catch (e) { toast('No hay espacio para guardar (imagen muy pesada)'); return false; } }
  };
  const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const NXs = (window.NX = window.NX || {});
  Object.assign(NXs, { $, $$, fmt, esc, store });

  /* ---------------- datos ---------------- */
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function seedDemo() {
    if (store.get('seeded_v1')) return;
    const r = rng(2012), now = Date.now(), start = new Date(2024, 0, 1).getTime(), DAY = 864e5;
    const names = ['Lucía', 'Carlos', 'Mariana', 'Diego', 'Sofía', 'Andrés', 'Valentina', 'Fabián', 'Camila', 'Gustavo', 'Rocío', 'Julián', 'Natalia', 'Rodrigo', 'Abril', 'Leandro'];
    const last = ['Benítez', 'González', 'Villalba', 'Ortiz', 'Ayala', 'Báez', 'Giménez', 'Acosta', 'Duarte', 'Cabrera', 'Rojas', 'Franco'];
    const prods = NXs.PRODUCTS, users = [], orders = [];
    for (let i = 0; i < 380; i++) {
      const created = start + (now - 2 * DAY - start) * Math.pow(r(), 0.55);
      const u = { id: 'u' + i, name: names[(r() * names.length) | 0] + ' ' + last[(r() * last.length) | 0], email: 'cliente' + i + '@demo.py', provider: 'demo', createdAt: Math.round(created), seed: true };
      if (r() < 0.2) { const d = created + (now - created) * (0.15 + r() * 0.85); if (d < now - DAY / 2) u.deletedAt = Math.round(d); }
      users.push(u);
    }
    const depts = ['Asunción', 'Central', 'Alto Paraná', 'Itapúa'];
    for (let i = 0; i < 1250; i++) {
      const u = users[(Math.pow(r(), 0.8) * users.length) | 0];
      const end = u.deletedAt || now; if (end - u.createdAt < DAY) continue;
      const date = Math.round(u.createdAt + (end - u.createdAt) * Math.pow(r(), 0.7));
      const items = []; const n = 1 + ((r() * 2.4) | 0);
      for (let k = 0; k < n; k++) { const p = prods[(r() * prods.length) | 0]; items.push({ id: p.id, name: p.name, qty: 1 + ((r() * 1.6) | 0), price: p.price }); }
      const sub = items.reduce((a, b) => a + b.price * b.qty, 0), ship = sub > 1000000 ? 0 : 35000;
      orders.push({ id: 'NX-' + String(100000 + i), userId: u.id, customer: u.name, date, items, subtotal: sub, shipping: ship, total: sub + ship,
        status: now - date > 6 * DAY ? 'Entregado' : ['Pendiente', 'Enviado'][(r() * 2) | 0], seed: true,
        delivery: { type: ['Casa', 'Departamento', 'Oficina'][(r() * 3) | 0], calle: 'Av. Mcal. López', nro: String(100 + ((r() * 900) | 0)), barrio: 'Centro', ciudad: depts[(r() * 4) | 0], depto: depts[(r() * 4) | 0], tel: '0981 000 000', ref: '' },
        billing: { ruc: String(80000000 + ((r() * 9999999) | 0)) + '-' + ((r() * 9) | 0), razon: u.name }, pay: { brand: 'Visa', last4: String(1000 + ((r() * 8999) | 0)) } });
    }
    orders.sort((a, b) => a.date - b.date);
    store.set('users', users); store.set('orders', orders); store.set('seeded_v1', 1);
  }
  if (!store.get('products')) store.set('products', NXs.PRODUCTS.map((p) => ({ ...p })));
  seedDemo();
  const products = () => store.get('products', []);
  const productImg = (p) => p.img || NXs.productArt(p.art || 'phone', p.brand);
  Object.assign(NXs, { products, productImg, sha });

  /* ---------------- UI base ---------------- */
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3400); }
  NXs.toast = toast;
  const overlay = $('#overlay'), modal = $('#modal'), mbox = $('#modalBox'), drawer = $('#cartDrawer');
  function openModal(html, small) { mbox.className = 'modal-box' + (small ? ' sm' : ''); mbox.innerHTML = html; modal.classList.add('on'); overlay.classList.add('on'); document.body.classList.add('locked'); closeDrawer(true); observe(); }
  function closeModal() { modal.classList.remove('on'); if (!drawer.classList.contains('on')) { overlay.classList.remove('on'); document.body.classList.remove('locked'); } }
  function openDrawer() { renderCart(); drawer.classList.add('on'); overlay.classList.add('on'); document.body.classList.add('locked'); }
  function closeDrawer(keep) { drawer.classList.remove('on'); if (!keep && !modal.classList.contains('on')) { overlay.classList.remove('on'); document.body.classList.remove('locked'); } }
  overlay.addEventListener('click', () => { closeModal(); closeDrawer(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeDrawer(); } });
  Object.assign(NXs, { openModal, closeModal });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });

  /* reveal + efectos */
  let io;
  function observe() {
    if (!io) io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.15 });
    $$('.reveal:not(.in)').forEach((el, i) => { el.style.setProperty('--d', (i % 4) * 0.08 + 's'); io.observe(el); });
  }
  NXs.observe = observe;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.btn'); if (!b) return;
    const r = b.getBoundingClientRect(), s = document.createElement('span'), d = Math.max(r.width, r.height);
    s.className = 'rip'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 700);
  });
  const glow = $('.cursor-glow');
  addEventListener('pointermove', (e) => {
    glow.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
    const m = e.target.closest && e.target.closest('.magnetic');
    $$('.magnetic').forEach((b) => { if (b !== m) b.style.transform = ''; });
    if (m) { const r = m.getBoundingClientRect(); m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`; }
    const c = e.target.closest && e.target.closest('.card');
    if (c) { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = `rotateY(${(x - 0.5) * 14}deg) rotateX(${(0.5 - y) * 14}deg) translateZ(14px)`; c.style.setProperty('--gx', x * 100 + '%'); c.style.setProperty('--gy', y * 100 + '%'); }
  });
  document.addEventListener('pointerout', (e) => { const c = e.target.closest && e.target.closest('.card'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });
  // título hero por letras
  $('#heroTitle').innerHTML = 'NEXUSTECH'.split('').map((ch, i) => `<span class="${i >= 5 ? 'r' : ''}" style="--i:${i}">${ch}</span>`).join('');
  $('#year').textContent = new Date().getFullYear();
  // nav
  let lastY = 0;
  addEventListener('scroll', () => { const y = scrollY; $('#nav').classList.toggle('solid', y > 60); lastY = y; }, { passive: true });
  $('#burger').addEventListener('click', () => { $('#burger').classList.toggle('on'); $('#navLinks').classList.toggle('on'); });

  /* ---------------- ruteo con transición ---------------- */
  const curtain = $('#curtain');
  let busy = false;
  function show(view, after) {
    if (busy) return; busy = true;
    const cur = !$('#view-admin').classList.contains('hidden') ? 'admin' : 'store';
    const go = () => {
      $('#view-store').classList.toggle('hidden', view !== 'store'); $('#view-admin').classList.toggle('hidden', view !== 'admin');
      if (view === 'admin') NXs.renderAdmin(); scrollTo(0, 0); document.body.classList.toggle('is-admin', view === 'admin');
      observe(); if (after) setTimeout(after, 60);
    };
    if (cur === view) { go(); busy = false; return; }
    curtain.classList.add('on');
    setTimeout(() => { go(); curtain.classList.remove('on'); busy = false; }, 750);
  }
  const scrollToId = (id) => { const t = id === 'top' ? document.body : document.getElementById(id); if (t) scrollTo({ top: id === 'top' ? 0 : t.getBoundingClientRect().top + scrollY - 10, behavior: 'smooth' }); };
  document.addEventListener('click', (e) => {
    const s = e.target.closest('[data-scroll]'); if (s) { e.preventDefault(); scrollToId(s.dataset.scroll); return; }
    const a = e.target.closest('[data-route]'); if (!a) return;
    e.preventDefault(); $('#navLinks').classList.remove('on'); $('#burger').classList.remove('on');
    const href = a.getAttribute('href'), goto = a.dataset.goto;
    if (href === '#/admin') { if (isAdmin()) { history.pushState(null, '', '#/admin'); show('admin'); } else adminLogin(); return; }
    history.pushState(null, '', '#/'); show('store', goto && goto !== 'top' ? () => scrollToId(goto) : null);
    if (goto === 'top') setTimeout(() => scrollTo({ top: 0, behavior: 'smooth' }), 800);
  });
  addEventListener('popstate', () => { if (location.hash === '#/admin' && isAdmin()) show('admin'); else show('store'); });

  /* ---------------- sesión ---------------- */
  const isAdmin = () => sessionStorage.getItem('nx_admin') === '1';
  const users = () => store.get('users', []);
  const me = () => { const id = store.get('session'); return id ? users().find((u) => u.id === id && !u.deletedAt) : null; };
  function refreshAccount() { const u = me(); $('#accountLabel').textContent = u ? u.name.split(' ')[0] : 'Ingresar'; }
  Object.assign(NXs, { isAdmin, me });
  $('#btnAccount').addEventListener('click', () => (me() ? accountModal() : authModal()));
  $('#btnCart').addEventListener('click', openDrawer);

  const ICON_APPLE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z"/></svg>';
  const ICON_G = '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.400-.2-2H12v3.800h5.600a4.800 4.800 0 0 1-2.100 3.100v2.600h3.400c2-1.800 3.100-4.500 3.100-7.500Z"/><path fill="#34A853" d="M12 22c2.800 0 5.200-.9 6.900-2.500l-3.400-2.600c-.9.600-2.100 1-3.500 1-2.700 0-5-1.800-5.800-4.300H2.700v2.700A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.200 13.600a6 6 0 0 1 0-3.800V7.100H2.700a10 10 0 0 0 0 9.200l3.500-2.700Z"/><path fill="#EA4335" d="M12 6c1.500 0 2.900.5 4 1.600l3-3A10 10 0 0 0 2.700 7.100l3.500 2.700C7 7.800 9.300 6 12 6Z"/></svg>';

  function authModal(tab = 'login', after) {
    openModal(`<div class="mhead"><h3>TU CUENTA</h3><button class="x" data-close aria-label="Cerrar">✕</button></div>
      <div class="tabs"><button data-t="login" class="${tab === 'login' ? 'on' : ''}">Ingresar</button><button data-t="reg" class="${tab === 'reg' ? 'on' : ''}">Crear cuenta</button></div>
      <form class="form" id="authForm" novalidate>
        ${tab === 'reg' ? '<label>Nombre completo<input name="name" autocomplete="name" required></label>' : ''}
        <label>Correo electrónico<input name="email" type="email" autocomplete="email" required></label>
        <label>Contraseña<input name="pass" type="password" autocomplete="${tab === 'reg' ? 'new-password' : 'current-password'}" minlength="6" required></label>
        <div class="err" id="authErr"></div>
        <button class="btn btn-red btn-block" type="submit">${tab === 'reg' ? 'Crear mi cuenta' : 'Ingresar'}</button>
      </form>
      <div class="sep">o continuá con</div>
      <div class="social"><button class="btn-social" data-social="Google">${ICON_G} Google</button><button class="btn-social apple" data-social="Apple">${ICON_APPLE} Apple</button></div>
      <p class="note" style="margin-top:14px">Demostración: Google y Apple se simulan en este prototipo (el inicio de sesión real requiere credenciales OAuth y un servidor).</p>`, true);
    $$('.tabs button', mbox).forEach((b) => b.addEventListener('click', () => authModal(b.dataset.t, after)));
    $('#authForm').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), err = $('#authErr');
      const email = (f.email || '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return (err.textContent = 'Ingresá un correo válido.');
      if (!f.pass || f.pass.length < 6) return (err.textContent = 'La contraseña debe tener al menos 6 caracteres.');
      const list = users(), hash = await sha(email + ':' + f.pass), found = list.find((u) => u.email === email && !u.deletedAt);
      if (tab === 'reg') {
        if (!f.name || f.name.trim().length < 3) return (err.textContent = 'Ingresá tu nombre completo.');
        if (found) return (err.textContent = 'Ese correo ya tiene una cuenta.');
        const u = { id: 'u' + Date.now(), name: f.name.trim(), email, pass: hash, provider: 'email', createdAt: Date.now() };
        list.push(u); store.set('users', list); loginAs(u, after);
      } else {
        if (!found || found.pass !== hash) return (err.textContent = 'Correo o contraseña incorrectos.');
        loginAs(found, after);
      }
    });
    $$('[data-social]', mbox).forEach((b) => b.addEventListener('click', () => socialModal(b.dataset.social, after)));
  }
  function socialModal(provider, after) {
    openModal(`<div class="mhead"><h3>CONTINUAR CON ${provider.toUpperCase()}</h3><button class="x" data-close>✕</button></div>
      <form class="form" id="socForm" novalidate><label>Tu correo de ${provider}<input name="email" type="email" required></label>
      <label>Tu nombre<input name="name" required></label><div class="err" id="socErr"></div>
      <button class="btn btn-red btn-block">Continuar</button></form><p class="note" style="margin-top:12px">Simulación de ${provider}: no se envía nada a ${provider}.</p>`, true);
    $('#socForm').addEventListener('submit', (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), email = (f.email || '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email) || !f.name.trim()) return ($('#socErr').textContent = 'Completá correo y nombre.');
      const list = users(); let u = list.find((x) => x.email === email && !x.deletedAt);
      if (!u) { u = { id: 'u' + Date.now(), name: f.name.trim(), email, provider: provider.toLowerCase(), createdAt: Date.now() }; list.push(u); store.set('users', list); }
      loginAs(u, after);
    });
  }
  function loginAs(u, after) { store.set('session', u.id); refreshAccount(); closeModal(); toast('Bienvenido/a, ' + u.name.split(' ')[0]); if (after) setTimeout(after, 500); }
  function accountModal() {
    const u = me(), mine = store.get('orders', []).filter((o) => o.userId === u.id).sort((a, b) => b.date - a.date);
    openModal(`<div class="mhead"><h3>MI CUENTA</h3><button class="x" data-close>✕</button></div>
      <div class="summary"><div class="row"><span>${esc(u.name)}</span><span class="pill">${esc(u.provider)}</span></div><div style="color:var(--mut)">${esc(u.email)}</div></div>
      <h3 style="margin:22px 0 10px;font-size:.8rem">MIS PEDIDOS</h3>
      ${mine.length ? mine.map((o) => `<div class="line-item" style="grid-template-columns:1fr auto"><div><b>${o.id}</b><br><small>${new Date(o.date).toLocaleDateString('es-PY')} · ${o.items.length} artículo(s) · ${esc(o.status)}</small></div><b>${fmt(o.total)}</b></div>`).join('') : '<p class="note">Todavía no hiciste pedidos.</p>'}
      <div class="adm-actions" style="margin-top:22px"><button class="btn btn-ghost btn-sm" id="logout">Cerrar sesión</button><button class="btn btn-ghost btn-sm" id="delAcc" style="color:#ff5d73">Eliminar mi cuenta</button></div>`);
    $('#logout').onclick = () => { store.set('session', null); refreshAccount(); closeModal(); toast('Sesión cerrada'); };
    $('#delAcc').onclick = () => { if (!confirm('¿Eliminar tu cuenta definitivamente?')) return; const l = users(); l.find((x) => x.id === u.id).deletedAt = Date.now(); store.set('users', l); store.set('session', null); refreshAccount(); closeModal(); toast('Cuenta eliminada'); };
  }

  function adminLogin() {
    openModal(`<div class="mhead"><h3>ACCESO DUEÑOS</h3><button class="x" data-close>✕</button></div>
      <form class="form" id="admForm" novalidate><label>Usuario<input name="u" autocomplete="username" required></label><label>Contraseña<input name="p" type="password" autocomplete="current-password" required></label>
      <div class="err" id="admErr"></div><button class="btn btn-red btn-block">Entrar al panel</button></form>`, true);
    $('#admForm').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      if ((await sha(f.u + ':' + f.p)) !== NXs.ADMIN_HASH) return ($('#admErr').textContent = 'Usuario o contraseña incorrectos.');
      sessionStorage.setItem('nx_admin', '1'); closeModal(); history.pushState(null, '', '#/admin'); show('admin');
    });
  }
  NXs.logoutAdmin = () => { sessionStorage.removeItem('nx_admin'); history.pushState(null, '', '#/'); show('store'); };

  /* ---------------- catálogo ---------------- */
  const filt = { q: '', cat: 'Todos', brand: 'Todas', sort: 'feat' };
  function chips() {
    const ps = products(), cats = ['Todos', ...new Set(ps.map((p) => p.cat))], brands = ['Todas', ...new Set(ps.map((p) => p.brand))];
    $('#chipsCat').innerHTML = cats.map((c) => `<button class="chip ${filt.cat === c ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    $('#chipsBrand').innerHTML = brands.map((c) => `<button class="chip ${filt.brand === c ? 'on' : ''}" data-brand="${esc(c)}">${esc(c)}</button>`).join('');
  }
  function renderGrid(animate = true) {
    let ps = products().filter((p) => (filt.cat === 'Todos' || p.cat === filt.cat) && (filt.brand === 'Todas' || p.brand === filt.brand) &&
      (!filt.q || (p.name + ' ' + p.brand + ' ' + p.cat).toLowerCase().includes(filt.q.toLowerCase())));
    if (filt.sort === 'asc') ps.sort((a, b) => a.price - b.price); if (filt.sort === 'desc') ps.sort((a, b) => b.price - a.price);
    $('#grid').innerHTML = ps.length ? ps.map((p, i) => `<article class="card ${animate ? 'enter' : ''}" style="--i:${i}" data-id="${p.id}" tabindex="0">
      <span class="tag ${p.stock <= 0 ? 'out' : p.stock <= 5 ? 'low' : ''}" ${p.stock > 5 ? 'hidden' : ''}>${p.stock <= 0 ? 'AGOTADO' : 'ÚLTIMAS ' + p.stock}</span>
      <div class="card-img"><img src="${esc(productImg(p))}" alt="${esc(p.name)}" loading="lazy"></div>
      <div class="card-body"><div class="card-brand">${esc(p.brand)}</div><div class="card-name">${esc(p.name)}</div>
      <div class="card-foot"><span class="price">${fmt(p.price)}</span><button class="btn btn-red btn-sm" data-add="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>Agregar</button></div></div><div class="glare"></div></article>`).join('')
      : '<div class="empty">No encontramos productos con ese filtro.</div>';
  }
  $('#q').addEventListener('input', (e) => { filt.q = e.target.value; renderGrid(false); });
  $('#sort').addEventListener('change', (e) => { filt.sort = e.target.value; renderGrid(); });
  $('#chipsCat').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (b) { filt.cat = b.dataset.cat; chips(); renderGrid(); } });
  $('#chipsBrand').addEventListener('click', (e) => { const b = e.target.closest('[data-brand]'); if (b) { filt.brand = b.dataset.brand; chips(); renderGrid(); } });
  $('#grid').addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]'); if (add) { e.stopPropagation(); addToCart(add.dataset.add); return; }
    const c = e.target.closest('.card'); if (c) detail(c.dataset.id);
  });
  $('#grid').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const c = e.target.closest('.card'); if (c) detail(c.dataset.id); } });
  function detail(id) {
    const p = products().find((x) => x.id === id); if (!p) return;
    openModal(`<div class="mhead"><span class="eyebrow">${esc(p.brand)} · ${esc(p.cat)}</span><button class="x" data-close>✕</button></div>
      <div class="detail"><div class="detail-img" id="dimg"><img src="${esc(productImg(p))}" alt="${esc(p.name)}"></div>
      <div><h3 style="font-size:1.25rem;line-height:1.3;letter-spacing:.04em;margin-bottom:10px">${esc(p.name)}</h3><p style="color:#bcbcc4;margin-bottom:16px">${esc(p.desc || '')}</p>
      <div class="price" style="font-size:1.3rem;margin-bottom:6px">${fmt(p.price)}</div><p class="note" style="margin-bottom:16px">${p.stock > 0 ? p.stock + ' en stock · IVA incluido' : 'Sin stock por el momento'}</p>
      <div class="adm-actions"><button class="btn btn-red" id="dAdd" ${p.stock <= 0 ? 'disabled' : ''}>Agregar al carrito</button><a class="btn btn-ghost" target="_blank" rel="noopener" href="${NXs.WHATSAPP}">Consultar por WhatsApp</a></div></div></div>`);
    $('#dAdd').onclick = () => { addToCart(p.id); closeModal(); };
    const d = $('#dimg'), im = $('img', d);
    d.addEventListener('pointermove', (e) => { const r = d.getBoundingClientRect(); im.style.transform = `rotateY(${((e.clientX - r.left) / r.width - 0.5) * 24}deg) rotateX(${(0.5 - (e.clientY - r.top) / r.height) * 24}deg)`; });
    d.addEventListener('pointerleave', () => (im.style.transform = ''));
  }

  /* ---------------- carrito ---------------- */
  const cart = () => store.get('cart', []);
  function saveCart(c) { store.set('cart', c); const n = c.reduce((a, b) => a + b.qty, 0), el = $('#cartCount'); el.textContent = n; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); if (drawer.classList.contains('on')) renderCart(); }
  function addToCart(id) {
    const p = products().find((x) => x.id === id), c = cart(), l = c.find((x) => x.id === id);
    if (!p || p.stock <= 0) return;
    if (l && l.qty >= p.stock) return toast('No hay más stock de este artículo');
    l ? l.qty++ : c.push({ id, qty: 1 }); saveCart(c); toast('Agregado: ' + p.name);
  }
  function cartLines() { const ps = products(); return cart().map((l) => ({ ...l, p: ps.find((x) => x.id === l.id) })).filter((l) => l.p); }
  const shipCost = (sub) => (sub === 0 || sub >= 1000000 ? 0 : 35000);
  function renderCart() {
    const ls = cartLines(), sub = ls.reduce((a, l) => a + l.p.price * l.qty, 0);
    drawer.innerHTML = `<div class="dr-head"><h3>TU CARRITO</h3><button class="x" id="drClose">✕</button></div>
      <div class="dr-body">${ls.length ? ls.map((l, i) => `<div class="line-item" style="animation-delay:${i * 0.06}s"><img src="${esc(productImg(l.p))}" alt=""><div><b style="font-size:.92rem">${esc(l.p.name)}</b><br><small>${fmt(l.p.price)}</small><br>
        <div class="qty"><button data-q="-1" data-id="${l.id}">−</button><span>${l.qty}</span><button data-q="1" data-id="${l.id}">+</button></div></div><div style="text-align:right"><b>${fmt(l.p.price * l.qty)}</b><br><button class="rm" data-rm="${l.id}">Quitar</button></div></div>`).join('') : '<p class="empty" style="padding:60px 0">Tu carrito está vacío.</p>'}</div>
      <div class="dr-foot"><div class="row"><span>Subtotal</span><b>${fmt(sub)}</b></div><div class="row"><span>Envío</span><b>${shipCost(sub) ? fmt(shipCost(sub)) : 'Gratis'}</b></div>
      <div class="row"><span>Total</span><span class="total">${fmt(sub + shipCost(sub))}</span></div><button class="btn btn-red btn-block" id="goCheckout" ${ls.length ? '' : 'disabled'}>Finalizar compra</button><p class="note">Envío gratis desde Gs. 1.000.000</p></div>`;
    $('#drClose').onclick = () => closeDrawer();
    $('#goCheckout').onclick = () => { closeDrawer(true); me() ? checkout() : authModal('login', checkout); };
  }
  drawer.addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]'), c = cart();
    if (q) { const l = c.find((x) => x.id === q.dataset.id), p = products().find((x) => x.id === q.dataset.id); l.qty += +q.dataset.q; if (l.qty > p.stock) { l.qty = p.stock; toast('Stock máximo alcanzado'); } saveCart(c.filter((x) => x.qty > 0)); }
    if (rm) saveCart(c.filter((x) => x.id !== rm.dataset.rm));
  });

  /* ---------------- checkout: entrega → facturación → pago ---------------- */
  const luhn = (n) => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return n.length >= 13 && s % 10 === 0; };
  const cardBrand = (n) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : 'Tarjeta');
  const ICONS = { Casa: '<path d="M3 11l9-8 9 8v10H3z"/>', Departamento: '<path d="M5 21V3h14v18M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>', Oficina: '<path d="M3 21h18M5 21V8h8v13M13 21V4h6v17M8 12h2M8 16h2"/>' };
  function checkout() {
    const ls = cartLines(); if (!ls.length) return;
    const co = { step: 0, d: { type: 'Casa', calle: '', nro: '', barrio: '', ciudad: '', depto: 'Asunción', ref: '', tel: '' }, b: { ruc: '', razon: '' }, p: { num: '', name: '', exp: '', cvv: '' } };
    const sub = ls.reduce((a, l) => a + l.p.price * l.qty, 0), ship = shipCost(sub), total = sub + ship;
    const draw = () => {
      const stepsHtml = `<div class="steps">${[0, 1, 2].map((i) => `<i class="${i <= co.step ? 'on' : ''}"></i>`).join('')}</div>`;
      let body = '';
      if (co.step === 0) body = `<div class="step form"><h3>¿DÓNDE LO RECIBÍS?</h3><div class="addr-types">${['Casa', 'Departamento', 'Oficina'].map((t) => `<input type="radio" name="type" id="t${t}" value="${t}" ${co.d.type === t ? 'checked' : ''}><label for="t${t}"><svg viewBox="0 0 24 24">${ICONS[t]}</svg>${t}</label>`).join('')}</div>
        <div class="three"><label>Calle / Avenida<input name="calle" value="${esc(co.d.calle)}" required></label><label>Nº<input name="nro" value="${esc(co.d.nro)}" required></label><label>${co.d.type === 'Casa' ? 'Piso/Compl.' : 'Piso / Of. / Dpto.'}<input name="piso" value="${esc(co.d.piso || '')}" ${co.d.type === 'Casa' ? '' : 'required'}></label></div>
        <div class="two"><label>Barrio<input name="barrio" value="${esc(co.d.barrio)}" required></label><label>Ciudad<input name="ciudad" value="${esc(co.d.ciudad)}" required></label></div>
        <div class="two"><label>Departamento<select name="depto">${NXs.DEPARTAMENTOS.map((d) => `<option ${d === co.d.depto ? 'selected' : ''}>${d}</option>`).join('')}</select></label><label>Teléfono / WhatsApp<input name="tel" inputmode="tel" placeholder="0981 123 456" value="${esc(co.d.tel)}" required></label></div>
        <label>Referencia (opcional)<input name="ref" placeholder="Portón negro, frente a la plaza…" value="${esc(co.d.ref)}"></label></div>`;
      if (co.step === 1) body = `<div class="step form"><h3>DATOS PARA LA FACTURA</h3>
        <label>RUC<input name="ruc" inputmode="numeric" placeholder="80012345-6" value="${esc(co.b.ruc)}" required></label>
        <label>Razón Social<input name="razon" placeholder="Nombre o empresa" value="${esc(co.b.razon)}" required></label>
        <p class="note">Emitimos factura legal con estos datos. Verificá que el RUC y la Razón Social coincidan con tu constancia de la SET.</p></div>`;
      if (co.step === 2) body = `<div class="step form"><h3>PAGO CON TARJETA</h3>
        <div class="card-preview"><div class="row"><span id="pvBrand">${cardBrand(co.p.num.replace(/\s/g, ''))}</span><span>●●●</span></div><div class="num" id="pvNum">${esc(co.p.num || '•••• •••• •••• ••••')}</div><div class="meta"><span id="pvName">${esc(co.p.name || 'NOMBRE APELLIDO')}</span><span id="pvExp">${esc(co.p.exp || 'MM/AA')}</span></div></div>
        <label>Número de tarjeta<input name="num" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" maxlength="23" value="${esc(co.p.num)}" required></label>
        <label>Titular<input name="name" autocomplete="cc-name" value="${esc(co.p.name)}" required></label>
        <div class="two"><label>Vencimiento<input name="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5" value="${esc(co.p.exp)}" required></label><label>CVV<input name="cvv" type="password" inputmode="numeric" autocomplete="cc-csc" maxlength="4" value="${esc(co.p.cvv)}" required></label></div>
        <div class="summary"><div class="row"><span>Subtotal</span><span>${fmt(sub)}</span></div><div class="row"><span>Envío</span><span>${ship ? fmt(ship) : 'Gratis'}</span></div><div class="row"><b>Total</b><b class="total">${fmt(total)}</b></div></div>
        <p class="note">Por seguridad solo guardamos la marca y los últimos 4 dígitos. Demostración: no se realiza ningún cobro real.</p></div>`;
      openModal(`<div class="mhead"><h3>FINALIZAR COMPRA</h3><button class="x" data-close>✕</button></div>${stepsHtml}<form id="coForm" novalidate>${body}<div class="err" id="coErr" style="margin-top:10px"></div>
        <div class="adm-actions" style="margin-top:14px;justify-content:space-between">${co.step ? '<button type="button" class="btn btn-ghost" id="coBack">Atrás</button>' : '<span></span>'}<button class="btn btn-red" type="submit">${co.step === 2 ? 'Pagar ' + fmt(total) : 'Continuar'}</button></div></form>`);
      const form = $('#coForm');
      const read = () => Object.fromEntries(new FormData(form));
      $$('input[name=type]', form).forEach((r) => r.addEventListener('change', () => { co.d = { ...co.d, ...read() }; draw(); }));
      if (co.step === 1) form.ruc.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^\d-]/g, ''); });
      if (co.step === 2) {
        form.num.addEventListener('input', (e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 19); e.target.value = v.replace(/(.{4})/g, '$1 ').trim(); $('#pvNum').textContent = e.target.value || '•••• •••• •••• ••••'; $('#pvBrand').textContent = cardBrand(v); });
        form.exp.addEventListener('input', (e) => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); e.target.value = v; $('#pvExp').textContent = v || 'MM/AA'; });
        form.name.addEventListener('input', (e) => { $('#pvName').textContent = e.target.value.toUpperCase() || 'NOMBRE APELLIDO'; });
        form.cvv.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
      }
      const back = $('#coBack'); if (back) back.onclick = () => { collect(read()); co.step--; draw(); };
      form.addEventListener('submit', (e) => {
        e.preventDefault(); const v = read(), err = $('#coErr'); collect(v);
        if (co.step === 0) {
          if ([co.d.calle, co.d.nro, co.d.barrio, co.d.ciudad].some((x) => !String(x).trim())) return (err.textContent = 'Completá calle, número, barrio y ciudad.');
          if (co.d.type !== 'Casa' && !String(co.d.piso || '').trim()) return (err.textContent = 'Indicá piso / oficina / departamento.');
          if (!/^\+?[\d\s-]{8,16}$/.test(co.d.tel)) return (err.textContent = 'Ingresá un teléfono válido.');
        }
        if (co.step === 1) {
          if (!/^\d{5,9}-\d$/.test(co.b.ruc.trim())) return (err.textContent = 'RUC inválido. Formato: 80012345-6');
          if (co.b.razon.trim().length < 3) return (err.textContent = 'Ingresá la Razón Social.');
        }
        if (co.step === 2) {
          const n = co.p.num.replace(/\s/g, ''), m = co.p.exp.match(/^(\d{2})\/(\d{2})$/);
          if (!luhn(n)) return (err.textContent = 'El número de tarjeta no es válido.');
          if (co.p.name.trim().length < 3) return (err.textContent = 'Ingresá el nombre del titular.');
          const now = new Date();
          if (!m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1], 1) <= now) return (err.textContent = 'La tarjeta está vencida o la fecha es inválida.');
          if (!/^\d{3,4}$/.test(co.p.cvv)) return (err.textContent = 'CVV inválido.');
          return place(n);
        }
        co.step++; draw();
      });
    };
    const collect = (v) => {
      if (co.step === 0) co.d = { ...co.d, type: v.type || co.d.type, calle: v.calle ?? '', nro: v.nro ?? '', piso: v.piso ?? '', barrio: v.barrio ?? '', ciudad: v.ciudad ?? '', depto: v.depto || co.d.depto, tel: v.tel ?? '', ref: v.ref ?? '' };
      if (co.step === 1) co.b = { ruc: v.ruc ?? '', razon: v.razon ?? '' };
      if (co.step === 2) co.p = { num: v.num ?? '', name: v.name ?? '', exp: v.exp ?? '', cvv: v.cvv ?? '' };
    };
    function place(n) {
      const ps = products(), cur = cartLines();
      for (const l of cur) { const p = ps.find((x) => x.id === l.id); if (!p || p.stock < l.qty) { closeModal(); toast('Se agotó stock de: ' + l.p.name); saveCart(cart().filter((x) => x.id !== l.id)); return; } }
      cur.forEach((l) => { ps.find((x) => x.id === l.id).stock -= l.qty; });
      const orders = store.get('orders', []), u = me();
      const o = { id: 'NX-' + String(100000 + orders.length), userId: u.id, customer: u.name, date: Date.now(), status: 'Pendiente',
        items: cur.map((l) => ({ id: l.id, name: l.p.name, qty: l.qty, price: l.p.price })), subtotal: sub, shipping: ship, total,
        delivery: { ...co.d }, billing: { ...co.b }, pay: { brand: cardBrand(n), last4: n.slice(-4) } };   // nunca se guarda el número completo ni el CVV
      orders.push(o); store.set('orders', orders); store.set('products', ps); saveCart([]); renderGrid(false);
      openModal(`<div class="ok"><svg class="tick" viewBox="0 0 90 90"><circle cx="45" cy="45" r="41"/><path d="M27 46l12 12 25-27"/></svg>
        <h3>¡PEDIDO CONFIRMADO!</h3><p style="margin:12px 0;color:#bcbcc4">Pedido <b>${o.id}</b> · ${fmt(o.total)}<br>Lo enviamos a ${esc(o.delivery.calle)} ${esc(o.delivery.nro)}, ${esc(o.delivery.ciudad)} (${esc(o.delivery.type)}).<br>Factura a nombre de ${esc(o.billing.razon)} · RUC ${esc(o.billing.ruc)}.</p>
        <div class="adm-actions" style="justify-content:center"><a class="btn btn-red" target="_blank" rel="noopener" href="${NXs.WHATSAPP}">Avisarnos por WhatsApp</a><button class="btn btn-ghost" data-close>Seguir comprando</button></div></div>`);
    }
    draw();
  }

  /* ---------------- arranque ---------------- */
  chips(); renderGrid(false); saveCart(cart()); refreshAccount();
  NXs.refreshShop = () => { chips(); renderGrid(false); };
  setTimeout(() => { $('#loader').classList.add('done'); observe(); $$('.hero .reveal').forEach((e) => e.classList.add('in')); }, 1500);
  if (location.hash === '#/admin') { if (isAdmin()) show('admin'); else { history.replaceState(null, '', '#/'); } }
})();

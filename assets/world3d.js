/* NEXUSTECH · mundo 3D guiado por scroll (Three.js). La cámara vuela a través de la escena. */
(function () {
  const canvas = document.getElementById('bg');
  if (!window.THREE || !canvas) { document.body.classList.add('no-webgl'); return; }
  const T = THREE, RED = 0xff1f3d, L = 64;           // L = largo del recorrido de la cámara
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch (e) { document.body.classList.add('no-webgl'); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x050506, 0.034);
  const camera = new T.PerspectiveCamera(55, 1, 0.1, 220);
  scene.add(new T.AmbientLight(0xffffff, 0.35));
  const key = new T.PointLight(RED, 2.2, 40); key.position.set(0, 4, 2); scene.add(key);
  const rim = new T.PointLight(0xffffff, 0.8, 40); rim.position.set(-4, -2, 4); scene.add(rim);

  const dark = new T.MeshStandardMaterial({ color: 0x15151a, metalness: 0.9, roughness: 0.28 });
  const glow = new T.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: 1.6 });
  const lineMat = () => new T.LineBasicMaterial({ color: RED, transparent: true, opacity: 0.7 });
  const edged = (mesh) => { mesh.add(new T.LineSegments(new T.EdgesGeometry(mesh.geometry), lineMat())); return mesh; };

  function screenTex(label) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 256, 256);
    g.addColorStop(0, '#ff1f3d'); g.addColorStop(0.6, '#4a000d'); g.addColorStop(1, '#0a0204');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    x.fillStyle = 'rgba(255,255,255,.9)'; x.font = 'bold 54px Arial'; x.textAlign = 'center'; x.fillText(label, 128, 140);
    return new T.CanvasTexture(c);
  }
  const screenMat = (l) => new T.MeshBasicMaterial({ map: screenTex(l) });

  /* ---- modelos hechos con primitivas ---- */
  function phone() {
    const g = new T.Group();
    g.add(edged(new T.Mesh(new T.BoxGeometry(1.1, 2.2, 0.12), dark)));
    const s = new T.Mesh(new T.PlaneGeometry(0.98, 2.08), screenMat('N')); s.position.z = 0.062; g.add(s);
    const cam = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.05, 24), glow); cam.rotation.x = Math.PI / 2; cam.position.set(0.28, 0.82, -0.08); g.add(cam);
    return g;
  }
  function laptop() {
    const g = new T.Group();
    const base = edged(new T.Mesh(new T.BoxGeometry(3, 0.1, 2), dark)); g.add(base);
    const hinge = new T.Group(); hinge.position.set(0, 0.05, -1); hinge.rotation.x = -0.28; g.add(hinge);
    const lid = edged(new T.Mesh(new T.BoxGeometry(3, 2, 0.08), dark)); lid.position.y = 1; hinge.add(lid);
    const s = new T.Mesh(new T.PlaneGeometry(2.8, 1.8), screenMat('NEXUS')); s.position.set(0, 1, 0.045); hinge.add(s);
    const pad = new T.Mesh(new T.PlaneGeometry(1, 0.6), new T.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.25 }));
    pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.055, 0.5); g.add(pad);
    g.scale.setScalar(0.85); return g;
  }
  function headphones() {
    const g = new T.Group();
    const arc = new T.Mesh(new T.TorusGeometry(1.15, 0.1, 16, 64, Math.PI), dark); g.add(arc);
    g.add(new T.Mesh(new T.TorusGeometry(1.15, 0.025, 8, 64, Math.PI), glow));
    [-1.15, 1.15].forEach((x) => {
      const cup = edged(new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.45, 32), dark)); cup.rotation.z = Math.PI / 2; cup.position.set(x, -0.05, 0); g.add(cup);
      const ring = new T.Mesh(new T.TorusGeometry(0.34, 0.04, 12, 32), glow); ring.rotation.y = Math.PI / 2; ring.position.set(x + (x > 0 ? 0.23 : -0.23), -0.05, 0); g.add(ring);
    });
    return g;
  }
  function watch() {
    const g = new T.Group();
    g.add(edged(new T.Mesh(new T.BoxGeometry(1.1, 1.3, 0.34), dark)));
    const s = new T.Mesh(new T.PlaneGeometry(0.95, 1.15), screenMat('12:00')); s.position.z = 0.175; g.add(s);
    [1, -1].forEach((d) => { const b = edged(new T.Mesh(new T.BoxGeometry(0.8, 1.2, 0.12), dark)); b.position.y = d * 1.2; g.add(b); });
    const crown = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.16, 16), glow); crown.rotation.z = Math.PI / 2; crown.position.set(0.62, 0.2, 0); g.add(crown);
    return g;
  }

  /* ---- composición: objetos a lo largo del recorrido ---- */
  const items = [];
  const heroKnot = edged(new T.Mesh(new T.TorusKnotGeometry(1.5, 0.42, 220, 20, 2, 3), new T.MeshStandardMaterial({ color: 0x0c0c0f, metalness: 1, roughness: 0.18 })));
  heroKnot.position.set(0, 0.2, -5); scene.add(heroKnot);
  const hero2 = new T.Mesh(new T.IcosahedronGeometry(2.6, 1), new T.MeshBasicMaterial({ color: RED, wireframe: true, transparent: true, opacity: 0.12 }));
  hero2.position.copy(heroKnot.position); scene.add(hero2);

  [[phone, 1], [laptop, 2], [headphones, 3], [watch, 4]].forEach(([fn, i], k) => {
    const o = fn(); const side = k % 2 === 0 ? 1 : -1;
    o.userData = { base: new T.Vector3(side * 2.6, 0, -(i / 4) * L - 6), phase: k * 1.7, spin: side, side };
    o.position.copy(o.userData.base); o.scale.multiplyScalar(1.15); scene.add(o); items.push(o);
  });

  // anillos tipo túnel
  const rings = [];
  for (let i = 0; i < 18; i++) {
    const r = new T.Mesh(new T.TorusGeometry(5.5 + (i % 3) * 0.6, 0.02, 8, 90), new T.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.35 }));
    r.position.set(0, 0, -i * 4.2 - 2); scene.add(r); rings.push(r);
  }
  const grid = new T.GridHelper(220, 110, RED, 0x3a0710); grid.position.set(0, -3.6, -L / 2); grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);

  // partículas
  const N = 900, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 36; pos[i * 3 + 1] = (Math.random() - 0.5) * 20; pos[i * 3 + 2] = -Math.random() * (L + 30) + 10; }
  const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
  const pts = new T.Points(pg, new T.PointsMaterial({ color: 0xff4a63, size: 0.06, transparent: true, opacity: 0.8 }));
  scene.add(pts);

  /* ---- loop ---- */
  let prog = 0, target = 0, mx = 0, my = 0, smx = 0, smy = 0, storyEnd = 1;
  const story = document.getElementById('story');
  function measure() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    storyEnd = Math.max(1, (story ? story.offsetTop + story.offsetHeight : h * 5) - h);
    const narrow = w < 800;
    items.forEach((o) => { o.userData.base.x = (narrow ? 0.9 : 2.6) * o.userData.side; });
  }
  addEventListener('resize', measure); measure();
  addEventListener('scroll', () => { target = Math.min(1, scrollY / storyEnd); }, { passive: true });
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  const clock = new T.Clock();
  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    prog += (target - prog) * 0.06; smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;
    camera.position.set(Math.sin(prog * 9) * 1.1 + smx * 1.6, Math.cos(prog * 7) * 0.5 - smy * 1.0, 6 - prog * L);
    camera.rotation.set(-smy * 0.12, -smx * 0.18 + Math.sin(prog * 9) * 0.04, Math.sin(prog * 5) * 0.03);
    key.position.set(camera.position.x, camera.position.y + 3, camera.position.z - 3);
    heroKnot.rotation.x = t * 0.25 + prog * 3; heroKnot.rotation.y = t * 0.35; hero2.rotation.y = -t * 0.12; hero2.rotation.x = t * 0.07;
    items.forEach((o, i) => {
      const u = o.userData;
      o.position.set(u.base.x, Math.sin(t * 1.1 + u.phase) * 0.25, u.base.z);
      const d = Math.abs(camera.position.z - u.base.z);   // más cerca = gira más lento y se alinea
      o.rotation.y = u.spin * (t * 0.5) * Math.min(1, d / 14) + (1 - Math.min(1, d / 14)) * -0.35 * u.spin;
      o.rotation.x = Math.sin(t * 0.6 + i) * 0.12;
    });
    rings.forEach((r, i) => { r.rotation.z = t * 0.12 * (i % 2 ? 1 : -1) + i; r.material.opacity = 0.22 + 0.15 * Math.sin(t * 1.5 + i); });
    pts.rotation.z = t * 0.01;
    renderer.render(scene, camera);
  }
  frame();
})();

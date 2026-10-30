/* Procedural desktop printer: layers of a tiny desk buddy appear, then the model turns. */
(function () {
  const host = document.querySelector(".hero-canvas");
  if (!host || !window.THREE) {
    if (host) host.classList.add("no-webgl");
    return;
  }

  const canvas = host.querySelector("canvas");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    host.classList.add("no-webgl");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(3.2, 2.4, 4.2);
  camera.lookAt(0, 0.4, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const key = new THREE.DirectionalLight(0xfff4e5, 1.3);
  key.position.set(3, 6, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0xff4d8d, 8, 12);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);
  const cyan = new THREE.PointLight(0x2ee6d6, 6, 12);
  cyan.position.set(3, 0.4, 2);
  scene.add(cyan);

  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.08, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x1c2838, metalness: 0.4, roughness: 0.35 })
  );
  bed.position.y = -0.7;
  scene.add(bed);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd7dee8, metalness: 0.55, roughness: 0.28 });
  function strut(w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
  }
  strut(0.08, 2.3, 0.08, -1.7, 0.4, -1.2);
  strut(0.08, 2.3, 0.08, 1.7, 0.4, -1.2);
  strut(3.5, 0.08, 0.08, 0, 1.5, -1.2);

  const colors = [0x2ee6d6, 0xff4d8d, 0xffb020, 0xb6ef4a, 0x8d7bff];
  const model = new THREE.Group();
  scene.add(model);
  const layers = [];
  const specs = [
    [1.15, 0.1, 0.72, 0],
    [0.95, 0.1, 0.62, 0.05],
    [0.78, 0.1, 0.5, 0.08],
    [0.62, 0.1, 0.42, 0.1],
    [0.5, 0.12, 0.36, 0.12],
    [0.36, 0.14, 0.36, 0.08],
    [0.28, 0.16, 0.28, 0],
  ];
  specs.forEach(function (spec, index) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(spec[0], spec[1], spec[2]),
      new THREE.MeshStandardMaterial({ color: colors[index % colors.length], roughness: 0.45, metalness: 0.05 })
    );
    mesh.position.y = -0.6 + index * 0.12;
    mesh.scale.y = 0.001;
    model.add(mesh);
    layers.push(mesh);
  });

  const nozzle = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0xf4f7fb, metalness: 0.8, roughness: 0.2 })
  );
  nozzle.position.set(0, 1.15, 0);
  scene.add(nozzle);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let started = performance.now();

  function resize() {
    const width = host.clientWidth || 640;
    const height = 420;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  function frame(now) {
    const t = reduce ? 8 : (now - started) / 1000;
    const build = Math.min(layers.length, t * 1.15);
    layers.forEach(function (mesh, index) {
      const local = Math.min(1, Math.max(0, build - index));
      mesh.scale.y = 0.001 + local * 0.999;
    });
    const spin = build >= layers.length ? (t - layers.length) * 0.45 : 0;
    model.rotation.y = reduce ? 0.6 : spin;
    nozzle.position.x = Math.sin(t * 2.2) * 0.55;
    nozzle.position.z = Math.cos(t * 1.7) * 0.35;
    nozzle.position.y = 1.2 - Math.min(build, layers.length) * 0.08;
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (reduce) frame(started + 9000);
})();

import * as THREE from "three";

export function initBackground() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const isLowEnd = cores <= 4 || memory <= 4 || (window.innerWidth < 768 && cores <= 6);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isLowEnd,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1.25 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 18;

  const world = new THREE.Group();
  scene.add(world);

  const COUNT = isLowEnd ? 400 : 1200;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const cA = new THREE.Color("#6366f1"); // indigo
  const cB = new THREE.Color("#a855f7"); // violet
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 38;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 22;
    const c = Math.random() < 0.5 ? cA : cB;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: isLowEnd ? 0.1 : 0.085,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const particles = new THREE.Points(geometry, material);
  world.add(particles);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.28 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(9, 0.018, 8, isLowEnd ? 48 : 110), ringMat);
  ring1.rotation.x = Math.PI / 2.6;
  world.add(ring1);

  const ring2 = !isLowEnd
    ? new THREE.Mesh(new THREE.TorusGeometry(12.5, 0.012, 8, 100), ringMat.clone())
    : null;
  if (ring2) {
    ring2.material.opacity = 0.16;
    ring2.rotation.x = Math.PI / 1.9;
    ring2.rotation.y = 0.4;
    world.add(ring2);
  }

  let crystal = null;
  if (!isLowEnd) {
    crystal = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6, 1),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.1 })
    );
    crystal.position.set(11.5, 3.5, -4);
    world.add(crystal);
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollT = 0; // 0..1 theo toàn trang
  const isMobile = window.matchMedia("(max-width: 900px)").matches || "ontouchstart" in window;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setPointer(clientX, clientY) {
    pointer.tx = (clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -(clientY / window.innerHeight) * 2 + 1;
  }

  function setDeviceTilt(event) {
    if (event.gamma === null || event.beta === null) return;
    const gamma = clamp(event.gamma / 35, -1, 1);
    const beta = clamp((event.beta - 30) / 50, -1, 1);
    pointer.tx = gamma * 1.3;
    pointer.ty = -beta * 1.1;
  }

  if (isMobile) {
    const enableMotion = () => {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission()
          .then((state) => {
            if (state === "granted") {
              window.addEventListener("deviceorientation", setDeviceTilt, { passive: true });
            }
          })
          .catch(() => {});
      } else {
        window.addEventListener("deviceorientation", setDeviceTilt, { passive: true });
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    let touchDragging = false;

    window.addEventListener("touchstart", (e) => {
      if (e.touches[0]) {
        touchDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
      enableMotion();
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!touchDragging || !e.touches[0]) return;
      const dx = (e.touches[0].clientX - touchStartX) / window.innerWidth;
      const dy = (e.touches[0].clientY - touchStartY) / window.innerHeight;
      pointer.tx = clamp(dx * 2.6, -1.2, 1.2);
      pointer.ty = clamp(-dy * 2.6, -1.2, 1.2);
    }, { passive: true });

    window.addEventListener("touchend", () => {
      touchDragging = false;
    }, { passive: true });
  }

  window.addEventListener("pointermove", (e) => setPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchmove", (e) => {
    if (!isMobile && e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  function updateScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollT = max > 0 ? window.scrollY / max : 0;
  }
  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  const INTERACTIVE = "a, button, input, textarea, select, label, [contenteditable]";
  let dragging = false;
  let lastX = 0;
  let userSpin = 0;
  let spinV = 0;
  let pulse = 0;

  window.addEventListener("pointerdown", (e) => {
    if (reducedMotion) return;
    if (e.target.closest && e.target.closest(INTERACTIVE)) return;
    dragging = true;
    lastX = e.clientX;
    pulse = 1;
  }, { passive: true });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    spinV += (e.clientX - lastX) * 0.0004;
    lastX = e.clientX;
  }, { passive: true });
  window.addEventListener("pointerup", () => { dragging = false; }, { passive: true });
  window.addEventListener("pointercancel", () => { dragging = false; }, { passive: true });

  const themeWatcher = new MutationObserver(() => {
    const light = document.documentElement.dataset.theme === "light";
    material.color.set(light ? 0x9aa3ff : 0xffffff);
    material.opacity = light ? 0.55 : 0.8;
    ringMat.color.set(light ? 0x4f46e5 : 0x6366f1);
    if (ring2) ring2.material.color.set(light ? 0x7c3aed : 0x6366f1);
    if (crystal) crystal.material.color.set(light ? 0x7c3aed : 0xa855f7);
    if (reducedMotion) renderer.render(scene, camera); // vẽ lại tĩnh
  });
  themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (reducedMotion) renderer.render(scene, camera);
  }
  window.addEventListener("resize", onResize, { passive: true });
  onResize();

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    running = false;
  });

  let running = true;
  document.addEventListener("visibilitychange", () => {
    const wasRunning = running;
    running = !document.hidden;
    if (running && !wasRunning && !reducedMotion) requestAnimationFrame(animate);
  });

  const clock = new THREE.Clock();

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;

    userSpin += spinV;
    spinV *= 0.94;
    pulse *= 0.9;
    world.scale.setScalar(1 + pulse * 0.05);
    world.rotation.y += (pointer.x * 0.18 - world.rotation.y) * 0.03;
    world.rotation.x += (pointer.y * 0.12 - world.rotation.x) * 0.03;

    particles.rotation.y = t * 0.025 + pointer.x * 0.22 + scrollT * 0.6 + userSpin;
    particles.rotation.x = pointer.y * 0.14;
    ring1.rotation.z = t * 0.06 + scrollT * 0.4;
    if (ring2) ring2.rotation.z = -t * 0.04;
    if (crystal) {
      crystal.rotation.x = t * 0.15 + pointer.y * 0.35;
      crystal.rotation.y = t * 0.1 + pointer.x * 0.35;
      crystal.position.y = 2.5 + Math.sin(t * 0.6) * 0.5;
    }

    camera.position.x += (pointer.x * 1.7 - camera.position.x) * 0.03;
    camera.position.y += (pointer.y * 1.1 + scrollT * 2.4 - camera.position.y) * 0.03;
    camera.lookAt(0, scrollT * 1.2, 0);

    renderer.render(scene, camera);
  }

  if (reducedMotion) {
    renderer.render(scene, camera);
  } else {
    animate();
  }
}

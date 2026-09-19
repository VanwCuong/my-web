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
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1.25 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 20;

  const world = new THREE.Group();
  scene.add(world);

  // 1. Interactive 3D Particle Constellation (1600 Particles)
  const COUNT = isLowEnd ? 500 : 1600;
  const positions = new Float32Array(COUNT * 3);
  const anchors = new Float32Array(COUNT * 3);
  const velocities = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);

  const colorA = new THREE.Color("#3b82f6"); // Electric Blue
  const colorB = new THREE.Color("#06b6d4"); // Cyan
  const colorC = new THREE.Color("#8b5cf6"); // Violet

  for (let i = 0; i < COUNT; i++) {
    const idx = i * 3;
    const px = (Math.random() - 0.5) * 45;
    const py = (Math.random() - 0.5) * 32;
    const pz = (Math.random() - 0.5) * 25;

    positions[idx] = px;
    positions[idx + 1] = py;
    positions[idx + 2] = pz;

    anchors[idx] = px;
    anchors[idx + 1] = py;
    anchors[idx + 2] = pz;

    velocities[idx] = (Math.random() - 0.5) * 0.02;
    velocities[idx + 1] = (Math.random() - 0.5) * 0.02;
    velocities[idx + 2] = (Math.random() - 0.5) * 0.02;

    const rand = Math.random();
    const c = rand < 0.45 ? colorA : (rand < 0.8 ? colorB : colorC);
    colors[idx] = c.r;
    colors[idx + 1] = c.g;
    colors[idx + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: isLowEnd ? 0.11 : 0.095,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(geometry, material);
  world.add(particles);

  // 2. Futuristic Holographic Wireframe Neural Sphere & Rings
  const sphereGeo = new THREE.IcosahedronGeometry(7.5, 2);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  });
  const neuralSphere = new THREE.Mesh(sphereGeo, sphereMat);
  neuralSphere.position.set(10, 2, -5);
  world.add(neuralSphere);

  const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.18 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(11, 0.015, 8, isLowEnd ? 40 : 100), ringMat1);
  ring1.rotation.x = Math.PI / 2.4;
  world.add(ring1);

  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.14 });
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(15, 0.012, 8, isLowEnd ? 40 : 100), ringMat2);
  ring2.rotation.x = Math.PI / 1.8;
  ring2.rotation.y = 0.5;
  world.add(ring2);

  // 3. Mouse Pointer Interaction with Inertia Spring Dynamics
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollProgress = 0;

  function onMouseMove(e) {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  function onScroll() {
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (totalScroll > 0) {
      scrollProgress = window.scrollY / totalScroll;
    }
  }

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onResize);
  onResize();

  // 4. Smooth 60fps Animation Frame Render Loop
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Lerp Mouse Position for Inertia
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Rotate 3D World based on Mouse & Scroll Parallax
    if (!reducedMotion) {
      world.rotation.y = mouse.x * 0.15 + scrollProgress * Math.PI * 0.5;
      world.rotation.x = -mouse.y * 0.15 + scrollProgress * 0.3;
      neuralSphere.rotation.x = elapsedTime * 0.08;
      neuralSphere.rotation.y = elapsedTime * 0.12;
      ring1.rotation.z = elapsedTime * 0.05;
      ring2.rotation.z = -elapsedTime * 0.04;

      // Particle Floating & Mouse Attraction
      const posAttr = geometry.attributes.position;
      const posArr = posAttr.array;

      for (let i = 0; i < COUNT; i++) {
        const idx = i * 3;
        
        // Sine wave floating effect
        posArr[idx + 1] = anchors[idx + 1] + Math.sin(elapsedTime * 1.2 + anchors[idx]) * 0.35;
        posArr[idx] = anchors[idx] + Math.cos(elapsedTime * 0.9 + anchors[idx + 1]) * 0.25;

        // Mouse displacement force
        const dx = posArr[idx] - mouse.x * 15;
        const dy = posArr[idx + 1] - mouse.y * 10;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 6) {
          const force = (6 - dist) * 0.04;
          posArr[idx] += (dx / dist) * force;
          posArr[idx + 1] += (dy / dist) * force;
        }
      }
      posAttr.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  animate();
}

(function () {
  "use strict";

  /* ─────────────────────────────────────────────────────────────
     Helpers
  ───────────────────────────────────────────────────────────── */
  const $  = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const reduced    = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fineHover  = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isMobile   = window.innerWidth < 720 || /Mobi|Android/i.test(navigator.userAgent);

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[COSMOS:" + name + "]", e); }
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function hexToVec3(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return new THREE.Color(r, g, b);
  }

  /* ─────────────────────────────────────────────────────────────
     Data
  ───────────────────────────────────────────────────────────── */
  const DATA = (window.__COSMOS__ || {}).planets || [];

  /* ─────────────────────────────────────────────────────────────
     State
  ───────────────────────────────────────────────────────────── */
  const state = {
    paused: false,
    speed: 1.0,
    time: 0,
    selectedPlanet: null,
    lang: "es",
    cameraMode: "overview",  // "overview" | "planet"
    orbit: { theta: 0.5, phi: 1.0, radius: 130 },
    target: new THREE.Vector3(0, 0, 0),
    mouse: { x: 0, y: 0 },
    drag: { active: false, prevX: 0, prevY: 0 }
  };

  /* ─────────────────────────────────────────────────────────────
     WebGL detection — let Three.js attempt it directly
  ───────────────────────────────────────────────────────────── */
  function hasWebGL() {
    if (!window.THREE) return true; // Three.js not loaded yet, proceed and let it fail
    try {
      return THREE.WebGL.isWebGLAvailable();
    } catch (_) {}
    try {
      const c = document.createElement("canvas");
      return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
    } catch (e) { return true; } // assume yes, let Three.js handle failure
  }

  /* ─────────────────────────────────────────────────────────────
     Splash
  ───────────────────────────────────────────────────────────── */
  function initSplash() {
    const splash = $("[data-splash]");
    if (!splash) return;
    const hide = () => splash.classList.add("is-out");
    if (document.readyState === "complete") setTimeout(hide, 800);
    else window.addEventListener("load", () => setTimeout(hide, 600));
    setTimeout(hide, 5000);
  }

  /* ─────────────────────────────────────────────────────────────
     Canvas texture builders
  ───────────────────────────────────────────────────────────── */
  function buildMercuryTexture() {
    const sz = 512;
    const cv = document.createElement("canvas"); cv.width = sz; cv.height = sz;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#6a6a6a"; ctx.fillRect(0, 0, sz, sz);
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * sz, y = Math.random() * sz;
      const r = 2 + Math.random() * 18;
      const alpha = 0.3 + Math.random() * 0.4;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(40,40,40,${alpha})`);
      g.addColorStop(0.7, `rgba(70,70,70,${alpha * 0.5})`);
      g.addColorStop(1, "rgba(106,106,106,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    return new THREE.CanvasTexture(cv);
  }

  function buildVenusTexture() {
    const sz = 512;
    const cv = document.createElement("canvas"); cv.width = sz; cv.height = sz;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#d4a84a"; ctx.fillRect(0, 0, sz, sz);
    for (let y = 0; y < sz; y += 4) {
      const t = y / sz;
      const bright = 0.15 * Math.sin(t * 18 + 0.5) + 0.08 * Math.sin(t * 7);
      const lum = Math.floor(180 + bright * 60);
      ctx.fillStyle = `rgba(${lum},${Math.floor(lum * 0.72)},${Math.floor(lum * 0.28)},0.4)`;
      ctx.fillRect(0, y, sz, 4);
    }
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * sz, y = Math.random() * sz;
      const rw = 20 + Math.random() * 80, rh = 3 + Math.random() * 8;
      ctx.globalAlpha = 0.15 + Math.random() * 0.2;
      ctx.fillStyle = "#f0d070";
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.random() * 0.3 - 0.15);
      ctx.beginPath(); ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    return new THREE.CanvasTexture(cv);
  }

  function buildEarthTexture() {
    const sz = 512;
    const cv = document.createElement("canvas"); cv.width = sz; cv.height = sz;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#1a5fa0"; ctx.fillRect(0, 0, sz, sz);
    const landPatches = [
      { x: 0.12, y: 0.25, w: 0.18, h: 0.28, color: "#2e7a3a" },
      { x: 0.35, y: 0.2,  w: 0.22, h: 0.3,  color: "#3a8844" },
      { x: 0.62, y: 0.22, w: 0.25, h: 0.35, color: "#3e8c42" },
      { x: 0.55, y: 0.55, w: 0.15, h: 0.2,  color: "#4a7c30" },
      { x: 0.25, y: 0.58, w: 0.12, h: 0.18, color: "#3a7838" },
    ];
    landPatches.forEach(p => {
      const grd = ctx.createRadialGradient(p.x*sz, p.y*sz, 0, p.x*sz, p.y*sz, Math.max(p.w, p.h)*sz);
      grd.addColorStop(0, p.color); grd.addColorStop(1, "rgba(30,95,50,0)");
      ctx.fillStyle = grd; ctx.beginPath();
      ctx.ellipse(p.x*sz, p.y*sz, p.w*sz/2, p.h*sz/2, Math.random(), 0, Math.PI*2);
      ctx.fill();
    });
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * sz, y = Math.random() * sz;
      const r = 10 + Math.random() * 40;
      ctx.globalAlpha = 0.22 + Math.random() * 0.18;
      ctx.fillStyle = "#c8e0f0";
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.35, Math.random() * 0.8, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(200,230,255,0.08)"; ctx.fillRect(0, 0, sz, 40);
    ctx.fillRect(0, sz - 40, sz, 40);
    return new THREE.CanvasTexture(cv);
  }

  function buildMarsTexture() {
    const sz = 512;
    const cv = document.createElement("canvas"); cv.width = sz; cv.height = sz;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#c24018"; ctx.fillRect(0, 0, sz, sz);
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * sz, y = Math.random() * sz;
      const r = 5 + Math.random() * 30;
      ctx.globalAlpha = 0.2 + Math.random() * 0.35;
      ctx.fillStyle = (Math.random() > 0.5) ? "#7a2008" : "#d88050";
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "rgba(255,220,180,0.15)"; ctx.fillRect(0, 0, sz, 50);
    ctx.fillRect(0, sz - 50, sz, 50);
    ctx.globalAlpha = 1;
    return new THREE.CanvasTexture(cv);
  }

  function buildJupiterTexture() {
    const sz = 512;
    const cv = document.createElement("canvas"); cv.width = sz; cv.height = sz;
    const ctx = cv.getContext("2d");
    const bands = [
      "#e8d0a0","#c8a060","#e0b870","#b88040","#e8c880",
      "#a06830","#d8b060","#c89050","#e0c070","#b87840"
    ];
    const bandH = sz / bands.length;
    bands.forEach((c, i) => {
      ctx.fillStyle = c; ctx.fillRect(0, i * bandH, sz, bandH + 1);
    });
    for (let i = 0; i < 12; i++) {
      const y = Math.random() * sz;
      ctx.globalAlpha = 0.12 + Math.random() * 0.18;
      ctx.fillStyle = (Math.random() > 0.5) ? "#b06030" : "#f0d890";
      ctx.beginPath(); ctx.ellipse(Math.random()*sz, y, 40+Math.random()*60, 3+Math.random()*5, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 0.9;
    const grs = ctx.createRadialGradient(sz*0.35, sz*0.55, 0, sz*0.35, sz*0.55, 45);
    grs.addColorStop(0, "#c84010"); grs.addColorStop(0.6, "#e06030"); grs.addColorStop(1, "rgba(200,80,30,0)");
    ctx.fillStyle = grs; ctx.beginPath(); ctx.ellipse(sz*0.35, sz*0.55, 45, 28, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    return new THREE.CanvasTexture(cv);
  }

  function buildSaturnTexture() {
    const sz = 512;
    const cv = document.createElement("canvas"); cv.width = sz; cv.height = sz;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#dbc888"; ctx.fillRect(0, 0, sz, sz);
    for (let y = 0; y < sz; y += 6) {
      const t = y / sz;
      const bright = 0.08 * Math.sin(t * 22 + 1.2);
      const base = 210 + bright * 35;
      ctx.fillStyle = `rgba(${Math.floor(base)},${Math.floor(base*0.88)},${Math.floor(base*0.62)},0.55)`;
      ctx.fillRect(0, y, sz, 6);
    }
    return new THREE.CanvasTexture(cv);
  }

  function buildUranusTexture() {
    const sz = 256;
    const cv = document.createElement("canvas"); cv.width = sz; cv.height = sz;
    const ctx = cv.getContext("2d");
    const grd = ctx.createLinearGradient(0, 0, 0, sz);
    grd.addColorStop(0, "#a0eaea");
    grd.addColorStop(0.5, "#60c8c8");
    grd.addColorStop(1, "#30a0a0");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, sz, sz);
    return new THREE.CanvasTexture(cv);
  }

  function buildNeptuneTexture() {
    const sz = 256;
    const cv = document.createElement("canvas"); cv.width = sz; cv.height = sz;
    const ctx = cv.getContext("2d");
    const grd = ctx.createLinearGradient(0, 0, 0, sz);
    grd.addColorStop(0, "#2244cc");
    grd.addColorStop(0.5, "#1a30aa");
    grd.addColorStop(1, "#0e1e78");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, sz, sz);
    for (let i = 0; i < 5; i++) {
      const y = Math.random() * sz;
      ctx.globalAlpha = 0.15 + Math.random() * 0.12;
      ctx.fillStyle = "#5588ee";
      ctx.beginPath(); ctx.ellipse(Math.random()*sz, y, 50+Math.random()*40, 4+Math.random()*3, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    return new THREE.CanvasTexture(cv);
  }

  const TEXTURE_BUILDERS = [
    buildMercuryTexture, buildVenusTexture, buildEarthTexture, buildMarsTexture,
    buildJupiterTexture, buildSaturnTexture, buildUranusTexture, buildNeptuneTexture
  ];

  /* ─────────────────────────────────────────────────────────────
     THREE.JS SCENE
  ───────────────────────────────────────────────────────────── */
  let renderer, scene, camera;
  let planetMeshes = [], planetPivots = [], orbitTrails = [];
  let moonPivot, moonMesh, sunMesh, sunGlow1, sunGlow2;
  let starsMesh, dustMesh, asteroidBelt;
  let saturnRings;
  let animId;

  /* Sun shader */
  const SUN_VERT = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const SUN_FRAG = `
    uniform float time;
    varying vec2 vUv;
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float smoothNoise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(noise(i), noise(i+vec2(1,0)), u.x),
                 mix(noise(i+vec2(0,1)), noise(i+vec2(1,1)), u.x), u.y);
    }
    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      float d = length(uv);
      vec2 animated = uv + vec2(
        sin(time * 0.3 + uv.y * 4.0) * 0.02,
        cos(time * 0.2 + uv.x * 3.0) * 0.02
      );
      float n = smoothNoise(animated * 6.0 + time * 0.1) * 0.5 +
                smoothNoise(animated * 12.0 - time * 0.15) * 0.25 +
                smoothNoise(animated * 24.0 + time * 0.08) * 0.125;
      n = n * 2.0 - 1.0;
      vec3 core  = vec3(1.0, 0.95, 0.55);
      vec3 mid   = vec3(1.0, 0.55, 0.1);
      vec3 edge  = vec3(0.9, 0.25, 0.05);
      float t = smoothstep(0.0, 1.0, d + n * 0.15);
      vec3 col = mix(core, mix(mid, edge, smoothstep(0.5, 1.0, d)), t);
      col += (1.0 - d) * vec3(0.3, 0.15, 0.0) * (n * 0.5 + 0.5);
      float alpha = 1.0 - smoothstep(0.82, 1.0, d);
      gl_FragColor = vec4(col, alpha);
    }
  `;

  /* Glow billboard shader */
  const GLOW_VERT = `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `;
  const GLOW_FRAG = `
    uniform vec3 glowColor;
    uniform float intensity;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      float d = length(uv);
      float glow = pow(max(0.0, 1.0 - d), 3.0) * intensity;
      gl_FragColor = vec4(glowColor * glow, glow * 0.85);
    }
  `;

  /* Star twinkle shader — attributes and varyings fully declared */
  const STAR_VERT = `
    attribute float alpha;
    attribute float size;
    uniform float time;
    varying float vAlpha;
    void main() {
      float twinkle = 0.75 + 0.25 * sin(time * size * 2.8 + alpha * 97.0);
      vAlpha = alpha * twinkle;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (280.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  const STAR_FRAG = `
    varying float vAlpha;
    void main() {
      vec2 uv = gl_PointCoord * 2.0 - 1.0;
      float d = length(uv);
      if (d > 1.0) discard;
      float soft = 1.0 - smoothstep(0.5, 1.0, d);
      gl_FragColor = vec4(1.0, 1.0, 1.0, soft * vAlpha);
    }
  `;

  function buildStarfield() {
    const count = 5500;
    const positions = new Float32Array(count * 3);
    const alphas    = new Float32Array(count);
    const sizes     = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 400 + Math.random() * 600;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      alphas[i]  = 0.3 + Math.random() * 0.7;
      sizes[i]   = 0.5 + Math.random() * 2.0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("alpha",    new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute("size",     new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geo, mat);
  }

  function buildSpaceDust() {
    const count = 800;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 50 + Math.random() * 200;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x8899bb, size: 0.25,
      transparent: true, opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Points(geo, mat);
  }

  function buildOrbitTrail(distance) {
    const segments = 128;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * distance, 0, Math.sin(angle) * distance
      ));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x334488,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });
    return new THREE.Line(geo, mat);
  }

  function buildAsteroidBelt() {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const r      = 38 + Math.random() * 8;
      const spread = (Math.random() - 0.5) * 2.5;
      positions[i * 3]     = Math.cos(angle) * r;
      positions[i * 3 + 1] = spread;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x776655, size: 0.18,
      transparent: true, opacity: 0.55,
      depthWrite: false
    });
    return new THREE.Points(geo, mat);
  }

  function buildSaturnRings(saturnMesh) {
    const innerR = 2.2, outerR = 4.0, segments = 128;
    const geo = new THREE.RingGeometry(innerR, outerR, segments);
    const pos = geo.attributes.position;
    const uv  = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - innerR) / (outerR - innerR), 0);
    }
    const sz = 512;
    const cv = document.createElement("canvas"); cv.width = sz; cv.height = 4;
    const ctx = cv.getContext("2d");
    const grd = ctx.createLinearGradient(0, 0, sz, 0);
    grd.addColorStop(0.0, "rgba(0,0,0,0)");
    grd.addColorStop(0.1, "rgba(220,200,140,0.3)");
    grd.addColorStop(0.3, "rgba(200,180,120,0.55)");
    grd.addColorStop(0.5, "rgba(240,220,160,0.45)");
    grd.addColorStop(0.7, "rgba(190,170,110,0.4)");
    grd.addColorStop(0.9, "rgba(180,160,100,0.2)");
    grd.addColorStop(1.0, "rgba(0,0,0,0)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, sz, 4);
    const ringTex = new THREE.CanvasTexture(cv);
    const mat = new THREE.MeshBasicMaterial({
      map: ringTex, side: THREE.DoubleSide,
      transparent: true, depthWrite: false,
      opacity: 0.8
    });
    const rings = new THREE.Mesh(geo, mat);
    rings.rotation.x = Math.PI / 2;
    saturnMesh.add(rings);
    return rings;
  }

  function initThree() {
    /* Renderer — wrapped in try-catch so any WebGL failure is caught */
    const canvas = $("#cosmos-canvas");
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
    } catch (e) {
      console.warn("WebGLRenderer failed, trying without antialias:", e);
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "default" });
      } catch (e2) {
        const nw = $("#no-webgl");
        if (nw) nw.hidden = false;
        return;
      }
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 0.9;
    if (isMobile) { renderer.shadowMap.enabled = false; }

    /* Scene */
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000006, 0.0012);
    scene.background = new THREE.Color(0x000008);

    /* Camera */
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1200);
    camera.position.set(0, 40, 130);
    camera.lookAt(0, 0, 0);

    /* Lighting */
    const sunLight = new THREE.PointLight(0xfff5e0, 3.5, 600);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    const ambientLight = new THREE.AmbientLight(0x111133, 0.35);
    scene.add(ambientLight);

    /* Starfield */
    starsMesh = buildStarfield();
    scene.add(starsMesh);

    /* Space dust */
    dustMesh = buildSpaceDust();
    scene.add(dustMesh);

    /* Sun */
    const sunGeo = new THREE.SphereGeometry(3.2, 48, 48);
    const sunMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: SUN_VERT,
      fragmentShader: SUN_FRAG,
      transparent: true,
      depthWrite: false,
    });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    /* Sun glow layers */
    function makeSunGlow(size, color, intensity) {
      const geo = new THREE.PlaneGeometry(size, size);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(color) },
          intensity: { value: intensity }
        },
        vertexShader: GLOW_VERT,
        fragmentShader: GLOW_FRAG,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = -1;
      return mesh;
    }
    sunGlow1 = makeSunGlow(22, 0xff9900, 1.2);
    sunGlow2 = makeSunGlow(38, 0xff5500, 0.55);
    scene.add(sunGlow1);
    scene.add(sunGlow2);

    /* Planets */
    DATA.forEach((pd, i) => {
      /* Orbit trail */
      const trail = buildOrbitTrail(pd.distance);
      scene.add(trail);
      orbitTrails.push(trail);

      /* Planet geometry + texture */
      const tex = TEXTURE_BUILDERS[i] ? TEXTURE_BUILDERS[i]() : null;
      const geo = new THREE.SphereGeometry(pd.radius, isMobile ? 24 : 40, isMobile ? 24 : 40);
      const mat = new THREE.MeshStandardMaterial({
        map: tex || null,
        color: tex ? 0xffffff : parseInt(pd.color.replace("#",""), 16),
        roughness: 0.85,
        metalness: 0.05,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = !isMobile;
      mesh.userData.planetIndex = i;
      mesh.userData.planetData  = pd;

      /* Axial tilt */
      mesh.rotation.z = pd.tilt || 0;

      /* Pivot for orbit */
      const pivot = new THREE.Object3D();
      pivot.userData.planetIndex = i;
      pivot.add(mesh);
      mesh.position.x = pd.distance;
      scene.add(pivot);

      planetMeshes.push(mesh);
      planetPivots.push(pivot);

      /* Saturn rings */
      if (pd.hasRings) {
        saturnRings = buildSaturnRings(mesh);
      }

      /* Earth moon */
      if (pd.hasMoon) {
        moonPivot = new THREE.Object3D();
        mesh.add(moonPivot);

        const moonGeo = new THREE.SphereGeometry(0.17, 20, 20);
        const moonMat = new THREE.MeshStandardMaterial({ color: 0x999988, roughness: 0.92 });
        moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.x = 1.1;
        moonPivot.add(moonMesh);
      }

      /* Initial random orbital phase */
      pivot.rotation.y = Math.random() * Math.PI * 2;
    });

    /* Asteroid belt */
    asteroidBelt = buildAsteroidBelt();
    scene.add(asteroidBelt);

    /* Resize handler */
    window.addEventListener("resize", () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });

    /* Raycaster for click detection */
    initRaycaster();

    /* Start render loop */
    tick(0);
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER LOOP
  ───────────────────────────────────────────────────────────── */
  let prevTime = 0;
  function tick(t) {
    animId = requestAnimationFrame(tick);
    const dt = Math.min((t - prevTime) / 1000, 0.05);
    prevTime = t;

    if (!state.paused) {
      state.time += dt * state.speed * 0.5;
    }

    const T = state.time;

    /* Animate planets */
    if (!state.paused) {
      DATA.forEach((pd, i) => {
        const pivot = planetPivots[i];
        if (!pivot) return;
        pivot.rotation.y = pd.initialAngle + T * pd.speed * 0.08;
        const mesh = planetMeshes[i];
        if (mesh) mesh.rotation.y += dt * pd.selfRotation * state.speed;
      });

      /* Moon */
      if (moonPivot) moonPivot.rotation.y += dt * 0.8 * state.speed;
    }

    /* Sun shader time */
    if (sunMesh) sunMesh.material.uniforms.time.value = T;

    /* Sun glow billboard (face camera) */
    if (sunGlow1) { sunGlow1.lookAt(camera.position); }
    if (sunGlow2) { sunGlow2.lookAt(camera.position); }

    /* Slow pulsing corona */
    if (sunGlow1) {
      const pulse = 1 + 0.04 * Math.sin(T * 1.4);
      sunGlow1.scale.setScalar(pulse);
      sunGlow2.scale.setScalar(1 + 0.06 * Math.sin(T * 0.9 + 1));
    }

    /* Stars slow twinkle */
    if (starsMesh && starsMesh.material.uniforms) {
      starsMesh.material.uniforms.time.value = T;
    }

    /* Dust slow rotation */
    if (dustMesh) dustMesh.rotation.y += dt * 0.005;

    /* Camera update */
    updateCamera(dt);

    renderer.render(scene, camera);
  }

  /* ─────────────────────────────────────────────────────────────
     CAMERA
  ───────────────────────────────────────────────────────────── */
  const camTarget = new THREE.Vector3();
  const camPos    = new THREE.Vector3();

  function cameraSpherical(target, theta, phi, radius) {
    return new THREE.Vector3(
      target.x + radius * Math.sin(phi) * Math.cos(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  function updateCamera(dt) {
    if (state.cameraMode === "overview") {
      /* Smooth approach to spherical target */
      const desired = cameraSpherical(state.target, state.orbit.theta, state.orbit.phi, state.orbit.radius);
      camera.position.lerp(desired, 0.08);
      camTarget.lerp(state.target, 0.08);
      camera.lookAt(camTarget);
    }
    /* planet mode camera is driven by GSAP, no lerp needed */
  }

  function flyToPlanet(index) {
    const pd   = DATA[index];
    if (!pd || !planetMeshes[index]) return;

    state.cameraMode = "planet";
    state.selectedPlanet = index;

    const worldPos = new THREE.Vector3();
    planetMeshes[index].getWorldPosition(worldPos);

    const offset = pd.radius * 6 + 4;
    const dest   = worldPos.clone().add(
      new THREE.Vector3(offset, offset * 0.4, offset * 0.7)
    );

    if (window.gsap) {
      gsap.killTweensOf(camera.position);
      gsap.to(camera.position, {
        x: dest.x, y: dest.y, z: dest.z,
        duration: 2.2,
        ease: "power3.inOut",
        onUpdate: () => {
          const wp2 = new THREE.Vector3();
          planetMeshes[index].getWorldPosition(wp2);
          camera.lookAt(wp2);
        },
        onComplete: () => {
          state.cameraMode = "planet-idle";
        }
      });
    } else {
      camera.position.copy(dest);
      camera.lookAt(worldPos);
      state.cameraMode = "planet-idle";
    }
  }

  function resetCamera() {
    state.selectedPlanet = null;
    state.cameraMode = "overview";
    state.orbit.theta  = 0.5;
    state.orbit.phi    = 1.0;
    state.orbit.radius = 130;
    state.target.set(0, 0, 0);

    if (window.gsap) {
      gsap.killTweensOf(camera.position);
      const dest = cameraSpherical(state.target, state.orbit.theta, state.orbit.phi, state.orbit.radius);
      gsap.to(camera.position, {
        x: dest.x, y: dest.y, z: dest.z,
        duration: 1.8,
        ease: "power3.inOut"
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
     RAYCASTER / PLANET CLICK
  ───────────────────────────────────────────────────────────── */
  let raycaster;
  function initRaycaster() {
    raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.5 };

    const canvas = $("#cosmos-canvas");

    canvas.addEventListener("pointerdown", (e) => {
      state.drag.active = true;
      state.drag.prevX  = e.clientX;
      state.drag.prevY  = e.clientY;
      state.drag.moved  = false;
      document.body.classList.add("cursor-grab");
    });

    canvas.addEventListener("pointermove", (e) => {
      state.mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (state.drag.active && state.cameraMode === "overview") {
        const dx = e.clientX - state.drag.prevX;
        const dy = e.clientY - state.drag.prevY;
        if (Math.abs(dx) + Math.abs(dy) > 2) state.drag.moved = true;
        state.orbit.theta -= dx * 0.005;
        state.orbit.phi   += dy * 0.005;
        state.orbit.phi    = Math.max(0.3, Math.min(Math.PI - 0.3, state.orbit.phi));
        state.drag.prevX   = e.clientX;
        state.drag.prevY   = e.clientY;
      }

      /* Hover detection for cursor style */
      if (raycaster) {
        raycaster.setFromCamera(new THREE.Vector2(state.mouse.x, state.mouse.y), camera);
        const hits = raycaster.intersectObjects(planetMeshes);
        const body = document.body;
        if (hits.length) {
          body.classList.add("cursor-planet");
          body.classList.remove("cursor-hover");
        } else {
          body.classList.remove("cursor-planet");
        }
      }
    });

    canvas.addEventListener("pointerup", (e) => {
      document.body.classList.remove("cursor-grab");
      if (!state.drag.moved) {
        handleCanvasClick(e);
      }
      state.drag.active = false;
      state.drag.moved  = false;
    });

    canvas.addEventListener("wheel", (e) => {
      if (state.cameraMode !== "overview") return;
      state.orbit.radius += e.deltaY * 0.1;
      state.orbit.radius  = Math.max(20, Math.min(250, state.orbit.radius));
    }, { passive: true });
  }

  function handleCanvasClick(e) {
    if (!raycaster) return;
    const mouse = new THREE.Vector2(
      (e.clientX / window.innerWidth)  * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(planetMeshes);
    if (hits.length > 0) {
      const idx = hits[0].object.userData.planetIndex;
      selectPlanet(idx);
    } else if (e.target === $("#cosmos-canvas")) {
      deselectPlanet();
    }
  }

  /* ─────────────────────────────────────────────────────────────
     UI — planet selection
  ───────────────────────────────────────────────────────────── */
  function selectPlanet(index) {
    const pd = DATA[index];
    if (!pd) return;

    state.selectedPlanet = index;

    /* Update sidebar */
    $$(".sidebar__item").forEach(item => item.classList.remove("is-active"));
    const activeItem = $(`[data-planet-nav="${index}"]`);
    if (activeItem) activeItem.classList.add("is-active");

    /* Update top nav */
    const pn = $("#current-planet-name");
    const t  = (pd.i18n && pd.i18n[state.lang]) || {};
    if (pn) pn.textContent = (t.name || pd.name).toUpperCase();

    /* Fill info panel */
    const kicker   = $("#panel-kicker");
    const name     = $("#panel-name");
    const tagline  = $("#panel-tagline");
    const desc     = $("#panel-desc");
    const statR    = $("#stat-radius");
    const statD    = $("#stat-distance");
    const statP    = $("#stat-period");
    const statT    = $("#stat-temp");
    const statM    = $("#stat-moons");
    const statMass = $("#stat-mass");

    if (kicker)   kicker.textContent   = state.lang === "en"
      ? "Planet " + (index + 1) + " of 8"
      : "Planeta " + (index + 1) + " de 8";
    if (name)     name.textContent     = t.name    || pd.name;
    if (tagline)  tagline.textContent  = t.tagline || pd.tagline || "";
    if (desc)     desc.textContent     = t.desc    || pd.desc    || "";
    if (statR && pd.facts)    statR.textContent    = pd.facts.radius;
    if (statD && pd.facts)    statD.textContent    = pd.facts.distance;
    if (statP && pd.facts)    statP.textContent    = pd.facts.period;
    if (statT && pd.facts)    statT.textContent    = pd.facts.temp;
    if (statM && pd.facts)    statM.textContent    = pd.facts.moons;
    if (statMass && pd.facts) statMass.textContent = pd.facts.mass + " M⊕";

    /* Open panel */
    const panel = $("#info-panel");
    if (panel) {
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
    }

    /* Fly camera */
    flyToPlanet(index);
  }

  function deselectPlanet() {
    state.selectedPlanet = null;

    $$(".sidebar__item").forEach(item => item.classList.remove("is-active"));

    const pn = $("#current-planet-name");
    if (pn) pn.textContent = "";

    const panel = $("#info-panel");
    if (panel) {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
    }

    resetCamera();
  }

  /* ─────────────────────────────────────────────────────────────
     UI — controls
  ───────────────────────────────────────────────────────────── */
  function initControls() {
    /* Pause button */
    const btnPause = $("#btn-pause");
    if (btnPause) {
      btnPause.addEventListener("click", () => {
        state.paused = !state.paused;
        btnPause.classList.toggle("is-paused", state.paused);
        btnPause.setAttribute("aria-pressed", String(state.paused));
      });
    }

    /* Reset button */
    $$("[data-action='reset']").forEach(btn => {
      btn.addEventListener("click", () => deselectPlanet());
    });

    /* Close panel */
    $$("[data-action='close-panel']").forEach(btn => {
      btn.addEventListener("click", () => deselectPlanet());
    });

    /* Speed slider */
    const slider = $("#speed-slider");
    const display = $("#speed-display");
    if (slider) {
      slider.addEventListener("input", () => {
        const raw  = parseFloat(slider.value);
        const spd  = raw === 0 ? 0.1 : Math.pow(10, (raw - 30) / 28);
        state.speed = spd;
        if (display) {
          display.textContent = spd < 0.5
            ? (Math.round(spd * 10) / 10) + "×"
            : Math.round(spd) + "×";
        }
        slider.setAttribute("aria-valuenow", slider.value);
      });
    }

    /* Sidebar planet buttons */
    $$("[data-planet-nav]").forEach(item => {
      const btn = item.querySelector(".sidebar__btn");
      if (!btn) return;
      btn.addEventListener("click", () => {
        const idx = parseInt(item.dataset.planetNav, 10);
        selectPlanet(idx);
      });
    });

    /* Language toggle */
    const langBtn = $("#lang-toggle");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        setLanguage(state.lang === "es" ? "en" : "es");
      });
      /* Mark initial active option */
      $$(".lang-toggle__opt", langBtn).forEach(opt => {
        opt.classList.toggle("is-active", opt.dataset.lang === state.lang);
      });
    }

    /* Keyboard shortcuts */
    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (key === "p") {
        state.paused = !state.paused;
        if (btnPause) {
          btnPause.classList.toggle("is-paused", state.paused);
          btnPause.setAttribute("aria-pressed", String(state.paused));
        }
      }
      if (key === "r" || key === "escape") deselectPlanet();
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 8) selectPlanet(n - 1);
    });
  }

  /* ─────────────────────────────────────────────────────────────
     Language switching
  ───────────────────────────────────────────────────────────── */
  function setLanguage(lang) {
    state.lang = lang;
    const isEN = lang === "en";

    /* Toggle button state */
    const langBtn = $("#lang-toggle");
    if (langBtn) {
      langBtn.setAttribute("aria-pressed", String(isEN));
      $$(".lang-toggle__opt", langBtn).forEach(opt => {
        opt.classList.toggle("is-active", opt.dataset.lang === lang);
      });
    }

    /* Sidebar planet names */
    $$(".sidebar__item[data-planet-nav]").forEach(item => {
      const idx = parseInt(item.dataset.planetNav, 10);
      const pd  = DATA[idx];
      if (!pd) return;
      const t = (pd.i18n && pd.i18n[lang]) || {};
      const nameEl = item.querySelector(".sidebar__name");
      if (nameEl) nameEl.textContent = t.name || pd.name;
    });

    /* Stat labels */
    const statLabels = {
      es: ["Radio ecuatorial", "Distancia al Sol", "Periodo orbital", "Temperatura media", "Lunas conocidas", "Masa (Tierra = 1)"],
      en: ["Equatorial radius", "Distance from Sun", "Orbital period", "Average temperature", "Known moons", "Mass (Earth = 1)"]
    };
    $$(".info-stats__label").forEach(function(dt, i) {
      if (statLabels[lang][i]) dt.textContent = statLabels[lang][i];
    });

    /* Refresh open info panel */
    if (state.selectedPlanet !== null) {
      selectPlanet(state.selectedPlanet);
    }
  }

  /* ─────────────────────────────────────────────────────────────
     CUSTOM CURSOR
  ───────────────────────────────────────────────────────────── */
  function initCursor() {
    if (!fineHover) return;

    const cursor  = $("#cursor");
    if (!cursor) return;

    let cx = -100, cy = -100;
    let firstMove = false;

    window.addEventListener("mousemove", (e) => {
      cx = e.clientX;
      cy = e.clientY;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (!firstMove) {
        firstMove = true;
        cursor.classList.add("is-ready");
      }
    });

    /* Hover detection for interactive elements */
    const HOVERABLES = "button, a, input[type='range'], [data-planet-nav] .sidebar__btn";
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest(HOVERABLES)) {
        document.body.classList.add("cursor-hover");
      }
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(HOVERABLES)) {
        document.body.classList.remove("cursor-hover");
      }
    });
  }

  /* ─────────────────────────────────────────────────────────────
     INTRO ANIMATION
  ───────────────────────────────────────────────────────────── */
  function initIntro() {
    const overlay = $("[data-intro]");
    if (!overlay) return;

    setTimeout(() => {
      overlay.classList.add("is-active");
    }, 900);

    setTimeout(() => {
      overlay.classList.add("is-done");
    }, 3800);

    setTimeout(() => {
      overlay.style.display = "none";
    }, 5400);
  }

  /* ─────────────────────────────────────────────────────────────
     INITIAL ORBIT ANGLES
  ───────────────────────────────────────────────────────────── */
  function initOrbitAngles() {
    DATA.forEach((pd, i) => {
      pd.initialAngle = Math.random() * Math.PI * 2;
    });
  }

  /* ─────────────────────────────────────────────────────────────
     BOOT
  ───────────────────────────────────────────────────────────── */
  function boot() {
    safe(initOrbitAngles, "initOrbitAngles");
    safe(initSplash, "initSplash");
    safe(initCursor, "initCursor");
    safe(initThree, "initThree");
    safe(initControls, "initControls");
    safe(initIntro, "initIntro");

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();

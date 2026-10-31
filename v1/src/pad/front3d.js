// Instalator: small on-demand 3D front view for the phone (rack, panel) using the same device models as the TV.

let libs = null;

export async function loadLibs() {
  if (libs) return libs;
  const THREE = await import("three");
  const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
  const DM = await import("../models/devices.js");
  libs = { THREE, RoomEnvironment, DM };
  return libs;
}

export async function createFront(host, { bg = "#2b2f33" } = {}) {
  const { THREE, RoomEnvironment, DM } = await loadLibs();
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;left:0;top:0;display:block";
  host.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  if (DM.setDeviceEnvMap) try { DM.setDeviceEnvMap(env, 1); } catch (e) {}
  scene.add(new THREE.HemisphereLight("#f4f6fa", "#6d6a62", 1.15));
  const key = new THREE.DirectionalLight("#fff3e2", 2.0);
  key.position.set(0.6, 1.2, 2.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight("#dfe8ff", 0.7);
  fill.position.set(-1.5, 0.4, 1.5);
  scene.add(fill);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
  camera.position.set(0, 0, 5);
  const view = { cx: 0, cy: 0, halfW: 0.3, w: 300, h: 300 };
  const api = {
    THREE, DM, renderer, scene, camera, canvas, env,
    size(w, h) {
      const dpr = Math.min(2, devicePixelRatio || 1);
      view.w = w; view.h = h;
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      api.apply();
    },
    frame(cx, cy, halfW) {
      view.cx = cx; view.cy = cy; view.halfW = halfW;
      api.apply();
    },
    apply() {
      const aspect = view.h / view.w;
      camera.left = view.cx - view.halfW; camera.right = view.cx + view.halfW;
      camera.top = view.cy + view.halfW * aspect; camera.bottom = view.cy - view.halfW * aspect;
      camera.position.set(view.cx, view.cy, 5);
      camera.lookAt(view.cx, view.cy, 0);
      camera.updateProjectionMatrix();
    },
    project(v) {
      const p = v.clone().project(camera);
      return [(p.x + 1) / 2 * view.w, (1 - p.y) / 2 * view.h];
    },
    worldPerPx() { return (view.halfW * 2) / view.w; },
    render() { renderer.render(scene, camera); },
    dispose() { renderer.dispose(); canvas.remove(); }
  };
  return api;
}

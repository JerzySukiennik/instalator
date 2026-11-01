// Instalator buildings: preview lighting rig in the Rybna Wyspa look (AgX 1.12, hemisphere + warm sun with PCF soft shadows framed on the building, distance fog, sky dome, bloom and grade).

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const RIGS = {
  rybna: { top: '#4f88c6', hor: '#bcd2e2', sun: '#ffe0b0', sunI: 3.3, hemiSky: '#a9c6e8', hemiGround: '#56663a', hemiI: 1.25, exp: 1.12, el: 44, az: 330, fog: [90, 520], bloom: 0.32 },
  game: { top: '#a9c4d8', hor: '#dfe3dc', sun: '#fff1dc', sunI: 2.7, hemiSky: '#e9f0f5', hemiGround: '#8a8467', hemiI: 1.05, exp: 1.12, el: 48, az: 35, fog: [70, 260], bloom: 0.22 },
  dusk: { top: '#4a5d96', hor: '#e9b48c', sun: '#ffb070', sunI: 1.3, hemiSky: '#c5c9e2', hemiGround: '#5a4a3c', hemiI: 0.55, exp: 1.18, el: 9, az: 250, fog: [60, 260], bloom: 0.42 }
};

const SKY_V = 'varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }';
const SKY_F = `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSunDir; uniform vec3 uSun; varying vec3 vDir;
void main() { vec3 d = normalize(vDir); float y = max(d.y, 0.0); vec3 c = mix(uHor, uTop, pow(y, 0.5)); c = mix(c, uHor * 0.92, smoothstep(0.0, -0.2, d.y));
float s = max(dot(d, uSunDir), 0.0); c += uSun * (pow(s, 1400.0) * 6.0 + pow(s, 14.0) * 0.2 + pow(s, 3.0) * 0.05);
gl_FragColor = vec4(c, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

export function setupRenderer(r) {
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.AgXToneMapping;
  r.toneMappingExposure = 1.12;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFShadowMap;
  r.localClippingEnabled = true;
  return r;
}

export function previewLight(scene, o = {}) {
  const k = RIGS[o.rig || 'rybna'];
  const hemi = new THREE.HemisphereLight(k.hemiSky, k.hemiGround, k.hemiI);
  const sun = new THREE.DirectionalLight(k.sun, k.sunI);
  sun.castShadow = true;
  sun.shadow.mapSize.set(o.shadowSize || 4096, o.shadowSize || 4096);
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.028;
  sun.shadow.radius = 3;
  scene.add(hemi, sun, sun.target);
  const uni = { uTop: { value: new THREE.Color(k.top) }, uHor: { value: new THREE.Color(k.hor) }, uSunDir: { value: new THREE.Vector3() }, uSun: { value: new THREE.Color(k.sun) } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({ uniforms: uni, vertexShader: SKY_V, fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false, fog: false }));
  dome.frustumCulled = false;
  dome.renderOrder = -10;
  scene.add(dome);
  scene.background = new THREE.Color(k.hor);
  scene.fog = new THREE.Fog(new THREE.Color(k.hor).lerp(new THREE.Color(k.top), 0.15), k.fog[0], k.fog[1]);
  const rig = {
    k, hemi, sun, dome,
    frame(center, radius, az = o.az ?? k.az, el = o.el ?? k.el) {
      const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, d = radius * 2.2 + 30;
      const dir = new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
      sun.position.copy(center).addScaledVector(dir, d);
      sun.target.position.copy(center);
      const c = sun.shadow.camera, f = radius * 1.15 + 4;
      c.left = -f; c.right = f; c.top = f; c.bottom = -f; c.near = 1; c.far = d * 2;
      c.updateProjectionMatrix();
      uni.uSunDir.value.copy(dir);
      dome.position.copy(center);
      return rig;
    }
  };
  return rig;
}

export function makeComposer(renderer, scene, camera, w, h, o = {}) {
  const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w / 2, h / 2), o.bloom ?? 0.32, 0.5, o.threshold ?? 1.0);
  composer.addPass(bloom);
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uSat: { value: 1.12 }, uVig: { value: 0.18 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uSat; uniform float uVig; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = mix(vec3(l), c.rgb, uSat);
      c.rgb = pow(max(c.rgb, vec3(0.0)), vec3(1.06)) * 1.05;
      c.rgb += vec3(-0.003, 0.0, 0.004) * (1.0 - smoothstep(0.0, 0.45, l)) + vec3(0.014, 0.007, -0.01) * smoothstep(0.5, 1.2, l);
      float d = distance(vUv, vec2(0.5)); c.rgb *= mix(1.0, 1.0 - uVig, smoothstep(0.32, 0.82, d));
      gl_FragColor = c; }`
  }));
  composer.addPass(new OutputPass());
  composer.setSize(w, h);
  return { composer, bloom };
}

// Instalator buildings: colour palette and materials (shared vertex-coloured sets, per-group wall + glass with section caps, fixture emissives, sky env map).

import * as THREE from 'three';

export const P = {
  white: '#f1efea', offwhite: '#e9e5dd', paper: '#f6f3ec', black: '#1d1e20', ink: '#2a2b2e', graphite: '#3b3d41', steel: '#c4c7ca', chrome: '#d9dcdf',
  oak: '#c09468', oakLight: '#d2ad82', oakDark: '#8f6644', walnut: '#6e4a33', pine: '#d3b386', birchPly: '#d9b98c', ply: '#d4ad7a',
  plaster: '#ece8e1', greige: '#d8d0c3', sage: '#9aa58c', terracotta: '#b9694c', mustard: '#c99a3b', navy: '#3d4a63', rose: '#c98f8a',
  fabricGrey: '#8e9093', fabricDark: '#45474b', fabricBeige: '#b9ab96', linen: '#e3ddd2', wool: '#cfc5b4', cognac: '#8d5a37',
  tileGrey: '#a8a49e', tileLight: '#dcd8d1', tileDark: '#55534f', grout: '#c9c5bd', marbleW: '#e6e2db', concrete: '#a09c95',
  leaf: '#4f7a3f', leafDark: '#355c2e', leafLight: '#7a9a52', soil: '#5e4936', pot: '#c47a55', potWhite: '#ece9e2',
  render: '#ebe6dc', renderWarm: '#e4d7c3', plinth: '#5f5c58', roofTile: '#3d3f43', roofRed: '#8f4a35', timber: '#8b6446', deck: '#9a6a48',
  lawn: '#7fa046', lawn2: '#6e9440', lawnHi: '#8ea852', path: '#a88a5e', soilBed: '#6b5440', asphalt: '#55585a', paver: '#8f8c86', paverDark: '#6c6a66', kerb: '#b9b6ae',
  section: '#4a4540', frame: '#f3f2ee', frameDark: '#2c2f33', sill: '#e9e6df', glassTint: '#cfe0e6'
};

function envTexture() {
  const w = 64, h = 32, data = new Uint8Array(w * h * 4);
  const top = new THREE.Color('#6d9bc9'), hor = new THREE.Color('#dfe6e8'), gnd = new THREE.Color('#7b7663'), gnd2 = new THREE.Color('#4d4a3e');
  const c = new THREE.Color();
  for (let y = 0; y < h; y++) {
    const v = 1 - (y + 0.5) / h, el = (v - 0.5) * Math.PI;
    if (el >= 0) c.copy(hor).lerp(top, Math.pow(Math.sin(el), 0.6));
    else c.copy(gnd).lerp(gnd2, Math.min(1, -el / 1.2));
    for (let x = 0; x < w; x++) {
      const sun = el > 0.5 && el < 0.9 && Math.abs(x - 20) < 3 ? 1.0 : 0;
      const o = (y * w + x) * 4;
      data[o] = Math.min(255, (c.r + sun) * 255);
      data[o + 1] = Math.min(255, (c.g + sun * 0.95) * 255);
      data[o + 2] = Math.min(255, (c.b + sun * 0.85) * 255);
      data[o + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

let shared = null;

export function materials() {
  if (shared) return shared;
  const env = envTexture();
  const lam = (o = {}) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o });
  const std = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, envMap: env, ...o });
  shared = {
    env,
    matte: lam(),
    matte2: lam({ side: THREE.DoubleSide }),
    satin: std({ roughness: 0.58, metalness: 0, envMapIntensity: 0.28 }),
    gloss: std({ roughness: 0.2, metalness: 0, envMapIntensity: 0.55 }),
    metal: std({ roughness: 0.32, metalness: 0.82, envMapIntensity: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: '#d4e3e8', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.25, envMap: env, envMapIntensity: 1.1, depthWrite: false, side: THREE.DoubleSide }),
    site: lam(),
    site2: lam({ side: THREE.DoubleSide }),
    leaf: lam({ side: THREE.DoubleSide }),
    tree: lam(),
    water: null
  };
  shared.glass.userData.noClipOwner = true;
  return shared;
}

export function wallMaterial(cap = P.section) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const uCap = { value: new THREE.Color(cap) }, uCapLight = { value: 1 };
  m.userData.cap = uCap;
  m.userData.capLight = uCapLight;
  m.onBeforeCompile = (s) => {
    s.uniforms.uCap = uCap;
    s.uniforms.uCapLight = uCapLight;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aCap;\nvarying float vCap;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCap = aCap;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uCap;\nuniform float uCapLight;\nvarying float vCap;')
      .replace('#include <opaque_fragment>', 'if (!gl_FrontFacing || vCap > 0.5) outgoingLight = uCap * uCapLight;\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'instalator-wall';
  return m;
}

export function wallGlassMaterial() {
  const s = materials();
  return new THREE.MeshStandardMaterial({ color: '#d4e3e8', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, envMap: s.env, envMapIntensity: 1.15, depthWrite: false, side: THREE.DoubleSide });
}

export function fixtureMaterial(color = '#fbf6ec', emissive = '#ffd8a0') {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0, roughness: 0.45, metalness: 0 });
}

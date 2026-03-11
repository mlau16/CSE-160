import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();

scene.fog = new THREE.FogExp2(0x38244F, 0.06);

const cubeTextureLoader = new THREE.CubeTextureLoader();
const skybox = cubeTextureLoader.load([
  '/img/px.png',
  '/img/nx.png',
  '/img/py.png',
  '/img/ny.png',
  '/img/pz.png',
  '/img/nz.png',
]);

scene.background = skybox;

const objLoader = new OBJLoader();
const mtlLoader = new MTLLoader();
const gltfLoader = new GLTFLoader();

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.45;
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0,0,0);

const light = new THREE.DirectionalLight(0xffffff, 0.6);
light.position.set(5, 10, 5);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);

const pointLight = new THREE.PointLight(0xffaa00, 1, 50);
pointLight.position.set(2, 3, 2);
scene.add(pointLight);

const neonLight = new THREE.PointLight(0x00ffff, 2, 8);
neonLight.position.set(3, 3, 5);
scene.add(neonLight);

const neonMat = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  opacity: 0.55
});


const loader = new THREE.TextureLoader();

// road
makeBox(6, 0.2, 36, 0x222222, 0, -1, 0);
makeBox(3, 0.3, 36, 0x444444, -4.5, -0.9, 0);
makeBox(3, 0.3, 36, 0x444444, 4.5, -0.9, 0);

// buildings
makeBox(3, 8, 3, 0x111122, -4.5, 3.25, -4.5);
makeBox(3, 10, 3, 0x181818, 5, 4, -3);
makeBox(3, 7, 3, 0x101020, -5, 2.5, 4);
makeBox(2.5, 4, 3, 0x222233, 5, 1, 5);

makeSkyline();

objLoader.load('/public/resources/Building1.obj', (obj) => {
  obj.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshPhongMaterial({ color: 0x222233 });
    }
  });

  obj.scale.set(0.7, 0.7, 0.7); // adjust size if needed
  obj.position.set(-4.8, -1, 0); // place it in your city

  scene.add(obj);
})

// rooftop details
makeCylinder(0.8, 0.8, 1.5, 0x666666, -5, 7.8, -5);
makeBox(1, 0.8, 1, 0x555555, 5, 9.5, -3);
makeCylinder(0.1, 0.1, 2, 0x999999, -5, 6.5, 4);

// signs
makeNeonSign(1.8, 0.7, 0.2, 0xff00ff, -3.2, 2, -5);
makeNeonSign(1.8, 0.7, 0.2, 0x00ffff, 3.2, 3, 5);
makeNeonSign(1.5, 0.5, 0.2, 0xff44aa, 3.2, 1.5, -3);
makeNeonSign(0.03, 1.2, 0.5, 0xff44aa, -3.8, 2, 2.15);

addWindows(-3.48, 2, 4, 1.8, 0.4);
addWindows(-3.48, 3, 4, 1.8, 0.4);
addWindows(-3.48, 4, 4, 1.8, 0.4);

loadLamp(-3.2, -1, -7, 0.5, 7.8);
loadLamp(3.2, -1, -6, 0.5, -7.8);
loadLamp(-3.2, -1, 7, 0.5, 7.8);
loadLamp(3.2, -1, 3, 0.5, -7.8);

camera.position.z = 5;

function animate( time ) {

  controls.update();

  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

function makeBox(w, h, d, color, x, y, z) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const material = new THREE.MeshPhongMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x,y,z);
  scene.add(mesh);
  return mesh;
}

function makeCylinder(rt, rb, h, color, x, y, z) {
   const geometry = new THREE.CylinderGeometry(rt, rb, h, 16);
   const material = new THREE.MeshPhongMaterial( { color });
   const mesh = new THREE.Mesh(geometry, material);
   mesh.position. set(x, y, z);
   scene.add(mesh);
   return mesh;
}

function addWindows(x, y, z, width, height, material = neonMat) {
  const geo = new THREE.BoxGeometry(0.05, height, width);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const glow = new THREE.PointLight(0x00ffff, 4, 10);
  glow.position.set(x + 0.4, y, z);
  scene.add(glow);

  return mesh;
}

function makeNeonSign(w, h, d, color, x, y, z) {

  const geometry = new THREE.BoxGeometry(w, h, d);
  const material = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const glow = new THREE.PointLight(color, 2, 8);
  glow.position.set(x + 0.3, y, z);
  scene.add(glow);

  return mesh;
}

function makeSkyline() {
  const size = 60;
  const spacing = 6;

  for (let x = -size; x <= size; x += spacing) {
    for (let z = -size; z <= size; z += spacing) {
      if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;

      const height = 6 + Math.random() * 30;
      const width = 4;
      const depth = 4;

      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshPhongMaterial({ color: 0x0f0f18 })
      );

      building.position.set(
        x + (Math.random() * 2 - 1),
        height / 2 - 1,
        z + (Math.random() * 2 - 1)
      );

      scene.add(building);

      addSkylineWindows(building.position.x, building.position.z, width, depth, height);
    }
  }
}

function addSkylineWindows(buildingX, buildingZ, width, depth, height) {
  const floors = Math.floor(height / 2);

  for (let i = 0; i < floors; i++) {
    const y = i * 1.2 + 0.5;
    const color = Math.random() < 0.5 ? 0x00ffff : 0xff44cc;

    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65
    });

    // +x face
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.9), mat);
    w1.position.set(buildingX + width / 2 + 0.06, y, buildingZ);
    scene.add(w1);

    // -x face
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.9), mat);
    w2.position.set(buildingX - width / 2 - 0.06, y, buildingZ);
    scene.add(w2);

    // +z face
    const w3 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.1), mat);
    w3.position.set(buildingX, y, buildingZ + depth / 2 + 0.06);
    scene.add(w3);

    // -z face
    const w4 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.1), mat);
    w4.position.set(buildingX, y, buildingZ - depth / 2 - 0.06);
    scene.add(w4);
  }
}

function loadLamp(x, y, z, scale = 1, rotationY = 0) {
   gltfLoader.load('/public/resources/Lamp.glb', (gltf) => {

    const lamp = gltf.scene;

    lamp.position.set(x, y, z);
    lamp.scale.set(scale, scale, scale);

    lamp.rotation.y = rotationY;

    scene.add(lamp);

    const glow = new THREE.PointLight(0xffcc88, 3, 12);
    glow.position.set(x, y + 2.5 * scale, z);
    scene.add(glow);

  });

}
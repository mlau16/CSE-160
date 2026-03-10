import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();

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

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0,0,0);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffaa00, 1, 50);
pointLight.position.set(2, 3, 2);
scene.add(pointLight);

const loader = new THREE.TextureLoader();
const texture = loader.load('./img/crate.jpg');

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshPhongMaterial( { map: texture, } );
const cube = new THREE.Mesh( geometry, material );
cube.position.set(-2, 0, 0);
scene.add( cube );

const objLoader = new OBJLoader();
objLoader.load('./resources/windmill_001.obj', (root) => {
  root.position.set(2, 0, 0);
  root.scale.set(1,1,1);
  root.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    }
  });
  scene.add(root);
});

camera.position.z = 5;

function animate( time ) {
  cube.rotation.x = time / 2000;
  cube.rotation.y = time / 1000;

  controls.update();

  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
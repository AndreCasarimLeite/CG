import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, material, light, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
scene.add(camera); // Add camera to the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

// create a cube
let cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
let cube = new THREE.Mesh(cubeGeometry, material);
// position the cube
cube.position.set(0.0, 3.0, 0.0);
// add the cube to the scene

cube.scale.set(11.0,0.3,6.0);
scene.add(cube);
// Use this to show information onscreen
let controls = new InfoBox();
  controls.add("Table Scene");
  controls.addParagraph();
  controls.add("Use mouse to interact:");
  controls.add("* Left button to rotate");
  controls.add("* Right button to translate (pan)");
  controls.add("* Scroll to zoom in/out.");
  controls.show();

for (let i = 0; i < 2; i++)
{
  for(let j = 0; j < 2; j++)
  {
    let pivo_i = i == 0 ? -0.45:0.45;
    let pivo_j = j == 0 ? -0.45:0.45;
    let cilindro = cil(cube, pivo_i,pivo_j);
    cube.add(cilindro);
  }
}

function cil(cubo, i, j)
{
  let cuboEsc = new THREE.Vector3();
  cubo.getWorldScale(cuboEsc);
  let cilindrogeometry = new THREE.CylinderGeometry( 0.2, 0.2, 3, 32 );
  let cilindromaterial = setDefaultMaterial('red'); 
  let cilindro = new THREE.Mesh( cilindrogeometry, cilindromaterial); 
  cilindro.position.set(i, -5.0, j);
  cilindro.scale.set(1/cuboEsc.x, 1/cuboEsc.y, 1/cuboEsc.z);
  return cilindro;
}
render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}
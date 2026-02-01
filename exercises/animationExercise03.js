import * as THREE from "three";
import { OrbitControls } from "../build/jsm/controls/OrbitControls.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {
  initRenderer,
  initCamera,
  initDefaultBasicLight,
  setDefaultMaterial,
  InfoBox,
  onWindowResize,
  createGroundPlaneXZ,
} from "../libs/util/util.js";

// Initial variables
let scene, renderer, camera, material, material2, light, orbit;

// Create main scene
scene = new THREE.Scene();
// Init a basic renderer
renderer = initRenderer();
// Init camera in this position
camera = initCamera(new THREE.Vector3(0, 15, 30));
// Create basic materials
material = setDefaultMaterial();
material2 = setDefaultMaterial("rgb(255,200,0)");
// Create a basic light to illuminate the scene
light = initDefaultBasicLight(scene);
// Enable mouse rotation, pan, zoom etc.
orbit = new OrbitControls(camera, renderer.domElement);

// Listen window size changes
window.addEventListener(
  "resize",
  function () {
    onWindowResize(camera, renderer);
  },
  false
);

// To use the keyboard
var keyboard = new KeyboardState();

// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper(12);
scene.add(axesHelper);

// Create the ground plane
let plane = createGroundPlaneXZ(20, 20);
scene.add(plane);

// Create variables for shooting mechanic
// Each ball is alocated in an array
let ballsArray = [];
// Index of the next free position in the array
let ballsIndex = 1;
// Current number existing shooting balls
let shootBall = 0;

// Create cube geometry
var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
// Create cube mesh
var cube = new THREE.Mesh(cubeGeometry, material);
// Position the cube
cube.position.setY(2.0);
// Add the cube to the scene
scene.add(cube);

// Init ball in the array
ballsArray[0] = createLightSphere();

// Show axes of the cube
var cubeAxesHelper = new THREE.AxesHelper(9);
cube.add(cubeAxesHelper);

render();

// Create sphere
function createLightSphere() {
  // Create geometry
  var sphGeo = new THREE.SphereGeometry(1, 20, 20);
  // Create material
  var sphere = new THREE.Mesh(sphGeo, material2);
  // Position the sphere
  sphere.position.setZ(3);
  // Add sphere to the cube
  cube.add(sphere);
  // Return sphere as result
  return sphere;
}

function keyboardUpdate() {
  // Update the keyboard state every frame
  keyboard.update();

  // Create rotation angle variable
  let angle = THREE.MathUtils.degToRad(5);

  // Keyboard.pressed - execute while is pressed
  if (keyboard.pressed("left")) cube.rotateY(angle);
  if (keyboard.pressed("right")) cube.rotateY(-angle);
  if (keyboard.pressed("up")) cube.translateZ(1);
  if (keyboard.pressed("down")) cube.translateZ(-1);

  // Keyboard.down - execute only once per key pressed
  if (keyboard.down("space")) {
    // Add shot ball to current shooting balls
    shootBall += 1;
    // Remove ball from cube and attach to the scene
    scene.attach(ballsArray[shootBall - 1]);
    // Add new ball to the cube to replace the shot one
    ballsArray[ballsIndex] = createLightSphere();
    ballsIndex += 1;
  }
}

// Use this to show information onscreen
var controls = new InfoBox();
controls.add("Animation - Attach");
controls.addParagraph();
controls.add("Use keyboard arrows to rotate/move the cube.");
controls.add("Press 'space' to shoot the ball");
controls.show();

function render() {
  // Remove any out of bounds ball
  // Check if any balls were shot
  if (shootBall > 0) {
    // Translate all shot balls in the array
    for (var i = 0; i < shootBall; i++) {
      ballsArray[i].translateZ(0.05);
    }
    // Check if ball is out of bounds (either on X or Z axes)
    if (
      Math.abs(ballsArray[0].position.x) > 20 ||
      Math.abs(ballsArray[0].position.z) > 20
    ) {
      // Remove ball from scene
      scene.remove(ballsArray[0]);
      // Free memory by disposing geometry and material
      ballsArray[0].geometry.dispose();
      ballsArray[0].material.dispose();
      // Remove out of bounds ball from the array
      ballsArray.shift();
      // Reduce number of existing shooting balls
      shootBall -= 1;
      // Fix next free position
      ballsIndex -= 1;
    }
  }

  // Check keyboard usage
  keyboardUpdate();
  // Animation loop
  requestAnimationFrame(render);
  // Render scene
  renderer.render(scene, camera);
}

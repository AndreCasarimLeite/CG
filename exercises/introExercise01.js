import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let player, playerBox = new THREE.Box3();
let scene, renderer, camera, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// Show axes (parameter is size of each axis)
let axesHelper = new THREE.AxesHelper( 12 );
scene.add( axesHelper );

// create the ground plane
let plane = createGroundPlaneXZ(20, 20)
scene.add(plane);

/*// create a cube
let cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
let cube = new THREE.Mesh(cubeGeometry, material);
// position the cube
cube.position.set(0.0, 2.0, 0.0);
// add the cube to the scene
scene.add(cube);
*/
// Use this to show information onscreen
let controls = new InfoBox();
  controls.add("Basic Scene");
  controls.addParagraph();
  controls.add("Use mouse to interact:");
  controls.add("* Left button to rotate");
  controls.add("* Right button to translate (pan)");
  controls.add("* Scroll to zoom in/out.");
  controls.show();

/*let cG1 = new THREE.BoxGeometry(2, 2, 2);
let c1 = new THREE.Mesh(cG1, material);
c1.position.set(5.0, 2.0, -3.0);
scene.add(c1);

let cG2 = new THREE.BoxGeometry(1, 1, 1);
let c2 = new THREE.Mesh(cG1, material);
c2.position.set(0.0, 2.0, 4.0);
scene.add(c2);*/

player = createPlayer();
scene.add(player);

render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}

function createPlayer(/*linhaChegada*/) {
  let base, material2, laterais, torusMat, atrasMat, capaMat, cabineMat;
  base = new THREE.MeshLambertMaterial({
    color: "red",
  });
  material2 = new THREE.MeshLambertMaterial({
    color: "lightgreen",
  });
  laterais = new THREE.MeshLambertMaterial({
    color: "lightblue",
  });
  torusMat = new THREE.MeshLambertMaterial({
    color: "lightblue",
  });
  atrasMat = new THREE.MeshLambertMaterial({
    color: "orangered",
  });
  capaMat = new THREE.MeshPhongMaterial({
    color: "blue",
    shininess: "200",
    specular: "blue",
  });
  cabineMat = new THREE.MeshPhongMaterial({
    color: "lightblue",
    shininess: "200",
    specular: "lightblue",
  });
  var textureLoader = new THREE.TextureLoader();
  // base
  let cylinderGeometry1 = new THREE.CylinderGeometry(4, 4, 0.3);
  player = new THREE.Mesh(cylinderGeometry1, base);
  player.scale.set(0.5 * 1.1, 0.5 * 1, 0.5 * 0.6);

  // posicionamento inicial pela linha de chegada
  /*let centro = new THREE.Vector3();
  new THREE.Box3().setFromObject(linhaChegada).getCenter(centro);
  player.position.copy(centro);
  player.translateY(3.5);
  player.quaternion.setFromUnitVectors(
    new THREE.Vector3(1, 0, 0), // frente no eixo X
    linhaChegada.userData.lineNormal.clone().normalize(),
  );*/

  function createLaterais(z) {
    let cylG = new THREE.CylinderGeometry(1.3, 1.3, 7, 45);
    let lateral = new THREE.Mesh(cylG, laterais);
    lateral.material.map = textureLoader.load("../T3/textures/lateral.jpg");
    lateral.position.set(0.0, 1.0, z);
    lateral.scale.x = 1 / 1.3;
    lateral.rotateZ(THREE.MathUtils.degToRad(90));
    lateral.receiveShadow = true;
    lateral.castShadow = true;
    player.add(lateral);
  }

  // núcleo
  let cubeGeometry = new THREE.BoxGeometry(9, 2, 7.5);
  let cube = new THREE.Mesh(cubeGeometry, material2);
  cube.position.setY(1);
  cube.scale.x = 1 / 1.3;
  player.add(cube);
  createLaterais(-3.8);
  createLaterais(3.8);
  cube.castShadow = true;

  let torusGeometry = new THREE.TorusGeometry(2.1, 1.0, 16, 100, 2.5);
  let torus = new THREE.Mesh(torusGeometry, torusMat);
  torus.material.map = textureLoader.load("../T3/textures/frente.jpg");
  torus.position.set(2.8, 0, -0.05);
  torus.scale.set(1.7, 1.8, 1);
  torus.rotateX(THREE.MathUtils.degToRad(90));
  torus.rotateZ(THREE.MathUtils.degToRad(-71));
  torus.receiveShadow = true;
  torus.castShadow = true;
  cube.add(torus);

  let atrasGeometry = new THREE.BoxGeometry(1, 2, 9.5);
  let atras = new THREE.Mesh(atrasGeometry, atrasMat);
  atras.position.setX(-5);
  atras.receiveShadow = true;
  atras.castShadow = true;
  cube.add(atras);

  let cabineGeometry = new THREE.SphereGeometry(8, 32, 16, 0, 6.5, 0, 0.6);
  let cabine = new THREE.Mesh(cabineGeometry, cabineMat);
  cabine.position.setY(-5.6);
  cabine.position.setX(3);
  cabine.scale.set(0.7, 1, 0.8);
  //cabine.material.map = textureLoader.load("../T3/textures/cabine.jpg");
  cabine.receiveShadow = true;
  cabine.castShadow = true;
  cube.add(cabine);

  let posteGeometry = new THREE.ConeGeometry(1.6, 1.5);
  let poste = new THREE.Mesh(posteGeometry, material2);
  poste.position.set(-3.3, 1.7, 0);
  poste.receiveShadow = true;
  poste.scale.x = 1 / 1.3;
  poste.castShadow = true;

  let turbinaGeometry = new THREE.CylinderGeometry(2, 2, 2);
  let turbina = new THREE.Mesh(turbinaGeometry, material2);
  turbina.position.set(0, 0.6, 0);
  turbina.scale.set(1, 1.3, 0.7);
  //turbina.scale.x = 1 / 1.3;
  turbina.rotateX(THREE.MathUtils.degToRad(90));
  turbina.rotateZ(THREE.MathUtils.degToRad(90));
  turbina.receiveShadow = true;
  turbina.castShadow = true;
  poste.add(turbina);

  cube.add(poste);

  // garante bounding boxes das geometrias filhas (evita Box3 gigante)
  player.traverse((n) => {
    if (n.isMesh && n.geometry && !n.geometry.boundingBox)
      n.geometry.computeBoundingBox();
  });

  // === HITBOX SIMPLIFICADO PARA COLISÃO/PREVISÃO ===
  const hitboxGeometry = new THREE.BoxGeometry(9, 2, 7.5); // dimensões aproximadas do corpo
  const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
  hitbox.position.set(0, 1, 0); // centralizado no player
  player.add(hitbox);

  // guarda referência para usar no updatePlayer
  player.userData.hitbox = hitbox;
  player.userData.isJumping = false;
  player.userData.velocityY = 0;
  player.userData.lastCheckpoint = null;
  // atualiza playerBox com base no hitbox
  playerBox.setFromObject(player.userData.hitbox);

  return player;
}
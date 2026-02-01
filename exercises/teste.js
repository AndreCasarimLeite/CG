import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";
function transformCube(cube) {
    //---------------------------------------------
    // FAÇA SEUS TESTES AQUI
    //---------------------------------------------
    //cube.translateX( 2 );
    //cube.rotateY(0.78);
    //cube.scale.set(2, 1, 1);
    //cube.translateX( 2 );
    //cube.translateZ( 2 );
    //cube.rotateX(0.78);
  }
  
  
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
  
  let planeGeometry = new THREE.PlaneGeometry(20, 20);
  let planeMaterial = new THREE.MeshLambertMaterial({
    color: "rgb(200,200,200)",
    side: THREE.DoubleSide
  });
  
  var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  var cubeMaterial = new THREE.MeshNormalMaterial();
  var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.add(new THREE.AxesHelper(5));
  scene.add(cube);
  
  transformCube(cube)
  
  //---------------------------------------------
  // FAÇA SEUS TESTES AQUI
  //---------------------------------------------
  //cube.translateX( 2 );
  //cube.rotateY(0.78);
  //cube.scale.set(2, 1, 1);
  //cube.translateX( 2 );
  //cube.translateZ( 2 );
  //cube.rotateX(0.78);

  render();
  
  function render() {
    requestAnimationFrame(render); // Show events
    renderer.render(scene, camera) // Render scene
  }
  
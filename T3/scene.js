import * as THREE from "three";
import { CSG } from "../libs/other/CSGMesh.js";
import { GLTFLoader } from "../build/jsm/loaders/GLTFLoader.js";

export function ground(scene, num) {
  const circleG = new THREE.CircleGeometry(720);
  const circleM = new THREE.MeshLambertMaterial();
  let circle = new THREE.Mesh(circleG, circleM);
  circle.translateZ(8.3);
  circle.receiveShadow = true;
  var textureLoader = new THREE.TextureLoader();
  switch (num) {
    case 1:
      var outside = textureLoader.load("./textures/grass.jpg");
      break;
    case 2:
      var outside = textureLoader.load("./textures/dirt.jpg");
      break;
    case 3:
      var outside = textureLoader.load("./textures/sand.jpg");
      break;
  }
  circle.material.map = outside;
  circle.colorSpace = THREE.SRGBColorSpace;
  circle.position.y = -16;
  circle.rotateX(THREE.MathUtils.degToRad(-90));

  scene.add(circle);

  return circle;
}

function skybox(scene) {
  const path = "./textures/skybox/";
  const format = ".bmp";
  const urls = [
    path + "posx" + format,
    path + "negx" + format,
    path + "posy" + format,
    path + "negy" + format,
    path + "posz" + format,
    path + "negz" + format,
  ];
  let cubeMapTexture = new THREE.CubeTextureLoader().load(urls);
  cubeMapTexture.colorSpace = THREE.SRGBColorSpace;
  scene.background = cubeMapTexture;
}

export function createScene() {
  let scene; // Initial variables
  scene = new THREE.Scene(); // Create main scene
  skybox(scene);
  return scene;
}

export function createLight(scene) {
  let dirPosition = new THREE.Vector3(40, 80, 150);
  const dirLight = new THREE.DirectionalLight("white", 8);
  dirLight.position.copy(dirPosition);
  dirLight.target.position.set(-160, 0, 180);
  scene.add(dirLight.target);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 410;
  dirLight.shadow.camera.left = -200;
  dirLight.shadow.camera.right = 200;
  dirLight.shadow.camera.bottom = -200;
  dirLight.shadow.camera.top = 200;
  scene.add(dirLight);

  let auxPosition = new THREE.Vector3(-160, 80, 150);
  const auxLight = new THREE.DirectionalLight("white", 0.5);
  auxLight.position.copy(auxPosition);
  scene.add(auxLight);

  return dirLight;
}

export function lightControl(player, light) {
  light.position.copy(player.position).add(new THREE.Vector3(160, 70, 100));
  light.target.position.copy(player.position).add(new THREE.Vector3(0, 0, 110));
  light.target.updateMatrixWorld();
}

let colisaoMuretas = [];
let rampa = [];
let buraco = [];
let checkpoints = [];
let cpOrderCounter = 0;

export function getCheckpoints() {
  return checkpoints;
}

export function clearCheckpoints() {
  checkpoints.length = 0; //limpa checkpoints
  cpOrderCounter = 0; //reseta ordem
}

export function getRampa() {
  return rampa;
}

export function clearRampa() {
  rampa.length = 0;
}
export function getBuraco() {
  return buraco;
}
export function clearBuraco() {
  buraco.length = 0;
}
export function getColisaoMuretas() {
  return colisaoMuretas;
}
export function clearColisaoMuretas() {
  colisaoMuretas.length = 0; // limpa colisoes
}

function tunel() {
  let auxMat = new THREE.Matrix4();
  // O resultado a ser colocado na cena
  let cylCompletoMesh;

  // Mesh de todas as geometrias que serão usadas no CSG
  let cylMeshMaior = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 100));
  let cylMeshMenor = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 100));
  let cylMeshFuro1 = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 20));
  let cylMeshFuro2 = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 20));
  let cylMeshFuro3 = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 20));
  let cylMeshFuro4 = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 20));
  let planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(125, 125));

  // Holders do CSG
  let cylCompletoCSG,
    cylCSGMaior,
    cylCSGMenor,
    cylCSGFuro1,
    cylCSGFuro2,
    cylCSGFuro3,
    cylCSGFuro4,
    planeCSG;

  // Posicionamento para operação
  cylMeshFuro1.rotateZ(THREE.MathUtils.degToRad(60));
  cylMeshFuro2.rotateX(THREE.MathUtils.degToRad(40));
  cylMeshFuro1.position.set(19, -35, -19);
  cylMeshFuro2.rotateZ(THREE.MathUtils.degToRad(80));
  cylMeshFuro2.position.set(-25, -10, -10);
  cylMeshFuro3.rotateX(THREE.MathUtils.degToRad(90));
  cylMeshFuro3.position.set(0, 15, -32);
  cylMeshFuro4.rotateZ(THREE.MathUtils.degToRad(90));
  cylMeshFuro4.position.set(30, 45, -5);
  planeMesh.rotateZ(THREE.MathUtils.degToRad(90));
  // Rotação em X para manter a parte de cima do clindro
  planeMesh.rotateX(THREE.MathUtils.degToRad(180));
  planeMesh.position.set(0, 0, 0);
  // Mudança de update matrix
  updateObject(cylMeshMenor);
  updateObject(cylMeshFuro1);
  updateObject(cylMeshFuro2);
  updateObject(cylMeshFuro3);
  updateObject(cylMeshFuro4);
  updateObject(planeMesh);
  // Conversão para CSG
  cylCSGMenor = CSG.fromMesh(cylMeshMenor);
  cylCSGMaior = CSG.fromMesh(cylMeshMaior);
  cylCSGFuro1 = CSG.fromMesh(cylMeshFuro1);
  cylCSGFuro2 = CSG.fromMesh(cylMeshFuro2);
  cylCSGFuro3 = CSG.fromMesh(cylMeshFuro3);
  cylCSGFuro4 = CSG.fromMesh(cylMeshFuro4);
  planeCSG = CSG.fromMesh(planeMesh);
  // Operação CSG
  cylCompletoCSG = cylCSGMaior
    .subtract(cylCSGMenor)
    .subtract(cylCSGFuro1)
    .subtract(cylCSGFuro2)
    .subtract(cylCSGFuro3)
    .subtract(cylCSGFuro4)
    .subtract(planeCSG);
  // Conversão para Mesh
  cylCompletoMesh = CSG.toMesh(cylCompletoCSG, auxMat);
  // Adição do material
  cylCompletoMesh.material = new THREE.MeshLambertMaterial({});
  // Posicionamento e adição na cena
  cylCompletoMesh.rotateX(THREE.MathUtils.degToRad(90));
  cylCompletoMesh.receiveShadow = true;
  cylCompletoMesh.castShadow = true;

  var textureLoader = new THREE.TextureLoader();
  var tunnelTex = textureLoader.load("./textures/steel.jpg");
  cylCompletoMesh.material.map = tunnelTex;
  cylCompletoMesh.colorSpace = THREE.SRGBColorSpace;
  // cylCompletoMesh.material.map.wrapS = THREE.RepeatWrapping;
  // cylCompletoMesh.material.map.wrapT = THREE.RepeatWrapping;

  return cylCompletoMesh;

  function updateObject(mesh) {
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
  }
}

function criarCheckpoint(size) {
  // caixa invisível
  let geo = new THREE.BoxGeometry(size, 2, size);
  let mat = new THREE.MeshLambertMaterial({ visible: false });
  let cp = new THREE.Mesh(geo, mat);
  cp.userData.isCheckpoint = true;
  cp.userData.order = cpOrderCounter++;
  cp.userData.passed = false;
  cp.rotateY(THREE.MathUtils.degToRad(180));
  checkpoints.push(cp);
  return cp;
}

function mureta(cor) {
  let boxG = new THREE.BoxGeometry(3, 2, 2);
  let any = new THREE.MeshLambertMaterial({
    color: cor,
  });
  let white = new THREE.MeshLambertMaterial({
    color: "white",
  });
  let boxA = new THREE.Mesh(boxG, any);
  let boxW = new THREE.Mesh(boxG, white);
  boxA.position.set(26, 1, 0.5);
  boxW.position.set(0, 0, 2);
  boxA.add(boxW);
  colisaoMuretas.push({ mesh: boxA, type: "box" });
  boxA.receiveShadow = true;
  boxA.castShadow = true;
  boxW.receiveShadow = true;
  boxW.castShadow = true;
  return boxA;
}
function reta(cor1, cor2) {
  let boxG = new THREE.BoxGeometry(50, 0.1, 20);
  let cor = new THREE.MeshLambertMaterial({});
  let reta = new THREE.Mesh(boxG, cor);
  var textureLoader = new THREE.TextureLoader();
  switch (cor1) {
    case "grey":
      var outside = textureLoader.load("./textures/stone.jpg");
      break;
    case "brown":
      var outside = textureLoader.load("./textures/redSoil.jpg");
      break;
    case "lightgrey":
      var outside = textureLoader.load("./textures/charcoal.jpg");
      break;
    case "white":
      var outside = textureLoader.load("./textures/chess.jpg");
      break;
  }
  reta.material.map = outside;
  reta.colorSpace = THREE.SRGBColorSpace;
  for (let i = -9; i <= 7; i += 4) {
    let muro = mureta(cor2);
    reta.add(muro);
    muro.position.setZ(i);
    let muro1 = mureta(cor2);
    muro1.position.setX(-26);
    muro1.position.setZ(i);
    reta.add(muro1);
  }
  //paredes de elevação
  let parG = new THREE.BoxGeometry(50, 36, 20);
  switch (cor1) {
    case "grey":
      var sideBox = textureLoader.load("./textures/mossRock.jpg");
      break;
    case "brown":
      var sideBox = textureLoader.load("./textures/lava.jpg");
      break;
    case "lightgrey":
      var sideBox = textureLoader.load("./textures/ashes.jpg");
      break;
  }
  if (cor1 == "white") {
    switch (cor2) {
      case "darkred":
        var sideBox = textureLoader.load("./textures/mossRock.jpg");
        break;
      case "lightgreen":
        var sideBox = textureLoader.load("./textures/lava.jpg");
        break;
      case "blue":
        var sideBox = textureLoader.load("./textures/ashes.jpg");
        break;
    }
  }
  let parM = [
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshBasicMaterial({ color: "rgb(255,255,255" }),
    new THREE.MeshBasicMaterial({ color: "rgb(255,255,255" }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
  ];
  let par = new THREE.Mesh(parG, parM);
  par.receiveShadow = true;
  par.castShadow = true;
  par.position.setY(-18.2);
  reta.add(par);
  reta.receiveShadow = true;
  return reta;
}
function curva(cor1, cor2) {
  let boxG = new THREE.BoxGeometry(55, 0.1, 55);
  let cor = new THREE.MeshLambertMaterial({});
  let curva = new THREE.Mesh(boxG, cor);
  var textureLoader = new THREE.TextureLoader();
  switch (cor1) {
    case "grey":
      var outside = textureLoader.load("./textures/stone.jpg");
      break;
    case "brown":
      console.log(cor1);
      var outside = textureLoader.load("./textures/redSoil.jpg");
      break;
    case "lightgrey":
      var outside = textureLoader.load("./textures/charcoal.jpg");
      break;
  }
  curva.material.map = outside;
  curva.colorSpace = THREE.SRGBColorSpace;
  for (let i = -27; i <= 21; i += 4) {
    let muro = mureta(cor2);
    muro.position.setX(-26);
    muro.position.setZ(i + 0.5);
    curva.add(muro);
    let muro1 = mureta(cor2);
    muro1.rotateY(THREE.MathUtils.degToRad(90));
    muro1.position.setZ(26);
    muro1.position.setX(i + 3.5);
    curva.add(muro1);
  }
  let cilIn = curvinha(cor2);
  cilIn.position.set(27.5, 1, -27.5);
  curva.add(cilIn);
  let cilOut = curvinha(cor2);
  cilOut.position.set(-24.5, 1, 24.5);
  curva.add(cilOut);

  //paredes de elevação
  let parG = new THREE.BoxGeometry(55, 36, 55);
  switch (cor1) {
    case "grey":
      var sideBox = textureLoader.load("./textures/mossRock.jpg");
      break;
    case "brown":
      var sideBox = textureLoader.load("./textures/lava.jpg");
      break;
    case "lightgrey":
      var sideBox = textureLoader.load("./textures/ashes.jpg");
      break;
  }
  if (cor1 == "white") {
    switch (cor2) {
      case "darkred":
        var sideBox = textureLoader.load("./textures/mossRock.jpg");
        break;
      case "lightgreen":
        var sideBox = textureLoader.load("./textures/lava.jpg");
        break;
      case "blue":
        var sideBox = textureLoader.load("./textures/ashes.jpg");
        break;
    }
  }
  let parM = [
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
  ];
  let par = new THREE.Mesh(parG, parM);
  par.receiveShadow = true;
  par.castShadow = true;
  par.position.setY(-18.2);
  curva.add(par);

  let cp = criarCheckpoint(48);
  curva.add(cp);
  curva.receiveShadow = true;
  curva.castShadow = true;
  return curva;
}
function curvinha(cor) {
  let cilG = new THREE.CylinderGeometry(
    3,
    3,
    2,
    30,
    1,
    false,
    0,
    THREE.MathUtils.degToRad(45),
  );
  let any = new THREE.MeshLambertMaterial({
    color: cor,
  });
  let white = new THREE.MeshLambertMaterial({
    color: "white",
  });
  let cilA = new THREE.Mesh(cilG, any);
  let cilW = new THREE.Mesh(cilG, white);
  cilW.rotateY(THREE.MathUtils.degToRad(45));
  cilA.add(cilW);
  cilA.rotateY(THREE.MathUtils.degToRad(270));
  colisaoMuretas.push({ mesh: cilA, type: "cylinder", radius: 1.8 });
  cilA.receiveShadow = true;
  cilA.castShadow = true;
  cilW.receiveShadow = true;
  cilA.castShadow = true;
  return cilA;
}
function cruzamento(cor1, cor2) {
  let boxG = new THREE.BoxGeometry(55, 0.1, 55);
  let cor = new THREE.MeshLambertMaterial({});
  let cruzamento = new THREE.Mesh(boxG, cor);
  var textureLoader = new THREE.TextureLoader();
  switch (cor1) {
    case "grey":
      var outside = textureLoader.load("./textures/stone.jpg");
      break;
    case "brown":
      var outside = textureLoader.load("./textures/redSoil.jpg");
      break;
    case "lightgrey":
      var outside = textureLoader.load("./textures/charcoal.jpg");
      break;
  }
  cruzamento.material.map = outside;
  cruzamento.colorSpace = THREE.SRGBColorSpace;
  for (let i = 0; i < 4; i++) {
    let curv = curvinha(cor2);
    switch (i) {
      case 0:
        curv.position.set(27.5, 1, -27.5);
        break;
      case 1:
        curv.position.set(27.5, 1, 27.5);
        curv.scale.x = -1;
        break;
      case 2:
        curv.position.set(-27.5, 1, 27.5);
        curv.scale.x = -1;
        curv.scale.z = -1;
        break;
      case 3:
        curv.position.set(-27.5, 1, -27.5);
        curv.scale.z = -1;
        break;
    }
    cruzamento.add(curv);
  }
  //paredes de elevação
  let parG = new THREE.BoxGeometry(55, 36, 55);
  switch (cor1) {
    case "grey":
      var sideBox = textureLoader.load("./textures/mossRock.jpg");
      break;
    case "brown":
      var sideBox = textureLoader.load("./textures/lava.jpg");
      break;
    case "lightgrey":
      var sideBox = textureLoader.load("./textures/ashes.jpg");
      break;
  }
  let parM = [
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshBasicMaterial({ color: "rgb(255,255,255" }),
    new THREE.MeshBasicMaterial({ color: "rgb(255,255,255" }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
    new THREE.MeshLambertMaterial({ map: sideBox }),
  ];
  let par = new THREE.Mesh(parG, parM);
  par.receiveShadow = true;
  par.castShadow = true;
  par.position.setY(-18.2);
  cruzamento.add(par);
  cruzamento.receiveShadow = true;
  return cruzamento;
}
let chegada;

export function linhaChegada() {
  return chegada;
}

export function pista1() {
  let cor1 = "grey",
    cor2 = "darkred";
  let pista = reta(cor1, cor2);

  for (let i = 0; i < 4; i++) {
    let j;
    let aux = reta(cor1, cor2);
    for (j = 1; j < 16; j++) {
      let ret;
      if (j == 6 && i == 0) {
        ret = reta("white", cor2);
        ret.userData.isLinhaChegada = true;
        ret.userData.lineNormal = new THREE.Vector3(0, 0, 1); // direção "certa" da passagem
        chegada = ret;
      } else ret = reta(cor1, cor2);
      ret.position.setZ(j * 20);
      aux.add(ret);
    }
    let curv = curva(cor1, cor2);
    curv.position.setZ(j * 20 + 17.5);
    aux.add(curv);
    let tree = block280x80(5, 20);
    tree.position.set(-70, -25, 120);
    tree.translateY(-8.2);
    tree.rotateY(THREE.MathUtils.degToRad(90));
    aux.add(tree);
    aux.rotateY(THREE.MathUtils.degToRad(90 * i));
    if (i == 1) {
      aux.position.setX(37.5);
      aux.position.setZ(j * 20 + 17.5);
      let tunnel = tunel();
      let tunnel2 = tunel();
      tunnel.position.set(0, 0, 105);
      tunnel2.position.set(0, 0, 205);
      aux.add(tunnel);
      aux.add(tunnel2);
    }
    if (i == 2) {
      aux.position.setX(j * 20 + 55);
      aux.position.setZ(j * 20 - 20);
    }
    if (i == 3) {
      aux.position.setX(j * 20 + 17.5);
      aux.position.setZ(-37.5);
      let tunnel = tunel();
      let tunnel2 = tunel();
      tunnel.position.set(0, 0, 105);
      tunnel2.position.set(0, 0, 205);
      aux.add(tunnel);
      aux.add(tunnel2);
    }
    pista.add(aux);
  }
  let trees = block1();
  trees.position.set(110, -25, 100);
  trees.translateY(-8.2);
  pista.add(trees);
  let trees1 = block2();
  trees1.position.set(280, -25, 100);
  trees1.translateY(-8.2);
  pista.add(trees1);
  let trees2 = block3();
  trees2.position.set(110, -25, 250);
  trees2.translateY(-8.2);
  pista.add(trees2);
  let trees3 = block4();
  trees3.position.set(280, -25, 250);
  trees3.translateY(-8.2);
  pista.add(trees3);
  pista.scale.x = -1;
  pista.scale.x *= 0.5;
  pista.scale.y *= 0.5;
  pista.scale.z *= 0.5;

  // pássaros
  let loader = new GLTFLoader();
  loader.load(
    "./objects/bird.glb",
    function (gltf) {
      let bird1 = gltf.scene;
      bird1.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      bird1.position.set(140, 1, -62);
      pista.add(bird1);
    },
    null,
    null,
  );
  loader.load(
    "./objects/bird.glb",
    function (gltf) {
      let bird2 = gltf.scene;
      bird2.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      bird2.position.set(230, 1, 362);
      bird2.rotateY(THREE.MathUtils.degToRad(180));
      pista.add(bird2);
    },
    null,
    null,
  );
  loader.load(
    "./objects/bird.glb",
    function (gltf) {
      let bird3 = gltf.scene;
      bird3.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      bird3.position.set(50, 1, 120);
      bird3.rotateY(THREE.MathUtils.degToRad(-90));
      pista.add(bird3);
    },
    null,
    null,
  );
  //pedras
  loader.load(
    "./objects/rock.glb",
    function (gltf) {
      let rock1 = gltf.scene;
      rock1.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      rock1.position.set(200, -33, 1);
      rock1.scale.set(16, 16, 16);
      pista.add(rock1);
    },
    null,
    null,
  );
  loader.load(
    "./objects/rock.glb",
    function (gltf) {
      let rock2 = gltf.scene;
      rock2.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      rock2.position.set(200, -33, 305);
      rock2.scale.set(16, 16, 16);
      pista.add(rock2);
    },
    null,
    null,
  );
  loader.load(
    "./objects/rock.glb",
    function (gltf) {
      let rock3 = gltf.scene;
      rock3.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      rock3.position.set(450, -33, 700);
      rock3.scale.set(16, 16, 16);
      pista.add(rock3);
    },
    null,
    null,
  );
  loader.load(
    "./objects/rock.glb",
    function (gltf) {
      let rock4 = gltf.scene;
      rock4.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      rock4.position.set(-100, -33, -400);
      rock4.scale.set(16, 16, 16);
      pista.add(rock4);
    },
    null,
    null,
  );

  return pista;
}

export function pista2() {
  let cor1 = "brown",
    cor2 = "lightgreen";
  let pista = reta(cor1, cor2);

  for (let i = 0; i < 2; i++) {
    let j;
    let aux = reta(cor1, cor2);
    for (j = 1; j < 15; j++) {
      let ret;
      if (j == 6 && i == 0) {
        ret = reta("white", cor2);
        ret.userData.isLinhaChegada = true;
        ret.userData.lineNormal = new THREE.Vector3(0, 0, 1); // direção "certa" da passagem
        chegada = ret;
      } else ret = reta(cor1, cor2);
      ret.position.setZ(j * 20);
      aux.add(ret);
    }
    let curv = curva(cor1, cor2, i);
    curv.position.setZ(j * 20 + 17.5);
    aux.add(curv);
    let tree = block280x80(5, 20);
    tree.position.set(-70, -25, 120);
    tree.translateY(-8.2);
    tree.rotateY(THREE.MathUtils.degToRad(90));
    aux.add(tree);
    aux.rotateY(THREE.MathUtils.degToRad(90 * i));
    if (i == 1) {
      aux.position.setX(37.5);
      aux.position.setZ(j * 20 + 17.5);
    }
    pista.add(aux);
    aux = reta(cor1, cor2);
    for (j = 1; j < 6; j++) {
      let ret = reta(cor1, cor2);
      ret.position.setZ(j * 20);
      aux.add(ret);
    }
    curv = curva(cor1, cor2);
    curv.position.setZ(j * 20 + 17.5);
    let aux1 = reta(cor1, cor2);
    aux1.position.setX(37.5);
    aux1.rotateY(THREE.MathUtils.degToRad(90));
    curv.add(aux1);
    aux.add(curv);
    if (i == 0) {
      aux.position.setX(15 * 20 + 55);
      aux.position.setZ(j * 20 + 160);
    } else if (i == 1) {
      aux.position.setX(16 * 20 - 2);
      aux.position.setZ(j * 20 + 22.5);
      aux.scale.x = -1;
      let tunnel = tunel();
      tunnel.position.set(0, 0, 60);
      aux.add(tunnel);
    }
    aux.rotateY(THREE.MathUtils.degToRad(90 * (i + 2)));
    pista.add(aux);
    aux = reta(cor1, cor2);
    for (j = 1; j < 6; j++) {
      let ret = reta(cor1, cor2);
      ret.position.setZ(j * 20);
      aux.add(ret);
    }
    curv = curva(cor1, cor2);
    curv.position.setZ(j * 20 + 17.5);
    aux1 = reta(cor1, cor2);
    aux1.position.setX(37.5);
    aux1.rotateY(THREE.MathUtils.degToRad(90));
    curv.add(aux1);
    aux.add(curv);
    if (i == 0) {
      aux.position.setX(9 * 20 + 0.5);
      aux.position.setZ(5 * 20);
      let tunnel = tunel();
      tunnel.position.set(0, 0, 40);
      aux.add(tunnel);
    } else if (i == 1) {
      aux.position.setX(7 * 20 - 2.5);
      aux.position.setZ(-37.5);
    }
    aux.rotateY(THREE.MathUtils.degToRad(90 * (i + 2)));
    pista.add(aux);
  }
  let trees = block5();
  trees.position.set(110, -25, 80);
  trees.translateY(-8.2);
  pista.add(trees);
  let trees1 = block6();
  trees1.position.set(320, -25, 60);
  trees1.translateY(-8.2);
  pista.add(trees1);
  let trees2 = block1();
  trees2.position.set(110, -25, 250);
  trees2.translateY(-8.2);
  pista.add(trees2);
  let trees3 = block3();
  trees3.position.set(260, -25, 250);
  trees3.translateY(-8.2);
  pista.add(trees3);
  checkpoints.splice(
    0,
    checkpoints.length,
    checkpoints[0], // ordem 0
    checkpoints[3], // ordem 1
    checkpoints[1], // ordem 2
    checkpoints[4], // ordem 3
    checkpoints[2], // ordem 4
    checkpoints[5], // ordem 5
  );
  // atualiza userData.order
  checkpoints.forEach((cp, i) => (cp.userData.order = i));
  pista.scale.x = -1;
  pista.scale.x *= 0.5;
  pista.scale.y *= 0.5;
  pista.scale.z *= 0.5;

  // aranha
  let loader = new GLTFLoader();
  loader.load(
    "./objects/spider.glb",
    function (gltf) {
      let spider1 = gltf.scene;
      spider1.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      spider1.position.set(268, 9, 170);
      spider1.rotateY(THREE.MathUtils.degToRad(-90));
      spider1.rotateX(THREE.MathUtils.degToRad(-90));
      spider1.rotateZ(THREE.MathUtils.degToRad(-90));
      pista.add(spider1);
    },
    null,
    null,
  );
  loader.load(
    "./objects/spider.glb",
    function (gltf) {
      let spider2 = gltf.scene;
      spider2.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      spider2.position.set(180, 26, 45);
      pista.add(spider2);
    },
    null,
    null,
  );
  loader.load(
    "./objects/spider.glb",
    function (gltf) {
      let spider3 = gltf.scene;
      spider3.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      spider3.position.set(35, 0, 290);
      spider3.rotateX(THREE.MathUtils.degToRad(-90));
      pista.add(spider3);
    },
    null,
    null,
  );
  //abóbora
  loader.load(
    "./objects/pumpkin.glb",
    function (gltf) {
      let pumpkin1 = gltf.scene;
      pumpkin1.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      pumpkin1.position.set(-270, -35, 460);
      pumpkin1.scale.set(10, 12, 10);
      pumpkin1.rotateY(THREE.MathUtils.degToRad(180));
      pista.add(pumpkin1);
    },
    null,
    null,
  );
  loader.load(
    "./objects/pumpkin.glb",
    function (gltf) {
      let pumpkin2 = gltf.scene;
      pumpkin2.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      pumpkin2.position.set(370, -35, -190);
      pumpkin2.scale.set(10, 12, 10);
      pumpkin2.rotateY(THREE.MathUtils.degToRad(-90));
      pista.add(pumpkin2);
    },
    null,
    null,
  );
  loader.load(
    "./objects/pumpkin.glb",
    function (gltf) {
      let pumpkin3 = gltf.scene;
      pumpkin3.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      pumpkin3.position.set(320, -35, 200);
      pumpkin3.scale.set(10, 12, 10);
      pumpkin3.rotateY(THREE.MathUtils.degToRad(-90));
      pista.add(pumpkin3);
    },
    null,
    null,
  );

  return pista;
}

function auxPista3(cor1, cor2, comLinhaChegada) {
  let aux = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    let j;
    let aux1 = reta(cor1, cor2);
    for (j = 1; j < 6; j++) {
      let ret;
      if (j == 1 && i == 0 && comLinhaChegada) {
        ret = reta("white", cor2);
        ret.userData.isLinhaChegada = true;
        ret.userData.lineNormal = new THREE.Vector3(0, 0, 1);
        chegada = ret;
      } else {
        if (i == 1 && j > 2 && j < 5 && comLinhaChegada) {
          const buracoGeo = new THREE.BoxGeometry(50, 0.1, 20);
          const buracoMat = new THREE.MeshBasicMaterial({ visible: false });
          ret = new THREE.Mesh(buracoGeo, buracoMat);
          ret.translateY(2);
          buraco.push(ret);
        } else if (i == 1 && j == 2 && comLinhaChegada) {
          ret = reta(cor1, cor2);
          ret.rotateX(THREE.MathUtils.degToRad(-20));
        } else ret = reta(cor1, cor2);
      }
      ret.position.setZ(j * 20);
      if (i == 1 && j == 2 && comLinhaChegada) {
        ret.translateY(4.5);
        ret.translateZ(-3);
        ret.userData.rampUp = true;
        rampa.push(ret);
      }
      aux1.add(ret);
    }
    let tree = block120x40(5, 20);
    tree.position.set(-90, -25, 50);
    tree.rotateY(THREE.MathUtils.degToRad(90));
    tree.translateY(-8.2);
    aux1.add(tree);
    if (i != 2) {
      let curv = curva(cor1, cor2);
      if (i != 0) curv.position.setZ((j + 1) * 20 + 17.5);
      else curv.position.setZ(j * 20 + 17.5);
      aux1.add(curv);
    }
    aux1.rotateY(THREE.MathUtils.degToRad(90 * i));
    if (i == 1) {
      let ret = reta(cor1, cor2);
      ret.position.setZ(j * 20);
      aux1.add(ret);
      aux1.position.setX(37.5);
      aux1.position.setZ(j * 20 + 17.5);
    }
    if (i == 2) {
      aux1.position.setX((j + 1) * 20 + 55);
      aux1.position.setZ(j * 20 - 20);
      let tunnel = tunel();
      tunnel.position.set(0, 0, 60);
      aux1.add(tunnel);
    }
    if (i == 3) {
      let ret = reta(cor1, cor2);
      ret.position.setZ(j * 20);
      aux1.add(ret);
      aux1.position.setX((j + 1) * 20 + 17.5);
      aux1.position.setZ(-37.5);
      let tunnel = tunel();
      tunnel.position.set(0, 0, 40);
      aux1.add(tunnel);
    }
    aux.add(aux1);
  }
  let trees = block1();
  trees.position.set(110, -25, 70);
  trees.translateY(-8.2);
  aux.add(trees);
  return aux;
}
export function pista3() {
  let cor1 = "lightgrey",
    cor2 = "blue";
  let pista = new THREE.Group();

  let cruza = cruzamento(cor1, cor2);
  cruza.position.setZ(-37.5);
  cruza.position.setX(195);
  pista.add(cruza);

  let base = auxPista3(cor1, cor2, true);

  let espelhada = auxPista3(cor1, cor2, false);
  espelhada.rotateY(THREE.MathUtils.degToRad(180));
  espelhada.position.x += 390;
  espelhada.position.z -= 75;
  checkpoints.splice(
    0,
    checkpoints.length,
    checkpoints[0], // ordem 0
    checkpoints[1], // ordem 1
    checkpoints[4], // ordem 2
    checkpoints[3], // ordem 3
    checkpoints[5], // ordem 4
    checkpoints[2], // ordem 5
  );
  // atualiza userData.order
  checkpoints.forEach((cp, i) => (cp.userData.order = i));
  pista.add(base);
  pista.add(espelhada);
  pista.scale.x = -1;
  pista.scale.x *= 0.5;
  pista.scale.y *= 0.5;
  pista.scale.z *= 0.5;

  // bola
  let loader = new GLTFLoader();
  loader.load(
    "./objects/beachBall.glb",
    function (gltf) {
      let ball1 = gltf.scene;
      ball1.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      ball1.position.set(225, 5, -70);
      ball1.scale.set(3, 3, 3);
      pista.add(ball1);
    },
    null,
    null,
  );
  loader.load(
    "./objects/beachBall.glb",
    function (gltf) {
      let ball2 = gltf.scene;
      ball2.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      ball2.position.set(100, 30, -37);
      ball2.scale.set(8, 8, 8);
      pista.add(ball2);
    },
    null,
    null,
  );
  loader.load(
    "./objects/beachBall.glb",
    function (gltf) {
      let ball3 = gltf.scene;
      ball3.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      ball3.position.set(115, -29, 140);
      ball3.scale.set(9, 9, 9);
      pista.add(ball3);
    },
    null,
    null,
  );
  // poço
  loader.load(
    "./objects/well.glb",
    function (gltf) {
      let well1 = gltf.scene;
      well1.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      well1.position.set(-200, -35, 150);
      well1.scale.set(2, 2, 2);
      pista.add(well1);
    },
    null,
    null,
  );
  loader.load(
    "./objects/well.glb",
    function (gltf) {
      let well2 = gltf.scene;
      well2.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      well2.position.set(350, -35, -450);
      well2.scale.set(2, 2, 2);
      pista.add(well2);
    },
    null,
    null,
  );
  loader.load(
    "./objects/well.glb",
    function (gltf) {
      let well3 = gltf.scene;
      well3.traverse(function (child) {
        if (child) {
          child.castShadow = true;
        }
      });
      well3.position.set(600, -35, 150);
      well3.scale.set(2, 2, 2);
      pista.add(well3);
    },
    null,
    null,
  );

  return pista;
}

function tree1() {
  let troncoGeometry = new THREE.CylinderGeometry(1, 2, 10, 4);
  let troncoMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
  let tronco = new THREE.Mesh(troncoGeometry, troncoMaterial);
  tronco.receiveShadow = true;
  tronco.castShadow = true;
  let folhasGeometry = new THREE.DodecahedronGeometry(6, 0);
  let folhasMaterial = new THREE.MeshLambertMaterial({ color: "darkgreen" });
  let folhas = new THREE.Mesh(folhasGeometry, folhasMaterial);
  folhas.receiveShadow = true;
  folhas.castShadow = true;
  folhas.position.set(0, 8, 0);
  tronco.add(folhas);
  tronco.position.set(0, 5, 0);
  return tronco;
}

function tree2() {
  let troncoGeometry = new THREE.CylinderGeometry(1, 2, 10, 4);
  let troncoMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
  let tronco = new THREE.Mesh(troncoGeometry, troncoMaterial);
  tronco.receiveShadow = true;
  tronco.castShadow = true;
  let folhasGeometry = new THREE.DodecahedronGeometry(6, 0);
  let folhasMaterial = new THREE.MeshLambertMaterial({ color: "darkgreen" });
  let folhas = new THREE.Mesh(folhasGeometry, folhasMaterial);
  folhas.position.set(0, 8, 0);
  folhas.receiveShadow = true;
  folhas.castShadow = true;
  tronco.add(folhas);
  let galho1 = tronco.clone();
  galho1.scale.set(0.5, 0.5, 0.5);
  galho1.position.set(2, 2, 0);
  galho1.rotateZ(THREE.MathUtils.degToRad(-60));
  galho1.receiveShadow = true;
  galho1.castShadow = true;
  let galho2 = tronco.clone();
  galho2.scale.set(0.5, 0.5, 0.5);
  galho2.position.set(-2, 1, 0);
  galho2.rotateZ(THREE.MathUtils.degToRad(60));
  galho2.receiveShadow = true;
  galho2.castShadow = true;
  tronco.add(galho1);
  tronco.add(galho2);
  tronco.position.set(0, 5, 0);
  return tronco;
}

function tree3() {
  let troncoGeometry = new THREE.CylinderGeometry(1, 2, 10, 4);
  let troncoMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
  let tronco = new THREE.Mesh(troncoGeometry, troncoMaterial);
  tronco.receiveShadow = true;
  tronco.castShadow = true;
  let folhasGeometry = new THREE.ConeGeometry(6, 6, 15);
  let folhasMaterial = new THREE.MeshLambertMaterial({ color: "darkgreen" });
  let folhas1 = new THREE.Mesh(folhasGeometry, folhasMaterial);
  folhas1.receiveShadow = true;
  folhas1.castShadow = true;
  folhas1.position.set(0, 2, 0);
  let folhas2 = folhas1.clone();
  folhas2.scale.set(0.8, 0.8, 0.8);
  folhas2.position.set(0, 5, 0);
  let folhas3 = folhas1.clone();
  folhas3.scale.set(0.6, 0.6, 0.6);
  folhas3.position.set(0, 8, 0);
  tronco.add(folhas1);
  tronco.add(folhas2);
  tronco.add(folhas3);
  tronco.position.set(0, 5, 0);
  return tronco;
}

// Função auxiliar para escolher aleatoriamente uma árvore
function randomTree() {
  const trees = [tree1, tree2, tree3];
  const index = Math.floor(Math.random() * trees.length);
  return trees[index]();
}

// Função auxiliar para criar um bloco genérico
function createBlock(minTrees, maxTrees) {
  const group = new THREE.Group();
  const numTrees =
    Math.floor(Math.random() * (maxTrees - minTrees + 1)) + minTrees;

  for (let i = 0; i < numTrees; i++) {
    const tree = randomTree();

    // posição aleatória dentro da área 160x160
    const x = Math.random() * 120 - 80; // centro no (0,0)
    const z = Math.random() * 120 - 80;
    tree.position.set(x, tree.position.y, z);

    // rotação aleatória para variar
    tree.rotation.y = Math.random() * Math.PI * 2;

    group.add(tree);
  }

  return group;
}

function block280x80(minTrees, maxTrees) {
  const group = new THREE.Group();
  const numTrees =
    Math.floor(Math.random() * (maxTrees - minTrees + 1)) + minTrees;

  for (let i = 0; i < numTrees; i++) {
    const tree = randomTree();

    // posição aleatória dentro da área 280x80
    const x = Math.random() * 280 - 160; // centro no eixo X
    const z = Math.random() * 80 - 40; // centro no eixo Z
    tree.position.set(x, tree.position.y, z);

    // rotação aleatória para variar
    tree.rotation.y = Math.random() * Math.PI * 2;

    group.add(tree);
  }
  return group;
}

function block120x40(minTrees, maxTrees) {
  const group = new THREE.Group();
  const numTrees =
    Math.floor(Math.random() * (maxTrees - minTrees + 1)) + minTrees;

  for (let i = 0; i < numTrees; i++) {
    const tree = randomTree();

    // posição aleatória dentro da área 280x80
    const x = Math.random() * 120 - 60; // centro no eixo X
    const z = Math.random() * 80 - 40; // centro no eixo Z
    tree.position.set(x, tree.position.y, z);

    // rotação aleatória para variar
    tree.rotation.y = Math.random() * Math.PI * 2;

    group.add(tree);
  }

  return group;
}

// Agora criamos 6 funções de blocos diferentes
function block1() {
  return createBlock(5, 20);
}

function block2() {
  return createBlock(8, 15);
}

function block3() {
  return createBlock(10, 20);
}

function block4() {
  return createBlock(6, 12);
}

function block5() {
  return createBlock(7, 18);
}

function block6() {
  return createBlock(5, 10);
}

import * as THREE from "three";

let player;
let playerBox = new THREE.Box3();
let forwardVec = new THREE.Vector3();
let moveVec = new THREE.Vector3();

// =========================
// ESTADO DO PLAYER
// =========================
let speed = 0;
let maxSpeed = 0.75;
let acceleration = 0.05;
let friction = 0.004;
let playerR = 2.0;

let steering = 0;
let maxSteering = 0.05;
let steeringDelta = 0.01;
let steeringReturn = 0.04;
let turnSign = -1;

let ultimoDisparoPlayer = 0;

// controle fino do alinhamento
const ALIGN_FACTOR = 0.15; // quanto aplicar do ajuste por colisão (0-1). Menor = mais suave
const ALIGN_MAX_ROT_PER_FRAME = 0.06; // limite de rotação por frame ao alinhar

const COOLDOWN = 500;

export function returnSpeed() {
  return speed * 117.33;
}

export function createPlayer(linhaChegada) {
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
    color: "yellow",
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
    color: "red",
    shininess: "200",
    specular: "red",
  });

  // base
  let cylinderGeometry1 = new THREE.CylinderGeometry(4, 4, 0.3);
  player = new THREE.Mesh(cylinderGeometry1, base);
  player.scale.set(0.5 * 1.1, 0.5 * 1, 0.5 * 0.6);

  // posicionamento inicial pela linha de chegada
  let centro = new THREE.Vector3();
  new THREE.Box3().setFromObject(linhaChegada).getCenter(centro);
  player.position.copy(centro);
  player.translateY(3.5);
  player.quaternion.setFromUnitVectors(
    new THREE.Vector3(1, 0, 0), // frente no eixo X
    linhaChegada.userData.lineNormal.clone().normalize(),
  );

  function createLaterais(z) {
    var textureLoader = new THREE.TextureLoader();
    let cylG = new THREE.CylinderGeometry(1.3, 1.3, 7, 45);
    let lateral = new THREE.Mesh(cylG, laterais);
    lateral.material.map = textureLoader.load("./textures/lateral.jpg");
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

  let capaRGeometry = new THREE.PlaneGeometry(9.0, 9.5);
  let capaR = new THREE.Mesh(capaRGeometry, capaMat);
  capaR.position.set(-1.0, 1.1, 0);
  capaR.rotateX(THREE.MathUtils.degToRad(-90));
  capaR.receiveShadow = true;
  capaR.castShadow = true;
  cube.add(capaR);

  let capaCGeometry = new THREE.CircleGeometry(4.7, 32, 0, 3.2);
  let capaC = new THREE.Mesh(capaCGeometry, capaMat);
  capaC.position.set(3.5, 1.1, 0);
  capaC.rotateX(THREE.MathUtils.degToRad(-90));
  capaC.rotateZ(THREE.MathUtils.degToRad(-90));
  capaC.receiveShadow = true;
  capaC.castShadow = true;
  cube.add(capaC);

  let cabineGeometry = new THREE.SphereGeometry(8, 32, 16, 0, 6.5, 0, 0.6);
  let cabine = new THREE.Mesh(cabineGeometry, cabineMat);
  cabine.position.setY(-5.6);
  cabine.scale.set(0.7, 1, 0.8);
  cabine.receiveShadow = true;
  cabine.castShadow = true;
  cube.add(cabine);

  let posteGeometry = new THREE.ConeGeometry(0.5, 1.5);
  let poste = new THREE.Mesh(posteGeometry, material2);
  poste.rotateX(THREE.MathUtils.degToRad(90));
  poste.position.set(-3.5, 0, 0.6);
  poste.receiveShadow = true;
  poste.castShadow = true;
  capaR.add(poste);

  let turbinaGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.9);
  let turbina = new THREE.Mesh(turbinaGeometry, material2);
  turbina.position.set(-3.5, 0, 1.5);
  turbina.scale.set(1, 1.3, 0.7);
  turbina.rotateZ(THREE.MathUtils.degToRad(90));
  turbina.receiveShadow = true;
  turbina.castShadow = true;
  capaR.add(turbina);

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

let keys = {};
window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

// =====================
// UPDATE PLAYER COM CHECKPOINTS
// =====================
export function updatePlayer(
  playerRef,
  npcs,
  colisaoMuretas,
  tirosPlayer,
  tirosRestantesPlayer,
  rampa,
  buraco
) {
  if (!playerRef || !npcs) return;
  player = playerRef;
  const agora = performance.now();

  //disparo
  if (
    keys[" "] &&
    tirosRestantesPlayer > 0 &&
    agora - ultimoDisparoPlayer > COOLDOWN
  ) {
    const proj = criarProjetil(player);
    tirosPlayer.push(proj);
    ultimoDisparoPlayer = agora; // atualiza o tempo do último disparo
    return proj; // devolve para o main.js adicionar na cena
  }
  // aceleração
  if (keys["w"] || keys["arrowup"] || keys["x"]) speed += acceleration;
  if (keys["s"] || keys["arrowdown"]) speed -= acceleration;
  speed = THREE.MathUtils.clamp(speed, -maxSpeed, maxSpeed);

  // steering
  if (keys["d"] || keys["arrowright"]) {
    steering = Math.max(maxSteering, steering - steeringDelta);
  } else if (keys["a"] || keys["arrowleft"]) {
    steering = Math.min(-maxSteering, steering + steeringDelta);
  } else {
    if (steering > 0) steering = Math.max(0, steering - steeringReturn);
    else steering = Math.min(0, steering + steeringReturn);
  }
  if (Math.abs(steering) < 1e-4) steering = 0;

  // rotação
  if (Math.abs(speed) > 1e-4 && Math.abs(steering) > 0) {
    const turnAmount = steering * Math.abs(speed * 1.5) * turnSign;
    player.rotateY(turnAmount);
  }

  // direção forward (frente no eixo X)
  forwardVec
    .set(1, 0, 0)
    .applyQuaternion(player.quaternion)
    .setY(0)
    .normalize();

  // vetor de entrada
  const incomingVec = forwardVec.clone().multiplyScalar(speed);
  moveVec.copy(incomingVec);

  // bounding box atual do hitbox do player
  playerBox.setFromObject(player.userData.hitbox);
  for (let r of rampa) {
    const rampBox = new THREE.Box3().setFromObject(r);
  
    if (playerBox.intersectsBox(rampBox) && !player.userData.isJumping) {
      player.userData.isJumping = true;
      player.userData.velocityY = 0.35;
      player.userData.alturaInicial = player.position.y;
  
      // salva orientação original
      player.userData.originalQuat = player.quaternion.clone();
  
      const moveDir = incomingVec.clone().normalize();
      const rampNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(r.quaternion).normalize();
      const jumpDir = moveDir.clone().add(rampNormal).normalize();
      
      let angle = moveDir.angleTo(jumpDir);
      // cria uma rotação apenas em Z
      const q = new THREE.Quaternion();
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
      
      // aplica ao player
      player.quaternion.multiply(q);
    }
  }
  for (let b of buraco) {
    const holeBox = new THREE.Box3().setFromObject(b);
    if (playerBox.intersectsBox(holeBox) && !player.userData.isJumping) {
      if (player.userData.lastCheckpoint) {
        player.position.copy(player.userData.lastCheckpoint.position);
        player.quaternion.copy(player.userData.lastCheckpoint.quaternion);
        speed = 0;
      }
    }
  }  
  
  if (player.userData.isJumping) {
    player.position.y += player.userData.velocityY;
    player.userData.velocityY -= 0.01;
    steering = 0;
  
    if (player.position.y <= player.userData.alturaInicial) {
      player.position.y = player.userData.alturaInicial;
      player.userData.isJumping = false;
  
      if (player.userData.originalQuat) {
        player.quaternion.copy(player.userData.originalQuat);
      }
    }
  }
  // caixa hipotética do próximo passo
  const tempBox = playerBox.clone().translate(moveVec);

  const nextCenter = new THREE.Vector3();
  tempBox.getCenter(nextCenter);

  checarColisaoPlayerNpcs(player, npcs, moveVec, incomingVec, playerBox);
  // loop das muretas
  for (let muroEnt of colisaoMuretas) {
    const muro = muroEnt.mesh;
    const tipo = muroEnt.type;

    if (tipo === "box") {
      const muroBox = new THREE.Box3().setFromObject(muro);

      if (tempBox.intersectsBox(muroBox)) {
        tratamentoColisaoBox(player, muroBox, moveVec, incomingVec, playerBox);
      }
    } else if (tipo === "cylinder") {
      const cilCentro = new THREE.Vector3().setFromMatrixPosition(
        muro.matrixWorld,
      );
      const dx = nextCenter.x - cilCentro.x;
      const dz = nextCenter.z - cilCentro.z;
      const dist = Math.hypot(dx, dz);
      const radius = muroEnt.radius;

      const overlap = radius + playerR - dist;
      if (overlap > 0) {
        tratamentoColisaoCilindro(
          player,
          cilCentro,
          radius,
          moveVec,
          incomingVec,
          playerBox,
        );
      }
    }
  }

  // aplica movimento final
  player.position.add(moveVec);

  // atrito
  if (
    !keys["w"] &&
    !keys["s"] &&
    !keys["arrowup"] &&
    !keys["arrowdown"] &&
    !keys["x"]
  ) {
    if (speed > 0) speed = Math.max(0, speed - friction);
    else if (speed < 0) speed = Math.min(0, speed + friction);
  }
  if (player.userData.penalizado) {
    player.userData.tempoPenalizacao--;
    maxSpeed = player.userData.velocidadeAtual;
    if (player.userData.tempoPenalizacao <= 0) {
      player.userData.penalizado = false;
      maxSpeed = player.userData.velocidadeOriginal;
    }
  }

  // atualizar BBox final do hitbox
  playerBox.setFromObject(player.userData.hitbox);
}

/* =============
   COLISÃO BOX
   ============= */
function tratamentoColisaoBox(
  player,
  muroBox,
  moveVecRef,
  incomingVec,
  playerBox,
) {
  if (!playerBox.intersectsBox(muroBox)) return;

  const overlapX =
    Math.min(playerBox.max.x, muroBox.max.x) -
    Math.max(playerBox.min.x, muroBox.min.x);
  const overlapZ =
    Math.min(playerBox.max.z, muroBox.max.z) -
    Math.max(playerBox.min.z, muroBox.min.z);

  if (overlapX <= 0 || overlapZ <= 0) return;

  const pC = new THREE.Vector3();
  const mC = new THREE.Vector3();
  playerBox.getCenter(pC);
  muroBox.getCenter(mC);

  let normal = new THREE.Vector3();

  // empurra pelo eixo de menor penetração
  if (overlapX < overlapZ) {
    const dirX = pC.x < mC.x ? -1 : 1;
    normal.set(dirX, 0, 0);
    player.position.x += dirX * (overlapX + 0.001);
    moveVecRef.x = 0;
  } else {
    const dirZ = pC.z < mC.z ? -1 : 1;
    normal.set(0, 0, dirZ);
    player.position.z += dirZ * (overlapZ + 0.001);
    moveVecRef.z = 0;
  }

  const n = normal.clone().setY(0).normalize();

  // perda gradual de velocidade
  perdaVelPorAnguloComMove(incomingVec, n);

  const dirIn = incomingVec.clone().setY(0).normalize();
  const dotIn = dirIn.dot(n);

  if (dotIn > 0.8) {
    // impacto frontal → parar seco
    speed = 0;
    moveVecRef.set(0, 0, 0);
    return;
  }

  const forward = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(player.quaternion)
    .setY(0)
    .normalize();
  const movingBackwards = incomingVec.lengthSq() > 0 && dirIn.dot(forward) < 0;

  if (Math.abs(speed) > 0.02) {
    // deslizar ao longo da parede
    let tangente = new THREE.Vector3()
      .crossVectors(n, new THREE.Vector3(0, 1, 0))
      .normalize();
    if (tangente.dot(incomingVec) < 0) tangente.multiplyScalar(-1);

    const projTang = moveVecRef.dot(tangente);
    moveVecRef.copy(tangente.multiplyScalar(projTang));

    // atrito extra enquanto raspa
    const atritoExtra = 0.01;
    if (speed > 0) speed = Math.max(0, speed - atritoExtra);
    else if (speed < 0) speed = Math.min(0, speed + atritoExtra);

    // alinhar player e suavizar moveVec para acompanhar a rotação
    alinharNaTangente(player, n, moveVecRef, incomingVec);
  }
}

/* =================
   COLISÃO CILINDRO
   ================= */
function tratamentoColisaoCilindro(
  player,
  centro,
  raio,
  moveVecRef,
  incomingVec,
  playerBox,
) {
  const playerC = new THREE.Vector3();
  playerBox.getCenter(playerC);
  playerC.setY(0);
  const c = centro.clone().setY(0);

  const dir = playerC.clone().sub(c);
  const dist = dir.length();
  if (dist === 0) {
    if (moveVecRef.lengthSq() > 0) {
      const fake = moveVecRef.clone().setY(0).normalize();
      player.position.addScaledVector(fake, -0.03);
    }
    return;
  }

  const penetration = raio - dist + 0.001;
  if (penetration <= 0) return;

  const normal = dir.clone().normalize();

  player.position.addScaledVector(normal, penetration);

  const proj = moveVecRef.dot(normal);
  if (proj > 0) moveVecRef.addScaledVector(normal, -proj);

  const n = normal.clone().setY(0).normalize();
  perdaVelPorAnguloComMove(incomingVec, n);

  const dirIn = incomingVec.clone().setY(0).normalize();
  const dotIn = dirIn.dot(n);

  if (dotIn > 0.8) {
    speed = 0;
    moveVecRef.set(0, 0, 0);
    return;
  }

  const forward = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(player.quaternion)
    .setY(0)
    .normalize();
  const movingBackwards = incomingVec.lengthSq() > 0 && dirIn.dot(forward) < 0;

  if (Math.abs(speed) > 0.02) {
    // deslizar ao longo da parede curva
    let tangente = new THREE.Vector3()
      .crossVectors(n, new THREE.Vector3(0, 1, 0))
      .normalize();
    if (tangente.dot(incomingVec) < 0) tangente.multiplyScalar(-1);

    const projTang = moveVecRef.dot(tangente);
    moveVecRef.copy(tangente.multiplyScalar(projTang));

    const atritoExtra = 0.01;
    if (speed > 0) speed = Math.max(0, speed - atritoExtra);
    else if (speed < 0) speed = Math.min(0, speed + atritoExtra);

    alinharNaTangente(player, n, moveVecRef, incomingVec);
  }
}

/* ===========================================================
   PERDA DE VELOCIDADE BASEADA NO ÂNGULO (gradual)
   =========================================================== */
function perdaVelPorAnguloComMove(moveVecLocal, normal) {
  const len = moveVecLocal.length();
  if (len < 1e-4) return;

  const dirMov = moveVecLocal.clone().setY(0).normalize();
  const cos = dirMov.dot(normal);

  // tangente → sem perda (cos ≈ 0 ou negativo => pouca perda)
  if (cos > 0.7) return;

  // frontal → perda maior
  let fator = cos < 0.25 ? 0.9 : 0.4; // valores aumentados para efeito perceptível
  const perda = THREE.MathUtils.clamp(Math.abs(cos) * fator, 0, 0.9);

  // redução gradual por frame
  const REDUCAO_MULT = 0.009;
  const reducao = perda * REDUCAO_MULT;
  if (speed > 0) speed = Math.max(0, speed - reducao);
  else if (speed < 0) speed = Math.min(0, speed + reducao);
}

/* ==========================================
   ALINHAR NA DIREÇÃO DA TANGENTE DA MURETA
   ========================================== */

function alinharNaTangente(player, normal, moveVecRef, moveVecOrig) {
  const len = moveVecOrig.length();
  if (len < 1e-4) return;

  // direção atual do movimento
  const dirMov = moveVecOrig.clone().setY(0).normalize();
  // normal da mureta
  const n = normal.clone().setY(0).normalize();

  // se estiver quase perpendicular (frontal), não alinhar
  const dot = dirMov.dot(n);
  if (dot > 0.8) return;

  // tangente da mureta
  let tangente = new THREE.Vector3()
    .crossVectors(n, new THREE.Vector3(0, 1, 0))
    .normalize();
  if (tangente.dot(dirMov) < 0) tangente.multiplyScalar(-1);

  // direção atual do carro (frente)
  const forward = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(player.quaternion)
    .setY(0)
    .normalize();

  // ângulo entre frente do carro e tangente
  let angle = forward.angleTo(tangente);

  // sinal do ângulo
  const cross = new THREE.Vector3().crossVectors(forward, tangente);
  const sign = cross.y < 0 ? -1 : 1;
  angle *= sign;

  // evita tremor pequeno
  if (Math.abs(angle) < 0.007) {
    // mas ainda podemos ajustar moveVec um pouco
    const desired = tangente.clone().multiplyScalar(moveVecRef.length());
    moveVecRef.lerp(desired, ALIGN_FACTOR);
    return;
  }

  // limite de rotação por frame e aplica ALIGN_FACTOR para suavizar
  const finalAng =
    THREE.MathUtils.clamp(
      angle,
      -ALIGN_MAX_ROT_PER_FRAME,
      ALIGN_MAX_ROT_PER_FRAME,
    ) * ALIGN_FACTOR;

  // aplica rotação para alinhar ao longo da tangente (suavemente)
  player.rotateY(finalAng);

  // suaviza steering
  steering *= 0.6;

  // atualiza forwardVec
  forwardVec
    .set(1, 0, 0)
    .applyQuaternion(player.quaternion)
    .setY(0)
    .normalize();

  // faz o moveVec acompanhar a tangente gradualmente
  const desired = tangente.clone().multiplyScalar(moveVecRef.length());
  moveVecRef.lerp(desired, ALIGN_FACTOR * 0.9); // lerp forte o suficiente para acompanhar mas suave
}

/* ===========================================================
   CHECAR COLISÃO ENTRE PLAYER E NPC
   =========================================================== */
export function checarColisaoPlayerNpcs(
    player,
    npcs,
    moveVec,
    incomingVec,
    playerBox,
  ) {
    if (!player || !npcs) return;
  
    // caixa hipotética do próximo passo do player
    const tempBox = playerBox.clone().translate(moveVec);
  
    for (let npc of npcs) {
      if (!npc) continue;
      const npcBox = new THREE.Box3().setFromObject(npc.userData.hitbox);
  
      if (tempBox.intersectsBox(npcBox)) {
        tratamentoColisaoBox(player, npcBox, moveVec, incomingVec, playerBox);
      }
    }
  }
  

function criarProjetil(origem) {
  const geo = new THREE.SphereGeometry(0.3, 20, 20);
  const mat = new THREE.MeshPhongMaterial({ color: "red", shininess: 100 });
  const proj = new THREE.Mesh(geo, mat);
  proj.position.copy(origem.position);
  proj.translateY(1);
  proj.quaternion.copy(origem.quaternion);
  proj.userData.direcao = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(origem.quaternion)
    .normalize();
  proj.userData.tempo = 0;
  return proj;
}
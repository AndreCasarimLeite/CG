import * as THREE from "three";

let npc;
let npcBox = new THREE.Box3();
let forwardVec = new THREE.Vector3();
let moveVec = new THREE.Vector3();

// controle fino do alinhamento
const ALIGN_FACTOR = 0.25;
const ALIGN_MAX_ROT_PER_FRAME = 0.06; // limite de rotação por frame ao alinhar

const COOLDOWN = 2000;

export function createnpc(linhaChegada) {
  let matFosco, matBrilho;
  matFosco = new THREE.MeshLambertMaterial({
    color: "pink",
  });
  matBrilho = new THREE.MeshPhongMaterial({
    color: "pink",
    shininess: "200",
    specular: "pink",
  });

  // base
  let cylinderGeometry1 = new THREE.CylinderGeometry(4, 4, 0.3);
  npc = new THREE.Mesh(cylinderGeometry1, matFosco);
  npc.scale.set(0.5 * 1.1, 0.5 * 1, 0.5 * 0.6);

  // posicionamento inicial pela linha de chegada
  let centro = new THREE.Vector3();
  new THREE.Box3().setFromObject(linhaChegada).getCenter(centro);
  npc.position.copy(centro);
  npc.translateY(3.5);
  npc.quaternion.setFromUnitVectors(
    new THREE.Vector3(1, 0, 0), // frente no eixo X
    linhaChegada.userData.lineNormal.clone().normalize(),
  );

  function createLaterais(z) {
    var textureLoader = new THREE.TextureLoader();
    let cylG = new THREE.CylinderGeometry(1.3, 1.3, 7, 45);
    let lateral = new THREE.Mesh(cylG, matFosco);
    lateral.material.map = textureLoader.load("./textures/lateral.jpg");
    lateral.position.set(0.0, 1.0, z);
    lateral.scale.x = 1 / 1.3;
    lateral.rotateZ(THREE.MathUtils.degToRad(90));
    lateral.receiveShadow = true;
    lateral.castShadow = true;
    npc.add(lateral);
  }

  // núcleo
  let cubeGeometry = new THREE.BoxGeometry(9, 2, 7.5);
  let cube = new THREE.Mesh(cubeGeometry, matFosco);
  cube.position.setY(1);
  cube.scale.x = 1 / 1.3;
  npc.add(cube);
  createLaterais(-3.8);
  createLaterais(3.8);
  cube.castShadow = true;

  let torusGeometry = new THREE.TorusGeometry(2.1, 1.0, 16, 100, 2.5);
  let torus = new THREE.Mesh(torusGeometry, matFosco);
  torus.position.set(2.8, 0, -0.05);
  torus.scale.set(1.7, 1.8, 1);
  torus.rotateX(THREE.MathUtils.degToRad(90));
  torus.rotateZ(THREE.MathUtils.degToRad(-71));
  torus.receiveShadow = true;
  torus.castShadow = true;
  cube.add(torus);

  let atrasGeometry = new THREE.BoxGeometry(1, 2, 9.5);
  let atras = new THREE.Mesh(atrasGeometry, matBrilho);
  atras.position.setX(-5);
  atras.receiveShadow = true;
  atras.castShadow = true;
  cube.add(atras);

  let capaRGeometry = new THREE.PlaneGeometry(9.0, 9.5);
  let capaR = new THREE.Mesh(capaRGeometry, matBrilho);
  capaR.position.set(-1.0, 1.1, 0);
  capaR.rotateX(THREE.MathUtils.degToRad(-90));
  capaR.receiveShadow = true;
  capaR.castShadow = true;
  cube.add(capaR);

  let capaCGeometry = new THREE.CircleGeometry(4.7, 32, 0, 3.2);
  let capaC = new THREE.Mesh(capaCGeometry, matBrilho);
  capaC.position.set(3.5, 1.1, 0);
  capaC.rotateX(THREE.MathUtils.degToRad(-90));
  capaC.rotateZ(THREE.MathUtils.degToRad(-90));
  capaC.receiveShadow = true;
  capaC.castShadow = true;
  cube.add(capaC);

  let cabineGeometry = new THREE.SphereGeometry(8, 32, 16, 0, 6.5, 0, 0.6);
  let cabine = new THREE.Mesh(cabineGeometry, matBrilho);
  cabine.position.setY(-5.6);
  cabine.scale.set(0.7, 1, 0.8);
  cabine.receiveShadow = true;
  cabine.castShadow = true;
  cube.add(cabine);

  let posteGeometry = new THREE.ConeGeometry(0.5, 1.5);
  let poste = new THREE.Mesh(posteGeometry, matFosco);
  poste.rotateX(THREE.MathUtils.degToRad(90));
  poste.position.set(-3.5, 0, 0.6);
  poste.receiveShadow = true;
  poste.castShadow = true;
  capaR.add(poste);

  let turbinaGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.9);
  let turbina = new THREE.Mesh(turbinaGeometry, matFosco);
  turbina.position.set(-3.5, 0, 1.5);
  turbina.scale.set(1, 1.3, 0.7);
  turbina.rotateZ(THREE.MathUtils.degToRad(90));
  turbina.receiveShadow = true;
  turbina.castShadow = true;
  capaR.add(turbina);

  // garante bounding boxes das geometrias filhas (evita Box3 gigante)
  npc.traverse((n) => {
    if (n.isMesh && n.geometry && !n.geometry.boundingBox)
      n.geometry.computeBoundingBox();
  });

  // === HITBOX SIMPLIFICADO PARA COLISÃO/PREVISÃO ===
  const hitboxGeometry = new THREE.BoxGeometry(9, 2, 7.5); // dimensões aproximadas do corpo
  const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
  hitbox.position.set(0, 1, 0); // centralizado no npc
  npc.add(hitbox);
  // guarda referência para usar no updatenpc
  npc.userData.hitbox = hitbox;

  npc.userData.voltas = 0;
  npc.userData.currentWaypoint = 0;
  npc.userData.lastWaypoint = 0;
  npc.userData.allPassed = false;

  npc.userData.isJumping = false;
  npc.userData.velocityY = 0;
  npc.userData.speed = 0;
  npc.userData.maxSpeed = 0.75;
  npc.userData.acceleration = 0.05;
  npc.userData.friction = 0.004;
  npc.userData.npcR = 2.0;

  npc.userData.steering = 0;
  npc.userData.maxSteering = 0.05;
  npc.userData.steeringReturn = 0.04;

  // penalização
  npc.userData.penalizado = false;
  npc.userData.velocidadeOriginal = 0.75;
  npc.userData.velocidadeAtual = 0.75;
  npc.userData.tempoPenalizacao = 0;

  // tiros
  npc.userData.tiros = [];
  npc.userData.tirosRestantes = 4;
  npc.userData.ultimoDisparo = 0;

  // atualiza npcBox com base no hitbox
  npcBox.setFromObject(npc.userData.hitbox);
  return npc;
}

//Waypoint Following

// =========================
// UPDATE DO NPC
// =========================
export function updateNpc(
  npcRef,
  playerRef,
  colisaoMuretas,
  waypoints,
  rampa,
  buraco,
  npcs
) {
  npc = npcRef;
  let player = playerRef;
  npcBox.setFromObject(npc.userData.hitbox);

  // caixa do waypoint e centro
  const cpBox = new THREE.Box3().setFromObject(
    waypoints[npc.userData.currentWaypoint],
  );
  const cpCenter = new THREE.Vector3();
  cpBox.getCenter(cpCenter);

  // direção e distância até o alvo
  const toTarget = cpCenter.clone().sub(npc.position);
  const dist = toTarget.length();
  const dir = toTarget.clone().normalize();

  // vetor forward (frente = +X local do NPC)
  forwardVec.set(1, 0, 0).applyQuaternion(npc.quaternion).setY(0).normalize();

  // ângulo assinado entre forward e dir
  const angle = Math.atan2(
    forwardVec.z * dir.x - forwardVec.x * dir.z,
    forwardVec.dot(dir),
  );

  // update do steering
  if (Math.abs(angle) > 1e-3) {
    const delta = THREE.MathUtils.clamp(
      angle * ALIGN_FACTOR,
      -ALIGN_MAX_ROT_PER_FRAME,
      ALIGN_MAX_ROT_PER_FRAME,
    );
    npc.userData.steering = THREE.MathUtils.clamp(
      npc.userData.steering + delta,
      -npc.userData.maxSteering,
      npc.userData.maxSteering,
    );
  } else {
    npc.userData.steering *= 1 - npc.userData.steeringReturn;
  }

  // física de velocidade
  if (npc.userData.speed < npc.userData.maxSpeed) npc.userData.speed += npc.userData.acceleration;
  else npc.userData.speed -= npc.userData.friction;

  // movimento à frente
  const incomingVec = forwardVec.clone().multiplyScalar(npc.userData.speed);
  moveVec.copy(incomingVec);
  // =====================
  // RAMPAS E BURACOS NPC
  // =====================
  for (let r of rampa) {
    const rampBox = new THREE.Box3().setFromObject(r);

    if (npcBox.intersectsBox(rampBox) && !npc.userData.isJumping) {
      npc.userData.isJumping = true;
      npc.userData.velocityY = 0.25;
      npc.userData.alturaInicial = npc.position.y;

      npc.userData.originalQuat = npc.quaternion.clone();

      const moveDir = incomingVec.clone().normalize();
      const rampNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(r.quaternion).normalize();
      const jumpDir = moveDir.clone().add(rampNormal).normalize();

      let angle = moveDir.angleTo(jumpDir);
      // cria uma rotação apenas em Z
      const q = new THREE.Quaternion();
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), angle);
      
      // aplica ao player
      npc.quaternion.multiply(q);
    }
  }

  for (let b of buraco) {
    const holeBox = new THREE.Box3().setFromObject(b);
    if (npcBox.intersectsBox(holeBox) && !npc.userData.isJumping) {
      if (npc.userData.lastCheckpoint) {
        npc.position.copy(npc.userData.lastCheckpoint.position);
        npc.quaternion.copy(npc.userData.lastCheckpoint.quaternion);
        npc.userData.speed = 0;
        npc.userData.steering = 0;
      }
    }
  }  

  if (npc.userData.isJumping) {
    npc.position.y += npc.userData.velocityY;
    npc.userData.velocityY -= 0.01;

    if (npc.position.y <= npc.userData.alturaInicial) {
      npc.position.y = npc.userData.alturaInicial;
      npc.userData.isJumping = false;

      if (npc.userData.originalQuat) {
        npc.quaternion.copy(npc.userData.originalQuat);
      }
    }
  }

  // --- lógica de ultrapassagem ---
  for (let outro of npcs) {
    if (!outro) continue;

    const npcPos = npc.position.clone();
    const outroPos = outro.position.clone();
    const frenteNpc = new THREE.Vector3(0, 1, 0).applyQuaternion(npc.quaternion).normalize();

    const relacao = outroPos.clone().sub(npcPos).dot(frenteNpc);
    const dist = outroPos.distanceTo(npcPos);

    const DISTANCIA_ULTRAPASSAGEM = 5;
    const lateral = new THREE.Vector3().crossVectors(frenteNpc, new THREE.Vector3(0,1,0)).normalize();
    if (relacao > 0 && dist < DISTANCIA_ULTRAPASSAGEM) {
      npc.userData.ultrapassando = true;
      npc.userData.ladoUltrapassagem = outroPos.clone().sub(npcPos).dot(lateral) > 0 ? -1 : 1;
      npc.userData.tempoUltrapassagem = 300; // frames de desvio
    }
    
    if (npc.userData.ultrapassando) {
      const intensidade = 1.5 + npc.userData.speed * 0.5;
      npc.userData.steering += npc.userData.ladoUltrapassagem * intensidade;
      npc.userData.steering = THREE.MathUtils.clamp(
        npc.userData.steering,
        -npc.userData.maxSteering * 2, // permitir virar mais forte que o normal
        npc.userData.maxSteering * 2
      );
    
      npc.userData.tempoUltrapassagem--;
      if (npc.userData.tempoUltrapassagem <= 0) {
        npc.userData.ultrapassando = false;
      }
    }    
  }

  // update do steering com deadzone
  const ANGLE_DEADZONE = 0.1; // tolerância para não "sambar"
  if (Math.abs(angle) < ANGLE_DEADZONE) {
    npc.userData.steering *= 1 - npc.userData.steeringReturn;
  } else {
    const delta = THREE.MathUtils.clamp(
      angle * ALIGN_FACTOR,
      -ALIGN_MAX_ROT_PER_FRAME,
      ALIGN_MAX_ROT_PER_FRAME
    );
    npc.userData.steering = THREE.MathUtils.clamp(
      npc.userData.steering + delta,
      -npc.userData.maxSteering,
      npc.userData.maxSteering
    );
  }

  // aplica rotação proporcional à velocidade
  if (Math.abs(npc.userData.speed) > 1e-4) {
    const turnAmount = npc.userData.steering * Math.abs(npc.userData.speed * 1.5);
    npc.rotateY(turnAmount);
  }

  // avança posição
  npc.position.add(moveVec);

  // troca de waypoint com raio mais robusto
  const WAYPOINT_RADIUS = 20.0;
  if (dist < WAYPOINT_RADIUS) {
    // salva último waypoint em coordenadas de mundo
    const wp = waypoints[npc.userData.currentWaypoint];
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    wp.getWorldPosition(worldPos);
    wp.getWorldQuaternion(worldQuat);
  
    // aplica rotação de 180° no eixo Y para alinhar frente
    const rot180 = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.PI
    );
  
    npc.userData.lastWaypoint = {
      position: worldPos.clone(),
      quaternion: worldQuat.clone()
    };
  
    // avança para o próximo waypoint
    npc.userData.currentWaypoint =
      (npc.userData.currentWaypoint + 1) % waypoints.length;
      npc.userData.steering *= 0.5;
      if (npc.userData.currentWaypoint === 0) npc.userData.allPassed = true;
  }
  

  // bounding box atual do hitbox do npc
  npcBox.setFromObject(npc.userData.hitbox);

  // caixa hipotética do próximo passo
  const tempBox = npcBox.clone().translate(moveVec);

  const nextCenter = new THREE.Vector3();
  tempBox.getCenter(nextCenter);

  checarColisaoNpcPlayer(npc, player, moveVec, incomingVec, npcBox);
  // colisão com outros NPCs
  checarColisaoNpcNpcs(npc, npcs, moveVec, incomingVec, npcBox);

  // colisões
  for (let muroEnt of colisaoMuretas) {
    const muro = muroEnt.mesh;
    const tipo = muroEnt.type;

    if (tipo === "box") {
      const muroBox = new THREE.Box3().setFromObject(muro);

      if (tempBox.intersectsBox(muroBox)) {
        tratamentoColisaoBox(npc, muroBox, moveVec, incomingVec, npcBox);
      }
    } else if (tipo === "cylinder") {
      const cilCentro = new THREE.Vector3().setFromMatrixPosition(
        muro.matrixWorld,
      );
      const dx = nextCenter.x - cilCentro.x;
      const dz = nextCenter.z - cilCentro.z;
      const dist = Math.hypot(dx, dz);
      const radius = muroEnt.radius;

      const overlap = radius + npc.userData.npcR - dist;
      if (overlap > 0) {
        tratamentoColisaoCilindro(
          npc,
          cilCentro,
          radius,
          moveVec,
          incomingVec,
          npcBox
        );
      }
    }
  }
  const npcPos = npc.position.clone();
  const frenteNpc = new THREE.Vector3(1, 0, 0).applyQuaternion(npc.quaternion).normalize();
  const agora = performance.now();
  
  // lista de alvos: player + outros NPCs
  const alvos = [player, ...npcs];
  
  for (let alvo of alvos) {
    if (!alvo) continue;
  
    const alvoPos = alvo.position.clone();
    const relacao = alvoPos.clone().sub(npcPos).dot(frenteNpc);
    const dist = alvoPos.distanceTo(npcPos);
  
    // alvo precisa estar à frente e dentro de uma distância limite
    const DISTANCIA_MAX = 50; // ajuste conforme necessário
    if (
      relacao > 0 &&
      dist < DISTANCIA_MAX &&
      npc.userData.tirosRestantes > 0 &&
      agora - npc.userData.ultimoDisparo > COOLDOWN
    ) {
      const proj = criarProjetil(npc);
      npc.userData.tiros.push(proj);
      npc.userData.ultimoDisparo = agora;
      npc.userData.tirosRestantes--;
      return proj; // dispara apenas um por vez
    }
  }  

  if (npc.userData.penalizado) {
    npc.userData.tempoPenalizacao--;
    npc.userData.maxSpeed = npc.userData.velocidadeAtual;
    if (npc.userData.tempoPenalizacao <= 0) {
      npc.userData.penalizado = false;
      npc.userData.maxSpeed = npc.userData.velocidadeOriginal;
    }
  }
}

export function checarColisaoNpcNpcs(
  npc,
  outrosNpcs,
  moveVecNpc,
  incomingVecNpc,
  npcBox,
) {
  if (!npc || !outrosNpcs) return;

  // caixa hipotética do próximo passo do NPC
  const tempBoxNpc = npcBox.clone().translate(moveVecNpc);

  for (let outro of outrosNpcs) {
    if (!outro) continue;
    const outroBox = new THREE.Box3().setFromObject(outro.userData.hitbox);

    if (tempBoxNpc.intersectsBox(outroBox)) {
      tratamentoColisaoBox(npc, outroBox, moveVecNpc, incomingVecNpc, npcBox);
    }
  }
}


/* =============
   COLISÃO BOX
   ============= */
function tratamentoColisaoBox(npc, muroBox, moveVecRef, incomingVec, npcBox) {
  if (!npcBox.intersectsBox(muroBox)) return;

  const overlapX =
    Math.min(npcBox.max.x, muroBox.max.x) -
    Math.max(npcBox.min.x, muroBox.min.x);
  const overlapZ =
    Math.min(npcBox.max.z, muroBox.max.z) -
    Math.max(npcBox.min.z, muroBox.min.z);

  if (overlapX <= 0 || overlapZ <= 0) return;

  const pC = new THREE.Vector3();
  const mC = new THREE.Vector3();
  npcBox.getCenter(pC);
  muroBox.getCenter(mC);

  let normal = new THREE.Vector3();

  // empurra pelo eixo de menor penetração
  if (overlapX < overlapZ) {
    const dirX = pC.x < mC.x ? -1 : 1;
    normal.set(dirX, 0, 0);
    npc.position.x += dirX * (overlapX + 0.001);
    moveVecRef.x = 0;
  } else {
    const dirZ = pC.z < mC.z ? -1 : 1;
    normal.set(0, 0, dirZ);
    npc.position.z += dirZ * (overlapZ + 0.001);
    moveVecRef.z = 0;
  }

  const n = normal.clone().setY(0).normalize();

  // perda gradual de velocidade
  perdaVelPorAnguloComMove(incomingVec, n);

  const dirIn = incomingVec.clone().setY(0).normalize();
  const dotIn = dirIn.dot(n);

  if (dotIn > 0.8) {
    // impacto frontal → parar seco
    npc.userData.speed = 0;
    moveVecRef.set(0, 0, 0);
    return;
  }

  const forward = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(npc.quaternion)
    .setY(0)
    .normalize();
  const movingBackwards = incomingVec.lengthSq() > 0 && dirIn.dot(forward) < 0;

  if (Math.abs(npc.userData.speed) > 0.02) {
    // deslizar ao longo da parede
    let tangente = new THREE.Vector3()
      .crossVectors(n, new THREE.Vector3(0, 1, 0))
      .normalize();
    if (tangente.dot(incomingVec) < 0) tangente.multiplyScalar(-1);

    const projTang = moveVecRef.dot(tangente);
    moveVecRef.copy(tangente.multiplyScalar(projTang));

    // atrito extra enquanto raspa
    const atritoExtra = 0.01;
    if (npc.userData.speed > 0) npc.userData.speed = Math.max(0, npc.userData.speed - atritoExtra);
    else if (npc.userData.speed < 0) npc.userData.speed = Math.min(0, npc.userData.npc.userData.speed + atritoExtra);

    // alinhar npc e suavizar moveVec para acompanhar a rotação
    alinharNaTangente(npc, n, moveVecRef, incomingVec);
  }
}

/* =================
     COLISÃO CILINDRO
     ================= */
function tratamentoColisaoCilindro(
  npc,
  centro,
  raio,
  moveVecRef,
  incomingVec,
  npcBox,
) {
  const npcC = new THREE.Vector3();
  npcBox.getCenter(npcC);
  npcC.setY(0);
  const c = centro.clone().setY(0);

  const dir = npcC.clone().sub(c);
  const dist = dir.length();
  if (dist === 0) {
    if (moveVecRef.lengthSq() > 0) {
      const fake = moveVecRef.clone().setY(0).normalize();
      npc.position.addScaledVector(fake, -0.03);
    }
    return;
  }

  const penetration = raio - dist + 0.001;
  if (penetration <= 0) return;

  const normal = dir.clone().normalize();

  npc.position.addScaledVector(normal, penetration);

  const proj = moveVecRef.dot(normal);
  if (proj > 0) moveVecRef.addScaledVector(normal, -proj);

  const n = normal.clone().setY(0).normalize();
  perdaVelPorAnguloComMove(incomingVec, n);

  const dirIn = incomingVec.clone().setY(0).normalize();
  const dotIn = dirIn.dot(n);

  if (dotIn > 0.8) {
    npc.userData.speed = 0;
    moveVecRef.set(0, 0, 0);
    return;
  }

  const forward = new THREE.Vector3(1, 0, 0)
    .applyQuaternion(npc.quaternion)
    .setY(0)
    .normalize();
  const movingBackwards = incomingVec.lengthSq() > 0 && dirIn.dot(forward) < 0;

  if (Math.abs(npc.userData.speed) > 0.02) {
    // deslizar ao longo da parede curva
    let tangente = new THREE.Vector3()
      .crossVectors(n, new THREE.Vector3(0, 1, 0))
      .normalize();
    if (tangente.dot(incomingVec) < 0) tangente.multiplyScalar(-1);

    const projTang = moveVecRef.dot(tangente);
    moveVecRef.copy(tangente.multiplyScalar(projTang));

    const atritoExtra = 0.01;
    if (npc.userData.speed > 0) npc.userData.speed = Math.max(0, npc.userData.speed - atritoExtra);
    else if (npc.userData.speed < 0) npc.userData.speed = Math.min(0, npc.userData.speed + atritoExtra);

    alinharNaTangente(npc, n, moveVecRef, incomingVec);
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
  if (npc.userData.speed > 0) npc.userData.speed = Math.max(0, npc.userData.speed - reducao);
  else if (npc.userData.speed < 0) npc.userData.speed = Math.min(0, npc.userData.speed + reducao);
}

/* ==========================================
     ALINHAR NA DIREÇÃO DA TANGENTE DA MURETA
     ========================================== */

function alinharNaTangente(npc, normal, moveVecRef, moveVecOrig) {
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
    .applyQuaternion(npc.quaternion)
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
  npc.rotateY(finalAng);

  // suaviza steering
  npc.userData.steering *= 0.6;

  // atualiza forwardVec
  forwardVec.set(1, 0, 0).applyQuaternion(npc.quaternion).setY(0).normalize();

  // faz o moveVec acompanhar a tangente gradualmente
  const desired = tangente.clone().multiplyScalar(moveVecRef.length());
  moveVecRef.lerp(desired, ALIGN_FACTOR * 0.9); // lerp forte o suficiente para acompanhar mas suave
}

/* ===========================================================
   CHECAR COLISÃO ENTRE NPC E PLAYER
   =========================================================== */
export function checarColisaoNpcPlayer(
  npc,
  player,
  moveVecNpc,
  incomingVecNpc,
  npcBox,
) {
  if (!player || !npc) return;

  // bounding box do player (posição atual)
  const playerBox = new THREE.Box3().setFromObject(player.userData.hitbox);

  // bounding box do npc (posição atual já passada como parâmetro)
  npcBox.setFromObject(npc.userData.hitbox);

  // prever próximo passo do NPC
  const tempBoxNpc = npcBox.clone().translate(moveVecNpc);

  // checar colisão box-box
  if (tempBoxNpc.intersectsBox(playerBox)) {
    tratamentoColisaoBox(npc, playerBox, moveVecNpc, incomingVecNpc, npcBox);
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
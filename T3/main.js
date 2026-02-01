import * as THREE from "three";
import Stats from "../build/jsm/libs/stats.module.js";
import {
  createScene,
  createLight,
  getColisaoMuretas,
  clearColisaoMuretas,
  pista1,
  pista2,
  pista3,
  getCheckpoints,
  clearCheckpoints,
  linhaChegada,
  lightControl,
  getRampa,
  clearRampa,
  getBuraco,
  clearBuraco,
  ground
} from "./scene.js";

import { createCamera, cameraControl, cameraStart, HudBox } from "./camera.js";
import { createPlayer, updatePlayer, returnSpeed } from "./player.js";
import { createnpc, updateNpc } from "./npc.js";

let scene,
  light,
  renderer,
  camera,
  player,
  playerBox,
  npc,
  npcBox,
  colisaoMuretas,
  pista,
  chegada,
  checkpoints,
  back;
  
let npc2, npc3;
let npcBox2, npcBox3;

let linhaPassada = false;
let linhaPassadaNpc1 = false;
let linhaPassadaNpc2 = false;
let linhaPassadaNpc3 = false;


var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// Estado lógico
let nextIdx = 0; // próximo checkpoint esperado (índice)

let ui = { voltas: 0, checks: 0 };

// ---------------------------------------------
// PROJÉTEIS
// ---------------------------------------------
let tirosPlayer = [];
let tirosRestantesPlayer = 4;

function aplicarPenalizacao(obj) {
  obj.userData.penalizado = true;
  obj.userData.tempoPenalizacao = 180; // 3 segundos
  obj.userData.velocidadeOriginal = obj.userData.velocidadeOriginal || 0.75;
  obj.userData.velocidadeAtual = 0.75 * 0.3;
}

function atualizarProjeteis(lista, alvos, colisaoMuretas) {
  for (let i = lista.length - 1; i >= 0; i--) {
    const t = lista[i];
    t.position.add(t.userData.direcao.clone().multiplyScalar(2.5));
    t.userData.tempo++;

    const box = new THREE.Box3().setFromObject(t);
    let atingiu = false;

    // --- colisão com qualquer alvo ---
    for (let alvo of alvos) {
      const alvoBox = new THREE.Box3().setFromObject(alvo.userData.hitbox);
      if (box.intersectsBox(alvoBox)) {
        aplicarPenalizacao(alvo);
        scene.remove(t);
        t.geometry.dispose();
        t.material.dispose();
        lista.splice(i, 1);
        atingiu = true;
        break; // sai do loop de alvos
      }
    }

    if (atingiu) continue; // passa para o próximo projétil

    // --- colisão com muretas ---
    for (let muroEnt of colisaoMuretas) {
      const muro = muroEnt.mesh;
      const muroBox = new THREE.Box3().setFromObject(muro);
      if (box.intersectsBox(muroBox)) {
        scene.remove(t);
        t.geometry.dispose();
        t.material.dispose();
        lista.splice(i, 1);
        atingiu = true;
        break;
      }
    }

    if (atingiu) continue; // passa para o próximo projétil

    // --- tempo de vida ---
    if (t.userData.tempo > 300) {
      scene.remove(t);
      t.geometry.dispose();
      t.material.dispose();
      lista.splice(i, 1);
    }
  }
}





// ---------------------------------------------
// ESTADO DO JOGO
// ---------------------------------------------
let pistaAtual;
let playerCriado = false;
let linhaPassadaPlayer = false;
let linhaPassadaNpc = false;

// Cena
scene = createScene();
light = createLight(scene);
camera = createCamera();
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// GUI
var speedMessage = new HudBox("");
speedMessage.changeStyle("rgba(0,0,0,0)", "orange", "40px", "ubuntu");
speedMessage.changePosition(4);
var voltaMessage = new HudBox("");
voltaMessage.changeStyle("rgba(0,0,0,0)", "orange", "40px", "ubuntu");
voltaMessage.changePosition(1);
var startMessage = new HudBox("");
startMessage.changeStyle("rgba(0,0,0,0)", "red", "40px", "ubuntu");
startMessage.changePosition(1);
startMessage.changeMessage("Aperte Enter para começar");

// ---------------------------------------------
// 1) CARREGAR PRIMEIRA PISTA AO INICIAR
// ---------------------------------------------
carregarPista(1);

// ---------------------------------------------
// 2) TECLAS PARA TROCAR DE PISTA (antes do player)
// ---------------------------------------------
window.addEventListener("keydown", (e) => {
  if (!playerCriado) {
    if (e.key === "1") carregarPista(1);
    if (e.key === "2") carregarPista(2);
    if (e.key === "3") carregarPista(3);

    // CONFIRMAR PISTA E CRIAR PLAYER
    if (e.key === "Enter") {
      criarPlayer();
      startMessage.hide();
    }
  }
});

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

render();

/* -----------------------------------------------------
   FUNÇÕES PRINCIPAIS
--------------------------------------------------------*/

function carregarPista(num) {
  pistaAtual = num;

  // remove pista anterior
  if (pista) scene.remove(pista);
  if (chegada) scene.remove(chegada);
  if (back) scene.remove(back);

  clearColisaoMuretas();
  clearCheckpoints();
  clearBuraco();
  clearRampa();
  // cria pista
  switch (num) {
    case 1:
      pista = pista1();
      back = ground(scene, num);
      break;
    case 2:
      pista = pista2();
      back = ground(scene, num);
      break;
    case 3:
      pista = pista3();
      back = ground(scene, num);
      break;
  }
  const pistaBox = new THREE.Box3().setFromObject(pista);
  const centro = new THREE.Vector3();
  pistaBox.getCenter(centro);

  pista.position.sub(centro);
  scene.add(pista);

  // linha de chegada
  chegada = linhaChegada();
  checkpoints = getCheckpoints();
  linhaPassada = false;
  nextIdx = 0;
  ui.checks = 0;
  ui.voltas = 0;
  if (!playerCriado) {
    // calcula bounding box da pista
    const pistaBox = new THREE.Box3().setFromObject(pista);
    const centro = new THREE.Vector3();
    pistaBox.getCenter(centro);

    // posiciona câmera em um ponto alto e afastado
    const tamanho = pistaBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(tamanho.x, tamanho.z);

    camera.position.set(
      centro.x + maxDim * 0.08, // desloca no eixo X
      centro.y + maxDim * 0.7, // altura
      centro.z + maxDim * 0.08, // desloca no eixo Z
    );

    camera.lookAt(centro);
  }
}

function criarPlayer() {
  if (playerCriado) return;

  playerCriado = true;

  // cria player na linha de largada
  player = createPlayer(chegada);
  scene.add(player);
  npc = createnpc(chegada);
  scene.add(npc);
  colisaoMuretas = getColisaoMuretas();
  playerBox = new THREE.Box3();
  npcBox = new THREE.Box3();

  npc2 = createnpc(chegada);
  scene.add(npc2);
  npcBox2 = new THREE.Box3();

  npc3 = createnpc(chegada);
  scene.add(npc3);
  npcBox3 = new THREE.Box3();

  const lineNormal = chegada.userData.lineNormal
    ? chegada.userData.lineNormal.clone().normalize()
    : new THREE.Vector3(0, 0, 1);
  const SPAWN_OFFSET = -20;
  const lateral = new THREE.Vector3()
    .crossVectors(lineNormal, new THREE.Vector3(0, 1, 0))
    .normalize();
  player.position.add(lineNormal.clone().multiplyScalar(SPAWN_OFFSET));
  player.position.add(lateral.clone().multiplyScalar(8));
  player.position.y += 5;
  
  npc.position.add(lineNormal.clone().multiplyScalar(SPAWN_OFFSET));
  npc.position.add(lateral.clone().multiplyScalar(-8));
  npc.position.y += 5;
  // NPC2: à frente do player
  npc2.position.copy(player.position);
  npc2.position.add(lineNormal.clone().multiplyScalar(12)); // mais à frente

  // NPC3: à frente do player, mas deslocado lateralmente
  npc3.position.copy(npc.position);
  npc3.position.add(lineNormal.clone().multiplyScalar(12));

  const tmpBox = new THREE.Box3();
  tmpBox.setFromObject(player);
  let tries = 0;
  const MAX_TRIES = 30;
  while (tries < MAX_TRIES) {
    let intersecting = false;
    for (let m of colisaoMuretas) {
      const muroBox = new THREE.Box3().setFromObject(m.mesh);
      if (tmpBox.intersectsBox(muroBox)) {
        // empurra mais um pouco para frente
        player.position.add(lineNormal.clone().multiplyScalar(1.0));
        tmpBox.setFromObject(player);
        intersecting = true;
        break;
      }
    }
    if (!intersecting) break;
    tries++;
  }
  cameraControl(player, camera);
  iniciarContagem();
}

function updatePositionMessage() {
  var num = "Speed: " + returnSpeed().toFixed(2) + " km/h";
  speedMessage.changeMessage(num);
  var str =
    "Volta: " +
    (ui.voltas + 1) +
    "/4\nCheck: " +
    nextIdx +
    "/" +
    checkpoints.length;
  voltaMessage.changeMessage(str);
  tiroMessage.changeMessage("Tiros: " + tirosRestantesPlayer);
}

function render() {
  requestAnimationFrame(render); // Antes do player existir → só renderiza câmeras e pistas
  if (!playerCriado) {
    renderer.render(scene, camera);
    return;
  }
  if (!raceStarted) {
    renderer.render(scene, camera);
    return;
  }
  if (gameOver) {
    renderer.render(scene, camera);
    return; // trava o jogo
  }
  // Atualiza bounding box
  playerBox.setFromObject(player);
  npcBox.setFromObject(npc);
  npcBox2.setFromObject(npc2);
  npcBox3.setFromObject(npc3);

  player.updateMatrixWorld(true);
  npc.updateMatrixWorld(true);
  npc2.updateMatrixWorld(true);
  npc3.updateMatrixWorld(true);
  chegada.updateMatrixWorld(true);
  // detecção de linha
  let linhaBox = new THREE.Box3().setFromObject(chegada);
  let linhaCentro = new THREE.Vector3();
  linhaBox.getCenter(linhaCentro);
  updatePositionMessage();
  for (let cp of checkpoints) {
    const cpBox = new THREE.Box3().setFromObject(cp);
    if (cp.userData.order === nextIdx && playerBox.intersectsBox(cpBox)) {
      cp.userData.passed = true;
      nextIdx += 1;
      ui.checks = nextIdx;

      // salva último checkpoint em coordenadas de mundo
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      cp.getWorldPosition(worldPos);
      cp.getWorldQuaternion(worldQuat);

      // usa lineNormal se existir para alinhar corretamente
      if (cp.userData.lineNormal) {
        const lineNormal = cp.userData.lineNormal.clone().normalize();
        const forward = new THREE.Vector3(1, 0, 0); // frente do carro

        // corrige se estiver invertido
        if (forward.dot(lineNormal) < 0) {
          lineNormal.negate();
        }

        const quat = new THREE.Quaternion().setFromUnitVectors(
          forward,
          lineNormal,
        );
        player.userData.lastCheckpoint = {
          position: worldPos,
          quaternion: quat,
        };
      } else {
        // fallback: usa rotação do checkpoint
        player.userData.lastCheckpoint = {
          position: worldPos,
          quaternion: worldQuat,
        };
      }
    }
  }

  if (playerBox.intersectsBox(linhaBox)) {
    const lineNormal = chegada.userData.lineNormal.clone().normalize();
    const relPos = player.position.clone().sub(linhaCentro);
    const proj = relPos.dot(lineNormal);

    if (!linhaPassadaPlayer && proj > 0) {
      let allPassed = nextIdx === checkpoints.length;
      if (allPassed) {
        ui.voltas++;
        checkpoints.forEach((cp) => (cp.userData.passed = false));
        nextIdx = 0;
        ui.checks = 0;
        tirosRestantesPlayer = 4;
      }
      linhaPassadaPlayer = true;
    } else if (proj < 0) {
      linhaPassadaPlayer = false;
    }
  }
  // NPC1
  if (npcBox.intersectsBox(linhaBox)) {
    const lineNormal = chegada.userData.lineNormal
      ? chegada.userData.lineNormal.clone().normalize()
      : new THREE.Vector3(0, 0, 1);

    const relPosNpc1 = npc.position.clone().sub(linhaCentro);
    const projNpc1 = relPosNpc1.dot(lineNormal);

    if (!linhaPassadaNpc1 && projNpc1 > 0) {
      if (npc.userData.allPassed) {
        npc.userData.voltas++;
        npc.userData.tirosRestantes = 4; // reset só deste NPC
      }
      linhaPassadaNpc1 = true;
    } else if (projNpc1 < 0) {
      linhaPassadaNpc1 = false;
    }
  }

  // NPC2
  if (npcBox2.intersectsBox(linhaBox)) {
    const lineNormal = chegada.userData.lineNormal
      ? chegada.userData.lineNormal.clone().normalize()
      : new THREE.Vector3(0, 0, 1);

    const relPosNpc2 = npc2.position.clone().sub(linhaCentro);
    const projNpc2 = relPosNpc2.dot(lineNormal);

    if (!linhaPassadaNpc2 && projNpc2 > 0) {
      if (npc2.userData.allPassed) {
        npc2.userData.voltas++;
        npc2.userData.tirosRestantes = 4;
      }
      linhaPassadaNpc2 = true;
    } else if (projNpc2 < 0) {
      linhaPassadaNpc2 = false;
    }
  }

  // NPC3
  if (npcBox3.intersectsBox(linhaBox)) {
    const lineNormal = chegada.userData.lineNormal
      ? chegada.userData.lineNormal.clone().normalize()
      : new THREE.Vector3(0, 0, 1);

    const relPosNpc3 = npc3.position.clone().sub(linhaCentro);
    const projNpc3 = relPosNpc3.dot(lineNormal);

    if (!linhaPassadaNpc3 && projNpc3 > 0) {
      if (npc3.userData.allPassed) {
        npc3.userData.voltas++;
        npc3.userData.tirosRestantes = 4;
      }
      linhaPassadaNpc3 = true;
    } else if (projNpc3 < 0) {
      linhaPassadaNpc3 = false;
    }
  }

  verificarVencedor(npc);
  verificarVencedor(npc2);
  verificarVencedor(npc3);

  const novoProjPlayer = updatePlayer(
    player,
    [npc, npc2, npc3], // lista de NPCs
    colisaoMuretas,
    tirosPlayer,
    tirosRestantesPlayer,
    getRampa(),
    getBuraco(),
  );
  
  if (novoProjPlayer) {
    scene.add(novoProjPlayer);
    tirosRestantesPlayer--; // decrementa aqui
  }

  const novoProjNpc1 = updateNpc(npc, player, colisaoMuretas, checkpoints, getRampa(), getBuraco(),[npc2,npc3]);
  if (novoProjNpc1) scene.add(novoProjNpc1);

  const novoProjNpc2 = updateNpc(npc2, player, colisaoMuretas, checkpoints, getRampa(), getBuraco(),[npc,npc3]);
  if (novoProjNpc2) scene.add(novoProjNpc2);

  const novoProjNpc3 = updateNpc(npc3, player, colisaoMuretas, checkpoints, getRampa(), getBuraco(),[npc,npc2]);
  if (novoProjNpc3) scene.add(novoProjNpc3);


  // mantém a câmera seguindo o player
  cameraControl(player, camera);

// Player contra todos NPCs
atualizarProjeteis(tirosPlayer, [npc, npc2, npc3], colisaoMuretas);

// NPC1 contra player + outros NPCs
atualizarProjeteis(npc.userData.tiros, [player, npc2, npc3], colisaoMuretas);

// NPC2 contra player + outros NPCs
atualizarProjeteis(npc2.userData.tiros, [player, npc, npc3], colisaoMuretas);

// NPC3 contra player + outros NPCs
atualizarProjeteis(npc3.userData.tiros, [player, npc, npc2], colisaoMuretas);

  
  lightControl(player, light);

  stats.begin();
  renderer.render(scene, camera);
  stats.end();
}

let startCountdown = 3; // segundos
let raceStarted = false;
var countdownMessage = new HudBox("");
countdownMessage.changeStyle("rgba(0,0,0,0)", "red", "80px", "ubuntu");
countdownMessage.changePosition(5);

function iniciarContagem() {
  cameraStart(camera, player);
  startCountdown = 3;
  countdownMessage.changeMessage(startCountdown);
  let interval = setInterval(() => {
    startCountdown--;
    if (startCountdown > 0) {
      countdownMessage.changeMessage(startCountdown);
    } else {
      countdownMessage.changeMessage("GO!");
      raceStarted = true;
      setTimeout(() => countdownMessage.changeMessage(""), 1000);
      clearInterval(interval);
    }
  }, 1000);
}

const MAX_VOLTAS = 4;
let gameOver = false;
var resultMessage = new HudBox("");
resultMessage.changeStyle("rgba(0,0,0,0)", "yellow", "80px", "ubuntu");
resultMessage.changePosition(6);

function verificarVencedor(obj) {
  if (ui.voltas >= MAX_VOLTAS) {
    gameOver = true;
    resultMessage.changeMessage("Você venceu!");
  }
  if (obj.userData.voltas >= MAX_VOLTAS) {
    gameOver = true;
    resultMessage.changeMessage("Você perdeu!");
  }
}
var tiroMessage = new HudBox("");
tiroMessage.changeStyle("rgba(0,0,0,0)", "red", "40px", "ubuntu");
tiroMessage.changePosition(3);

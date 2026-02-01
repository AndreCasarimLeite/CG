import * as THREE from "three";

export function createCamera() {
  var camera;

  let w = window.innerWidth;
  let h = window.innerHeight;
  let aspect = w / h;
  let near = 0.1;
  let far = 850;
  let fov = 90;

  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  camera.position.set(0, 10, 60);

  return camera;
}

export function cameraControl(player, camera) {
  // distância que a câmera fica do player
  const cameraOffset = new THREE.Vector3(-10, 7, 0);
  // ponto a frente do player que a câmera vai apontar
  const lookFix = new THREE.Vector3(5, 4, 0);
  // calcula a posição da câmera baseado na posição do player
  const relativeCameraOffset = cameraOffset.clone();
  const cameraPosition = relativeCameraOffset.applyMatrix4(player.matrixWorld);
  // calcula o ponto que a camêra vai apontar baseado na posição do player
  const relativeLookFix = lookFix.clone();
  const lookAtPosition = relativeLookFix.applyMatrix4(player.matrixWorld);

  // a câmera segue suavemente
  camera.position.lerp(cameraPosition, 0.25);

  // aponta a câmera para um ponto a frente do player
  camera.lookAt(lookAtPosition);
}

export function cameraStart(camera, player) {
  // camera.position.set(191, -5, -45);
  camera.position.copy(player.position).add(new THREE.Vector3(0, 5, -10));
  camera.lookAt(new THREE.Vector3(0, 0, 7500));
}

export class HudBox {
  constructor(defaultText) {
    this.box = document.createElement("div");
    this.box.id = "box";
    this.box.style.padding = "6px 14px";
    this.box.style.top = "0";
    this.box.style.left = "0";
    this.box.style.position = "fixed";
    this.box.style.backgroundColor = "rgba(100,100,255,0.3)";
    this.box.style.color = "white";
    this.box.style.fontFamily = "sans-serif";
    this.box.style.fontSize = "26px";
    this.box.style.whiteSpace = "pre-line";

    this.textnode = document.createTextNode(defaultText);
    this.box.appendChild(this.textnode);
    document.body.appendChild(this.box);
  }

  changeMessage(newText) {
    this.textnode.nodeValue = newText;
  }
  hide() {
    this.textnode.nodeValue = "";
    this.box.style.backgroundColor = "rgba(0,0,0,0)";
  }
  changeStyle(backcolor, fontColor, size = "26px", font = "sans-serif") {
    this.box.style.backgroundColor = backcolor;
    this.box.style.color = fontColor;
    this.box.style.fontFamily = font;
    this.box.style.fontSize = size;
  }
  changePosition(place) {
    switch (place) {
      case 1:
        this.box.style.top = "0";
        this.box.style.bottom = "auto";
        this.box.style.left = "auto";
        this.box.style.right = "0";
        break;
      case 2:
        this.box.style.top = "0";
        this.box.style.bottom = "auto";
        this.box.style.left = "0";
        this.box.style.right = "auto";
        break;
      case 3:
        this.box.style.top = "auto";
        this.box.style.bottom = "0";
        this.box.style.left = "0";
        this.box.style.right = "auto";
        break;
      case 4:
        this.box.style.top = "auto";
        this.box.style.bottom = "0";
        this.box.style.left = "auto";
        this.box.style.right = "0";
        break;
      case 5:
        this.box.style.top = "40%";
        this.box.style.bottom = "auto";
        this.box.style.left = "50%";
        this.box.style.right = "auto";
        break;
      case 6:
        this.box.style.top = "40%";
        this.box.style.bottom = "auto";
        this.box.style.left = "40%";
        this.box.style.right = "auto";
        break;
    }
  }
}
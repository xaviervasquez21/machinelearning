let handPose;
let video;
let hands = [];
let prevPositions = [];
let idleTimer = 0;
let volume = 0.5;
let songIndex = 0;
let songs = [];
let currentSong;
let isPaused = true; // Comienza en pausa
let sideMovementTimer = 0;
let actionColor = [255, 165, 0]; // Naranja por defecto
let openPalmTimer = 0; // Temporizador para la palma abierta
let palmOpen = false; // Estado actual de la palma abierta

function preload() {
  songs.push(loadSound("assets/song1.mp3"));
  songs.push(loadSound("assets/song2.mp3"));
  songs.push(loadSound("assets/song3.mp3"));
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  currentSong = songs[songIndex];
  currentSong.setVolume(volume); // Configurar volumen inicial
  actionColor = [255, 0, 0]; // Rojo para indicar pausa al inicio

  handPose = ml5.handpose(video, modelLoaded);
  handPose.on("hand", gotHands);
}

function modelLoaded() {
  console.log("Modelo de HandPose cargado con éxito");
}

function gotHands(results) {
  hands = results;
  if (hands.length > 0) {
    idleTimer = 0;
  }
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);

  if (hands.length > 0) {
    let hand = hands[0];
    let landmarks = hand.landmarks;

    if (prevPositions.length === 0) {
      prevPositions = landmarks.map((p) => ({ x: p[0], y: p[1] }));
    }

    palmOpen = detectOpenPalm(landmarks); // Detectar si la palma está abierta

    if (palmOpen) {
      openPalmTimer += deltaTime / 1000; // Incrementar el temporizador
      if (openPalmTimer >= 3) {
        toggleMusic(); // Cambiar entre pausa y reproducción
        openPalmTimer = 0; // Reiniciar el temporizador
      }
    } else {
      openPalmTimer = 0; // Reiniciar el temporizador si no hay palma abierta
    }

    let movementType = detectMovement(landmarks);

    for (let i = 0; i < landmarks.length; i++) {
      let x = landmarks[i][0];
      let y = landmarks[i][1];
      fill(...actionColor);
      noStroke();
      ellipse(x, y, 10, 10);
    }

    prevPositions = landmarks.map((p) => ({ x: p[0], y: p[1] }));
  } else {
    idleTimer = 0;
    prevPositions = [];
  }

  displayInfo();
}

function detectOpenPalm(landmarks) {
  let distances = [];

  // Calcular la distancia entre cada dedo y la base de la mano (punto 0)
  for (let i = 4; i <= 20; i += 4) {
    // Índices de las yemas de los dedos
    let dx = landmarks[i][0] - landmarks[0][0];
    let dy = landmarks[i][1] - landmarks[0][1];
    let distance = Math.sqrt(dx * dx + dy * dy);
    distances.push(distance);
  }

  // Umbral para considerar la palma como abierta
  let openThreshold = 100;
  return distances.every((d) => d > openThreshold);
}

function detectMovement(landmarks) {
  let totalMovementX = 0;
  let totalMovementY = 0;

  for (let i = 0; i < landmarks.length; i++) {
    let x = landmarks[i][0];
    let y = landmarks[i][1];
    let prevX = prevPositions[i]?.x || 0;
    let prevY = prevPositions[i]?.y || 0;
    totalMovementX += x - prevX;
    totalMovementY += y - prevY;
  }

  let threshold = 5; // Umbral para movimientos verticales
  let sideMovementThreshold = 50;
  let sideMovementTimeThreshold = 1000;

  // Detectar movimiento vertical para ajustar volumen
  if (
    abs(totalMovementY) > threshold &&
    abs(totalMovementY) > abs(totalMovementX)
  ) {
    if (totalMovementY < -threshold) {
      changeVolume("up");
    } else if (totalMovementY > threshold) {
      changeVolume("down");
    }
    return "up-down";
  }
  // Detectar cambio de canción
  else if (totalMovementX > sideMovementThreshold) {
    sideMovementTimer += deltaTime;
    if (sideMovementTimer >= sideMovementTimeThreshold) {
      changeSong("next");
      sideMovementTimer = 0;
      actionColor = [0, 0, 255];
      return "change-song";
    }
    return "right";
  } else if (totalMovementX < -sideMovementThreshold) {
    sideMovementTimer += deltaTime;
    if (sideMovementTimer >= sideMovementTimeThreshold) {
      changeSong("prev");
      sideMovementTimer = 0;
      actionColor = [0, 0, 255];
      return "change-song";
    }
    return "left";
  } else {
    sideMovementTimer = 0;
    idleTimer += deltaTime / 1000;
    return "idle";
  }

  actionColor = [255, 165, 0];
  return "none";
}

function changeVolume(direction) {
  let increment = 0.05; // Ajuste más suave del volumen
  if (direction === "up" && volume < 1) {
    volume = min(1, volume + increment);
    setVolume(volume);
  } else if (direction === "down" && volume > 0) {
    volume = max(0, volume - increment);
    setVolume(volume);
  }
}

function setVolume(vol) {
  currentSong.setVolume(vol);
  console.log("Volumen ajustado a:", Math.round(vol * 100) + "%");
}

function changeSong(direction) {
  currentSong.stop();
  currentSong.jump(0);
  if (direction === "next") {
    songIndex = (songIndex + 1) % songs.length;
  } else if (direction === "prev") {
    songIndex = (songIndex - 1 + songs.length) % songs.length;
  }
  currentSong = songs[songIndex];
  if (!isPaused) currentSong.play(); // Reproducir solo si no está en pausa
  currentSong.setVolume(volume);
  console.log("Cargando y reproduciendo canción:", songs[songIndex].url);
}

function toggleMusic() {
  if (isPaused) {
    currentSong.play();
    isPaused = false;
    actionColor = [0, 255, 0]; // Verde para reproducción
    console.log("Música reproducida");
  } else {
    currentSong.pause();
    isPaused = true;
    actionColor = [255, 0, 0]; // Rojo para pausa
    console.log("Música pausada");
  }
}

function displayInfo() {
  fill(255);
  textSize(16);
  text(
    "Estado de la canción: " + (isPaused ? "Pausada" : "Reproduciendo"),
    10,
    height - 90
  );
  text("Volumen: " + Math.round(volume * 100) + "%", 10, height - 70);
  text("Canción: " + (songIndex + 1), 10, height - 50);
  text("Mano detectada: " + (hands.length > 0 ? "Sí" : "No"), 10, height - 30);
  text("Palma abierta: " + (palmOpen ? "Sí" : "No"), 10, height - 10);
}

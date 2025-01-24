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
  for (let i = 1; i <= 3; i++) {
    // Cambia 3 por el número total de canciones
    songs.push(loadSound(`assets/song${i}.mp3`));
  }
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
    hands.forEach((hand) => {
      let landmarks = hand.landmarks;
      if (prevPositions.length === 0) {
        prevPositions = landmarks.map((p) => ({ x: p[0], y: p[1] }));
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
    });
  } else {
    idleTimer = 0;
    prevPositions = [];
  }

  displayInfo();
}

function detectMovement(landmarks) {
  let handCenterY = landmarks[0][1]; // Coordenada Y del punto base de la mano

  let upperThreshold = height / 3; // Umbral para la parte superior
  let lowerThreshold = (2 * height) / 3; // Umbral para la parte inferior

  if (handCenterY < upperThreshold) {
    changeVolume("up");
    actionColor = [255, 255, 0]; // Amarillo al subir volumen
    return "volume-up";
  } else if (handCenterY > lowerThreshold) {
    changeVolume("down");
    actionColor = [255, 255, 0]; // Amarillo al bajar volumen
    return "volume-down";
  } else if (detectOpenPalm(landmarks)) {
    openPalmTimer += deltaTime / 1000; // Incrementar temporizador
    if (openPalmTimer >= 2) {
      // Cambiar después de 2 segundos
      if (palmOpen) {
        toggleMusic();
        openPalmTimer = 0; // Reiniciar temporizador
      }
    }
    palmOpen = true; // Estado de palma abierta activo
    actionColor = [0, 255, 0]; // Verde para play/pausa
    return "toggle-music";
  } else {
    openPalmTimer = 0; // Reiniciar si no se detecta palma abierta
    palmOpen = false; // Desactivar estado de palma abierta
  }

  actionColor = [255, 165, 0]; // Naranja por defecto
  return "none";
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
  actionColor = [0, 0, 255]; // Azul al cambiar canción
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
}

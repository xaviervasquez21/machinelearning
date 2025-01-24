let handPose; // Variable para el modelo de HandPose
let video; // Elemento de video capturado
let hands = []; // Arreglo para almacenar las manos detectadas
let prevPositions = []; // Posiciones previas de las manos
let volume = 0.5; // Volumen inicial (50%)
let songIndex = 0; // Índice de la canción actual
let songs = []; // Arreglo para almacenar las canciones
let currentSong; // Canción que se está reproduciendo actualmente
let isPlaying = false; // Estado de reproducción
let actionColor = [255, 165, 0]; // Naranja por defecto para interacciones

// Cooldowns para evitar múltiples acciones rápidas
let sideCooldown = false; // Cooldown para cambiar canciones
let playPauseCooldown = false; // Cooldown para pausa/play

// Carga las canciones antes de inicializar el sketch
function preload() {
  for (let i = 1; i <= 3; i++) {
    songs.push(loadSound(`assets/song${i}.mp3`)); // Carga las canciones desde la carpeta "assets"
  }
}

function setup() {
  let canvas = createCanvas(640, 480); // Crea el canvas de 640x480 píxeles
  canvas.parent("canvas-container"); // Asocia el lienzo al contenedor con ID "canvas-container"

  video = createCapture(VIDEO); // Captura de video desde la cámara
  video.size(640, 480); // Tamaño del video
  video.hide(); // Oculta el elemento de video por defecto

  currentSong = songs[songIndex]; // Asigna la primera canción como la actual
  currentSong.setVolume(volume); // Ajusta el volumen inicial

  handPose = ml5.handpose(video, modelLoaded); // Inicializa el modelo HandPose
  handPose.on("hand", gotHands); // Evento para manejar detecciones de manos
}

// Callback cuando el modelo HandPose está cargado
function modelLoaded() {
  console.log("Modelo de HandPose cargado con éxito");
}

// Callback para manejar las manos detectadas
function gotHands(results) {
  hands = results; // Guarda las manos detectadas en el arreglo
}

function draw() {
  background(0); // Fondo negro
  image(video, 0, 0, width, height); // Dibuja el video en el canvas

  if (hands.length > 0) {
    hands.forEach((hand) => {
      let landmarks = hand.landmarks; // Coordenadas de la mano

      // Inicializa las posiciones previas si no están definidas
      if (prevPositions.length === 0) {
        prevPositions = landmarks.map((p) => ({ x: p[0], y: p[1] }));
      }

      // Detecta el tipo de movimiento realizado
      let movementType = detectMovement(landmarks);

      // Dibuja los puntos de la mano
      for (let i = 0; i < landmarks.length; i++) {
        let x = landmarks[i][0];
        let y = landmarks[i][1];
        fill(...actionColor); // Color según la acción detectada
        noStroke();
        ellipse(x, y, 10, 10); // Dibuja un punto en cada coordenada
      }

      // Actualiza las posiciones previas
      prevPositions = landmarks.map((p) => ({ x: p[0], y: p[1] }));
    });
  } else {
    prevPositions = []; // Si no hay manos, resetea las posiciones previas
  }

  displayInfo(); // Muestra la información en pantalla
}

// Detecta movimientos para realizar acciones
function detectMovement(landmarks) {
  let handCenterX = landmarks[0][0]; // Coordenada X del punto base de la mano
  let handCenterY = landmarks[0][1]; // Coordenada Y del punto base de la mano

  let upperThreshold = height / 3; // Límite superior para ajustar volumen
  let lowerThreshold = (2 * height) / 3; // Límite inferior para ajustar volumen

  // Cambiar volumen si la mano está en la parte superior o inferior
  if (handCenterY < upperThreshold) {
    changeVolume("up");
    actionColor = [0, 255, 0]; // Verde para subir/bajar volumen
    return "volume-up";
  } else if (handCenterY > lowerThreshold) {
    changeVolume("down");
    actionColor = [0, 255, 0]; // Verde para subir/bajar volumen
    return "volume-down";
  }

  // Cambiar canción si la mano está en los laterales
  if (!sideCooldown && handCenterX < width / 4) {
    changeSong("prev");
    sideCooldown = true;
    setTimeout(() => (sideCooldown = false), 2000); // Cooldown de 2 segundos
    actionColor = [0, 0, 255]; // Azul para cambiar canción
    return "prev-song";
  } else if (!sideCooldown && handCenterX > (3 * width) / 4) {
    changeSong("next");
    sideCooldown = true;
    setTimeout(() => (sideCooldown = false), 2000); // Cooldown de 2 segundos
    actionColor = [0, 0, 255]; // Azul para cambiar canción
    return "next-song";
  }

  // Pausar/Reproducir si la mano está en el centro
  if (
    !playPauseCooldown &&
    handCenterX > width / 4 &&
    handCenterX < (3 * width) / 4 &&
    handCenterY > upperThreshold &&
    handCenterY < lowerThreshold
  ) {
    playPauseSong();
    playPauseCooldown = true;
    setTimeout(() => (playPauseCooldown = false), 3000); // Cooldown de 3 segundos
    actionColor = [255, 255, 0]; // Amarillo para play/pausa
    return "play-pause";
  }

  // Sin acción específica
  actionColor = [255, 165, 0]; // Naranja por defecto
  return "none";
}

// Maneja la pausa y reproducción de la canción
function playPauseSong() {
  if (isPlaying) {
    currentSong.pause();
    console.log("Canción pausada");
  } else {
    currentSong.play();
    console.log("Reproduciendo canción");
  }
  isPlaying = !isPlaying; // Cambia el estado de reproducción
}

// Cambia el volumen de la canción
function changeVolume(direction) {
  let increment = 0.02; // Incremento/decremento más suave
  if (direction === "up" && volume < 1) {
    volume = min(1, volume + increment); // Asegura que no supere el 100%
    setVolume(volume);
  } else if (direction === "down" && volume > 0) {
    volume = max(0, volume - increment); // Asegura que no sea menor al 0%
    setVolume(volume);
  }
}

// Aplica el volumen actual a la canción
function setVolume(vol) {
  currentSong.setVolume(vol);
  console.log("Volumen ajustado a:", Math.round(vol * 100) + "%");
}

// Cambia entre canciones
function changeSong(direction) {
  currentSong.stop(); // Detenemos la canción actual

  if (direction === "next") {
    songIndex = (songIndex + 1) % songs.length; // Avanzar a la siguiente canción
  } else if (direction === "prev") {
    songIndex = (songIndex - 1 + songs.length) % songs.length; // Retroceder a la canción anterior
  }

  currentSong = songs[songIndex]; // Cambiar a la nueva canción
  currentSong.setVolume(volume); // Sincronizar el volumen actual
  currentSong.play(); // Reproducir la nueva canción
  isPlaying = true; // Actualizar el estado a "Reproduciendo"
  console.log(
    "Canción cambiada a:",
    songIndex + 1,
    "- Volumen:",
    Math.round(volume * 100) + "%"
  );
}

// Muestra la información en pantalla
function displayInfo() {
  fill(255);
  textSize(16);
  text("Volumen: " + Math.round(volume * 100) + "%", 10, height - 40);
  text("Canción: " + (songIndex + 1), 10, height - 20);
  text(isPlaying ? "Reproduciendo" : "Pausado", width - 120, height - 20);
}

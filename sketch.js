// Declaración de variables globales
let songs = []; // Array para almacenar y controlar las canciones
let handposeModel; // Modelo de detección de manos (Handpose)
let video; // Elemento de video para capturar la entrada de la cámara
let predictions = []; // Lista para almacenar las predicciones del modelo Handpose
let currentSongIndex = 0; // Índice de la canción actual
let isPlaying = false; // Estado de la música (reproduciendo o pausado)
let gestureCooldown = false; // Control para evitar detecciones redundantes
let lastGestureTime = 0; // Registro del último gesto detectado

// Función que precarga recursos antes de iniciar el programa
function preload() {
  const songCount = 3; // Número de canciones
  for (let i = 0; i < songCount; i++) {
    songs[i] = loadSound(
      `assets/song${i + 1}.mp3`,
      () => console.log(`Canción ${i + 1} cargada`),
      () => console.error(`Error al cargar canción ${i + 1}`)
    );
  }
}

// Función que se ejecuta una vez al iniciar el programa
function setup() {
  // Crea un lienzo de p5.js con tamaño 640x480
  const canvas = createCanvas(640, 480);
  canvas.parent("canvas-container"); // Asocia el lienzo a un contenedor HTML

  // Captura el video desde la cámara
  video = createCapture(VIDEO, () => {
    console.log("Video cargado correctamente");
  });
  video.size(width, height); // Ajusta el tamaño del video al del lienzo
  video.hide(); // Oculta la visualización del video en la página

  // Inicializa el modelo de Handpose con el video como entrada
  handposeModel = ml5.handpose(video, () => {
    console.log("Modelo Handpose cargado");
  });

  // Evento que se activa cada vez que el modelo genera predicciones
  handposeModel.on("predict", (results) => {
    predictions = results; // Almacena las predicciones en la variable global
  });
}

// Función para verificar si todos los dedos están abiertos
function isAllFingersOpen(hand) {
  const palm = hand.landmarks[9];
  const threshold = 60; // Umbral para determinar si los dedos están abiertos

  return [4, 8, 12, 16, 20].every((i) => {
    const fingerTip = hand.landmarks[i];
    return dist(fingerTip[0], fingerTip[1], palm[0], palm[1]) > threshold;
  });
}

// Función para detectar gestos y controlar la música
function detectGesture(hand) {
  const currentTime = millis();

  if (gestureCooldown) return;

  if (isAllFingersOpen(hand)) {
    if (currentTime - lastGestureTime > 3000) {
      // 3 segundos de espera
      if (!isPlaying) {
        songs[currentSongIndex].play();
        isPlaying = true;
        console.log("Todos los dedos abiertos - Música iniciada");
      } else {
        songs[currentSongIndex].pause();
        isPlaying = false;
        console.log("Todos los dedos abiertos nuevamente - Música pausada");
      }
      lastGestureTime = currentTime;
    }

    // Activar cooldown para evitar repeticiones rápidas
    gestureCooldown = true;
    setTimeout(() => (gestureCooldown = false), 500); // 500ms de espera
  }
}

// Función que se ejecuta continuamente para renderizar el lienzo
function draw() {
  background(30); // Establece un fondo oscuro

  // Dibuja el video capturado en el lienzo
  image(video, 0, 0, width, height);

  // Verifica si hay predicciones (manos detectadas)
  if (predictions.length > 0) {
    const hand = predictions[0]; // Toma la primera mano detectada

    // Dibuja los puntos clave de la mano en el lienzo
    hand.landmarks.forEach((point) => {
      fill(0, 255, 0); // Color verde para los puntos
      noStroke(); // Sin borde en los puntos
      ellipse(point[0], point[1], 10, 10); // Dibuja un círculo en cada punto
    });

    // Detecta gestos para controlar la música
    detectGesture(hand);
  } else {
    // Mensaje si no hay manos detectadas
    fill(255);
    textSize(16);
    textAlign(CENTER);
    text("No se detectan manos", width / 2, height - 20);
  }

  // Dibuja el estado actual de la música en el lienzo
  drawState();
}

// Función para mostrar el estado actual de la música
function drawState() {
  fill(255);
  textSize(24);
  textAlign(CENTER);
  if (isPlaying) {
    text("Reproduciendo", width / 2, 30);
  } else {
    text("Pausado", width / 2, 30);
  }
}

// Función para cambiar la canción
function changeSong(direction) {
  // Detiene la canción actual
  songs[currentSongIndex].stop();

  // Calcula el nuevo índice de la canción
  currentSongIndex += direction;

  // Asegura que el índice esté dentro de los límites
  if (currentSongIndex < 0) {
    currentSongIndex = songs.length - 1; // Última canción si se va hacia la izquierda
  } else if (currentSongIndex >= songs.length) {
    currentSongIndex = 0; // Primera canción si se va hacia la derecha
  }

  // Reproduce la nueva canción
  songs[currentSongIndex].loop();
}

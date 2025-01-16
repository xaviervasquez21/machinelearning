let songs = [];
let handposeModel;
let video;
let predictions = [];
let currentSongIndex = 0;
let isPlaying = false;
let palmDetectedTime = 0; // Tiempo de detección de la palma abierta
let palmLastPosition = null; // Guardará la última posición de la palma para verificar el movimiento
let isPalmStationary = false; // Bandera para saber si la palma está quieta
let volume = 100; // Establece un valor inicial para el volumen

// Precarga de canciones
function preload() {
  const songCount = 3;
  for (let i = 0; i < songCount; i++) {
    songs[i] = loadSound(`assets/song${i + 1}.mp3`);
  }
}

function setup() {
  const canvas = createCanvas(640, 480);
  canvas.parent("canvas-container");

  // Configuración del video
  video = createCapture(VIDEO);
  video.size(width, height); // Ajusta el tamaño del video al tamaño del lienzo
  video.hide();

  frameRate(30); // Limitar a 30 FPS para mejor rendimiento

  // Inicialización del modelo Handpose
  handposeModel = ml5.handpose(video, onModelReady);

  // Listener para predicciones
  handposeModel.on("predict", (results) => {
    predictions = results;
    checkPalmStatus(predictions); // Verifica si la palma está abierta
    controlVolume(predictions); // Controla el volumen basado en la posición de la palma
    changeSong(predictions); // Cambia la canción basado en la posición horizontal de la palma
  });
}

function onModelReady() {
  console.log("Modelo Handpose cargado");
}

// Función que revisa si la palma está abierta
function checkPalmStatus(predictions) {
  if (predictions.length > 0) {
    const hand = predictions[0]; // Usamos la primera mano detectada
    const thumb = hand.landmarks[4]; // Dedos de la mano
    const index = hand.landmarks[8];
    const middle = hand.landmarks[12];
    const ring = hand.landmarks[16];
    const pinky = hand.landmarks[20];

    // Calcula la distancia entre la punta del pulgar y los otros dedos
    const thumbToIndex = dist(thumb[0], thumb[1], index[0], index[1]);
    const thumbToMiddle = dist(thumb[0], thumb[1], middle[0], middle[1]);
    const thumbToRing = dist(thumb[0], thumb[1], ring[0], ring[1]);
    const thumbToPinky = dist(thumb[0], thumb[1], pinky[0], pinky[1]);

    // Umbral para detectar una palma abierta (distancia suficientemente grande entre el pulgar y los otros dedos)
    const openThreshold = 50; // Ajusta este valor según tus necesidades

    const currentPalmPosition = middle; // Usamos la posición del dedo medio como referencia de la palma

    // Comprobar si la palma está abierta
    if (
      thumbToIndex > openThreshold &&
      thumbToMiddle > openThreshold &&
      thumbToRing > openThreshold &&
      thumbToPinky > openThreshold
    ) {
      // Si la palma está abierta, se debe verificar si está quieta
      if (
        !palmLastPosition ||
        dist(
          currentPalmPosition[0],
          currentPalmPosition[1],
          palmLastPosition[0],
          palmLastPosition[1]
        ) < 5
      ) {
        // Si la palma está quieta, empezar a contar el tiempo
        if (millis() - palmDetectedTime > 1500) {
          // Cambié el tiempo a 1.5 segundos
          // Si han pasado 1.5 segundos de palma abierta y quieta
          togglePlayPause(); // Cambiar entre reproducir y pausar
          palmDetectedTime = millis(); // Reiniciar el contador de tiempo
        }
        isPalmStationary = true;
      } else {
        // Si la palma se ha movido, reiniciar el contador
        palmDetectedTime = millis();
        isPalmStationary = false;
      }

      palmLastPosition = currentPalmPosition; // Guardar la última posición de la palma
    } else {
      // Si la palma no está abierta, reiniciar el contador y la bandera
      palmDetectedTime = millis();
      isPalmStationary = false;
      palmLastPosition = null;
    }
  }
}

function togglePlayPause() {
  if (isPlaying) {
    songs[currentSongIndex].pause(); // Pausar canción si está reproduciéndose
  } else {
    songs[currentSongIndex].play(); // Reproducir canción si está pausada
  }
  isPlaying = !isPlaying; // Cambiar el estado de la música
}

function controlVolume(predictions) {
  if (predictions.length > 0 && isPalmStationary) {
    const hand = predictions[0]; // Usamos la primera mano detectada
    const middle = hand.landmarks[12]; // Usamos el dedo medio para controlar la altura

    // Obtener la posición Y del dedo medio
    const palmY = middle[1];

    // Mapear la posición Y del dedo medio a un rango de volumen (0 a 100)
    const volumeMapped = map(palmY, 0, height, 100, 0); // Invertimos la relación (parte superior = volumen alto)
    volume = constrain(volumeMapped, 0, 100); // Asegurarse de que el volumen esté entre 0 y 100

    // Ajustar el volumen de la canción
    songs[currentSongIndex].setVolume(volume / 100); // La función setVolume espera un valor entre 0 y 1, por eso dividimos entre 100
  }
}

function changeSong(predictions) {
  if (predictions.length > 0) {
    const hand = predictions[0]; // Usamos la primera mano detectada
    const indexFinger = hand.landmarks[8]; // Usamos el dedo índice para la posición horizontal

    const palmX = indexFinger[0]; // Coordenada X del dedo índice

    if (palmX > width - 50) {
      // Si la palma está en el extremo derecho
      nextSong();
    } else if (palmX < 50) {
      // Si la palma está en el extremo izquierdo
      previousSong();
    }
  }
}

function nextSong() {
  if (isPlaying) {
    songs[currentSongIndex].pause(); // Pausar la canción actual
  }
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  songs[currentSongIndex].play(); // Reproducir la nueva canción
  isPlaying = true; // Asegurarse de que está reproduciéndose
}

function previousSong() {
  if (isPlaying) {
    songs[currentSongIndex].pause(); // Pausar la canción actual
  }
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  songs[currentSongIndex].play(); // Reproducir la nueva canción
  isPlaying = true; // Asegurarse de que está reproduciéndose
}

function draw() {
  background(30);

  // Dibuja el video en el lienzo
  image(video, 0, 0, width, height);

  // Dibuja predicciones si hay manos detectadas
  if (predictions.length > 0) {
    predictions.forEach((hand) => {
      hand.landmarks.forEach((point) => {
        fill(0, 255, 0);
        noStroke();
        ellipse(point[0], point[1], 10, 10); // Dibuja el punto clave directamente
      });
    });
  }

  // Muestra el estado actual de la música
  drawState();
}

function drawState() {
  fill(255);
  textSize(24);
  textAlign(CENTER);
  text(isPlaying ? "Reproduciendo" : "Pausado", width / 2, 30);
  text(`Volumen: ${Math.round(volume)}%`, width / 2, height - 30); // Muestra el volumen en porcentaje
}

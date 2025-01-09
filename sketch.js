let song; // Para la música
let handposeModel; // Modelo de Handpose
let video; // Elemento de video
let predictions = []; // Para almacenar las predicciones de Handpose

function preload() {
  // Carga un archivo de audio en la carpeta "assets"
  song = loadSound("assets/song.mp3");
}

function setup() {
  // Crea el lienzo de p5.js
  const canvas = createCanvas(640, 480);
  canvas.parent("canvas-container");

  // Inicializa el video y el modelo de Handpose
  video = createCapture(VIDEO, () => {
    console.log("Video cargado correctamente");
  });
  video.size(width, height);
  video.hide(); // Oculta el video en la página

  handposeModel = ml5.handpose(video, () => {
    console.log("Modelo Handpose cargado");
  });

  handposeModel.on("predict", (results) => {
    predictions = results;
  });

  song.loop(); // Reproduce la canción en bucle
}

function draw() {
  background(30);

  // Dibuja el video en el lienzo
  image(video, 0, 0, width, height);

  // Si hay predicciones de las manos, procesa el control de la música
  if (predictions.length > 0) {
    const hand = predictions[0]; // Toma la primera mano detectada

    // Dibuja los puntos de la mano en pantalla
    hand.landmarks.forEach((point) => {
      fill(0, 255, 0);
      noStroke();
      ellipse(point[0], point[1], 10, 10);
    });

    // Controla el volumen con la posición Y de la palma (landmark[9])
    const palmY = hand.landmarks[9][1];
    const volume = map(palmY, 0, height, 1, 0); // Mapea Y a volumen (0-1)
    song.setVolume(volume);

    // Cambia de pista con movimientos horizontales (landmark[9])
    const palmX = hand.landmarks[9][0];
    if (palmX < width / 4) {
      // Aquí podrías cambiar a una pista anterior
      console.log("Movimiento a la izquierda - Cambiar a pista anterior");
    } else if (palmX > (3 * width) / 4) {
      // Aquí podrías cambiar a una pista siguiente
      console.log("Movimiento a la derecha - Cambiar a pista siguiente");
    }
  }
}

function preload() {
  song = loadSound("assets/song.mp3", () => {
    console.log("Audio cargado correctamente");
  });
}

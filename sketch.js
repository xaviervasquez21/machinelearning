// Declaración de variables globales
let song; // Para almacenar y controlar la música que se reproducirá
let handposeModel; // Modelo de detección de manos (Handpose)
let video; // Elemento de video para capturar la entrada de la cámara
let predictions = []; // Lista para almacenar las predicciones del modelo Handpose

// Función que precarga recursos antes de iniciar el programa
function preload() {
  // Carga un archivo de audio desde la carpeta "assets"
  song = loadSound("assets/song.mp3", () => {
    console.log("Audio cargado correctamente");
  });
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

  // Configura la música para que se reproduzca en bucle
  song.loop();
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

    // Controla el volumen de la música según la posición Y de la palma
    const palmY = hand.landmarks[9][1]; // Coordenada Y del punto 9 (palma)
    const volume = map(palmY, 0, height, 1, 0); // Mapea la posición Y a un rango de volumen (0-1)
    song.setVolume(volume); // Ajusta el volumen de la música

    // Detecta movimientos horizontales para cambiar de pista
    const palmX = hand.landmarks[9][0]; // Coordenada X del punto 9 (palma)
    if (palmX < width / 4) {
      // Movimiento hacia la izquierda: cambiar a la pista anterior
      console.log("Movimiento a la izquierda - Cambiar a pista anterior");
    } else if (palmX > (3 * width) / 4) {
      // Movimiento hacia la derecha: cambiar a la pista siguiente
      console.log("Movimiento a la derecha - Cambiar a pista siguiente");
    }
  }
}

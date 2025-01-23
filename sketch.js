let handPose;
let video;
let hands = [];

function preload() {
  // Cargar el modelo de HandPose
  handPose = ml5.handpose();
}

function setup() {
  createCanvas(640, 480);

  // Crear la captura de video y ocultarlo
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide(); // El video se oculta para que solo se muestre en el canvas

  // Comenzar a detectar las manos
  handPose.on("hand", gotHands); // Usamos el evento 'hand' para recibir los datos de las manos
}

function gotHands(results) {
  hands = results; // Guardar los resultados de las manos detectadas
}

function draw() {
  background(0); // Asegurémonos de limpiar el fondo cada vez

  // Mostrar el video en el canvas
  image(video, 0, 0);

  // Si hay manos detectadas, dibujarlas
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];

    for (let j = 0; j < hand.landmarks.length; j++) {
      let x = hand.landmarks[j][0];
      let y = hand.landmarks[j][1];

      fill(0, 255, 0);
      noStroke();
      ellipse(x, y, 10, 10); // Dibujar cada punto de la mano
    }
  }
}

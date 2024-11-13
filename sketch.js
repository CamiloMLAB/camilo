let font;
let tSize = 200;  // Tamaño del texto
let tposY = 800;  // Posición en Y
let pointCount = 1;  // Factor de muestra

let speed = 5;  // Velocidad de las partículas
let comebackSpeed = 250;  // Fuerza de atracción
let dia = 75;  // Diámetro para el comportamiento de 'flee'
let randomPos = false;  // Iniciar con el texto en pantalla
let pointsDirection = "general";  // Dirección de las partículas
let interactionDirection = -1;

let textPoints = [];
let expanded = false;  // Control de expansión
let formingShape = false;  // Control para formar la figura de la imagen
let edgePoints = [];  // Puntos de borde de la imagen

// Variables para las cajas delimitadoras del texto
let valenciaBounds, youBounds;
let textBoundingBox;

let shapeImage;  // Imagen de la forma

function preload() {
  font = loadFont("AvenirNextLTPro-Demi.otf");
  shapeImage = loadImage("kisspng-valencia-map-download-clip-art-beijing-clipart-5ae3047ed9ad18.4845494115248272628916.png"); // Reemplaza con el nombre real de la imagen
}

function setup() {
  createCanvas(1080, 1920);
  textFont(font);

  // Obtener las cajas delimitadoras para ambos textos
  valenciaBounds = font.textBounds("Valencia", 0, 0, tSize);
  youBounds = font.textBounds("You are not alone", 0, 0, tSize / 2);

  // Calcular posiciones para centrar los textos
  let valenciaX = (width - valenciaBounds.w) / 2;
  let valenciaY = tposY;

  let youX = (width - youBounds.w) / 2;
  let youY = valenciaY + valenciaBounds.h + 50;  // Espacio entre los textos

  // Actualizar las cajas delimitadoras a sus posiciones
  valenciaBounds.x = valenciaX;
  valenciaBounds.y = valenciaY - valenciaBounds.h;

  youBounds.x = youX;
  youBounds.y = youY - youBounds.h;

  // Crear una caja delimitadora combinada para ambos textos
  let minX = min(valenciaBounds.x, youBounds.x);
  let minY = min(valenciaBounds.y, youBounds.y);
  let maxX = max(valenciaBounds.x + valenciaBounds.w, youBounds.x + youBounds.w);
  let maxY = max(valenciaBounds.y + valenciaBounds.h, youBounds.y + youBounds.h);

  textBoundingBox = {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
  };

  // Escalar la imagen para que se ajuste al tamaño del canvas
  let scaleFactor = min(width / shapeImage.width, height / shapeImage.height);
  shapeImage.resize(shapeImage.width * scaleFactor, shapeImage.height * scaleFactor);

  // Procesar la imagen para obtener puntos de borde
  shapeImage.loadPixels();
  edgePoints = []; // Asegurar que esté vacío antes de llenarlo
  for (let x = 0; x < shapeImage.width; x++) {
    for (let y = 0; y < shapeImage.height; y++) {
      let index = (x + y * shapeImage.width) * 4;
      let a = shapeImage.pixels[index + 3];
      if (a > 128) {  // Solo considerar los píxeles opacos
        let worldX = x + width / 2 - shapeImage.width / 2;
        let worldY = y + height / 2 - shapeImage.height / 2;
        edgePoints.push(createVector(worldX, worldY));
      }
    }
  }

  // Crear puntos para "Valencia" y "You are not alone"
  let points1 = font.textToPoints("Valencia", valenciaX, valenciaY + valenciaBounds.h, tSize, { sampleFactor: pointCount });
  let points2 = font.textToPoints("You are not alone", youX, youY + youBounds.h, tSize / 2, { sampleFactor: pointCount });
  
  points1.concat(points2).forEach((pt) => {
    let textPoint = new Interact(pt.x, pt.y, speed, dia, randomPos, comebackSpeed, pointsDirection, interactionDirection);
    textPoints.push(textPoint);
  });
}

function draw() {
  background(255, 117, 20);

  // Actualizar y mostrar cada partícula
  textPoints.forEach((v) => {
    v.update();
    v.show();
    v.behaviors();
  });
}

function mousePressed() {
  if (
    mouseX >= textBoundingBox.x &&
    mouseX <= textBoundingBox.x + textBoundingBox.w &&
    mouseY >= textBoundingBox.y &&
    mouseY <= textBoundingBox.y + textBoundingBox.h
  ) {
    if (!expanded) {
      expanded = true;
      textPoints.forEach((v) => {
        v.target = createVector(random(width), random(height));
      });
    } else if (!formingShape) {
      formingShape = true;
      textPoints.forEach((v, i) => {
        v.target = i < edgePoints.length ? edgePoints[i] : createVector(random(width), random(height));
      });
    } else {
      expanded = false;
      formingShape = false;
      textPoints.forEach((v) => {
        v.target = v.home.copy();
      });
    }
  }
}

function Interact(x, y, m, d, t, s, di, p) {
  this.home = createVector(x, y);
  this.pos = t ? createVector(random(width), random(height)) : this.home.copy();
  this.target = this.home.copy();

  this.vel = createVector();
  this.acc = createVector();
  this.r = 8;
  this.maxSpeed = m;
  this.maxForce = 1;
  this.dia = d;
  this.come = s;
  this.dir = p;
}

Interact.prototype.behaviors = function () {
  let arrive = this.arrive(this.target);
  let mouse = createVector(mouseX, mouseY);
  let flee = this.flee(mouse);

  this.applyForce(arrive);
  this.applyForce(flee);
};

Interact.prototype.applyForce = function (f) {
  this.acc.add(f);
};

Interact.prototype.arrive = function (target) {
  let desired = p5.Vector.sub(target, this.pos);
  let d = desired.mag();
  let speed = this.maxSpeed;
  if (d < this.come) {
    speed = map(d, 0, this.come, 0, this.maxSpeed);
  }
  desired.setMag(speed);
  let steer = p5.Vector.sub(desired, this.vel);
  steer.limit(this.maxForce);
  return steer;
};

Interact.prototype.flee = function (target) {
  let desired = p5.Vector.sub(target, this.pos);
  let d = desired.mag();

  if (d < this.dia) {
    desired.setMag(this.maxSpeed);
    desired.mult(this.dir);
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    return steer;
  } else {
    return createVector(0, 0);
  }
};

Interact.prototype.update = function () {
  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.acc.mult(0);
};

Interact.prototype.show = function () {
  stroke(254, 252, 29);
  strokeWeight(4);
  point(this.pos.x, this.pos.y);
};

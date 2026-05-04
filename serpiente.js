window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 17);
        };
})();

var lienzo = null, canvas = null;
var lastPress = null;
var pause = true;
var gameover = true;
var score = 0;
var dir;

const KEY_LEFT  = 37;
const KEY_UP    = 38;
const KEY_RIGHT = 39;
const KEY_DOWN  = 40;
const KEY_P     = 80;
const KEY_ENTER = 13;

const ARRIBA    = 0;
const DERECHA   = 1;
const ABAJO     = 2;
const IZQUIERDA = 3;

var body = [];
var wall = [];

var medios = [];
var numMediosCargados = 0;

Array.longitud = function(obj) {
    return Object.getOwnPropertyNames(obj).length - 1;
};

function canPlayOgg() {
    var aud = new Audio();
    if (aud.canPlayType('audio/ogg').replace(/no/, ''))
        return true;
    else
        return false;
}

function Rectangle(x, y, width, height, color) {
    this.x      = (x      == null) ? 0            : x;
    this.y      = (y      == null) ? 0            : y;
    this.width  = (width  == null) ? 0            : width;
    this.height = (height == null) ? this.width   : height;
    this.color  = (color  == null) ? "#000"       : color;
}

Rectangle.prototype.intersects = function(rect) {
    if (rect != null) {
        return (this.x < rect.x + rect.width  &&
                this.x + this.width  > rect.x &&
                this.y < rect.y + rect.height &&
                this.y + this.height > rect.y);
    }
    return false;
};

Rectangle.prototype.fill = function(lienzo) {
    if (lienzo != null) {
        lienzo.fillStyle = this.color;
        lienzo.fillRect(this.x, this.y, this.width, this.height);
    }
};

function random(max) {
    return Math.floor(Math.random() * max);
}

function cargaMedio() {
    numMediosCargados++;
}

function reset() {
    score = 0;
    dir   = DERECHA;

    body.length = 0;
    body.push(new Rectangle(40, 40, 10, 10, "#0f0"));
    body.push(new Rectangle(0,  0,  10, 10, "#0f0"));
    body.push(new Rectangle(0,  0,  10, 10, "#0f0"));

    food.x = random(canvas.width  / 10 - 1) * 10;
    food.y = random(canvas.height / 10 - 1) * 10;

    lastPress  = null;
    gameover   = false;
}

var food = new Rectangle(80, 80, 10, 10, "#f00");

function act() {
    if (!pause && !gameover) {

        if (lastPress == KEY_UP    && dir != ABAJO)     dir = ARRIBA;
        if (lastPress == KEY_RIGHT && dir != IZQUIERDA) dir = DERECHA;
        if (lastPress == KEY_DOWN  && dir != ARRIBA)    dir = ABAJO;
        if (lastPress == KEY_LEFT  && dir != DERECHA)   dir = IZQUIERDA;

        for (var i = body.length - 1; i > 0; i--) {
            body[i].x = body[i - 1].x;
            body[i].y = body[i - 1].y;
        }

        if (dir == DERECHA)   body[0].x += 10;
        if (dir == IZQUIERDA) body[0].x -= 10;
        if (dir == ARRIBA)    body[0].y -= 10;
        if (dir == ABAJO)     body[0].y += 10;

        if (body[0].x >= canvas.width)  body[0].x = 0;
        if (body[0].y >= canvas.height) body[0].y = 0;
        if (body[0].x < 0)              body[0].x = canvas.width  - 10;
        if (body[0].y < 0)              body[0].y = canvas.height - 10;

        if (body[0].intersects(food)) {
            score++;
            food.x = random(canvas.width  / 10 - 1) * 10;
            food.y = random(canvas.height / 10 - 1) * 10;

            body.push(new Rectangle(0, 0, 10, 10, "#0f0"));

            if (medios['aComer']) {
                medios['aComer'].currentTime = 0;
                medios['aComer'].play();
            }

            for (var i = 0; i < wall.length; i++) {
                if (food.intersects(wall[i])) {
                    food.x = random(canvas.width  / 10 - 1) * 10;
                    food.y = random(canvas.height / 10 - 1) * 10;
                }
            }
        }

        for (var i = 2; i < body.length; i++) {
            if (body[0].intersects(body[i])) {
                gameover = true;
                if (medios['aMorir']) medios['aMorir'].play();
            }
        }

        for (var i = 0; i < wall.length; i++) {
            if (food.intersects(wall[i])) {
                food.x = random(canvas.width  / 10 - 1) * 10;
                food.y = random(canvas.height / 10 - 1) * 10;
            }
            if (body[0].intersects(wall[i])) {
                gameover = true;
                if (medios['aMorir']) medios['aMorir'].play();
            }
        }
    }

    if (lastPress == KEY_P) {
        pause    = !pause;
        lastPress = null;
    }

    if (gameover && lastPress == KEY_ENTER) {
        reset();
    }
}

function paint(lienzo) {
    var gradiente = lienzo.createLinearGradient(0, 0, 0, canvas.height);
    gradiente.addColorStop(0.5, '#0000FF');
    gradiente.addColorStop(1,   '#000000');
    lienzo.fillStyle = gradiente;
    lienzo.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < body.length; i++) {
        if (medios['iBody'] && medios['iBody'].complete) {
            lienzo.drawImage(medios['iBody'], body[i].x, body[i].y);
        } else {
            body[i].fill(lienzo);
        }
    }

    if (medios['iFood'] && medios['iFood'].complete) {
        lienzo.drawImage(medios['iFood'], food.x, food.y);
    } else {
        food.fill(lienzo);
    }

    for (var i = 0, l = wall.length; i < l; i++) {
        if (medios['iWall'] && medios['iWall'].complete) {
            lienzo.drawImage(medios['iWall'], wall[i].x, wall[i].y);
        } else {
            wall[i].fill(lienzo);
        }
    }

    lienzo.fillStyle = '#fff';
    lienzo.font      = 'bold 12px verdana, sans-serif';
    lienzo.textAlign = 'left';
    lienzo.fillText('Score: ' + score, 10, 15);

    if (pause || gameover) {
        lienzo.textAlign = 'center';
        lienzo.font      = 'bold 20px verdana, sans-serif';
        lienzo.fillStyle = '#fff';
        if (gameover) {
            lienzo.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
            lienzo.font = '12px verdana, sans-serif';
            lienzo.fillText('Pulsa ENTER para jugar', canvas.width / 2, canvas.height / 2 + 25);
        } else {
            lienzo.fillText('PAUSE', canvas.width / 2, canvas.height / 2);
        }
        lienzo.textAlign = 'left';
    }
}

function run() {
    setTimeout(run, 150);
    act();
}

function repaint() {
    requestAnimationFrame(repaint);
    paint(lienzo);
}

function cargando() {
    if (numMediosCargados < Array.longitud(medios)) {
        lienzo.fillStyle = '#000';
        lienzo.fillRect(0, 0, canvas.width, canvas.height);
        lienzo.fillStyle = '#0f0';
        lienzo.font      = '14px verdana';
        lienzo.fillText('Cargando ' + numMediosCargados + ' de ' + Array.longitud(medios), 10, 20);
        setTimeout(cargando, 100);
    } else {
        iniciar();
    }
}

function iniciar() {
    canvas = document.getElementById('lienzo');
    lienzo = canvas.getContext('2d');

    if (numMediosCargados < Array.longitud(medios)) {
        cargando();
        return;
    }


    wall = [];
    wall.push(new Rectangle(100,  50, 10, 10, "#999"));
    wall.push(new Rectangle(100, 100, 10, 10, "#999"));
    wall.push(new Rectangle(200,  50, 10, 10, "#999"));
    wall.push(new Rectangle(200, 100, 10, 10, "#999"));

    body = [];
    body.push(new Rectangle(40, 40, 10, 10, "#0f0"));
    body.push(new Rectangle(0,  0,  10, 10, "#0f0"));
    body.push(new Rectangle(0,  0,  10, 10, "#0f0"));

    dir = DERECHA;

    run();
    repaint();
}

document.addEventListener('keydown', function(evt) {
    lastPress = evt.keyCode;
    if ([37, 38, 39, 40].indexOf(evt.keyCode) > -1) {
        evt.preventDefault();
    }
}, false);

window.addEventListener('load', function() {
    canvas = document.getElementById('lienzo');
    lienzo = canvas.getContext('2d');

    medios['iBody'] = new Image();
    medios['iBody'].src = 'body.png';
    medios['iBody'].addEventListener('load', cargaMedio, false);

    medios['iFood'] = new Image();
    medios['iFood'].src = 'fruit.png';
    medios['iFood'].addEventListener('load', cargaMedio, false);

    medios['iWall'] = new Image();
    medios['iWall'].src = 'wall.png';
    medios['iWall'].addEventListener('load', cargaMedio, false);

    // Sonidos
    medios['aComer'] = new Audio();
    medios['aComer'].src = canPlayOgg() ? 'chomp.ogg' : 'chomp.m4a';
    medios['aComer'].addEventListener('canplaythrough', cargaMedio, false);

    medios['aMorir'] = new Audio();
    medios['aMorir'].src = canPlayOgg() ? 'dies.ogg' : 'dies.m4a';
    medios['aMorir'].addEventListener('canplaythrough', cargaMedio, false);

    cargando();
}, false);

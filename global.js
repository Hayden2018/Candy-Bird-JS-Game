// The point and size class used in this program
function Point(x, y) {
    this.x = (x)? parseFloat(x) : 0.0;
    this.y = (y)? parseFloat(y) : 0.0;
}

function Size(w, h) {
    this.w = (w)? parseFloat(w) : 0.0;
    this.h = (h)? parseFloat(h) : 0.0;
}

// function for checking intersection
function intersect(pos1, size1, pos2, size2) {
    return (pos1.x < pos2.x + size2.w && pos1.x + size1.w > pos2.x &&
            pos1.y < pos2.y + size2.h && pos1.y + size1.h > pos2.y);
}

var motionType = {NONE:0, LEFT:1, RIGHT:2}; // Motion enum

var PLAYER_SIZE = new Size(40, 40);         // The size of the player
var MONSTER_SIZE = new Size(40, 40);        // The size of a monster
var SCREEN_SIZE = new Size(600, 560);       // The size of the game screen
var PLAYER_INIT_POS  = new Point(0, 0);     // The initial position of the player

var MOVE_DISPLACEMENT = 5;                  // The speed of the player in motion
var JUMP_SPEED = 15;                        // The speed of the player jumping
var VERTICAL_DISPLACEMENT = 1;              // The displacement of vertical speed
var GAME_INTERVAL = 25;                     // The time interval of running the game

var player = null;                          // The player object
var monsters = [];                          // The list of monsters
var gameInterval = null;                    // The game interval
var timeInterval = null;                    // The timer
var redPortal = null;                       // Red Portal
var bluePortal = null;                      // Blue Portal

var BULLET_SIZE = new Size(10, 10); // The size of a bullet
var BULLET_SPEED = 10.0;            // The speed of a bullet
var SHOOT_INTERVAL = 200.0;         // The period when shooting is disabled
var canShoot = true;                // A flag indicating whether the player can shoot a bullet

// Game state information
var bulletRemain = 8;
var secondsLeft = 30;
var score = 0;
var portalCool = true;
var playerName = "";
var playerId = "";
var cheating = false;

// Level information
var currentLevel = 1;
var monsterSpeed = 2;
var monsterCount = 6;
var bulletCount = 8;
var rectProb = 0.75;
var timeAllow = 30;

// Sounds
var collectSound = new Audio("collect.wav");
var killSound = new Audio("monsterDie.wav");
var passSound = new Audio("pass.wav");
var dieSound = new Audio("playerDie.wav");
var shootSound = new Audio("shoot.wav");
var BGM = new Audio("background.mp3");

BGM.onended = () => {BGM.play()}

// Allow repeatly playing same sound
function play(sound) {
    sound.pause();
    sound.currentTime = 0;
    sound.play();
}

// Generate platforms in the game
function generatePlatforms() {
    for (let y = 60; y <= 460; y = y + 80){
        let c = 0;
        for (let x = 0; x <= 640; x = x + 60) {
            if ((Math.random() < rectProb || x + y == 60) && c < 9) {
                let platform = document.createElementNS("http://www.w3.org/2000/svg", "use");
                platform.setAttribute("x", x);
                platform.setAttribute("y", y);
                platform.setAttribute("width", 60);
                platform.setAttribute("height", 20);
                platform.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#block");
                document.getElementById("platforms").appendChild(platform);
                c += 1;
            }
        }  
    }
}

// Check too close to another monster
function closeToCandy(x, y) {
    var candies = document.getElementById("dish");
    for (var i = 0; i < candies.childNodes.length; i++) {
        var node = candies.childNodes.item(i);

        var cx = parseFloat(node.getAttribute("x"));
        var cy = parseFloat(node.getAttribute("y"));
        let xclose = Math.abs(cx - x) < 100;
        let yclose = cy == y;
        if (yclose && xclose) return true;
    }
    return false;
}

// Generate candy in the game
function generateCandy() {
    let i = 0;
    while (i < 8){
        let y = Math.floor(Math.random() * 7) * 80 + 20;
        let x = Math.floor(Math.random() * 550) + 10;
        if (closeToCandy(x, y)) continue;
        let candy = document.createElementNS("http://www.w3.org/2000/svg", "use");
        candy.setAttribute("x", x);
        candy.setAttribute("y", y);
        candy.setAttribute("width", 30);
        candy.setAttribute("height", 30);
        candy.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#candy");
        document.getElementById("dish").appendChild(candy);
        ++i;
    }         
}

// This function shoots a bullet from the player
function shootBullet() {

    // Disable shooting for a short period of time
    canShoot = false;
    play(shootSound);
    setTimeout("canShoot = true", SHOOT_INTERVAL);

    // Create the bullet using the use node
    var bullet = document.createElementNS("http://www.w3.org/2000/svg", "use");
    if (player.orientation == motionType.RIGHT) bullet.setAttribute("direction", "right");
    if (player.orientation == motionType.LEFT) bullet.setAttribute("direction", "left");
    bullet.setAttribute("x", player.position.x + PLAYER_SIZE.w / 2 - BULLET_SIZE.w / 2);
    bullet.setAttribute("y", player.position.y + PLAYER_SIZE.h / 2 - BULLET_SIZE.h / 2);
    bullet.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#bullet");
    document.getElementById("bullets").appendChild(bullet);

    if (!cheating) bulletRemain -= 1;
    document.getElementById("remain").innerHTML = bulletRemain;
}

// This function updates the position of the bullets
function moveBullets() {
    // Go through all bullets
    var bullets = document.getElementById("bullets");
    for (var i = 0; i < bullets.childNodes.length; i++) {

        var node = bullets.childNodes.item(i);
        var x = parseInt(node.getAttribute("x"));
        if (node.getAttribute("direction") == "right") node.setAttribute("x", x + BULLET_SPEED);
        if (node.getAttribute("direction") == "left") node.setAttribute("x", x - BULLET_SPEED);

        // If the bullet is not inside the screen delete it from the group
        if (x > SCREEN_SIZE.w) {
            bullets.removeChild(node);
            i--;
        }
    }
}

// This is the keydown handling function for the SVG document
function keydown(evt) {
    var keyCode = (evt.keyCode)? evt.keyCode : evt.getKeyCode();
    switch (keyCode) {
        case "A".charCodeAt(0):
            player.motion = motionType.LEFT;
            break;

        case "D".charCodeAt(0):
            player.motion = motionType.RIGHT;
            break;
			
        case "W".charCodeAt(0):
            if (player.isOnPlatform()) player.verticalSpeed = JUMP_SPEED;
            break;
		
		case "H".charCodeAt(0): 
			if (canShoot && bulletRemain > 0) shootBullet();
            break;
            
        case "C".charCodeAt(0): 
            cheating = true;
            document.getElementById("cheatBox").style = "fill:black;stroke:green;stroke-width:5";
            break;
            
        case "V".charCodeAt(0): 
            cheating = false;
            document.getElementById("cheatBox").style = "fill:black;stroke:red;stroke-width:5";
			break;
    }
}

// This is the keyup handling function for the SVG document
function keyup(evt) {
    // Get the key code
    var keyCode = (evt.keyCode)? evt.keyCode : evt.getKeyCode();

    switch (keyCode) {
        case "A".charCodeAt(0):
            if (player.motion == motionType.LEFT) player.motion = motionType.NONE;
            break;

        case "D".charCodeAt(0):
            if (player.motion == motionType.RIGHT) player.motion = motionType.NONE;
            break;
    }
}

function restart() {
    window.location.replace("game.html");
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function updateRank() {
    let rank = getCookie("rank");
    if (rank == "") {
        playerId = playerName + "#" + 1;
        setCookie("rank", playerId, 50);
        setCookie(playerId, score, 50);
        return;
    }
    rank = rank.split(",");
    let i = 0;
    let newRank = [];
    let added = false;
    playerId = playerName + "#" + (rank.length + 1);
    while (i < rank.length) {
        let s = getCookie(rank[i]);
        if (score > parseInt(s) && !added) {
            newRank.push(playerId);
            added = true;
        }
        newRank.push(rank[i]);
        i += 1;
    }
    if (!added) newRank.push(playerId);
    setCookie("rank", newRank, 50);
    setCookie(playerId, score, 50);
}

function showRank() {
    let rank = getCookie("rank");
    if (rank == "") return;
    rank = rank.split(",");
    let i = 0;
    while (i < rank.length) {
        if (i == 5) break;
        let s = getCookie(rank[i]);
        let name = rank[i].split("#")[0];
        let r = document.getElementById("r" + i);
        r.innerHTML = name.padEnd(32, '-') + s;
        if (rank[i] == playerId) r.style = "fill:#0c9fe8";
        i += 1;
    }
}

// Handle end game
function endGame(reason) {

    if (reason == "monster") {
        alert("Game Over !\nYou are eaten by a monster.");
        let choice = confirm("Play again ?");
        if (choice) restart();
        else {
            document.getElementById("game").style.display = "none";
            document.getElementById("ranking").style.display = "block";
            showRank();
        }
    }

    if (reason == "time") {
        alert("Game Over !\nTime is up.");
        let choice = confirm("Play again ?");
        if (choice) restart();
        else {
            document.getElementById("game").style.display = "none";
            document.getElementById("ranking").style.display = "block";
            showRank();
        }
    }

    if (reason == "win") {
        if (currentLevel == 3)
            alert("Congradulations !\nYou have passed all levels of the game with score " + score + " !");
        else
            alert("Congradulations !\nYou have passed " + currentLevel + " level of the game with score " + score + " !");
        document.getElementById("game").style.display = "none";
        document.getElementById("ranking").style.display = "block";
        updateRank();
        showRank();
    }
}
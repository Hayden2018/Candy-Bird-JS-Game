// The player class used in this program
function Player() {
    let p = document.createElementNS("http://www.w3.org/2000/svg", "use");
    p.setAttribute("x", 0);
    p.setAttribute("y", 0);
    p.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#rplayer");
    document.getElementById("gamearea").appendChild(p);
    this.node = p;
    this.position = PLAYER_INIT_POS;
    this.motion = motionType.NONE;
    this.orientation = motionType.RIGHT;
    this.verticalSpeed = 0;
}

// Check if player is on a platform
Player.prototype.isOnPlatform = function() {
    var platforms = document.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect" && node.nodeName != "use") continue;

        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));

        if (((this.position.x + PLAYER_SIZE.w > x && this.position.x < x + w) ||
            ((this.position.x + PLAYER_SIZE.w) == x && this.motion == motionType.RIGHT) ||
            (this.position.x == (x + w) && this.motion == motionType.LEFT)) &&
            (this.position.y + PLAYER_SIZE.h <= y + 5) && (this.position.y + PLAYER_SIZE.h >= y - 5)) return true;
    }
    if (this.position.y + PLAYER_SIZE.h == SCREEN_SIZE.h) return true;
    return false;
}

// Check if player collide with platform
Player.prototype.collidePlatform = function(position) {
    var platforms = document.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect" && node.nodeName != "use") continue;

        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));
        var h = parseFloat(node.getAttribute("height"));
        var pos = new Point(x, y);
        var size = new Size(w, h);

        if (intersect(position, PLAYER_SIZE, pos, size)) {
            position.x = this.position.x;
            if (intersect(position, PLAYER_SIZE, pos, size)) {
                if (this.position.y >= y + h) position.y = y + h;
                else position.y = y - PLAYER_SIZE.h;
                this.verticalSpeed = 0;
            }
        }
    }
}

// Check if player collide with screen
Player.prototype.collideScreen = function(position) {
    if (position.x < 0) position.x = 0;
    if (position.x + PLAYER_SIZE.w > SCREEN_SIZE.w) position.x = SCREEN_SIZE.w - PLAYER_SIZE.w;
    if (position.y < 0) {
        position.y = 0;
        this.verticalSpeed = 0;
    }
    if (position.y + PLAYER_SIZE.h > SCREEN_SIZE.h) {
        position.y = SCREEN_SIZE.h - PLAYER_SIZE.h;
        this.verticalSpeed = 0;
    }
}

// Check if player collide with candy
Player.prototype.collideCandy = function(position) {
    var candies = document.getElementById("dish");
    for (var i = 0; i < candies.childNodes.length; i++) {
        var node = candies.childNodes.item(i);

        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));
        var h = parseFloat(node.getAttribute("height"));
        var pos = new Point(x, y);
        var size = new Size(w, h);

        if (intersect(position, PLAYER_SIZE, pos, size)) {
            play(collectSound);
            node.remove();
            score += 20;
            displayScore();
        }
    }
}

Player.prototype.collidePortal = function(position) {
    
    if (portalCool == false) return;

    if (intersect(position, PLAYER_SIZE, redPortal.position, redPortal.size)) {
        position.x = bluePortal.position.x;
        position.y = bluePortal.position.y;
        portalCool = false;
    }

    if (portalCool == false) return;

    if (intersect(position, PLAYER_SIZE, bluePortal.position, bluePortal.size)) {
        position.x = redPortal.position.x;
        position.y = redPortal.position.y;
        portalCool= false;
    }
}
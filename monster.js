// The monster class used in this program
function Monster(x, y) {
    let m = document.createElementNS("http://www.w3.org/2000/svg", "use");
    m.setAttribute("x", x);
    m.setAttribute("y", y);
    m.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#rmonster");
    document.getElementById("monsters").appendChild(m);
    this.node = m;
    this.position = new Point(x, y);
    this.displacement = 0;
    this.motion = motionType.NONE;
    
    if (x > 280) {
        this.rightTarget = x;
        this.leftTarget = x - 180;
    }
    else {
        this.rightTarget = x + 180;
        this.leftTarget = x;
    }
}

// Move the monster
Monster.prototype.move = function() {

    if (this.position.x + this.displacement >= this.rightTarget){
        this.motion = motionType.LEFT;
        this.node.remove();
        let m = document.createElementNS("http://www.w3.org/2000/svg", "use");
        m.setAttribute("x", this.position.x);
        m.setAttribute("y", this.position.y);
        m.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#lmonster");
        document.getElementById("monsters").appendChild(m);
        this.node = m;
    }
    if (this.position.x + this.displacement <= this.leftTarget){
        this.motion = motionType.RIGHT;
        this.node.remove();
        let m = document.createElementNS("http://www.w3.org/2000/svg", "use");
        m.setAttribute("x", this.position.x);
        m.setAttribute("y", this.position.y);
        m.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#rmonster");
        document.getElementById("monsters").appendChild(m);
        this.node = m;
    }

    if (this.motion == motionType.LEFT) this.displacement -= monsterSpeed; 
    if (this.motion == motionType.RIGHT) this.displacement += monsterSpeed;
    this.node.setAttribute("transform", "translate(" + this.displacement + ", 0)");
}

// Check collision with player
Monster.prototype.collidePlayer = function() {
    if (cheating) return;
    var x = this.position.x + this.displacement;
    var y = this.position.y;
    if (this.motion == motionType.LEFT) x -= 40;
    if (this.motion == player.motion && player.motion == motionType.RIGHT) x += 10;
    if (this.motion == player.motion && player.motion == motionType.LEFT) x -= 10;
    if (intersect(new Point(x, y), MONSTER_SIZE, player.position, PLAYER_SIZE)) {
        BGM.pause();
        play(dieSound);
        clearInterval(gameInterval);
        clearInterval(timeInterval);
        dieSound.onended = () => {endGame("monster")}
    }
}

// Check collision with bullet
Monster.prototype.collideBullet = function() {
    
    var bullets = document.getElementById("bullets");
    for (var i = 0; i < bullets.childNodes.length; i++) {
        var bullet = bullets.childNodes.item(i);
        var x = parseInt(bullet.getAttribute("x"));
        var y = parseInt(bullet.getAttribute("y"));
        var mx = this.position.x + this.displacement;
        var my = this.position.y;

        if (intersect(new Point(x, y), BULLET_SIZE, new Point(mx, my), MONSTER_SIZE)) {
            play(killSound);
            monsters.splice(monsters.indexOf(this), 1);
            bullets.removeChild(bullet);
            this.node.remove();
            score += 10;
            displayScore();
            i--;
        }
    }
}

// Check close to player
function closeToPlayer(x, y) {
    if (x + y < 160) return true;
    return false;
}

// Check maximum two monster per row
function existTwoMonster(x, y) {
    let c = 0;
    monsters.forEach(m => {if (m.position.y == y) c += 1})
    return c >= 2;
}

// Check too close to another monster
function closeToMonster(x, y) {
    monsters.forEach(m => {
        let xclose = Math.abs(m.position.x - x) < 120;
        let yclose = m.position.y == y;
        if (yclose && xclose) return true;
    })
    return false;
}

// Generate monsters 
function generateMonsters() {
    let i = 0;
    while (i < monsterCount) {
        let y = Math.floor(Math.random() * 7) * 80 + 10;
        let x = Math.floor(Math.random() * 520) + 40;
        // Check conditions
        c1 = closeToPlayer(x, y);
        c2 = existTwoMonster(x, y);
        c3 = closeToMonster(x, y);
        if (c1 || c2 || c3) continue;
        monsters[i] = new Monster(x, y);
        ++i;
    }
}
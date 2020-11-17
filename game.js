// Timer count down
function timer() {
    let time = document.getElementById("seconds");
    if (secondsLeft == 1) {
        BGM.pause();
        play(dieSound);
        clearInterval(gameInterval);
        clearInterval(timeInterval);
        dieSound.onended = () => {endGame("time")}
    }
    secondsLeft -= 1;
    if (secondsLeft == 9) time.setAttribute("x", "700");
    time.innerHTML = secondsLeft;
}

// Should be executed after the page is loaded
function load() {
    document.getElementById("game").style.display = "none";
    document.getElementById("guideline").style.display = "block";
    document.getElementById("ranking").style.display = "none";
}

// Move on to next level
function nextLevel () {
    currentLevel += 1;
    monsterCount += 1;
    monsterSpeed += 1;
    timeAllow -= 5;
    rectProb -= 0.05;

    // Clear all platforms
    let i = 0;
    let platforms = document.getElementById("platforms");
    while (platforms.childNodes.length > i) {
        let node = platforms.childNodes.item(i);
        if (node.nodeName != "use") {
            i += 1;
            continue;
        }
        node.remove();
    }

    // Clear all candy
    let candies = document.getElementById("dish");
    while (candies.childNodes.length > 0) {
        let node = candies.childNodes.item(0);
        node.remove();
    }

    // Clear all monster
    for (let i = 0; i < monsters.length; i++) {
        let m = monsters[i];
        m.node.remove();
    }

    // Reset everything
    monsters = [];
    bulletRemain = 8;
    player.node.remove();
    redPortal.node.remove();
    bluePortal.node.remove();
    secondsLeft = timeAllow;
    document.getElementById("remain").innerHTML = bulletRemain;
    
    // Start next level
    startGame();
}

// Should be executed after the page is loaded
function startGame() {

    BGM.play();

    // Require user to enter name
    if (playerName == "") {
        playerName = prompt("Please enter your player name (Max 10 characters without #)", getCookie("lastUsedName"));
        if (playerName == "" || playerName == null) playerName = "Anonymous";
        else setCookie("lastUsedName", playerName.slice(0, 10), 50);
        if (playerName.length > 10) playerName = playerName.slice(0, 10);
        let nameHolder = document.getElementsByClassName("pname");
        nameHolder[0].innerHTML = playerName;
        nameHolder[1].innerHTML = playerName;
    }
    
    // Show game area and hide guideline area
    document.getElementById("game").style.display = "block";
    document.getElementById("guideline").style.display = "none";

    // Attach keyboard events
    document.addEventListener("keydown", keydown, false);
    document.addEventListener("keyup", keyup, false);

    // Generate game elements
    generatePlatforms();
    generatePortal();
    generateMonsters();
    generateCandy();
    document.getElementById("level").innerHTML = "Level " + currentLevel;

    // Create the player
    player = new Player();

    // Start the game interval
    document.getElementById("seconds").innerHTML = timeAllow;
    gameInterval = setInterval("gamePlay()", GAME_INTERVAL);
    timeInterval = setInterval("timer()", 1000);
}

function checkExit() {
    if (player.position.x > 520 && player.position.y > 480) {
        play(passSound);
        score += 100;
        score += secondsLeft * 5;
        displayScore();
        clearInterval(timeInterval);
        clearInterval(gameInterval);
        if (currentLevel != 3) {
            passSound.onended = () => { 
                let choice = confirm("More danger and rewards await you at the next level !\nBut you would loose all your score if you fail. Continue ?");
                if (choice) nextLevel();
                else endGame('win');
            };  
        }
        else passSound.onended = () => {endGame('win')}
    }
}

function displayScore() {
    let s = document.getElementById("score");
    s.innerHTML = score;
    if (score >= 10) s.setAttribute("x", "690");
    if (score >= 100) s.setAttribute("x", "680");
    if (score >= 1000) s.setAttribute("x", "670");
}

// This function updates the position of the player's SVG object and
function movePlayer() {
    player.node.setAttribute("transform", "translate(" + player.position.x + "," + player.position.y + ")");
}

// This function updates the position and motion of the player in the system
function gamePlay() {    
	
    // Check whether the player is on a platform
    var isOnPlatform = player.isOnPlatform();
    
    // Update player position
    var displacement = new Point();

    // Move left or right
    if (player.motion == motionType.LEFT)
        displacement.x = -MOVE_DISPLACEMENT;
        
    if (player.motion == motionType.RIGHT)
        displacement.x = MOVE_DISPLACEMENT;

    if (player.motion != 0 && player.orientation != player.motion){
        player.node.remove();
        let p = document.createElementNS("http://www.w3.org/2000/svg", "use");
        p.setAttribute("x", 0);
        p.setAttribute("y", 0);
        if (player.motion == motionType.LEFT)
            p.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#lplayer");
        if (player.motion == motionType.RIGHT)
            p.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#rplayer");
        document.getElementById("gamearea").appendChild(p);
        player.node = p;
        player.orientation = player.motion;
    }
        
    // Fall
    if (!isOnPlatform && player.verticalSpeed <= 0) {
        displacement.y = -player.verticalSpeed;
        player.verticalSpeed -= VERTICAL_DISPLACEMENT;
    }

    // Jump
    if (player.verticalSpeed > 0) {
        displacement.y = -player.verticalSpeed;
        player.verticalSpeed -= VERTICAL_DISPLACEMENT;
        if (player.verticalSpeed <= 0)
            player.verticalSpeed = 0;
    }

    // Get the new position of the player
    var position = new Point();
    position.x = player.position.x + displacement.x;
    position.y = player.position.y + displacement.y;

    // Check player collision with everything
    portalCoolDown();
    player.collidePlatform(position);
    player.collideScreen(position);
    player.collidePortal(position);
    player.collideCandy(position);

    // Set the location back to the player object if collision occur
    player.position = position;

    // Move bullets and player
    moveBullets();
    movePlayer();
    
    // Check monster collsion with player or bullet
    monsters.forEach(m => {m.collideBullet()});
    monsters.forEach(m => {m.collidePlayer()});
    
    // Move monster
    monsters.forEach(m => {m.move()});
    
    // Check if player reached exit.
    checkExit();
}
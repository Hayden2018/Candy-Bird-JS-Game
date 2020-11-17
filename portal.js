function Portal(x, y, color) {
    let p = document.createElementNS("http://www.w3.org/2000/svg", "use");
    p.setAttribute("x", x - 5);
    p.setAttribute("y", y - 5);
    if (color == "red") p.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#redPortal");
    if (color == "blue") p.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#bluePortal");
    document.getElementById("gamearea").appendChild(p);
    this.node = p;
    this.position = new Point (x, y);
    this.size = new Size(30, 30);
}

function generatePortal() {
    let y = Math.floor(Math.random() * 3) * 80 + 10;
    let x = Math.floor(Math.random() * 500) + 80;
    redPortal = new Portal(x, y, "red");
    y = Math.floor(Math.random() * 3) * 80 + 250;
    x = Math.floor(Math.random() * 560);
    bluePortal = new Portal(x, y, "blue");
}

function portalCoolDown() {
    let x = player.position.x;
    let y = player.position.y;
    let rx = redPortal.position.x;
    let bx = bluePortal.position.x;
    let ry = redPortal.position.y;
    let by = bluePortal.position.y;
    if (Math.abs(x - rx) > 50 && Math.abs(x - bx) > 50) portalCool = true;
    if (Math.abs(y - ry) > 70 && Math.abs(y - by) > 70) portalCool = true;
}
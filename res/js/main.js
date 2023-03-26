const main = document.getElementById("main");

let selectedHat = (selectedStaff = 0);

// Odzlobřovací kód
window.onresize = () => window.location.reload();

// Json Prep
let gearFile;
let gearData;
window.onload = async () => {
  try {
    gearFile = await fetch("./res/data/gear.json");
    gearData = await gearFile.json();
  } catch (err) {
    console.log(err);
  }
  updateSelect();
};

// Class Prep
class Element {
  constructor(type, parent, id, src) {
    this.type = type;
    this.parent = parent instanceof Element ? parent.instance : parent;
    this.id = id;
    this.src = src;
    this.instance = document.createElement(this.type);
    this.parent.appendChild(this.instance);
    this.instance.id = this.id;
    this.rect = this.instance.getBoundingClientRect();
    this.instance.setAttribute("draggable", false);
    if (this.src != undefined) this.instance.src = this.src;
  }
  hide() {
    this.instance.style.display = "none";
  }
  show() {
    this.instance.style.display = "block";
  }
  remove() {
    this.parent.removeChild(this.instance);
  }
}

class SelectButton extends Element {
  constructor(wrapper, isLeft) {
    super(
      "img",
      wrapper,
      "selectButton",
      isLeft ? "./res/img/leftButton.png" : "./res/img/rightButton.png"
    );
    this.isLeft = isLeft;
    this.hoverSrc = this.isLeft
      ? "./res/img/leftButtonHover.png"
      : "./res/img/rightButtonHover.png";
    this.instance.onmouseover = () => {
      this.instance.src = this.hoverSrc;
    };
    this.instance.onmouseout = () => {
      this.instance.src = this.src;
    };
  }
}

class Player extends Element {
  constructor(wrapper) {
    super("div", wrapper, "player");
    this.body = document.createElement("img");
    this.hatElement = document.createElement("img");
    this.staffElement = document.createElement("img");
    this.body.id = "body";
    this.hatElement.id = "hat";
    this.staffElement.id = "staff";
    this.instance.appendChild(this.body);
    this.instance.appendChild(this.hatElement);
    this.instance.appendChild(this.staffElement);
    this.body.src = "./res/img/body.png";
    this.body.setAttribute("draggable", false);
    this.hatElement.setAttribute("draggable", false);
    this.staffElement.setAttribute("draggable", false);
    this.updateGear();
  }
  async updateGear() {
    try {
      this.hatElement.src = await gearData.hats[selectedHat].src;
      this.staffElement.src = await gearData.staves[selectedStaff].src;
    } catch (error) {
      console.log(error);
    }
  }
}

// Main Menu Init
const mainMenuWrapper = new Element("div", main, "mainMenuWrapper");
const logo = new Element("div", mainMenuWrapper, "logo");
logo.instance.innerText = "RIZZARD";
const hatWrapper = new Element("div", mainMenuWrapper, "selectWrapper");
const hatButtonLeft = new SelectButton(hatWrapper, true);
const hatSelect = new Element("div", hatWrapper, "select");
const hatButtonRight = new SelectButton(hatWrapper, false);
const hatHint = new Element("div", mainMenuWrapper, "selectHint");
const staffWrapper = new Element("div", mainMenuWrapper, "selectWrapper");
const staffButtonLeft = new SelectButton(staffWrapper, true);
const staffSelect = new Element("div", staffWrapper, "select");
const staffButtonRight = new SelectButton(staffWrapper, false);
const staffHint = new Element("div", mainMenuWrapper, "selectHint");
const playerPreview = new Player(mainMenuWrapper);
const startButton = new Element("div", mainMenuWrapper, "startButton");
startButton.instance.innerText = "start";

const updateSelect = () => {
  hatSelect.instance.innerText = gearData.hats[selectedHat].name;
  hatHint.instance.innerText = gearData.hats[selectedHat].hint;
  staffSelect.instance.innerText = gearData.staves[selectedStaff].name;
  staffHint.instance.innerText = gearData.staves[selectedStaff].hint;
  playerPreview.updateGear();
};

hatButtonRight.instance.onclick = () => {
  selectedHat++;
  if (selectedHat == gearData.hats.length) {
    selectedHat = 0;
  }
  updateSelect();
};

hatButtonLeft.instance.onclick = () => {
  selectedHat--;
  if (selectedHat == -1) {
    selectedHat = gearData.hats.length - 1;
  }
  updateSelect();
};

staffButtonRight.instance.onclick = () => {
  selectedStaff++;
  if (selectedStaff == gearData.staves.length) {
    selectedStaff = 0;
  }
  updateSelect();
};

staffButtonLeft.instance.onclick = () => {
  selectedStaff--;
  if (selectedStaff == -1) {
    selectedStaff = gearData.staves.length - 1;
  }
  updateSelect();
};

// Gameplay
let gameplayWrapper;
let player;
let playerPos = window.innerWidth / 2;
let playerTop = (window.innerHeight / 100) * 68;

let healthBar;
let healthBarInside;
let healthCounter;
let maxHealth;
let health;
let scoreCounter;
let score;

let speed;
let maxJumps;
let remainingJumps;
let moveInterval;
let jumpInterval;
let propellerInterval;
let propellerIterator = 0;

startButton.instance.onclick = () => {
  mainMenuWrapper.hide();
  speed = selectedHat == 1 ? 1.5 : 2.5;
  remainingJumps = maxJumps = selectedHat == 2 ? 192 : 30;
  health = maxHealth = 25;
  score = 1;
  gameplayWrapper = new Element("div", main, "gameplayWrapper");
  new Element("div", gameplayWrapper, "borderLeft");
  new Element("div", gameplayWrapper, "borderRight");
  new Element("div", gameplayWrapper, "floor");
  // Player Init
  player = new Player(gameplayWrapper);
  player.instance.style.scale = "0.5";
  player.instance.style.left = playerPos + "px";
  player.instance.style.top = playerTop + "px";
  const propellerCheck = setInterval(() => {
    if (propellerIterator == maxJumps / 6) {
      clearInterval(propellerInterval);
    }
  }, 1);
  const fallInterval = setInterval(() => {
    if (playerTop == (window.innerHeight / 100) * 68) {
      remainingJumps = maxJumps;
      propellerIterator = 0;
    }
    if (playerTop + 6 > (window.innerHeight / 100) * 68) {
      return;
    }
    playerTop += 6;
    player.instance.style.top = playerTop + "px";
  }, 24);
  window.addEventListener("keydown", startMoving);
  window.addEventListener("keyup", stopMoving);
  document.onmousemove = (event) => updateStaffRotation(event);
  // Hud Init
  healthBar = new Element("div", gameplayWrapper, "healthBar");
  healthBarInside = new Element("div", healthBar, "healthBarInside");
  healthCounter = new Element("div", gameplayWrapper, "healthCounter");
  scoreCounter = new Element("div", gameplayWrapper, "scoreCounter");
  updateHealth();
  scoreCounter.instance.innerText = score;
};

const updateHealth = () => {
  healthCounter.instance.innerText = `${health}/${maxHealth}`;
};

// Matematika těžká :((
const updateStaffRotation = (event) => {
  let rect = player.instance.getBoundingClientRect();
  let a = event.clientX - playerPos - rect.width;
  let b = playerTop + rect.height - event.clientY;
  player.staffElement.style.transform = `rotate(${Math.atan2(a, b)}rad)`;
};

const startMoving = (event) => {
  if (event.keyCode != 32) {
    if (moveInterval) {
      clearInterval(moveInterval);
    }
    moveInterval = setInterval(move, 10, event);
    return;
  }
  if (selectedHat == 2) {
    remainingJumps -= 96;
    propellerIterator = 0;
    if (remainingJumps > 0) {
      clearInterval(propellerInterval);
      propellerInterval = setInterval(() => {
        propellerIterator++;
        playerTop -= 6;
        player.instance.style.top = playerTop + "px";
      }, 10);
    }
    return;
  }
  if (jumpInterval) {
    clearTimeout(jumpInterval);
  }
  if (remainingJumps == maxJumps) {
    jumpInterval = setInterval(jump, 10);
  }
};

const move = (event) => {
  switch (event.keyCode) {
    case 65:
      if (parseInt(player.instance.style.left, 10) <= 0) {
        break;
      }
      playerPos -= speed;
      player.instance.style.left = playerPos + "px";
      break;
    case 68:
      if (
        parseInt(player.instance.style.left, 10) >=
        window.innerWidth - player.rect.width
      ) {
        break;
      }
      playerPos += speed;
      player.instance.style.left = playerPos + "px";
      break;
  }
};

const jump = () => {
  if (remainingJumps > 0) {
    remainingJumps--;
    playerTop -= 6;
    player.instance.style.top = playerTop + "px";
  }
};

const stopMoving = (event) => {
  if (event.keyCode != 32) {
    clearInterval(moveInterval);
    return;
  }
  if (event.keyCode == 32) {
    clearInterval(jumpInterval);
  }
};

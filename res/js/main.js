const main = document.getElementById("main");

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

let selectedHat = (selectedStaff = 0);

class Player extends Element {
  constructor(wrapper, isPlayable) {
    super("div", wrapper, "player");
    this.isPlayable = isPlayable;
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
    this.updateGear();
  }
  async updateGear() {
    this.hatElement.src = await gearData.hats[selectedHat].src;
    this.staffElement.src = await gearData.staves[selectedStaff].src;
  }
}

// Main Menu Init
const mainMenuWrapper = new Element("div", main, "mainMenuWrapper");
const logo = new Element("div", mainMenuWrapper, "logo");
logo.instance.innerText = "RIZZARD";
const hatWrapper = new Element(
  "div",
  mainMenuWrapper.instance,
  "selectWrapper"
);
const hatButtonLeft = new SelectButton(hatWrapper, true);
const hatSelect = new Element("div", hatWrapper, "select");
const hatButtonRight = new SelectButton(hatWrapper, false);
const hatHint = new Element("div", mainMenuWrapper, "selectHint");
const staffWrapper = new Element("div", mainMenuWrapper, "selectWrapper");
const staffButtonLeft = new SelectButton(staffWrapper, true);
const staffSelect = new Element("div", staffWrapper, "select");
const staffButtonRight = new SelectButton(staffWrapper, false);
const staffHint = new Element("div", mainMenuWrapper, "selectHint");
const playerPreview = new Player(mainMenuWrapper, false);
const startButton = new Element("div", mainMenuWrapper, "startButton");
startButton.instance.innerText = "start";

// Gameplay Init
const gameplayWrapper = new Element("div", main, "gameplayWrapper");
gameplayWrapper.hide();

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

startButton.instance.onclick = () => {
  mainMenuWrapper.hide();
};

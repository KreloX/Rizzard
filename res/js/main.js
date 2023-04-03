const main = document.getElementById("main");

let selectedHat = (selectedStaff = souls = 0);

// Odzlobřovací kód
window.onresize = () => window.location.reload();

// Json Prep
let gearFile, gearData;
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

let maxHealth, health, barrier, barrierElement;
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
      // One premature json load
    }
  }
  startInvulnerability() {
    canHurt = false;
    setTimeout(() => {
      canHurt = true;
    }, invulnerabilityTimer);
  }
  shoot(event) {
    window.removeEventListener("click", player.shoot, event);
    setTimeout(() => {
      if (canShoot) window.addEventListener("click", player.shoot, event);
    }, attackSpeed);
    if (selectedStaff != 4) {
      new Projectile(event.clientX, event.clientY, player);
      return;
    }
    new Lightning(event.clientX, true);
  }
  updateHealth(hpIncrease, maxHpIncrease) {
    if (hpIncrease < 0) {
      this.startInvulnerability();
      if (barrier) {
        clearInterval(barrierInterval);
        barrierInterval = setInterval(() => {
          if (!barrier) {
            barrierElement = new Element("div", player, "barrier");
          }
          barrier = true;
        }, 16000 / epicCounters[1]);
        hpIncrease = 0;
        barrierElement.remove();
        barrier = false;
      }
    }
    health += hpIncrease < 0 ? hpIncrease - hpIncrease * defense : hpIncrease;
    maxHealth += maxHpIncrease;
    health = health < 0 ? 0 : health <= maxHealth ? health : maxHealth;
    healthCounter.instance.innerText = `${parseInt(health, 10)}/${maxHealth}`;
    healthBarInside.instance.style.width = `${(health / maxHealth) * 100}%`;
    if (health == 0) {
      isOver = true;
      projectiles.forEach((projectile) => {
        projectile.remove();
      });
      enemies.forEach((enemy) => {
        enemy.remove();
      });
      clearInterval(fallingInterval);
      clearInterval(beanieInterval);
      clearInterval(thunderInterval);
      clearInterval(barrierInterval);
      playerPos = window.innerWidth / 2;
      playerTop = (window.innerHeight / 100) * 68;
      window.removeEventListener("keydown", startMoving);
      window.removeEventListener("keyup", stopMoving);
      window.removeEventListener("click", player.shoot);
      this.remove();
      const overWindow = new Element("div", gameplayWrapper, "overWindow");
      const gameOver = new Element("p", overWindow, "gameOver");
      new Element("img", overWindow, "gameOverImg", "./res/img/gameOver.png");
      const scoreDisplay = new Element("p", overWindow, "scoreDisplay");
      const retryButton = new Element("div", overWindow, "retryButton");
      gameOver.instance.innerText = "game over";
      scoreDisplay.instance.innerText = "score";
      //            CSS usage world champion    |||
      //                                        VVV
      scoreDisplay.instance.innerHTML += `<span id="red">${score}</span>`;
      retryButton.instance.innerText = "retry";
      retryButton.instance.onclick = () => {
        gameplayWrapper.remove();
        mainMenuWrapper.show();
      };
    }
  }
}

let lightningDamage;
class Lightning extends Element {
  constructor(pos, isPlayer) {
    super("img", gameplayWrapper, "lightning", "./res/img/lightning.png");
    this.isPlayer = isPlayer;
    lightningDamage = this.isPlayer
      ? 2 + uncommonCounters[6] + commonCounters[0] * 2
      : 2 + uncommonCounters[6];
    this.pos = pos - window.innerWidth * 0.017;
    this.instance.style.left = this.pos + "px";
    this.rect = this.instance.getBoundingClientRect();
    enemies.forEach((enemy) => {
      let enemyRect = enemy.instance.getBoundingClientRect();
      let enemyX = enemyRect.x;
      if (
        this.rect.x >= enemyX - enemyRect.width / 2 &&
        this.rect.x <= enemyX + enemyRect.width
      ) {
        enemy.hurt(lightningDamage);
      }
    });
    setTimeout(() => {
      this.remove();
    }, 200);
  }
}

let projectileWidth;
let projectileHeight;
let invulnerabilityTimer = 300;
let enemyProjectiles = [];
class Projectile extends Element {
  constructor(destX, destY, source) {
    super("div", gameplayWrapper, "projectile");
    this.source = source;
    this.canHurt = true;
    this.projectileResistance = projectileResistance;
    projectiles.push(this);
    if (this.source instanceof Enemy) {
      this.instance.style.backgroundColor = "#FF00E1";
      let playerRect = player.instance.getBoundingClientRect();
      this.destX = playerRect.x + playerRect.width / 2;
      this.destY = playerRect.y + playerRect.height;
      enemyProjectiles.push(this);
    } else {
      this.destX = parseInt(destX, 10);
      this.destY = parseInt(destY, 10);
      this.instance.style.width = projectileWidth + "%";
      this.instance.style.height = projectileHeight + "%";
    }
    this.sourceRect = this.source.instance.getBoundingClientRect();
    this.startX = this.sourceRect.x + this.sourceRect.width / 2;
    this.startY = this.sourceRect.y + this.sourceRect.height / 2;
    this.instance.style.left = this.startX;
    this.instance.style.top = this.startY;
    this.vx = this.destX - this.startX;
    this.vy = this.destY - this.startY;
    this.dist = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.dx = this.vx / this.dist;
    this.dy = this.vy / this.dist;
    this.dx *=
      this.source instanceof Enemy
        ? window.innerWidth / 480
        : window.innerWidth / 360;
    this.dy *= window.innerWidth / 480;
    this.update = setInterval(() => this.onUpdate(), 10);
    setTimeout(
      () => {
        this.instance.style.display = "block";
      },
      this.source instanceof Player ? 80 : 40
    );
  }
  onUpdate() {
    let projectileRect = this.instance.getBoundingClientRect();
    let projectileX = projectileRect.x;
    let projectileY = projectileRect.y;
    this.startX += this.dx;
    this.startY += this.dy;
    this.instance.style.left = `${this.startX}px`;
    this.instance.style.top = `${this.startY}px`;
    if (
      this.startX < (window.innerWidth / 100) * 1.8 ||
      this.startX > (window.innerWidth / 100) * 97 ||
      this.startY > (window.innerHeight / 100) * 84.4 ||
      this.startY < 0
    ) {
      this.remove();
    }
    if (this.source instanceof Player) {
      enemyProjectiles.forEach((enemyProjectile) => {
        let enemyProjectileRect =
          enemyProjectile.instance.getBoundingClientRect();
        let enemyX = enemyProjectileRect.x;
        let enemyY = enemyProjectileRect.y;
        if (
          projectileX >= enemyX - enemyProjectileRect.width &&
          projectileX <= enemyX + enemyProjectileRect.width &&
          projectileY >= enemyY - enemyProjectileRect.height &&
          projectileY <= enemyY + enemyProjectileRect.height
        ) {
          enemyProjectile.remove();
          this.takeHit(1);
        }
      });
      enemies.forEach((enemy) => {
        let enemyRect = enemy.instance.getBoundingClientRect();
        let enemyX = enemyRect.x;
        let enemyY = enemyRect.y;
        if (
          projectileX >= enemyX - enemyRect.width * 0.2 &&
          projectileX <= enemyX + enemyRect.width * 0.9 &&
          projectileY >= enemyY &&
          projectileY <= enemyY + enemyRect.height
        ) {
          player.updateHealth(damage * leech, 0);
          if (this.canHurt) {
            enemy.hurt(damage);
          }
          this.canHurt = false;
          setTimeout(() => {
            this.canHurt = true;
          }, 600);
          if (selectedStaff != 5) this.remove();
        }
      });
      return;
    }
    let playerRect = player.instance.getBoundingClientRect();
    let playerX = playerRect.x;
    let playerY = playerRect.y;
    if (
      projectileX >= playerX &&
      projectileX <= playerX + playerRect.width / 1.5 &&
      projectileY >= playerY &&
      projectileY <= playerY + playerRect.height
    ) {
      this.remove();
      if (canHurt) {
        player.updateHealth(enemyDamage, 0);
      }
    }
  }
  takeHit(damage) {
    this.projectileResistance -= damage;
    if (this.projectileResistance <= 0) {
      this.remove();
    }
  }
  remove() {
    super.remove();
    projectiles.splice(projectiles.indexOf(this), 1);
    if (this.source instanceof Enemy) {
      enemyProjectiles.splice(enemyProjectiles.indexOf(this), 1);
    }
    clearInterval(this.update);
  }
}

let enemyHealth, enemyDamage;
class Enemy extends Element {
  constructor() {
    super("img", gameplayWrapper, "enemy", "./res/img/enemy.png");
    this.gap = enemyGap;
    enemyGap += window.innerWidth * 0.1;
    this.maxHealth = this.health = enemyHealth;
    this.randomPos =
      Math.floor(
        Math.random() * (window.innerWidth * 0.9 - window.innerWidth * 0.02)
      ) +
      window.innerWidth * 0.02;
    this.instance.style.left = `${this.randomPos}px`;
    this.top = -window.innerHeight * 0.3;
    this.left = this.randomPos;
    this.instance.style.top = `${this.top}px`;
    this.wantedTop =
      Math.floor(
        Math.random() * (window.innerHeight * 0.1 - window.innerHeight * 0.3)
      ) +
      window.innerHeight * 0.3;
    enemies.push(this);
    setTimeout(() => {
      this.instance.style.display = "block";
      setTimeout(() => {
        this.shooting = setInterval(() => {
          new Projectile(0, 0, this);
        }, 1600);
      }, 1000);
    }, 20);
    this.moving = setInterval(() => {
      let playerRect = player.instance.getBoundingClientRect();
      let playerX = playerRect.x;
      let rect = this.instance.getBoundingClientRect();
      let rectX = rect.x;
      let rectY = rect.y;
      if (rectY < this.wantedTop) {
        this.top += window.innerHeight * 0.01;
        this.instance.style.top = `${this.top}px`;
      }
      if (rectX - this.gap < playerX - playerRect.width * 3) {
        setTimeout(() => {
          if (this.left + window.innerWidth * 0.001 < window.innerWidth * 0.9) {
            this.left += window.innerWidth * 0.001;
            this.instance.style.left = `${this.left}px`;
          }
        }, 500);
      }
      if (rectX + this.gap > playerX + playerRect.width * 3) {
        setTimeout(() => {
          if (this.left - window.innerWidth * 0.001 > window.innerWidth * 0.1) {
            this.left -= window.innerWidth * 0.001;
            this.instance.style.left = `${this.left}px`;
          }
        }, 500);
      }
    }, 35);
    this.onUpdate = setInterval(() => {
      this.rotate();
      if (this.health <= 0) {
        if (Math.random() * 101 <= soulChance) {
          new Orb(true, this);
        }
        if (Math.random() * 101 <= orbChance) {
          new Orb(false, this);
        }
        this.remove();
      }
    }, 10);
  }
  rotate() {
    let enemyRect = this.instance.getBoundingClientRect();
    let playerRect = player.instance.getBoundingClientRect();
    let a = playerRect.x - (enemyRect.x - playerRect.width / 6);
    let b = enemyRect.y - (playerRect.y + playerRect.height / 2);
    this.instance.style.transform = `rotate(${Math.atan2(a, b) + Math.PI}rad)`;
  }
  hurt(damage) {
    this.instance.src = "./res/img/enemyHit.png";
    setTimeout(() => {
      this.instance.src = this.src;
    }, 100);
    let rect = this.instance.getBoundingClientRect();
    let random = Math.random() * 101;
    let critical = critChance >= random;
    let finalDamage = critical ? damage * critAmp : damage;
    new Popoff(
      rect.x + rect.width / 6,
      rect.y - rect.height / 1.2,
      finalDamage,
      critical
    );
    this.health -= finalDamage;
    this.instance.style.opacity = this.health / this.maxHealth;
  }
  remove() {
    super.remove();
    enemies.splice(enemies.indexOf(this), 1);
    clearInterval(this.onUpdate);
    clearInterval(this.shooting);
    clearInterval(this.moving);
    if (enemies.length == 0 && !isOver) {
      cardSelect();
    }
  }
}

class Orb extends Element {
  constructor(isSoul, source) {
    super("div", gameplayWrapper, "orb");
    this.isSoul = isSoul;
    this.source = source;
    this.sourceRect = this.source.instance.getBoundingClientRect();
    this.startX = this.isSoul
      ? this.sourceRect.x + this.sourceRect.width / 4
      : this.sourceRect.x + (this.sourceRect.width / 4) * 3;
    this.startY = this.sourceRect.y + this.sourceRect.height / 2;
    this.fallingSpeed = window.innerHeight / 360;
    this.instance.style.left = this.startX + "px";
    this.instance.style.top = this.startY + "px";
    this.instance.style.backgroundColor = this.isSoul ? "blue" : "red";
    this.canPick = false;
    this.falling = setInterval(() => {
      if (this.startY >= window.innerHeight * 0.8275) {
        clearInterval(this.falling);
        this.canPick = true;
      }
      this.startY += this.fallingSpeed;
      this.instance.style.top = this.startY + "px";
    }, 10);
    this.playerCheck = setInterval(() => {
      let rect = this.instance.getBoundingClientRect();
      let playerRect = player.instance.getBoundingClientRect();
      let playerX = playerRect.x;
      if (
        playerX >= this.startX - playerRect.width &&
        playerX <= this.startX + rect.width &&
        this.canPick
      ) {
        clearInterval(this.playerCheck);
        this.remove();
        if (this.isSoul) {
          souls++;
          updateSouls();
        } else {
          player.updateHealth(orbHeal, 0);
        }
      }
    }, 100);
  }
}

class Popoff extends Element {
  constructor(startX, startY, damage, critical) {
    super("p", gameplayWrapper, "popoff");
    this.startX = parseInt(startX, 10);
    this.startY = parseInt(startY, 10);
    this.instance.style.left = `${this.startX}px`;
    this.instance.style.top = `${this.startY}px`;
    this.damage = damage;
    this.critical = critical;
    this.instance.innerText = parseInt(this.damage, 10);
    this.instance.style.color = critical ? "#00F9FE" : "#D60113";
    setTimeout(() => {
      this.remove();
    }, 300);
    this.onUpdate = setInterval(() => {
      let upSpeed = window.innerHeight / 1080;
      this.startY -= upSpeed;
      this.instance.style.top = `${this.startY}px`;
    }, 1);
  }
  remove() {
    super.remove();
    clearInterval(this.onUpdate);
  }
}

let uncommonChance, epicChance;
let commonCounters, uncommonCounters, epicCounters;
let projectileResistance;
let leech;
let tome;
let soulChance;
let orbChance;
let orbHeal;
let critAmp;
let refreshCost;
let thunderbolts;
let thunderInterval;
class Card extends Element {
  constructor(isRefresh) {
    super("div", selectionWrapper, "card");
    this.isRefresh = isRefresh;
    this.cardName = new Element("div", this, "cardName");
    this.cardImg = new Element("img", this, "cardImg");
    this.cardDesc = new Element("div", this, "cardDesc");
    if (this.isRefresh) {
      this.cardName.instance.innerText = "Refresh";
      this.cardImg.instance.src = "./res/img/refresh.png";
      this.cardDesc.instance.innerHTML = `Reroll cards<br><br>Cost: ${refreshCost} Souls`;
      this.instance.onclick = () => {
        if (souls >= refreshCost) {
          souls -= refreshCost;
          updateSouls();
          cards.forEach((card) => {
            if (card.category < 2) {
              card.category = Card.randomCategory();
            }
            card.attachAbility();
          });
        }
      };
      return;
    }
    this.category = score % 5 == 0 ? 2 : Card.randomCategory();
    this.randomCard;
    this.attachAbility();
  }
  attachAbility() {
    this.randomCard = parseInt(
      Math.random() * gearData.cards[this.category].cards.length,
      10
    );
    if (this.randomCard == 0 && this.category == 2 && cardsToSelect >= 9) {
      this.category = 3;
      this.randomCard = 5;
    }
    switch (this.category) {
      case 0:
        this.cardName.instance.style.color = "white";
        this.cardImg.instance.style.borderColor = "white";
        break;
      case 1:
        this.cardName.instance.style.color = "#00FA00";
        this.cardImg.instance.style.borderColor = "#00FA00";
        break;
      case 2:
        this.cardName.instance.style.color = "#E0DA3E";
        this.cardImg.instance.style.borderColor = "#FF3CFF";
        break;
      case 3:
        this.cardName.instance.style.color = "#00F9AB";
        this.cardImg.instance.style.borderColor = "#00F9AB";
        break;
    }
    this.cardName.instance.innerText =
      gearData.cards[this.category].cards[this.randomCard].name;
    this.cardImg.instance.src =
      gearData.cards[this.category].cards[this.randomCard].src;
    this.cardDesc.instance.innerHTML =
      gearData.cards[this.category].cards[this.randomCard].desc;
    setTimeout(() => {
      this.instance.onclick = () => {
        nextRound();
        switch (this.category) {
          // Common
          case 0:
            commonCounters[this.randomCard]++;
            switch (this.randomCard) {
              // Catalyst
              case 0:
                damage += 2 * tome;
                break;
              // Eyesight
              case 1:
                critChance += 5 * tome;
                break;
              // Growth
              case 2:
                player.updateHealth(10 * tome, 10 * tome);
                break;
              // Impulse
              case 3:
                maxJumps +=
                  selectedHat == 2
                    ? (window.innerHeight / 5.625) * 0.3 * tome
                    : 9 * tome;
                break;
              // Renew
              case 4:
                player.updateHealth(maxHealth, 0);
                break;
              // Resist
              case 5:
                defense += defense < 90 ? 0.04 * tome : 0;
                break;
              // Resonance
              case 6:
                attackSpeed -= attackSpeed * 0.12 * tome;
                break;
              // Souls
              case 7:
                soulChance += 1 * tome;
                break;
              // Stability
              case 8:
                projectileResistance++;
                break;
              // Swift
              case 9:
                speed +=
                  0.2 *
                  (selectedHat == 1
                    ? window.innerWidth / 1280
                    : window.innerWidth / 768) *
                  tome;
                break;
            }
            break;
          // Uncommon
          case 1:
            switch (this.randomCard) {
              // Catalyst+
              case 0:
                commonCounters[0] += 2;
                damage += 4;
                break;
              // Charge
              case 1:
                uncommonCounters[0]++;
                projectileWidth += 0.2;
                projectileHeight += 0.4;
                break;
              // Cloak
              case 2:
                uncommonCounters[1]++;
                invulnerabilityTimer += 150;
                break;
              // Growth+
              case 3:
                commonCounters[2] += 2;
                player.updateHealth(20, 20);
                break;
              // Leech
              case 4:
                uncommonCounters[2]++;
                leech += 0.03;
                break;
              // Luck
              case 5:
                uncommonCounters[3]++;
                uncommonChance += 5;
                epicChance++;
                break;
              // Orb
              case 6:
                uncommonCounters[4]++;
                orbHeal++;
                orbChance += 5;
                break;
              // Precision
              case 7:
                uncommonCounters[5]++;
                critAmp += 0.5;
                break;
              // Resonance+
              case 8:
                commonCounters[5] += 2;
                attackSpeed -= attackSpeed * 0.24;
                break;
              // Swift+
              case 9:
                commonCounters[9] += 2;
                speed +=
                  0.4 *
                  (selectedHat == 1
                    ? window.innerWidth / 1280
                    : window.innerWidth / 768);
                break;
              // Thunderbolt
              case 10:
                uncommonCounters[6]++;
                thunderbolts += thunderbolts < 6 ? 2 : 0;
                clearInterval(thunderInterval);
                thunderInterval = setInterval(() => {
                  spawnLightning();
                }, 8000);
                break;
            }
            break;
          // Epic
          case 2:
            switch (this.randomCard) {
              // Appraisal
              case 0:
                epicCounters[0]++;
                cardsToSelect++;
                break;
              // Barrier
              case 1:
                epicCounters[1]++;
                clearInterval(barrierInterval);
                barrierInterval = setInterval(() => {
                  if (!barrier) {
                    barrierElement = new Element("div", player, "barrier");
                  }
                  barrier = true;
                }, 16000 / epicCounters[1]);
                break;
              // Focus
              case 2:
                epicCounters[2]++;
                break;
              // Growth++
              case 3:
                commonCounters[2] += 4;
                player.updateHealth(40, 40);
                break;
              // Leech+
              case 4:
                uncommonCounters[2] += 2;
                leech += 0.09;
                break;
              // Overheat
              case 5:
                epicCounters[3]++;
                break;
              // Thunderbolt+
              case 6:
                uncommonCounters[6] += 2;
                thunderbolts += 6 - thunderbolts;
                clearInterval(thunderInterval);
                thunderInterval = setInterval(() => {
                  spawnLightning();
                }, 8000);
                break;
              // Wound
              case 7:
                epicCounters[4]++;
                break;
              // Tome
              case 8:
                epicCounters[5]++;
                tome += 0.35;
                break;
            }
            break;
          // Ascension
          case 3:
            break;
        }
      };
    }, 500);
  }
  static randomCategory() {
    let random = Math.random() * 101;
    if (random < epicChance) {
      return 2;
    } else if (random < uncommonChance) {
      return 1;
    } else return 0;
  }
}

// Main Menu Init
const mainMenuWrapper = new Element("div", main, "mainMenuWrapper");
new Element(
  "img",
  mainMenuWrapper,
  "backgroundImg",
  "./res/img/background.png"
);
const swarmImg = new Element(
  "img",
  mainMenuWrapper,
  "swarmImg",
  "./res/img/swarm.png"
);
const logo = new Element("div", mainMenuWrapper, "logo");
const moveHint = new Element(
  "img",
  mainMenuWrapper,
  "moveHint",
  "./res/img/hint.png"
);
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

let swarmPos = -window.innerWidth / 1.5;
setInterval(() => {
  swarmPos += window.innerHeight / 216;
  swarmImg.instance.style.left = `${swarmPos}px`;
  if (swarmPos >= window.innerWidth) {
    swarmPos = -window.innerWidth / 1.5;
  }
}, 25);

const updateSelect = () => {
  hatSelect.instance.innerText = gearData.hats[selectedHat].name;
  hatHint.instance.innerText = gearData.hats[selectedHat].hint;
  staffSelect.instance.innerText = gearData.staves[selectedStaff].name;
  staffHint.instance.innerHTML = gearData.staves[selectedStaff].hint;
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

let gameplayWrapper, player, canShoot, canHurt;
let playerPos = window.innerWidth / 2;
let playerTop = (window.innerHeight / 100) * 68;
let enemies = (projectiles = cards = []);
let healthBar, healthBarInside, healthCounter;
let scoreCounter, score, isOver, soulsCounter;
let damage, attackSpeed, defense, critChance, speed;
let jumpSpeed = window.innerHeight / 180;
let maxJumps, remainingJumps, enemiesToSpawn, cardsToSelect, enemyGap;
let moveLeftInterval, moveRightInterval, jumpInterval, propellerInterval;
let fallingInterval, beanieInterval, barrierInterval;
let propellerIterator = (timesJumped = 0);
// Gameplay
startButton.instance.onclick = () => {
  mainMenuWrapper.hide();
  isOver = barrier = false;
  canShoot = canHurt = true;
  leech = orbChance = thunderbolts = enemyDamage = 0;
  tome = projectileResistance = soulChance = enemiesToSpawn = 1;
  orbHeal = 4;
  critAmp = 1.5;
  projectileWidth = 1;
  projectileHeight = 2;
  enemyHealth = 10;
  refreshCost = selectedHat != 5 ? 5 : 0;
  cardsToSelect = 4;
  epicChance = 0;
  uncommonChance = selectedHat != 3 ? 10 : 100;
  speed = window.innerWidth / 768;
  defense = 0;
  enemyGap = 0;
  commonCounters = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  uncommonCounters = [0, 0, 0, 0, 0, 0, 0];
  epicCounters = [0, 0, 0, 0, 0];
  if (selectedHat == 1) {
    speed = window.innerWidth / 1280;
    defense = 0.12;
  }
  remainingJumps = maxJumps =
    selectedHat == 2 ? window.innerHeight / 5.625 : 30;
  health = maxHealth = 25;
  attackSpeed = selectedStaff == 1 ? 400 : 600;
  damage = selectedStaff == 1 ? 2 : 4;
  critChance = 5;
  score = 0;
  gameplayWrapper = new Element("div", main, "gameplayWrapper");
  enemies = [];
  spawnEnemies(selectedHat != 4 ? enemiesToSpawn : enemiesToSpawn * 2);
  new Element("div", gameplayWrapper, "borderLeft");
  new Element("div", gameplayWrapper, "borderRight");
  new Element("div", gameplayWrapper, "floor");
  // Player Init
  player = new Player(gameplayWrapper);
  player.instance.style.scale = "0.5";
  player.instance.style.left = playerPos + "px";
  player.instance.style.top = playerTop + "px";
  window.addEventListener("keydown", startMoving);
  window.addEventListener("keyup", stopMoving);
  window.addEventListener("mousemove", updateStaffRotation);
  setTimeout(() => {
    window.addEventListener("click", player.shoot);
  }, 10);
  beanieInterval = setInterval(() => {
    if (propellerIterator == 32) {
      clearInterval(propellerInterval);
    }
  }, 1);
  fallingInterval = setInterval(() => {
    if (playerTop == (window.innerHeight / 100) * 68) {
      if (propellerIterator != 0) {
        propellerIterator = 0;
        timesJumped = 0;
        return;
      }
      remainingJumps = maxJumps;
    }
    if (playerTop + jumpSpeed > (window.innerHeight / 100) * 68) {
      return;
    }
    playerTop += jumpSpeed;
    player.instance.style.top = playerTop + "px";
  }, 24);
  // Hud Init
  healthBar = new Element("div", gameplayWrapper, "healthBar");
  healthBarInside = new Element("div", healthBar, "healthBarInside");
  healthCounter = new Element("div", gameplayWrapper, "healthCounter");
  scoreCounter = new Element("div", gameplayWrapper, "scoreCounter");
  soulsCounter = new Element("div", gameplayWrapper, "soulsCounter");
  player.updateHealth(0, 0);
  updateSouls();
  scoreCounter.instance.innerText = score;
};

const updateSouls = () => {
  soulsCounter.instance.innerText = `Souls: ${souls}`;
};

const spawnEnemies = (count) => {
  let timeout = 100;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      new Enemy();
    }, timeout);
    timeout += 500;
  }
};

let selectionWrapper;
const cardSelect = () => {
  player.updateHealth(2, 2);
  canHurt = false;
  removeEventListener("keydown", startMoving);
  removeEventListener("mousemove", updateStaffRotation);
  removeEventListener("click", player.shoot);
  canShoot = false;
  selectionWrapper = new Element("div", gameplayWrapper, "selectionWrapper");
  for (let i = 0; i < cardsToSelect; i++) {
    if (cardsToSelect == 5 && (i == 0 || i == 3)) {
      const placeholder = new Element("div", selectionWrapper, "");
      placeholder.instance.style.width = "16.5vw";
    } else if (cardsToSelect > 5 && (i == 0 || i == 4)) {
      const placeholder = new Element("div", selectionWrapper, "");
      placeholder.instance.style.width = "8.25vw";
    }
    const card = new Card(false);
    cards.push(card);
  }
  // Making the refresh card the last
  const card = new Card(true);
};

const nextRound = () => {
  window.addEventListener("keydown", startMoving);
  window.addEventListener("mousemove", updateStaffRotation);
  setTimeout(() => {
    window.addEventListener("click", player.shoot);
  }, 10);
  canHurt = true;
  canShoot = true;
  enemyGap = 0;
  if (score % 5 == 0) {
    enemyHealth += 2;
    enemyDamage += 2;
  }
  enemiesToSpawn++;
  selectionWrapper.remove();
  score++;
  scoreCounter.instance.innerText = score;
  spawnEnemies(selectedHat != 4 ? enemiesToSpawn : enemiesToSpawn * 2);
};

// Matematika těžká :((
const updateStaffRotation = (event) => {
  let rect = player.instance.getBoundingClientRect();
  let a = event.clientX - playerPos - rect.width;
  let b = playerTop + rect.height - event.clientY;
  player.staffElement.style.transform = `rotate(${Math.atan2(a, b)}rad)`;
};

const startMoving = (event) => {
  if (event.key == "a") {
    if (moveLeftInterval) {
      clearInterval(moveLeftInterval);
    }
    moveLeftInterval = setInterval(move, 10, event);
    return;
  }
  if (event.key == "d") {
    if (moveRightInterval) {
      clearInterval(moveRightInterval);
    }
    moveRightInterval = setInterval(move, 10, event);
    return;
  }
  if (event.key == " " || event.key == "w") {
    if (selectedHat == 2) {
      timesJumped++;
      if (remainingJumps > 0 && timesJumped < 3) {
        remainingJumps -= maxJumps / 2;
        propellerIterator = 0;
        clearInterval(propellerInterval);
        propellerInterval = setInterval(() => {
          propellerIterator++;
          playerTop -= jumpSpeed;
          player.instance.style.top = playerTop + "px";
        }, 10);
      }
      return;
    }
    if (jumpInterval) {
      clearTimeout(jumpInterval);
    }
    if (remainingJumps == maxJumps) {
      jumpInterval = setInterval(move, 10, event);
    }
  }
};

const move = (event) => {
  switch (event.key) {
    case "a":
      if (parseInt(player.instance.style.left, 10) <= 0) {
        break;
      }
      playerPos -= speed;
      player.instance.style.left = playerPos + "px";
      break;
    case "d":
      if (
        parseInt(player.instance.style.left, 10) >=
        window.innerWidth - player.rect.width
      ) {
        break;
      }
      playerPos += speed;
      player.instance.style.left = playerPos + "px";
      break;
    case "w":
    case " ":
      if (remainingJumps > 0) {
        remainingJumps--;
        playerTop -= jumpSpeed;
        player.instance.style.top = playerTop + "px";
      }
      break;
  }
};

const stopMoving = (event) => {
  switch (event.key) {
    case "a":
      clearInterval(moveLeftInterval);
      break;
    case "d":
      clearInterval(moveRightInterval);
      break;
    case "w":
    case " ":
      clearInterval(jumpInterval);
      break;
    default:
      break;
  }
};

const spawnLightning = () => {
  let timeout = 100;
  for (let i = 0; i < thunderbolts; i++) {
    let randomPos =
      Math.floor(
        Math.random() * (window.innerWidth * 0.974 - window.innerWidth * 0.024)
      ) +
      window.innerWidth * 0.024;
    setTimeout(() => {
      new Lightning(randomPos, false);
    }, timeout);
    timeout += 100;
  }
};

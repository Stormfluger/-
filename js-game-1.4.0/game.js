'use strict';

class Vector {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }
  
  plus(vector) {
  	if (!(vector instanceof Vector)) {
  		throw new Error('Можно прибавлять к вектору только вектор типа Vector')
  	}

    return new Vector(this.x + vector.x, this.y + vector.y);
  }
  
  times(factor) {
    return new Vector(this.x * factor, this.y * factor);
  }
}

class Actor {
  constructor(pos=new Vector(0,0), size=new Vector(1,1), speed=new Vector(0,0)) {
    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
        throw new Error('pos, size, speed are not instanceof Actor');
    }
    
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }
  
  act() {}
  
  get left() {
    return this.pos.x;
  }
  
  get top() {
      return this.pos.y;    
  }
  
  get right() {
    return this.pos.x + this.size.x;
  }
  
  get bottom() {
    return this.pos.y + this.size.y;
  }
  
  get type() {
    return 'actor';
  }
  
  isIntersect(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error('actor is not instanceof Actor');
    }
    
    if (actor === this) {
        return false;
    }

    return this.right > actor.left && this.left < actor.right && this.bottom > actor.top && this.top < actor.bottom;
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid.slice();
    this.actors = actors.slice();
    this.player = actors.find(elem => elem.type === 'player');
    this.height = this.grid.length;
    this.width = Math.max(0, ...this.grid.map(cell => cell.length));
    this.status = null;
    this.finishDelay = 1;

  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0
  }

  actorAt(actor) {


    if (!(actor instanceof Actor) || actor === undefined) {
      throw new Error('Можно передавать только объекты типа Actor и аргумент не может быть пустым');
    }

    return this.actors.find((curActor) => actor.isIntersect(curActor));

  }

  obstacleAt(objectPosition , objectSize) {

    if (!(objectPosition instanceof Vector) || !(objectSize instanceof Vector)) {
      throw new Error('Можно передавать только объекты типа Vector');
    }

    const topBorder = objectPosition.y;
    const rightBorder = objectPosition.x + objectSize.x;
    const bottomBorder = objectPosition.y + objectSize.y;
    const leftBorder = objectPosition.x;

    if (leftBorder < 0 || topBorder < 0 || rightBorder > this.width) {
      return 'wall'
    }

    if (bottomBorder > this.height) {
      return 'lava';
    }

    for (let y = Math.floor(topBorder); y < Math.ceil(bottomBorder); y++) {
      for (let x = Math.floor(leftBorder); x < Math.ceil(rightBorder); x++) {
        const fieldType = this.grid[y][x];
        if (fieldType) {
          return fieldType;
        }
      }
    }

  }

  removeActor(actor) {
    const result = this.actors.findIndex(curActor => actor === curActor);
    if (result !== -1) {
      this.actors.splice(result, 1);
    }
  }

  noMoreActors(actorType) {
    return !this.actors.some(actor => actor.type === actorType);
  }


  playerTouched(objectType, touchedActor) {

    if (this.status !== null) {
      return false;
    }


    if (objectType === 'lava' || objectType === 'fireball') {
      this.status = 'lost';
    }

    if (objectType === 'coin' && touchedActor.type === 'coin') {
      this.removeActor(touchedActor);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }

  }
}
class LevelParser {
  constructor(actorsMap) {
    this.actorsMap = actorsMap;
    
    this._symbolMap = new Map();
    this._symbolMap
      .set('x', 'wall')
      .set('!', 'lava')
  }
  
  actorFromSymbol(symbol) {
  	if (symbol === undefined) {
			return undefined;
		} else
    return this.actorsMap[symbol];
  }
 //  	obstacleFromSymbol(symbol) {
	// 	if (symbol === 'x') {
	// 		return 'wall';
	// 	} else if (symbol === '!') {
	// 		return 'lava';
	// 	} else {
	// 		return undefined;
	// 	}
	// }
  obstacleFromSymbol(symbol) {
  	if (symbol === 'x' || symbol === '!') {
    return this._symbolMap.get(symbol);
  } else
    return undefined;
  }
  
  createGrid(data = []) {
    return data.map(row => row.split('').map(elem => this.obstacleFromSymbol(elem)));
  }
    createActors(data = []) {
      const result = [];
      data.forEach((row, i) => {
          row.split('').forEach((symbol, j) => {
            const value = this.actorFromSymbol(symbol);
              if (Actor === value || Actor.isPrototypeOf(value)) {
                result.push(new value(new Vector(j, i)));
              }
          })
      })
     return result;
    }
  parse(data) {
    return new Level(this.createGrid(data), this.createActors(data));
  }
}

class Player extends Actor {
  constructor(pos) {
    super(pos);
	this.pos = this.pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
  }
	get type() {return 'player';}
}
class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed);
  }
  get type() {
    return 'fireball';
  }
  getNextPosition(factor = 1) {
  	if (this.speed.x === 0 && this.speed.y === 0) {
  		return this.pos;
  	}

    return this.pos.plus(this.speed.times(factor));
  }
  
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  
  act(time, level) {
    let nextPosition = this.getNextPosition(time);
    let isIntersect = level.obstacleAt(nextPosition, this.size);
    if (!isIntersect) {
      this.pos = nextPosition;
    } else {
    	this.handleObstacle();
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    this.size = new Vector(1, 1);
    this.speed = new Vector(2, 0);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 2);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos);
    this._pos = pos;
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 3);
  }
  
  handleObstacle() {
     this.pos = this._pos;
  }
}

class Coin extends Actor {
  constructor(pos) {
    super(pos);
    this.pos = this.pos.plus(new Vector(0.2, 0.1));
    this._pos = this.pos;
    this.size = new Vector(0.6, 0.6);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }
  
  get type() {
    return 'coin';
  }
  
  updateSpring(time=1) {
    this.spring = this.spring + this.springSpeed * time;
  }
  
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }
  
  getNextPosition(time=1) {
  	this.updateSpring(time);
  	let newPosition = new Vector(this._pos.x, this._pos.y);
    return newPosition.plus(this.getSpringVector());
  }
  
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

const actorDict = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
}
const parser = new LevelParser(actorDict);

loadLevels().then(schemasStr => {
	let schemas = JSON.parse(schemasStr);
  return runGame(schemas, parser, DOMDisplay);
}).then(() => {
	alert('Вы выиграли!')
});

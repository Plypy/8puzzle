function GameManager(size, InputManager, Actuator, StorageManager) {
  this.size           = size; // Size of the grid
  this.inputManager   = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator       = new Actuator;

  this.inputManager.on("move", this.move.bind(this, false));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.storageManager.clearGameState();
  this.actuator.continueGame(); // Clear the game won/lost message
  this.setup();
};

// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function () {
  return this.over || (this.won && !this.keepPlaying);
};

// Set up the game
GameManager.prototype.setup = function () {
  var previousState = this.storageManager.getGameState();

  // Reload the game from a previous game if present
  if (previousState) {
    this.grid        = new Grid(previousState.grid.size,
                                previousState.grid.cells); // Reload grid
    this.score       = previousState.score;
    this.over        = previousState.over;
    this.won         = previousState.won;
    this.keepPlaying = previousState.keepPlaying;
    this.pos0        = previousState.pos0;
  } else {
    this.grid        = new Grid(this.size);
    this.score       = 0;
    this.over        = false;
    this.won         = false;
    this.keepPlaying = false;

    // Add the initial tiles
    this.addStartTiles();
  }

  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  var self = this;
  var maxnum = this.size * this.size;
  var i, j;
  for (i = 0; i < this.size; ++i) {
    for (j = 0; j < this.size; ++j) {
      var cell = {x: j, y: i};
      var val = (i*3)+j+1;
      if (val === maxnum) {
        continue;
      }
      var tile = new Tile(cell, val);
      this.grid.insertTile(tile);
    }
  }
  this.pos0 = {x: this.size-1, y: this.size-1};

  var update = function (callback) {
    async.timesSeries(100, function (n, next) {
      setTimeout(function () {
        var dir = Math.floor(Math.random()*4);
        self.move(true, dir, next);
      }, 10);
    }, callback);
  };

  async.doUntil(update, function () {
    return !self.isWon();
  }, function () {
    // do nothing
  });
};

GameManager.prototype.execute = function(series, interval, callback) {
  var self = this;
  async.timesSeries(series.length, function (n, next) {
    setTimeout(function () {
      self.move(false, series[i], next);
    }, interval);
  }, callback);
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function (callback) {
  if (this.won) {
    if (this.storageManager.getBestScore() > this.score) {
      this.storageManager.setBestScore(this.score);
    }
  }

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
  } else {
    this.storageManager.setGameState(this.serialize());
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.storageManager.getBestScore(),
    terminated: this.isGameTerminated()
  }, callback);

};

// Represent the current game as an object
GameManager.prototype.serialize = function () {
  return {
    grid:        this.grid.serialize(),
    score:       this.score,
    over:        this.over,
    won:         this.won,
    keepPlaying: this.keepPlaying,
    pos0:        this.pos0
  };
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (auto, direction, callback) {
  // 0: up, 1: right, 2: down, 3: left

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var vector     = this.getVector(direction);

  var from       = {};
  from.x         = this.pos0.x - vector.x;
  from.y         = this.pos0.y - vector.y;
  if (this.grid.withinBounds(from)) {
    var tile         = this.grid.cellContent(from);
    this.moveTile(tile, this.pos0);
    this.pos0    = from;
    if (false === auto) {
      ++this.score;
      if (this.isWon()) {
        this.won = true;
      }
    }
    this.actuate(callback);
  } else {
    return callback();
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // Up
    1: { x: 1,  y: 0 },  // Right
    2: { x: 0,  y: 1 },  // Down
    3: { x: -1, y: 0 }   // Left
  };

  return map[direction];
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};

GameManager.prototype.isWon = function () {
  var i, j;
  var last = {x: this.size-1, y: this.size-1};
  if (!this.positionsEqual(last, this.pos0)) {
    return false;
  }
  for (i = 0; i < this.size; ++i) {
    for (j = 0; j < this.size; ++j) {
      var expected = (i*3)+j+1;
      var cell = {x: j, y: i};
      if (this.positionsEqual(cell, last)) {
        continue;
      }
      var real = this.grid.cellContent(cell).value;
      if (real !== expected) {
        return false;
      }
    }
  }
  return true;
};


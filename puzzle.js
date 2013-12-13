var $ = $ || function(s) {
  return document.getElementById(s);
};

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function createDiv(append) {
  var div = document.createElement('div');
  if (append) {
    div.id = guid();
    document.body.appendChild(div);
  }
  return div;
}

function createPuzzle(kwargs) {
  // img src needed, or else throw error.
  var imgSrc = kwargs.imgSrc;
  if (!imgSrc) {
    throw 'Must create puzzle with an image src.';
  }
  var callback = kwargs.callback || function() { alert("You won!"); };
  var divId = kwargs.divId || createDiv(true).id;
  var rows = kwargs.rows || 3;
  var cols = kwargs.cols || 3;
  var scale = kwargs.scale || 1;

  var img = new Image();
  img.onload = function() {
    document.body.appendChild(this);
    var width = kwargs.width;
    var height = kwargs.height;
    if (!width && !height) {
      width = this.clientWidth || 300;
      height = this.clientHeight || 300;
    } else if (width) {
      height = width * this.clientHeight / this.clientWidth;
    } else if (height) {
      width = height * this.clientWidth / this.clientHeight;
    }
    width *= scale;
    height *= scale;
    var puzzle = new Puzzle(divId, imgSrc, width, height, rows, cols, callback);
    var div = $(divId);
    while(div.firstChild) div.removeChild(div.firstChild);
    puzzle.createPieces();
    document.body.removeChild(this);
  };
  img.src = imgSrc;
}

function Puzzle(divId, imgSrc, width, height, rows, cols, callback) {
  this.divId = divId;
  this.imgSrc = imgSrc;
  this.width = width;
  this.height = height;
  this.rows = rows;
  this.cols = cols;
  this.callback = callback;
  this.pieces = [];
  this.original = [];
  this.fixWidth();
  this.addListeners();
}

Puzzle.prototype.addListeners = function() {
  var div = $(this.divId);
  div.onmousemove = div.ontouchstart = this.onmousemove();
  div.onmousedown = div.ontouchmove = this.onmousedown();
  div.onmouseup = div.ontouchend = div.ontouchcancel = this.onmouseup();
};

Puzzle.prototype.removeListeners = function() {
  var div = $(this.divId);
  div.onmousemove = div.onmousedown = div.onmouseup = null;
};

Puzzle.prototype.fixWidth = function() {
  var div = $(this.divId);
  div.style.width = this.width + 'px';
  div.style.height = this.height + 'px';
  this.offsetLeft = div.offsetLeft;
  this.offsetTop = div.offsetTop;
};

Puzzle.prototype.createPieces = function() {
  var i;
  for (i = 0; i < this.rows * this.cols; ++i) {
    this.createPiece(i);
  }
  for (i = 0; i < this.rows * this.cols; ++i) {
    this.original.push(this.pieces[i]);
  }
  this.mixUp();
  this.setLocations();
};

Puzzle.prototype.mixUp = function() {
  var mixedUp = [];
  while (this.pieces.length) {
    var idx = Math.floor(Math.random() * this.pieces.length);
    mixedUp.push(this.pieces.splice(idx,1)[0]);
  }
  this.pieces = mixedUp;
};

Puzzle.prototype.setLocations = function() {
  for (var count = 0; count < this.pieces.length; ++count) {
    var piece = this.pieces[count];
    var pieceDim = this.getPieceDimension(count);
    piece.style.position = 'absolute';
    piece.style.left = pieceDim.left;
    piece.style.top = pieceDim.top;
  }
};

Puzzle.prototype.getPieceDimension = function(count) {
  var width = this.width / this.cols;
  var height = this.height / this.rows;
  var i = Math.floor(count / this.cols);
  var j = count % this.cols;
  var left = j * width;
  var top = i * height;
  return {
   left: left,
   top: top,
   width: width,
   height: height
  };
};

Puzzle.prototype.createPiece = function(count) {
  var pieceDim = this.getPieceDimension(count);
  var div = createDiv(false);
  var par = $(this.divId);
  par.appendChild(div);
  par.style.position = 'relative';
  div.style.backgroundSize = this.width + 'px ' + this.height + 'px';
  div.style.backgroundImage = 'url(' + this.imgSrc + ')';
  div.style.backgroundPosition =
      (this.width - pieceDim.left) + ' ' + (this.height - pieceDim.top);
  div.style.width = pieceDim.width;
  div.style.height = pieceDim.height;
  div.style.float = 'left';
  div.style.transitionDuration = '0.2s';
  div.num = count;
  this.pieces.push(div);
};

Puzzle.prototype.reset = function() {
  this.col = this.row = this.orig = this.origHover = this.selected =
  this.hovering = this.selectedIdx = this.hoveringIdx = undefined;
};

Puzzle.prototype.isDone = function() {
  for (var i = 0; i < this.pieces.length; ++i) {
    if (i != this.pieces[i].num) {
      return false;
    }
  }
  return true;
};

Puzzle.prototype.onmousemove = function() {
  var self = this;
  return function(evt) {
    var x = evt.clientX - self.offsetLeft;
    var y = evt.clientY - self.offsetTop;
    self.col = Math.floor(x / self.width * self.cols);
    self.row = Math.floor(y / self.height * self.rows);
    self.hoveringIdx = self.row * self.cols + self.col;
    if (self.selected) {
      var tmp = self.pieces[self.hoveringIdx];
      if (tmp && tmp != self.hovering && tmp != self.selected) {
        if (self.hovering) {
          self.hovering.style.left = self.origHover.left;
          self.hovering.style.top = self.origHover.top;
        }
        self.hovering = tmp;
        self.origHover = {
          left: tmp.style.left,
          top: tmp.style.top
        };
      }
      
      if (self.hovering) {
        self.hovering.style.left = self.orig.left;
        self.hovering.style.top = self.orig.top;
      }
      
      self.selected.style.left = evt.clientX - self.orig.x;
      self.selected.style.top = evt.clientY - self.orig.y;
    } else {
      for (var i = 0; i < self.pieces.length; ++i) {
        self.pieces[i].style.opacity = 1;
      }
      var tmp = self.pieces[self.hoveringIdx];
      tmp.style.opacity = 0.8;
    }
  };
};

Puzzle.prototype.onmousedown = function() {
  var self = this;
  return function(evt) {
    self.selectedIdx = self.row * self.cols + self.col;
    self.selected = self.pieces[self.selectedIdx];
    for (var i = 0; i < self.pieces.length; ++i) {
      self.pieces[i].style.opacity = 0.3;
    }
    if (!self.selected) {
      return;
    }
    self.selected.style.opacity = 1;
    self.selected.style.transitionDuration = '0s';
    self.orig = {
      x: evt.clientX - parseInt(self.selected.style.left, 10),
      y: evt.clientY - parseInt(self.selected.style.top, 10),
      left: self.selected.style.left,
      top: self.selected.style.top
    };
  };
};

Puzzle.prototype.onmouseup = function() {
  var self = this;
  return function(evt) {
    for (var i = 0; i < self.pieces.length; ++i) {
      self.pieces[i].style.opacity = 1;
    }
    var tmp = self.selected;
    if (self.hovering && self.selected) {
      self.pieces[self.selectedIdx] = self.hovering;
      self.pieces[self.hoveringIdx] = self.selected;
    }
    self.setLocations();
    self.reset();
    if (self.isDone()) {
      self.callback();
      self.removeListeners();
    }
  };
};


AstSymbol = new JS.Class({
	initialize: function(_line, _col, _name) {
	    this._name = _name;
	    this._line = _line;
	    this._col = _col;
	},
	getName: function() {
	    return this._name;
	},
	getLine: function() {
	    return this._line;
	},
	getColumn: function() {
	    return this._column;
	},
	toString: function() {
	    return this._name;
	}
    });

AstKeyword = new JS.Class({
	initialize: function(_line, _col, _name) {
	    this._name = _name;
	    this._line = _line;
	    this._col = _col;
	},
	getName: function() {
	    return this._name;
	},
	getLine: function() {
	    return this._line;
	},
	getColumn: function() {
	    return this._column;
	},
	toString: function() {
	    return this._name;
	},
	get: function(o) {
	    var fn = o[this._name];
	    var this_name = this._name;
	    return function() {
		return fn.apply(o, arguments);
	    };
	}
    });

AstString = new JS.Class({
	initialize: function(_line, _col, _value) {
	    this._value = _value;
	    this._line = _line;
	    this._col = _col;
	},
	getValue: function() {
	    return this._value;
	},
	getLine: function() {
	    return this._line;
	},
	getColumn: function() {
	    return this._column;
	},
	toString: function() {
	    return "\"" + this._value + "\"";
	}
    });

AstInteger = new JS.Class({
	initialize: function(_line, _col, _value) {
	    this._value = _value;
	    this._line = _line;
	    this._col = _col;
	},
	getValue: function() {
	    return this._value;
	},
	getLine: function() {
	    return this._line;
	},
	getColumn: function() {
	    return this._column;
	},
	toString: function() {
	    return this._value;
	}
    });
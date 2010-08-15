PersistentList = new JS.Class({
	extend: {
	    empty: function() {
		return new this(null, null, 0);
	    },
	    create: function(list) {
		if (!list) return this.empty();
		var result = this.empty();
		for (var len = list.length, i = len - 1; i >= 0; i--) {
		    result = result.cons(list[i]);
		}
		return result;
	    }
	},
	initialize: function(_first, _rest, _count) {
	    this._first = _first;
	    this._rest = _rest;
	    this._count = _count;
	},
	count: function() { return this._count; },
	first: function() { return this._first; },
	next: function() { return this._rest; },
	pop: function() {
	    if (!this._rest) return this.klass.empty();
	    return this._rest;
	},
	cons: function(o) {
	    return new this.klass(o, this, this._count + 1);
	},
	isEmpty: function() {
	    return this._count == 0;
	},
	map: function(fn) {
	    var list = this;
	    var result = []
	    while (!list.isEmpty()) {
		result.push(fn(list.first()));
		list = list.pop();
	    }
	    return this.klass.create(result);
	},
	dolist: function(fn) {
	    var list = this;
	    while (!list.isEmpty()) {
		fn(list.first());
		list = list.pop();
	    };
	    return null;
	},
	toArray: function() {
	    var list = this;
	    var result = []
	    while (!list.isEmpty()) {
		result.push(list.first());
		list = list.pop();
	    }
	    return result;
	},
	toString: function() {
	    var str = "";
	    this.dolist(function(e) { str += e.toString() + " "; });
	    return "(" + (str.length > 1 ? str.slice(0, (str.length - 1)) : str) + ")";
	}
    });

assert.equal(0, PersistentList.empty().count());
assert.ok(PersistentList.empty().isEmpty());
assert.equal(1, PersistentList.create(["A"]).count());
assert.ok(!PersistentList.create(["A"]).isEmpty());
assert.equal(2, PersistentList.create(["A", "B"]).count());
assert.equal("A", PersistentList.create(["A", "B"]).first());
assert.equal("B", PersistentList.create(["A", "B"]).next().first());
assert.deepEqual(["a", "b", "c"], PersistentList.create(["a", "b", "c"]).toArray());
assert.deepEqual(["a", "b", "c"], PersistentList.create(["A", "B", "C"]).map(function (e) { return e.toLowerCase(); }).toArray());

var result = [];
PersistentList.create(["A", "B", "C"]).dolist(function (el) { result.push(el.toLowerCase());});
assert.deepEqual(["a", "b", "c"], result);
var assert = require("assert");


var plus = function(source, line, pos) {
    assert.ok(arguments.length >= 5, source + ":"+ line + "," + pos + ": arity " + (arguments.length - 3) + ", must be >= 2");
    var result = 0;
    for (var i = 3, len = arguments.length; i < len; i++) {
	assert.ok(typeof(arguments[i]) == "number", line + "," + pos + ": arg " + (i - 3) + " is not a number");
	result += arguments[i];
    }
    return result;
};

var eq = function(source, line, pos) {
    assert.ok(arguments.length >= 5, source + ":"+ line + "," + pos + ": arity " + (arguments.length - 3) + ", must be >= 2");
    var x = arguments[3];
    var result = false;
    for (var i = 4, len = arguments.length; i < len; i++) {
	result = (x == arguments[i]); // TODO improve equality test
    }
    return result;
};

var println = function(source, line, pos) {
    var str = "";
    for (var i = 3, len = arguments.length; i < len; i++) {
	str += arguments[i];
    }
    console.log(str);
    return null;
};

var bit_and = function(source, line, pos) {
    assert.ok(arguments.length == 5, source + ":" + line + "," + pos + ": arity " + (arguments.length - 3) + ", must be = 2");
    var x = arguments[3];
    var y = arguments[4];
    assert.ok(typeof(x) == "number", source + ":" + line + "," + pos + ": arg 1 is not a number");
    assert.ok(typeof(y) == "number", source + ":" + line + "," + pos + ": arg 2 is not a number");
    return x & y;
};

var lisp_assert = function(source, line, pos) {
    assert.ok(arguments.length == 4, source + ":" + line + "," + pos + ": arity " + (arguments.length - 3) + ", must be = 1");
    var x = arguments[3];
    assert.ok(x, source + ":" + line + "," + pos + ": assert failed");
    return null;
};

var if_fn = function(source, line, pos) {
    assert.ok(arguments.length >= 5 && arguments.length <= 6, source + ":" + line + "," + pos + ": if arity is 2 or 3");
    var cond = arguments[3];
    var then = arguments[4];
    var _else = (arguments.length == 6 ? arguments[5] : null);
    if (cond.apply(this, [])) {
	return then.apply(this, []);
    } else {
	return (_else ? _else.apply(this, []) : null);
    }
}



exports.funs = {
    "+": plus,
    "println": println,
    "bit-and": bit_and,
    "assert": lisp_assert,
    "=": eq
};
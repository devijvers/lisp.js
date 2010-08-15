curry = function (fn) {
    var args = [];
    for (var i=1, len = arguments.length; i < len; ++i) {
        args.push(arguments[i]);
    };
    return function() {
	var args2 = [];
	for (var x=0, xl = arguments.length; x < xl; x++) {
	    args2.push(arguments[x]);
	}
	return fn.apply(this, args.concat(args2));
    };
}
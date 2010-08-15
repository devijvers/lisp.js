JSCLASS_PATH = "js-class";
require("../js-class/loader");
var lisp_func = require("./lisp-func");
var fs = require("fs");
assert = require("assert");

JS.Packages(function() { with(this) {
	    file("lisp/grammar/parser.js").provides("parser");
	    file("lisp/types/list.js").provides("PersistentList").requires("JS.Class");
	    file("lisp/types/ast.js").provides("Symbol", "Keyword").requires("JS.Class");
	}});

var curry = function (fn) {
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

JS.require("parser", "PersistentList", "JS.Set" , function () {
	var handle_seq = function(source, dispatch, seq_ast) {
	    if (seq_ast.type != "SEQ") {
		throw source + ":line(" + seq_ast.line + "): not a sequence"; 
	    }
	    var value = seq_ast.value;
	    var first_element = value[0];
	    if (first_element.type != "SYMBOL" && first_element.type != "KEYWORD") {
		throw first_element.line + "," + first_element.pos + ": first element of sequence must be either symbol or keyword";
	    }
	    var result = new JS.Set(value).map(curry(dispatch, source, dispatch));
	    var fn = result[0];
	    if (typeof(fn) != "function") {
		console.log(first_element.line + "," + first_element.pos + ": not a function?! " + fn);
		throw first_element.line + "," + first_element.pos + ": not a function?! Fail!";
	    }
	    var args = [];
	    args.push(source);
	    args.push(first_element.line);
	    args.push(first_element.pos);
	    return function() {
		var args2 = [];
		for (var x = 1, len = result.length; x < len; x++) {
		    args2.push((typeof(result[x]) == "function" ? result[x].apply(this, []) : result[x]));
		}
		return fn.apply(this, args.concat(args2));
	    }
	};

	var handle_symbol = function(sym_ast) {
	    var name = sym_ast.value;
	    if (name == "true") return true;
	    if (name == "false") return false;
	    var core_func = lisp_func.funs[name];
	    if (core_func) {
		return core_func;
	    } else {
		throw "Vars not yet implemented";
	    }
	};

	var handle_integer = function(int_ast) {
	    return int_ast.value;
	};

	var dispatch = function(source, dispatch, ast_el) {
	    var type = ast_el.type;
	    switch (type) {
	    case "SEQ":
		return handle_seq(source, dispatch, ast_el);
	    case "SYMBOL":
		return handle_symbol(ast_el);
	    case "INTEGER":
		return handle_integer(ast_el);
	    default:
		console.log("Unknown AST type " + type);
		throw "Unknown AST type " + type;
	    };	    
	};

	var repl = function() {
	    var stdin = process.openStdin();

	    stdin.setEncoding("utf8");

	    stdin.on("data", function(chunk) {
		    try {
			var ast = parser.parse(chunk);
			var fns = new JS.Set(ast).map(curry(handle_seq, "REPL", dispatch));
			for (var i = 0, len = fns.length; i < len; i++) {
			    process.stdout.write("" + fns[i].apply(this, []) + "\n");
			}
		    } catch (err) {
			process.stdout.write("" + err + "\n");
		    }
		});
	};

	var load_file = function(file_path) {
	    fs.readFile(file_path, "utf8", function(err, data) {
		    if (err) throw err;
		    try {
			var ast = parser.parse(data);
			var fns = new JS.Set(ast).map(curry(handle_seq, file_path, dispatch));
			for (var i = 0, len = fns.length; i < len; i++) {
			    fns[i].apply(this, []);
			}
		    } catch(err) {
			if (err.name && err.name == "SyntaxError") {
			    console.log("Syntax error: " + file_path + ":" + err.line + "," + err.column + "; " + err.message);
			} else {
			    console.log("" + err + "\n");
			}
			throw err;
		    }
		});
	};

	var args = process.argv;

	if (args.length > 2 && args[2] == "--repl") {
	    repl();
	} else if (args.length > 2) {
	    load_file(args[2]);
	} else {
	    var ast = parser.parse("(println (+ 1 2))(assert (= 1 2))");
	    var fns = new JS.Set(ast).map(curry(handle_seq, "TEST", dispatch));

	    for (var i = 0, len = fns.length; i < len; i++) {
		fns[i].apply(this, []);
	    }
	}
    });


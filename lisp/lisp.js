JSCLASS_PATH = "js-class";
require("../js-class/loader");
var lisp_func = require("./lisp-func");
var fs = require("fs");
var sys = require("sys");
assert = require("assert");

String.prototype.startsWith = function(str){
    return (this.indexOf(str) === 0);
};

JS.Packages(function() { with(this) {
	    file("lisp/grammar/parser.js").provides("parser");
	    file("lisp/types/list.js").provides("PersistentList").requires("JS.Class");
	    file("lisp/types/ast.js").provides("AstSymbol", "AstKeyword", "AstString", "AstInteger").requires("JS.Class");
	    file("lisp/util.js").provides("curry");
	}});

JS.require("parser", "PersistentList", "AstSymbol", "AstKeyword", "AstString", "AstInteger", "curry", function() {
	var text_parser = function(text) {
	    try {
		return parser.parse(text);
	    } catch (err) {
		if (err.name && err.name == "SyntaxError") {
		    console.log("Syntax error: " + err.line + "," + err.column + "; " + err.message);
		} else {
		    console.log("" + err + "\n");
		}
		throw err;
	    }
	};
	var seq_parser = function(recur, ast) {

	    if (ast instanceof Array) {
		return PersistentList.create(ast).map(function(ast_el) { return recur(recur, ast_el); });
	    } else {
		var type = ast.type;
		if (type == "SEQ") {
		    return PersistentList.create(ast.value).map(function(ast_el) { return recur(recur, ast_el); });
		} else if (type == "KEYWORD") {
		    return new AstKeyword(ast.line, ast.pos, ast.value);
		} else if (type == "SYMBOL") {
		    return new AstSymbol(ast.line, ast.pos, ast.value);
		} else if (type == "STRING") {
		    return new AstString(ast.line, ast.pos, ast.value);
		} else if (type == "INTEGER") {
		    return new AstInteger(ast.line, ast.pos, ast.value);
		} else if (type == "QUOTE") {
		    var quote = new AstSymbol(ast.line, ast.pos, "quote");
		    var value = PersistentList.create(ast.value).map(function(ast_el) { return recur(recur, ast_el); });
		    return PersistentList.create([quote,(value.count() == 1 ? value.first() : value)]);
	        } else {
		    throw "Unknown AST type " + type;
		}
	    }
	};
	var s_expressions = function(text) {
	    return seq_parser.apply(this, [seq_parser, text_parser(text)]);
	}

	// now do the following steps:
	// load library macros and parse them into s-expressions
	// traverse user code and parse defmacro's into s-expressions
	// traverse user code again and replace macro calls with macro AST replacing variables inside macros with AST elements
	// finally, evaluate AST since at this point AST should be macro-free (OK)

	// def, vector(!), fn

	var handle_if = function(source, dispatch, cond, then, _else) {
	    var cond_fn = dispatch(source, dispatch, cond);
	    var cond_val = (typeof(cond_fn) == "function" ? cond_fn.apply(this, []) : cond_fn);
	    if (cond_val) {
		return dispatch(source, dispatch, then);
	    } else {
		return (_else ? dispatch(source, dispatch, _else) : function() { return null; });
	    }
	}

	var handle_seq = function(source, dispatch, ast) {
	    if (!ast.isA(PersistentList)) {
		throw source + ":line(" + ast.line + "): not a sequence"; 
	    }
	    var first_element = ast.first();
	    var rest = ast.next();
	    if (first_element.isA(PersistentList)) {
		first_element = dispatch(source, dispatch, first_element);
	    }
	    if (typeof(first_element) != "function" && !first_element.isA(AstSymbol) && !first_element.isA(AstKeyword)) {
		console.log(source + ":" + first_element.getLine() + "," + first_element.getColumn() + "; first element of sequence must be either sequence, symbol or keyword");
		throw source + ":" + first_element.getLine() + "," + first_element.getColumn() + "; first element of sequence must be either sequence, symbol or keyword";
	    }
	    if (typeof(first_element) != "function" && first_element.isA(AstSymbol) && first_element.getName() == "quote") {
		return function() {
		    return (rest.count() == 1 ? rest.first() : rest);
		};
	    }
	    if (typeof(first_element) != "function" && first_element.isA(AstKeyword) && rest.count() == 1) {
		var rest_result = dispatch(source, dispatch, rest.first());
		var kw_fn = first_element.get(typeof(rest_result) == "function" ? rest_result.apply(this, []) : rest_result);
		var dispatch_fn = function() {
		    var args = [];
		    for (var len = arguments.length, i = 3; i < len; i++) {
			args.push(arguments[i]);
		    }
		    return kw_fn.apply(this, args);
		}
		dispatch_fn.getLine = function() { return first_element.getLine(); };
		dispatch_fn.getColumn = function() { return first_element.getColumn(); };
		return dispatch_fn;
	    }
	    var result = null;
	    if (typeof(first_element) == "function") {
		var rest_result = rest.map(curry(dispatch, source, dispatch));
		result = PersistentList.create([first_element].concat(rest_result.toArray()));
	    } else if (first_element.isA(AstSymbol) && first_element.getName() == "if") {
		if (rest.count() == 2 || rest.count() == 3) {
		    result = handle_if(source, dispatch, rest.first(), rest.next().first(), (rest.count() == 3 ? rest.next().next().first() : null));
		    result = PersistentList.create([result]);
		} else {
		    console.log(source + ":" + first_element.getLine() + "," + first_element.getColumn() + "; if arity is 2 or 3");
		    throw source + ":" + first_element.getLine() + "," + first_element.getColumn() + "; if arity is 2 or 3";
		}
	    } else {
		result = ast.map(curry(dispatch, source, dispatch));
	    }
	    var fn = result.first();
	    if (typeof(fn) != "function") {
		console.log(first_element.getLine() + "," + first_element.getColumn() + ": not a function?! " + fn);
		throw first_element.getLine() + "," + first_element.getColumn() + ": not a function?! Fail!";
	    }
	    var args = [];
	    args.push(source);
	    args.push(first_element.getLine());
	    args.push(first_element.getColumn());
	    return function() {
		var args2 = [];
		if (result.next()) {
		    result.next().dolist(function (el) {
			    args2.push((typeof(el) == "function" ? el.apply(this, []) : el));
			});
		}
		return fn.apply(this, args.concat(args2));
	    }
	};

	var handle_symbol = function(sym_ast) {
	    var name = sym_ast.getName();
	    if (name == "true") return true;
	    if (name == "false") return false;
	    if (name.startsWith(".")) {
		return function(s,l,p,o) {
		    var f = o[name.substring(1)];
		    if (typeof(f) == "function") {
			var args = [];
			for (var len = arguments.length, i = 4; i < len; i++) {
			    args.push(arguments[i]);
			}
			return f.apply(o, args);
		    } else {
			return f;
		    }
		};
	    }
	    var core_func = lisp_func.funs[name];
	    if (core_func) {
		return core_func;
	    } else {
		throw sym_ast.getLine() + "," + sym_ast.getColumn() + ": vars not yet implemented (" + name + ")";
	    }
	};

	var handle_integer = function(int_ast) {
	    return int_ast.getValue();
	};

	var handle_string = function(str_ast) {
	    return str_ast.getValue();
	};

	var dispatch = function(source, dispatch, ast) {
	    if (ast.isA(PersistentList)) {
		return handle_seq(source, dispatch, ast);
	    } else if (ast.isA(AstSymbol)) {
		return handle_symbol(ast);
	    } else if (ast.isA(AstInteger)) {
		return handle_integer(ast);
	    } else if (ast.isA(AstString)) {
		return handle_string(ast);
	    } else {
		console.log("Unknown AST type " + ast);
		throw "Unknown AST type " + ast;
	    }
	};

	var repl = function() {
	    var stdin = process.openStdin();

	    stdin.setEncoding("utf8");

	    stdin.on("data", function(chunk) {
		    try {
			var ast = s_expressions(chunk);
			var fns = ast.map(curry(handle_seq, "REPL", dispatch));
			fns.dolist(function(fn) {
				process.stdout.write("" + fn.apply(this, []) + "\n");
			    });
		    } catch (err) {
			process.stdout.write("" + err + "\n");
		    }
		});
	};

	var load_file = function(file_path) {
	    fs.readFile(file_path, "utf8", function(err, data) {
		    if (err) throw err;
		    try {
			var ast = s_expressions(data);
			var fns = ast.map(curry(handle_seq, file_path, dispatch));
			fns.dolist(function(fn) {
				fn.apply(this, []);
			    });
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
	    var ast = s_expressions("(println (+ 1 2))(assert (= 1 1))");
	    var fns = ast.map(curry(handle_seq, "TEST", dispatch));
	    fns.dolist(function(fn) {
		    fn.apply(this, []);
		});
	}


    });
{
    var line = 1;
    var prev_line_pos = 0;
}

start
    = seq

seq 
    = e:expr s:seq* 
      { 
          var result = [];
          if (e.type != "WHITESPACE") result.push(e);
          for (i=0; i< s.length; i++) { 
              if (s[i].type != "WHITESPACE") result = result.concat(s[i]);
          } 
          return result;
      }
    / "'" e:expr s:seq*
      { 
          var result = [];
          if (e.type != "WHITESPACE") result.push(e);
          
          var q = [{type:"QUOTE", value:result,line:line, pos:pos-prev_line_pos}];
          for (i=0; i < s.length; i++) {
              if (s[i].type != "WHITESPACE") q = q.concat(s[i]);
          }
          return q;
      }


list
    = "(" s:seq ")" { return {type:"SEQ",value:s}; }
    / "[" _* "]"    { return {type:"VEC",value:[],line:line}; }
    / "[" s:seq "]" { return {type:"VEC",value:s,line:line}; }
    / "{" s:seq "}" { return {type:"MAP",value:s,line:line}; }

expr
    = integer 
    / keyword 
    / symbol 
    / string  
    / list 
    / _ 

string
    = '"' str:[^"\n]+ '"' { return {type:"STRING", value:str.join(""),pos:(pos-prev_line_pos-str.join("").length-1+1),line:line}; }

keyword
    = ":" kw:symbol { return {type:"KEYWORD", value:kw.value,pos:(pos-prev_line_pos-kw.pos-1+1),line:line}; }

symbol
    = sym:[-+*/!@%^&=.a-zA-Z0-9_]+ { return {type:"SYMBOL", value:sym.join(""),pos:(pos-prev_line_pos-sym.join("").length+1),line:line}; }

integer
    = digits:[0-9]+ { return {type:"INTEGER", value:parseInt(digits.join("")) ,pos:(pos-prev_line_pos-digits.join("").length+1),line:line}; }

_
    = w:[ \t\n\r,;]+ { if (w.join("") == "\n") {line++; prev_line_pos = pos;} return {type:"WHITESPACE"}; }
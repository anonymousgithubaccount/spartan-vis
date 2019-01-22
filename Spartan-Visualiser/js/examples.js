var ex1 = 'PLUS (3, TIMES (5, 6))'

var ex2 =
 '// x and y are bound variables\n'+
 '// As x is used twice, it is substituted explicitly via copying\n\n'+
 'bind x = 1 in\n' +
 'bind y = PLUS (x, 2) in\n' +
 'TIMES (x, y)'

var ex3 =
  '// A much more interesting example, that features some logic too \n\n'+
  'bind z = PLUS (1, 2) in\n'+
  'bind y = IF (EQUALS (z,3) ; PLUS(1,z), PLUS(2,z)) in\n' +
  'bind x = PLUS (4, y) in\n'+
  'AND (NOT (EQUALS (z, 4)), EQUALS (x, x))'

var ex4 = '// 5! done recursively; for higher values, perhaps skip to the end\n\n'+
          'bind fact = REC (\n'+
          '; f.LAMBDA (\n'+
          '; x.IF (EQUALS (x, 1)\n'+
          '  ; 1                             // This is the "base case"\n'+
          '  , bind y = APP (f, MINUS(x, 1)) // This is the "step case"\n'+
          '  in TIMES (x, y))))\n'+
          'in APP(fact, 5)                   // Change 5 to another value for n!'

var ex5 = '// What value will this return? \n'+
          '// A trivial example to display some diffrent kinds of imperative computation \n\n'+
          'new b = 10 in\n'+
          'new a = 5 in\n'+
          'bind x = TIMES (DEREF(a), 2) in\n'+
          'SEC (ASSIGN (a, x)\n'+
          '  ; SEC (SCOPE                             // Sequential behaviour (;)\n'+
          '      (; w.IF (EQUALS (DEREF(a), DEREF(b))\n'+
          '         ; SEC ( BREAK (w)                 // Local jump (in SCOPE)\n'+
          '             ; ABORT (; 8))                // Global jumps\n'+
          '         , ABORT (; 9)))\n'+
          '      ; 10))'

var ex6 = '// This uses callcc to explore both branches of a conditional \n'+
          '// "We can have it both ways!"\n\n'+
          'new state = UNIT in\n'+
          'bind saveState = LAMBDA (\n'+
          '; x.CALLCC (\n'+
          '  ; LAMBDA (\n'+
          '    ; c.SEC (\n'+
          '        ASSIGN (state, c)\n'+
          '      ; x)\n'+
          '      )\n'+
          '  )) in\n'+
          'bind loadState = DEREF(state) in\n'+
          'IF ( APP (saveState, FALSE) ; 1, APP (loadState, TRUE))'

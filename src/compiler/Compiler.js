// namespace
if (typeof window === 'undefined') {
    this.weavecore = this.weavecore || {};
    this.trace = function (msg) {
        console.log(msg);
    }
} else {
    window.weavecore = window.weavecore || {};
    window.trace = function (msg) {
        console.log(msg);
    }
}




/**
 * This class can compile simple JS expressions into functions.
 *
 * @author adufilie
 * @author sanbalag
 */
(function (domain) {
    "use strict";


    Object.defineProperty(Compiler, 'ENCODE_LOOKUP', {
        value: {
            '\b': 'b',
            '\f': 'f',
            '\n': 'n',
            '\r': 'r',
            '\t': 't',
            '\\': '\\'
        }
    });
    Object.defineProperty(Compiler, 'DECODE_LOOKUP', {
        value: {
            'b': '\b',
            'f': '\f',
            'n': '\n',
            'r': '\r',
            't': '\t'
        }
    });


    /**
     * Add keys to this dictionary for class alias names or deprecated library replacements using dot notation (".") rather than "::" package notation.
     */
    Object.defineProperty(Compiler, 'classAliases', {
        value: {}
    });



    Object.defineProperty(Compiler, 'OPERATOR_ESCAPE', {
        value: '\\'
    });

    Object.defineProperty(Compiler, 'FUNCTION', {
        value: 'function'
    });
    Object.defineProperty(Compiler, 'FUNCTION_PARAM_NAMES', {
        value: 'names'
    });
    Object.defineProperty(Compiler, 'FUNCTION_PARAM_VALUES', {
        value: 'values'
    });
    Object.defineProperty(Compiler, 'FUNCTION_CODE', {
        value: 'code'
    });



    //private constants

    /**
     * (statement name) -> (true if requires parentheses)
     */
    Compiler.statements = null;

    Compiler.OPERATOR_NEW = 'new';

    /**
     * This is a String containing all the characters that are treated .
     */
    Object.defineProperty(Compiler, 'WHITESPACE', {
        value: '\r\n \t\f'
    });



    /**
     * This is the prefix used for the function notation of infix operators.
     * For example, the function notation for ( x + y ) is ( \+(x,y) ).
     */
    Object.defineProperty(Compiler, 'OPERATOR_ESCAPE', {
        value: '\\'
    });


    Object.defineProperty(Compiler, 'INDEX_METHOD', {
        value: -1
    });
    Object.defineProperty(Compiler, 'INDEX_CONDITION', {
        value: 0
    });
    Object.defineProperty(Compiler, 'INDEX_TRUE', {
        value: 1
    });
    Object.defineProperty(Compiler, 'INDEX_FALSE', {
        value: 2
    });

    Object.defineProperty(Compiler, 'INDEX_FOR_LIST', {
        value: 0
    });
    Object.defineProperty(Compiler, 'INDEX_FOR_ITEM', {
        value: 1
    });


    Object.defineProperty(Compiler, 'ST_IF', {
        value: 'if'
    });
    Object.defineProperty(Compiler, 'ST_ELSE', {
        value: 'else'
    });
    Object.defineProperty(Compiler, 'ST_FOR', {
        value: 'for'
    });
    Object.defineProperty(Compiler, 'ST_EACH', {
        value: 'each'
    });

    Object.defineProperty(Compiler, 'ST_DO', {
        value: 'do'
    });
    Object.defineProperty(Compiler, 'ST_WHILE', {
        value: 'while'
    });
    Object.defineProperty(Compiler, 'ST_CASE', {
        value: 'case'
    });
    Object.defineProperty(Compiler, 'ST_DEFAULT', {
        value: 'default'
    });


    Object.defineProperty(Compiler, 'ST_TRY', {
        value: 'try'
    });
    Object.defineProperty(Compiler, 'ST_CATCH', {
        value: 'catch'
    });
    Object.defineProperty(Compiler, 'ST_FINALLY', {
        value: 'finally'
    });

    Object.defineProperty(Compiler, 'ST_BREAK', {
        value: 'break'
    });
    Object.defineProperty(Compiler, 'ST_CONTINUE', {
        value: 'continue'
    });
    Object.defineProperty(Compiler, 'ST_VAR', {
        value: 'var'
    });

    Object.defineProperty(Compiler, 'ST_RETURN', {
        value: 'return'
    });
    Object.defineProperty(Compiler, 'ST_THROW', {
        value: 'throw'
    });
    Object.defineProperty(Compiler, 'ST_IMPORT', {
        value: 'import'
    });


    /**
     * Used during compiling only.
     */
    Object.defineProperty(Compiler, '_jumpStatements', {
        value: [Compiler.ST_BREAK, Compiler.ST_CONTINUE, Compiler.ST_RETURN, Compiler.ST_THROW]
    });


    /**
     * Only used during evaluation and decompiling.
     */
    Object.defineProperty(Compiler, 'ST_FOR_DO', {
        value: 'for do'
    });


    /**
     * Only used during evaluation and decompiling.
     */
    Object.defineProperty(Compiler, 'ST_FOR_IN', {
        value: 'for in'
    });


    /**
     * Used  single token for simplicity.
     */
    Object.defineProperty(Compiler, 'ST_FOR_EACH', {
        value: 'for each'
    });


    /**
     * must be enclosed in () with expressions separated by ;
     * Used in conjunction with _validStatementPatterns.
     */
    Object.defineProperty(Compiler, 'PN_PARAMS', {
        value: 'PARAMS'
    });


    /**
     * MUST be a {} code block.
     * Used in conjunction with _validStatementPatterns.
     */
    Object.defineProperty(Compiler, 'PN_BLOCK', {
        value: 'BLOCK'
    });


    /**
     * may contain either a single statement or a {} code block.
     * Used in conjunction with _validStatementPatterns.
     */
    Object.defineProperty(Compiler, 'PN_STMT', {
        value: 'STMT'
    });


    /**
     * may only contain one expression, optionally enclosed in (), no statements.
     * Used in conjunction with _validStatementPatterns.
     */
    Object.defineProperty(Compiler, 'PN_EXPR', {
        value: 'EXPR'
    });


    /**
     * variable names and/or assignments separated by commas
     * Used in conjunction with _validStatementPatterns.
     */
    Object.defineProperty(Compiler, 'PN_VARS', {
        value: 'VARS'
    });



    /**
     * This is used to match number tokens.
     */
    Object.defineProperty(Compiler, 'numberRegex', {
        value: new RegExp(/^(0x[0-9A-Fa-f]+|[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/)
    });

    Object.defineProperty(Compiler, 'unicodeRegex', {
        value: new RegExp(/^(\{[0-9A-Fa-f]+\}|[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f])/)
    });

    Object.defineProperty(Compiler, '_statementsWithoutParams', {
        value: [
			Compiler.ST_ELSE, Compiler.ST_DO, Compiler.ST_BREAK, Compiler.ST_CONTINUE, Compiler.ST_CASE, Compiler.ST_DEFAULT,
			Compiler.ST_TRY, Compiler.ST_FINALLY, Compiler.ST_RETURN, Compiler.ST_THROW, Compiler.ST_VAR, Compiler.ST_IMPORT
		]
    });

    Object.defineProperty(Compiler, '_statementsWithParams', {
        value: [
			Compiler.ST_IF, Compiler.ST_FOR, Compiler.ST_EACH, Compiler.ST_FOR_EACH, Compiler.ST_WHILE, Compiler.ST_SWITCH, Compiler.ST_CATCH
		]
    });

    /**
     * The list of packages to check when looking up class definitions.
     */
    Object.defineProperty(Compiler, 'defaultPackages', {
        value: []
    });


    Compiler._staticInstance = null;


    //constructor
    function Compiler(includeDefaultLibraries) {
        //private
        Object.defineProperty(this, 'JUMP_LOOKUP', {
            value: new Map() // Function -> true
        });
        Object.defineProperty(this, 'LOOP_LOOKUP', {
            value: new Map() // Function -> true
        });
        Object.defineProperty(this, 'BRANCH_LOOKUP', {
            value: new Map() // // Function -> Boolean, for short-circuiting
        });
        Object.defineProperty(this, 'ASSIGN_OP_LOOKUP', {
            value: new Map() // Function -> true
        });
        Object.defineProperty(this, 'PURE_OP_LOOKUP', {
            value: new Map() // Function -> true
        });
        Object.defineProperty(this, 'MAX_OPERATOR_LENGTH', {
            value: 4
        });


        /**
         * This is a list of objects and/or classes containing functions and constants supported by the compiler.
         */
        Object.defineProperty(this, 'libraries', {
            value: []
        });


        /**
         * This object maps the name of a predefined constant to its value.
         */

        this.constants = null;
        /**
         * This object maps the name of a global symbol to its value.
         */

        this.globals = null;
        /**
         * This object maps an operator like "*" to a Function or a valie of true if there is no function.
         */

        this.operators = null;
        /**
         * A pure operator is one that always gives the same result when invoked with the same parameters.
         * This object maps a pure operator like "+" to its corresponding function.
         */

        this.pureOperators = null;
        /**
         * This object maps an assignment operator like "=" to its corresponding function.
         * This object is used  quick lookup to see if an operator is an assignment operator.
         */

        this.assignmentOperators = null;
        /**
         * This is a two-dimensional Array of operator symbols arranged in the order they should be evaluated.
         * Each nested Array is a group of operators that should be evaluated in the same pass.
         */

        this.orderedOperators = null;
        /**
         * This is an Array of all the unary operator symbols.
         */

        this.unaryOperatorSymbols = null;

        /**
         * This is used to temporarily store the host of the property that was accessed by the last call to the '.' operator.
         */
        this._propertyHost = null;
        /**
         * This is used to temporarily store the property name that was accessed by the last call to the '.' operator.
         */
        this._propertyName = null;
        /**
         * Set this to true to enable trace statements for debugging.
         */
        this.debug = false;

        initialize.call(this);
        if (includeDefaultLibraries)
            includeLibraries(Math, weavecore.StandardLib);
        //includeLibraries(Math, StringUtil, weavecore.StandardLib, Dictionary);
    }

    /**
     * Attempts to compile an expression as a constant, then returns the constant value.
     * @param constantExpression
     * @return The value of the expression.
     * @throws Error if the expression cannot be evaluated as a constant.
     */
    Compiler.parseConstant = function (constantExpression) {
        if (!Compiler._staticInstance)
            Compiler._staticInstance = new Compiler(false);
        var compiled = Compiler._staticInstance.finalize(Compiler._staticInstance.compileTokens(Compiler._staticInstance.getTokens(constantExpression), false), true);
        if (compiled instanceof weavecore.CompiledConstant) {
            return (compiled).value;
        } else {
            throw new Error("Expression does not evaluate to a constant");
        }
    }


    /**
     * This function surrounds a String with quotes and escapes special characters using ActionScript string literal format.
     * @param string A String that may contain special characters.
     * @param useDoubleQuotes If this is true, double-quote will be used.  If false, single-quote will be used.
     * @return The given String formatted for ActionScript.
     */
    Compiler.encodeString = function (string, quote) {
        quote = (quote === undefined) ? '"' : quote;
        if (string === null)
            return 'null';
        var result = [];
        result.length = string.length
        for (var i = 0; i < string.length; i++) {
            var chr = string.charAt(i);
            var esc = (chr === quote) ? quote : Compiler.ENCODE_LOOKUP[chr];
            result[i] = esc ? '\\' + esc : chr;
        }
        return quote + result.join('') + quote;
    }

    Compiler.isClass = function (object) {
        return object.prototype && object.name && object.name.length > 0 && object.prototype.constructor.name === object.name;
    }

    /**
     * Casts an object to a specified type.
     * If given an unclassed Object, the properties will be copied over to a new instance of the type.
     * @param object An object to cast.
     * @param type The desired type.
     * @return An instance of the desired type.
     * @throws Error If unable to cast the object to the desired type.
     */
    Compiler.cast = function (object, type) {
        if (object instanceof type || object === null || object.constructor.name !== 'Object')
            return type(object);
        var newObj = new type();
        for (var key in object)
            if (newObj.hasOwnProperty(key))
                newObj[key] = object[key];
        return newObj;
    }

    /**
     * Generates a deterministic JSON-like representation of an object, meaning object keys appear in sorted order.
     * @param value The object to stringify.
     * @param replacer A function like function(key, value)
     * @param indent Either a Number or a String to specify indentation of nested values
     * @param json_values_only If this is set to true, only JSON-compatible values will be used (NaN/Infinity/undefined -> null)
     */
    Compiler.stringify = function (value, replacer, indent, json_values_only) {
        replacer = (replacer === undefined) ? null : replacer;
        indent = (indent === undefined) ? null : indent;
        json_values_only = (json_values_only === undefined) ? false : json_values_only;
        indent = indent ? indent : '';
        indent = (indent.constructor === Number) ? weavecore.StandardLib.lpad('', indent, ' ') : String(indent);
        return Compiler._stringify("", value, replacer, indent ? '\n' : '', indent, json_values_only);
    }

    Compiler._stringify = function (key, value, replacer, lineBreak, indent, json_values_only) {
        if (replacer !== null)
            value = replacer(key, value);

        var output;
        var item;
        var key;

        if (value.constructor === String)
            return Compiler.encodeString(value);

        // non-string primitives
        if (value === null || typeof value !== 'object') {
            if (json_values_only && (value === undefined || !isFinite(value)))
                value = null;
            return String(value) || String(null);
        }

        // loop over keys in Array or Object
        var lineBreakIndent = lineBreak + indent;
        var valueIsArrayOrVector = value.constructor === Array;
        output = [];
        if (valueIsArrayOrVector) {
            for (var i = 0; i < value.length; i++)
                output.push(Compiler._stringify(String(i), value[i], replacer, lineBreakIndent, indent, json_values_only));
        } else if (value.constructor.name === 'Object') {
            for (key in value)
                output.push(Compiler.encodeString(key) + ": " + Compiler._stringify(key, value[key], replacer, lineBreakIndent, indent, json_values_only));
            // sort keys
            weavecore.StandardLib.sort(output);
        }
        /*else {
               for each(var list in DescribeType.getInfo(value, DescribeType.ACCESSOR_FLAGS | DescribeType.VARIABLE_FLAGS)['traits'])
               for each(item in list)
               if (item.access != 'writeonly' && !item.uri) // ignore properties with namespaces
                   output.push(Compiler.encodeString(item.name) + ": " + _stringify(item.name, value[item.name], replacer, lineBreakIndent, indent, json_values_only));
               // sort keys
               StandardLib.sort(output);
           }*/

        if (output.length === 0)
            return valueIsArrayOrVector ? "[]" : "{}";

        return (valueIsArrayOrVector ? "[" : "{") + lineBreakIndent + output.join(indent ? ',' + lineBreakIndent : ', ') + lineBreak + (valueIsArrayOrVector ? "]" : "}");
    }

    /**
     * First checks deprecatedClassReplacements, then getDefinitionByName().
     * @param name The name used to look up a definition.
     * @return The corresponding object.
     * @throws Error If there is no definition corresponding to the name.
     */
    Compiler.getDefinition = function (name) {
        // return cached definition if present
        var def = Compiler.classAliases[name];
        if (def)
            return def;

        if (domain[name]) {
            return domain[name];
        }


        // if it's not a fully qualified name, check the default packages

        for (var i = -1; i < Compiler.defaultPackages.length; i++) {
            var pkg = i < 0 ? "" : Compiler.defaultPackages[i];
            var qname = i < 0 ? name : (Compiler.defaultPackages[i] + "." + name);
            if (domain[pkg] && domain[pkg][name]) {
                // cache definition for next time
                def = weavecore.ClassUtils.hasClassDefinition(qname) ? weavecore.ClassUtils.getClassDefinition(qname) : null
                def = def ? def : eval(qname);
                if (def) {
                    classAliases[name] = def;
                    classAliases[altName] = def;
                }
                return def;
            }
        }


    }

    var p = Compiler.prototype;


    /**
     * This function will include additional libraries to be supported by the compiler when compiling functions.
     * @param classesOrObjects An Array of Class definitions or objects containing functions to be supported by the compiler.
     */
    p.includeLibraries = function () {
        var classesOrObjects = Array.prototype.slice.call(this, arguments);
        for (var i = 0; i < classesOrObjects.length; i++) {
            var library = classesOrObjects[i];
            // only add this library to the list if it is not already added.
            if (library != null && this.libraries.indexOf(library) < 0) {
                var className = null;
                if (library.constructor === String) {
                    className = library;
                    library = Compiler.getDefinition.call(this, className);
                    if (this.libraries.indexOf(library) >= 0)
                        continue;
                } else if (Compiler.isClass(library)) {
                    className = library.constructor.name;
                }
                if (className) {
                    // save the class name as a symbol
                    //className = className.substr(Math.max(className.lastIndexOf('.'), className.lastIndexOf(':')) + 1);
                    this.globals[className] = library;
                }
                /*if (library is Function) // special case for global function like flash.utils.getDefinitionByName
                	continue;*/

                this.libraries.push(library);
            }
        }

    }

    /**
     * This function compiles an expression into a Function that evaluates using variables from a symbolTable.
     * @param expression An expression to compile.
     * @param symbolTable This is a lookup table containing custom variables and functions that can be used in the expression. Multiple lookup tables can be specified in an Array. The values in the lookup tables may be changed outside the function after compiling.
     * @param errorHandler A function that takes an Error and optionally returns true if execution should continue, behaving  the current instruction returned undefined.
     * @param useThisScope If this is set to true, properties of 'this' can be accessed  they were local variables.
     * @param paramNames This specifies local variable names to be associated with the arguments passed in  to the compiled function.
     * @param paramDefaults This specifies default values corresponding to the parameter names.  This must be the same length  paramNames array.
     * @return A Function generated from the expression String.
     * @throws Error If the expression is invalid.
     */
    p.compileToFunction = function (expression, symbolTable, errorHandler, useThisScope, paramNames, paramDefaults) {
        errorHandler = (errorHandler === undefined) ? null : errorHandler;
        useThisScope = (useThisScope === undefined) ? false : useThisScope;
        paramNames = (paramNames === undefined) ? null : paramNames;
        paramDefaults = (paramDefaults === undefined) ? null : paramDefaults;

        var tokens = getTokens.call(this, expression);
        //trace("source:", expression, "tokens:" + tokens.join(' '));
        var compiledObject = finalize.call(this, compileTokens.call(this, tokens, true));
        return this.compileObjectToFunction(compiledObject, symbolTable, errorHandler, useThisScope, paramNames, paramDefaults);
    }

    /**
     * Tests if an expression is a single, valid symbol name.
     */
    p.isValidSymbolName = function (expression) {
        try {
            var tokens = getTokens.call(this, expression);
            if (tokens.length !== 1 || expression !== tokens[0])
                return false;
            var str = tokens[0];
            if (this.operators.hasOwnProperty(str.charAt(0)))
                return false;
            return !Compiler.numberRegex.exec(str);
        } catch (e) {
            console.warn(e);
        }
        return false;
    }

    function getTokens(expression) {
        var tokens = [];
        if (!expression)
            return tokens;
        var n = expression.length;
        // get a flat list of tokens
        var i = 0;
        while (i < n) {
            var token = getToken.call(this, expression, i);
            var substr = token.substr(0, 2);
            // skip whitespace and comments
            if (substr != '//' && substr != '/*' && Compiler.WHITESPACE.indexOf(token.charAt(0)) === -1)
                tokens.push(token);
            i += token.length;
        }
        return tokens;
    }

    /**
     * This function is for internal use only.
     * @param expression An expression to parse.
     * @param index The starting index of the token.
     * @return The token beginning at the specified index.
     * @throws Error If a block comment or quoted String is not terminated properly.
     */
    function getToken(expression, index) {
        var endIndex;
        var n = expression.length;
        var c = expression.charAt(index);

        // handle comments
        if (c === '/') {
            var c2 = expression.charAt(index + 1);

            if (c2 === '/') // line comment
                return expression.substr(index).split('\r')[0].split('\n')[0];

            if (c2 === '*') /* block comment */ {
                var endBlockComment = expression.indexOf("*/", index + 2);
                if (endBlockComment < 0)
                    throw new Error('Missing end sequence of block comment ("*/"): ' + expression.substr(index));
                return expression.substring(index, endBlockComment + 2);
            }
        }

        // handle quoted string
        if (c === '"' || c === "'" || c === '`') {
            var quote = c;
            // index points to the opening quote
            // make endIndex point to the matching end quote
            for (c = null, endIndex = index + 1; endIndex < n; endIndex++) {
                c = expression.charAt(endIndex);
                // stop when matching quote found, unless there are two together for an escape sequence
                if (c === quote) {
                    if (endIndex < n - 1 && expression.charAt(endIndex + 1) === quote) {
                        // skip second quote
                        endIndex++;
                    } else {
                        // return the quoted string, including the quotes
                        return expression.substring(index, endIndex + 1);
                    }
                } else if (c === '\\') // handle escape sequences
                {
                    endIndex++; // skip the next character
                }
            }
            // invalid quoted string
            throw new Error("Missing matching end quote: " + expression.substr(index));
        }

        // handle numbers
        var foundNumber = Compiler.numberRegex.exec(expression.substr(index));
        if (foundNumber)
            return foundNumber[0];

        // handle operators (find the longest matching operator)
        // this function assumes operators h been initialized
        if (this.operators.hasOwnProperty(c)) // only handle operator if it begins with operator character (doesn't include as,in,instanceof,is)
            for (var opLength = this.MAX_OPERATOR_LENGTH; opLength > 0; opLength--)
            if (this.operators.hasOwnProperty(c = expression.substr(index, opLength)))
                return c;

            // handle whitespace (find the longest matching sequence)
        endIndex = index;
        while (endIndex < n && Compiler.WHITESPACE.indexOf(expression.charAt(endIndex)) >= 0)
            endIndex++;
        if (index < endIndex)
            return expression.substring(index, endIndex);

        // handle everything else (go until a special character is found)
        for (endIndex = index + 1; endIndex < n; endIndex++) {
            c = expression.charAt(endIndex);
            // whitespace terminates a token
            if (Compiler.WHITESPACE.indexOf(c) >= 0)
                break;
            // operator terminates a token
            if (this.operators.hasOwnProperty(c))
                break;
        }
        return expression.substring(index, endIndex);
    }

    /**
     * This function will recursively compile a set of tokens into a compiled object representing a function that takes no parameters and returns a value.
     * Example set of input tokens:  pow ( - ( - 2 + 1 ) ** - 4 , 3 ) - ( 4 + - 1 )
     * @param tokens An Array of tokens for an expression.  This array will be modified in place.
     * @param allowSemicolons Set to true to allow multiple statements and empty expressions.
     * @return A CompiledConstant or CompiledFunctionCall generated from the tokens.
     * @throws Error If the tokens do not describe a valid expression.
     */
    function compileTokens(tokens, allowSemicolons) {
        // there are no more parentheses, so the remaining tokens are operators, constants, and variable names.
        if (this.debug)
            console.log("compiling tokens", tokens.join(' '));

        var i;
        var token;
        var str;
        var call;

        // first step: compile quoted Strings and Numbers
        for (i = 0; i < tokens.length; i++) {
            str = (tokens[i].constructor === String) ? tokens[i] : null;

            if (!str)
                continue;

            // if the token starts with a quote, treat it  String
            if (str.charAt(0) === '"' || str.charAt(0) === "'" || str.charAt(0) === '`') {
                tokens[i] = compileStringLiteral.call(this, str);
            } else {
                // attempt to evaluate the token  Number
                try {
                    var number = Number(str);
                    if (!isNaN(number))
                        tokens[i] = new weavecore.CompiledConstant(str, number);
                } catch (e) {}
            }
        }


        // next step: compile escaped operators
        for (i = 0; i < tokens.length - 1; i++) {
            token = tokens[i];
            if (token === Compiler.OPERATOR_ESCAPE && this.operators[tokens[i + 1]].constructor === Function) {
                token = tokens[i + 1];
                tokens.splice(i, 2, new weavecore.CompiledConstant(Compiler.OPERATOR_ESCAPE + token, this.operators[token]));
            }
        }

        // next step: combine 'for each' into a single token
        for (i = tokens.length; i > 0; i--)
            if (tokens[i] === Compiler.ST_EACH && tokens[i - 1] === Compiler.ST_FOR)
                tokens.splice(i - 1, 2, Compiler.ST_FOR_EACH);
        if (tokens[0] === Compiler.ST_EACH)
            throw new Error("Invalid statement 'each'");

        // next step: compile unary '#' operators (except those immediately followed by other operators)
        if (this.operators.hasOwnProperty('#'))
            compileUnaryOperators.call(this, tokens, ['#']);

        // next step: handle operators "..[]{}()"
        compileBracketsAndProperties.call(this, tokens);

        // next step: handle stray operators "..[](){}"
        for (i = 0; i < tokens.length; i++)
            if (tokens[i].constructor === String && '..[](){}'.indexOf(tokens[i]) >= 0)
                throw new Error("Misplaced '" + tokens[i] + "'" + _betweenTwoTokens.call(this, tokens[i - 1], tokens[i + 1]));

            // next step: compile constants and variable names
        for (i = 0; i < tokens.length; i++) {
            token = (tokens[i].constructor === String) ? tokens[i] : null;
            // skip tokens that have already been compiled and skip operator tokens
            if (token === null || this.operators.hasOwnProperty(token))
                continue;
            // evaluate constants
            if (this.constants.hasOwnProperty(token)) {
                tokens[i] = new weavecore.CompiledConstant(token, this.constants[token]);
                continue;
            }
            // treat everything else  variable name.
            // make a copy of the variable name that is safe for the wrapper function to use
            // compile the token  call to variableGetter.
            tokens[i] = compileVariable.call(this, token);
        }

        // next step: compile new operator used  unary operator (missing parentheses)
        compileUnaryOperators.call(this, tokens, [Compiler.OPERATOR_NEW]);

        // next step: compile unary '#' operators
        if (this.operators.hasOwnProperty('#'))
            compileUnaryOperators.call(this, tokens, ['#']);

        compilePostfixOperators(tokens, ['--', '++']);

        // next step: compile infix '**' operators
        compileInfixOperators.call(this, tokens, ['**']);

        // next step: compile unary operators
        compileUnaryOperators.call(this, tokens, this.unaryOperatorSymbols);

        // next step: compile remaining infix operators in order
        for (i = 0; i < this.orderedOperators.length; i++)
            compileInfixOperators.call(this, tokens, this.orderedOperators[i]);

        // next step: compile conditional branches
        conditionals: while (true) {
                // true branch includes everything between the last '?' and the next ':'
                var left = tokens.lastIndexOf('?');
                var right = tokens.indexOf(':', left);

                var terminators = [',', ';'];
                for (var index in terminators) {
                    var terminator = terminators[index];
                    var terminatorIndex = tokens.indexOf(terminator, left);
                    if (terminatorIndex >= 0 && terminatorIndex < right)
                        throw new Error("Expecting colon before '" + terminator + "'");
                    if (terminatorIndex === right + 1)
                        break conditionals; // missing expression
                }

                // stop if operator missing or any section h tokens
                if (right < 0 || left < 1 || left + 1 === right || right + 1 === tokens.length)
                    break;

                // false branch includes everything after ':' and up until the next ?:,;
                var end = right + 2;
                while (end < tokens.length) {
                    token = tokens[end];
                    if (token && '?:,;'.indexOf(token) >= 0)
                        break;
                    end++;
                }
                if (this.debug)
                    console.log("compiling conditional branch:", tokens.slice(left - 1, right + 2).join(' '));

                // condition includes only the token to the left of the '?'
                var condition = compileTokens.call(this, tokens.slice(left - 1, left), false);
                var trueBranch = compileTokens.call(this, tokens.slice(left + 1, right), false);
                var falseBranch = compileTokens.call(this, tokens.slice(right + 1, end), false);
                tokens.splice(left - 1, end - left + 1, compileOperator.call(this, '?:', [condition, trueBranch, falseBranch]));
            }
            // stop if any branch operators remain
        if (Math.max(tokens.indexOf('?')) >= 0)
            throw new Error('Invalid conditional branch');

        // next step: inline functions (headers only), right to left
        i = tokens.length;
        while (i--) {
            if (tokens[i] === Compiler.FUNCTION)
                tokens.splice(i, 2, compileFunctionHeader.call(this, Compiler.FUNCTION, tokens[i + 1]));
            if (tokens[i] === '=>')
                tokens.splice(i - 1, 2, compileFunctionHeader.call(this, '=>', tokens[i - 1]));
        }

        // next step: function applications
        for (i = 0; i < tokens.length; i++) {
            call = (tokens[i] && tokens[i] instanceof weavecore.CompiledFunctionCall) ? tokens[i] : null;
            if (call && call.evaluatedMethod === this.operators[','] && tokens[i - 1] instanceof weavecore.ICompiledObject && !isFunctionHeader.call(this, tokens[i - 1]))
                tokens.splice(i - 1, 2, new weavecore.CompiledFunctionCall(tokens[i - 1], call.compiledParams));
        }

        // next step: variable assignment and inline function definitions, right to left
        while (true) {
            i = tokens.length;
            while (i--) {
                if (isFunctionHeader.call(this, tokens[i]))
                    tokens.splice(i, 2, compileFunctionDefinition(tokens[i], tokens[i + 1]));
                else if (this.assignmentOperators.hasOwnProperty(tokens[i]))
                    break;
            }
            if (i < 0)
                break;
            if (i === 0 || i + 1 === tokens.length)
                throw new Error("Misplaced '" + tokens[i] + "'");
            tokens.splice(i - 1, 3, compileVariableAssignment.call(this, tokens[i - 1], tokens[i], tokens[i + 1]));
        }

        //next step literal property declarations: [variable, ":", expr]
        for (i = 0; i < tokens.length; i++) {
            if (tokens[i + 1] === ':' && tokens[i + 2] instanceof weavecore.ICompiledObject) {
                var constant = (tokens[i] && tokens[i] instanceof weavecore.CompiledConstant) ? tokens[i] : null;
                if (constant && !(constant.value.constructor === String) && this.constants.hasOwnProperty(constant.name) && isValidSymbolName(constant.name))
                    constant = new weavecore.CompiledConstant(constant.name, constant.name);

                call = (tokens[i] && tokens[i] instanceof weavecore.CompiledFunctionCall) ? tokens[i] : null;
                if (isVariableLookup(call))
                    constant = (call.compiledMethod && call.compiledMethod instanceof weavecore.CompiledConstant) ? call.compiledMethod : null;

                if (constant && constant.value instanceof String)
                    tokens.splice(i, 3, compileOperator.call(this, ":", [constant, tokens[i + 2]]));
            }
        }
        // stop if any ":" remain
        if (tokens.indexOf(':') >= 0)
            throw new Error('Misplaced ":"');

        // next step: commas
        compileInfixOperators.call(this, tokens, [',']);

        // next step: handle statements
        if (allowSemicolons) {
            // remove leading ';'
            while (tokens[0] === ';')
                tokens.shift();
            // convert EXPR; to {EXPR}
            for (i = 1; i < tokens.length; i++) {
                if (tokens[i] === ';') {
                    call = (tokens[i - 1] && tokens[i - 1] instanceof weavecore.CompiledFunctionCall) ? tokens[i - 1] : null;

                    if (Compiler._jumpStatements.indexOf(tokens[i - 1]) >= 0 || (call && call.evaluatedMethod === this.operators['('])) {
                        // support for "return;" and "while (cond);"
                        tokens[i] = compileOperator.call(this, ';', []);
                    } else if (tokens[i - 1] instanceof weavecore.CompiledConstant || (call && call.evaluatedMethod != this.operators[';'])) {
                        // support for "while (cond) expr;"
                        tokens.splice(i - 1, 2, compileOperator.call(this, ';', [tokens[i - 1]]));
                    }
                }
            }

            // if there are any remaining ';', compile separate statements
            if (tokens.indexOf(';') >= 0)
                return compileOperator.call(this, ';', compileArray.call(this,tokens, ';'));

            // there are no more ';'
            assertValidStatementParams.call(this,tokens);
            for (i = 0; i < tokens.length; i++)
                compileStatement.call(this, tokens, i);

            // group multiple statements in {}
            if (tokens.length > 1)
                return compileOperator.call(this, ';', tokens);
        } else if (tokens.indexOf(';') >= 0)
            throw new Error("Misplaced ';'");

        // last step: verify there is only one token left
        if (tokens.length === 1)
            return tokens[0];

        if (tokens.length > 1)
            throw new Error("Missing operator" + _betweenTwoTokens.call(this, tokens[0], tokens[1]));

        if (allowSemicolons)
            return compileOperator.call(this, ';', tokens);

        throw new Error("Empty expression");
    }


    /**
     * This function is for internal use only.  It assumes the string it receives is valid.
     * @param encodedString A quoted String with special characters escaped using ActionScript string literal format.
     * @return The compiled string.
     */
    function compileStringLiteral(encodedString) {
        // remove quotes
        var quote = encodedString.charAt(0);
        var input = encodedString.substr(1, encodedString.length - 2);
        input = input.split(quote + quote).join(quote); // handle doubled quote escape sequences
        var output = "";
        var searchIndex = 0;
        var compiledObjects = [];
        while (true) {
            var escapeIndex = input.indexOf("\\", searchIndex);
            if (escapeIndex < 0)
                escapeIndex = input.length;
            // only support expressions inside { } if the string literal is surrounded by the '`' quote symbol.
            var bracketIndex = quote === '`' ? input.indexOf("{", searchIndex) : -1;
            if (bracketIndex < 0)
                bracketIndex = input.length;

            if (bracketIndex === escapeIndex) // handle end of string
            {
                output += input.substring(searchIndex);
                input = Compiler.encodeString(output, quote); // use original quote symbol

                var compiledString = new weavecore.CompiledConstant(input, output);

                if (compiledObjects.length === 0)
                    return compiledString;

                compiledObjects.unshift(compiledString);
                return new weavecore.CompiledFunctionCall(new weavecore.CompiledConstant('substitute', weavecore.StandardLib.substitute), compiledObjects);
            } else if (escapeIndex < bracketIndex) // handle '\'
            {
                // append everything before the escaped character
                output += input.substring(searchIndex, escapeIndex);

                // look up escaped character
                var c = input.charAt(escapeIndex + 1);
                c = Compiler.DECODE_LOOKUP[c] || c;

                if ('0123'.indexOf(c) >= 0) {
                    // \000 .. \377        a byte specified in octal
                    var oct = input.substr(escapeIndex + 1, 3);
                    c = String.fromCharCode(parseInt(oct, 8));
                    searchIndex = escapeIndex + 4; // skip over escape sequence
                } else if (c === 'x') {
                    // \x00 .. \xFF        a byte specified in hexadecimal
                    var hex = input.substr(escapeIndex + 2, 2);
                    c = String.fromCharCode(parseInt(hex, 16));
                    searchIndex = escapeIndex + 4; // skip over escape sequence
                } else if (c === 'u') {
                    var unicodeDigits;
                    var unicodeValue;
                    var foundUnicode = Compiler.unicodeRegex.exec(input.substr(escapeIndex + 2, maxUnicodeEscapeChars))
                    if (foundUnicode) {
                        unicodeDigits = foundUnicode[0];
                        if (unicodeDigits.charAt(0) === '{') // \u{10FFFF}
                            unicodeValue = parseInt(unicodeDigits.substr(1, unicodeDigits.length - 2), 16);
                        else // \u0000 .. \uFFFF    a 16-bit Unicode character specified in hexadecimal
                            unicodeValue = parseInt(unicodeDigits, 16);
                    }
                    if (!foundUnicode || unicodeValue > maxUnicodeEscapeValue)
                        throw new Error("Malformed Unicode character escape sequence: " + input);
                    c = weavecore.StandardLib.ucs2encode(unicodeValue);
                    searchIndex = escapeIndex + 2 + unicodeDigits.length; // skip over escape sequence
                } else {
                    searchIndex = escapeIndex + 2; // skip over escape sequence
                }

                // append the escaped character
                output += c;
            } else if (bracketIndex < escapeIndex) // handle '{'
            {
                // handle { } brackets for inline code
                var tokens = [];
                var token = null;
                var depth = 1;
                escapeIndex = bracketIndex + 1;
                while (escapeIndex < input.length) {
                    token = getToken.call(this, input, escapeIndex);
                    if (token === '{')
                        depth++;
                    if (token === '}')
                        depth--;
                    if (depth === 0)
                        break;
                    if (Compiler.WHITESPACE.indexOf(token.charAt(0)) === -1)
                        tokens.push(token);
                    escapeIndex += token.length;
                }
                if (escapeIndex === input.length)
                    throw new Error("Missing '}' in string literal inline code: " + input);

                // now bracketIndex points to '{' and escapeIndex points to matching '}'
                //replace code between brackets with an int like {0} so the resulting string can be passed to StandardLib.substitute() with compiledObject  next parameter
                output += input.substring(searchIndex, bracketIndex) + '{' + compiledObjects.length + '}';
                searchIndex = escapeIndex + 1;
                compiledObjects.push(compileTokens.call(this, tokens, true));
            }
        }
        throw new Error("unreachable");
    }

    /**
     * This function is for internal use only.
     * This will compile unary operators of the given type from right to left.
     * @param compiledTokens An Array of compiled tokens for an expression.  No '(' ')' or ',' tokens should appear in this Array except when compiling '#' operator.
     * @param operatorSymbols An Array containing all the infix operator symbols to compile.
     */
    function compileUnaryOperators(compiledTokens, operatorSymbols) {
        var call;
        var index = compiledTokens.length;
        while (index--) // right to left
        {

            var token = (compiledTokens[index].constructor === String) ? compiledTokens[index] : null;

            // skip tokens that are not listed unary operators
            if (operatorSymbols.indexOf(token) < 0)
                continue;

            var nextToken = compiledTokens[index + 1];

            if (token === '#') {
                // do not compile unary '#' if immediately followed by an uncompiled operator
                if (operators.hasOwnProperty(nextToken))
                    continue;

                if (nextToken !== undefined)
                    nextToken = compileTokens.call(this, [nextToken], false);
            }

            // fail when next token is not a compiled object, unless we're compiling '#'
            if ((nextToken === undefined && token !== '#') || nextToken.constructor === String)
                throw new Error("Misplaced unary operator '" + token + "'");

            // skip infix operator
            if (index > 0 && compiledTokens[index - 1] instanceof weavecore.ICompiledObject) {
                call = (compiledTokens[index - 1] && compiledTokens[index - 1] instanceof weavecore.CompiledFunctionCall) ? compiledTokens[index - 1] : null;
                if (!call || call.evaluatedMethod !== this.operators[';'])
                    continue;
            }

            // compile unary operator
            if (this.debug)
                console.log("compile unary operator", compiledTokens.slice(index, index + 2).join(' '));

            if (this.assignmentOperators.hasOwnProperty(token)) // unary assignment operators
            {

                call = (nextToken && nextToken instanceof weavecore.CompiledFunctionCall) ? nextToken : null;
                if (call && !call.compiledParams) // variable lookup
                {
                    compiledTokens.splice(index, 2, compileOperator.call(this, token, [call.compiledMethod, newUndefinedConstant()]));
                } else if (call && call.evaluatedMethod === this.operators['.']) {
                    // switch '.' to the unary assignment operator
                    call.compiledParams.push(newUndefinedConstant());
                    compiledTokens.splice(index, 2, compileOperator.call(this, token, call.compiledParams));
                } else {
                    throw new Error("Invalid operand for unary operator " + token);
                }
            } else {
                compiledTokens.splice(index, 2, compileOperator.call(this, token, nextToken === undefined ? [] : [nextToken]));
            }
        }
    }

    function newTrueConstant() {
        return new weavecore.CompiledConstant('true', true);
    }

    function newUndefinedConstant() {
        return new weavecore.CompiledConstant('undefined', undefined);
    }

    function compileOperator(operatorName, compiledParams) {
        operatorName = Compiler.OPERATOR_ESCAPE + operatorName;
        var op = new weavecore.CompiledFunctionCall(new weavecore.CompiledConstant(operatorName, this.constants[operatorName]), compiledParams);
        //op.originalTokens = originalTokensForDecompiling;
        return op;
    }

    /**
     *
     * @param leftBracket
     * @param rightBracket
     * @param tokens
     */
    function compileBracketsAndProperties(tokens) {
        var token;
        var compiledToken;
        var compiledParams;
        var open;
        var close;
        var leftBracket;
        var rightBracket;
        while (true) {
            // find first closing bracket or '.' or '..'
            for (close = 0; close < tokens.length; close++)
                if ('..])}'.indexOf(tokens[close]) >= 0)
                    break;
            if (close === tokens.length || close === 0)
                break; // possible error, or no operator found

            // use matching brackets
            rightBracket = tokens[close];
            if (rightBracket === '..')
                leftBracket = '..';
            else
                leftBracket = '.[({'.charAt('.])}'.indexOf(rightBracket));

            // work backwards to the preceeding, matching opening bracket or stop if '.'
            for (open = close; open >= 0; open--)
                if (tokens[open] === leftBracket)
                    break;
            if (open < 0 || open + 1 === tokens.length)
                break; // possible error, or no operator found

            // unless it's an operator, compile the token to the left
            token = open > 0 ? tokens[open - 1] : null;
            compiledToken = (token && token instanceof weavecore.ICompiledObject) ? token : null;
            if (open > 0 && !compiledToken && !this.operators.hasOwnProperty(token)) {
                // The function token hasn't been compiled yet.
                if (this.constants.hasOwnProperty(token))
                    compiledToken = new weavecore.CompiledConstant(token, this.constants[token]);
                else {
                    var tok = (token && token.constructor === String) ? token : null;
                    var compiledToken = compileVariable.call(this, tok);
                    compiledToken = (compiledToken && compiledToken instanceof weavecore.ICompiledObject) ? compiledToken : null;

                }

            }

            // handle access and descendants operators
            if ('..'.indexOf(tokens[open]) === 0) {
                var propertyToken = tokens[open + 1];

                if (!compiledToken || !propertyToken || this.operators.hasOwnProperty(propertyToken))
                    throw new Error("Misplaced '" + tokens[open] + "' " + _betweenTwoTokens.call(this, token, tokens[open + 1]));

                // the token on the right is a variable name, but we will store it  String because it's a property lookup
                compiledParams = [compiledToken, new weavecore.CompiledConstant(Compiler.encodeString(propertyToken), propertyToken)];
                tokens.splice(open - 1, 3, compileOperator.call(this, tokens[open], compiledParams));
                continue;
            }

            // cut out tokens between brackets
            var subArray = tokens.splice(open + 1, close - open - 1);

            if (this.debug)
                console.log("compiling tokens", leftBracket, subArray.join(' '), rightBracket);

            if (leftBracket === '{') {
                var block = compileTokens.call(this, subArray, true);
                var blockCall = (block && block instanceof weavecore.CompiledFunctionCall) ? block : null;
                if (blockCall) {
                    var blockItems = null;
                    if (blockCall.evaluatedMethod === this.operators[';'] && blockCall.compiledParams.length === 0)
                        blockItems = [];
                    if (blockCall.evaluatedMethod === this.operators[','])
                        blockItems = blockCall.compiledParams;
                    if (blockCall.evaluatedMethod === this.operators[':'])
                        blockItems = [blockCall];
                    if (blockItems && (blockItems.length === 0 || weavecore.StandardLib.getArrayType(blockItems) === weavecore.CompiledFunctionCall)) {
                        var params = [];
                        for (var index in blockItems) {
                            var item = blockItems[index]
                            if (item.evaluatedMethod !== this.operators[':']) {
                                params = null;
                                break;
                            }
                            params.push(item.compiledParams[0], item.compiledParams[1]);
                        }
                        if (params !== null) {
                            tokens.splice(open, 2, compileOperator.call(this, '{', params));
                            continue;
                        }
                    }
                }
                // It's ok if it creates an extra {} wrapper because finalize() will take care of that.
                // It's important to remember that the brackets existed for statement processing.
                tokens.splice(open, 2, compileOperator.call(this, ';', [block]));
                continue;
            }

            var separator = ',';
            if (leftBracket === '(' && Compiler.statements.hasOwnProperty(token) && Compiler.statements[token])
                separator = ';'; // statement parameters are separated by ';'
            compiledParams = compileArray.call(this, subArray, separator);

            if (leftBracket === '[') // this is either an array or a property access
            {
                if (compiledToken) {
                    // property access
                    if (compiledParams.length === 0)
                        throw new Error("Missing parameter for bracket operator: " + this.decompileObject.call(this, compiledToken) + "[]");
                    // the token on the left becomes the first parameter of the access operator
                    compiledParams.unshift(compiledToken);
                    // replace the token to the left and the brackets with the operator call
                    tokens.splice(open - 1, 3, compileOperator.call(this, '.', compiledParams));
                } else {
                    // array initialization -- replace '[' and ']' tokens
                    tokens.splice(open, 2, compileOperator.call(this, '[', compiledParams));
                }
                continue;
            }

            compiledToken = (compiledToken && compiledToken.constructor === weavecore.CompiledFunctionCall) ? compiledToken : null;
            var compiledCall = compiledToken;
            // if there is a compiled token to the left, this is a function call (unless the token is a function header or is a call to operator ';')
            if (leftBracket === '(' && compiledToken && !isFunctionHeader.call(this, compiledToken) && !(compiledCall && compiledCall.evaluatedMethod === this.operators[';'])) {
                if (open >= 2) {
                    var prevToken = tokens[open - 2];
                    if (prevToken === Compiler.OPERATOR_NEW) {
                        compiledParams.unshift(compiledToken);
                        tokens.splice(open - 2, 4, compileOperator.call(this, Compiler.OPERATOR_NEW, compiledParams));
                        continue;
                    }
                }
                if (this.debug)
                    console.log("compiling function call", this.decompileObject.call(this, compiledToken));

                // the token to the left is the method
                // replace the function token, '(', and ')' tokens with a compiled function call
                tokens.splice(open - 1, 3, new weavecore.CompiledFunctionCall(compiledToken, compiledParams));
                continue;
            }

            // '{' or '(' group that does not correspond to a function call

            if (leftBracket === '(' && compiledParams.length === 0 && (token !== Compiler.FUNCTION && tokens[open + 2] != '=>'))
                throw new Error("Missing expression inside parentheses");

            if (leftBracket === '(' && Compiler.statements.hasOwnProperty(token) && Compiler.statements[token])
                separator = '('; // statement params
            tokens.splice(open, 2, compileOperator.call(this, separator, compiledParams));

            if (token === Compiler.FUNCTION && leftBracket === '(')
                tokens.splice(open - 1, 2, compileFunctionHeader.call(this, Compiler.FUNCTION, tokens[open]));
        }
    }

    /**
     * Used for generating a portion of an error message like " between token1 and token2"
     */
    function _betweenTwoTokens(token1, token2) {
        if (token1 instanceof weavecore.ICompiledObject)
            token1 = this.decompileObject(token1);
        if (token2 instanceof weavecore.ICompiledObject)
            token2 = this.decompileObject(token2);
        if (token1 && token2)
            return ' between ' + token1 + ' and ' + token2;
        if (token1)
            return ' after ' + token1;
        if (token2)
            return ' before ' + token2;
        return '';
    }


    /**
     * This function will compile an expression into a compiled object representing a function that takes no parameters and returns a value.
     * This function is useful for inspecting the structure of the compiled function and decompiling individual parts.
     * @param expression An expression to parse.
     * @return A CompiledConstant or CompiledFunctionCall generated from the tokens.
     * @throws Error If the expression is invalid.
     */
    p.compileToObject = function (expression) {
        return finalize.call(this, compileTokens.call(this, getTokens.call(this, expression), true));
    }

    /**
     * Call this to move all var declarations at the beginning of the code and perform optimizations on the compiled objects.
     * @param compiledObject An ICompiledObject to finalize.
     * @param forceInlineObjectConstants If true, forces the evaluation of inline objects to constants.
     * @return A finialized/optimized version of compiledObject.
     */
    function finalize(compiledObject, forceInlineObjectConstants) {
        forceInlineObjectConstants = (forceInlineObjectConstants === undefined) ? false : forceInlineObjectConstants;
        var varLookup = {};

        var final = _finalize.call(this, compiledObject, forceInlineObjectConstants, varLookup);
        if (!final)
            return compiledObject;

        compiledObject = final;

        var names = [];
        for (var name in varLookup)
            names.push(name);

        if (names.length > 0) {
            // there is at least one var declaration, so we need to include it at the beginning.
            var varDeclarations = compileOperator.call(this, Compiler.ST_VAR, [new weavecore.CompiledConstant(null, names)]);
            var call = (compiledObject && compiledObject instanceof weavecore.CompiledFunctionCall) ? compiledObject : null;
            if (call && call.evaluatedMethod === this.operators[';']) {
                call.compiledParams.unshift(varDeclarations);
                call.evaluateConstants();
            } else
                compiledObject = compileOperator.call(this, ';', [varDeclarations, compiledObject]);
        }
        return compiledObject;
    }
    /**
     * @private helper function
     */
    function _finalize(compiledObject, forceInlineObjectConstants, varLookup) {
        if (compiledObject instanceof weavecore.CompiledConstant)
            return compiledObject;

        var i;
        var call = (compiledObject && compiledObject instanceof weavecore.CompiledFunctionCall) ? compiledObject : null;

        // function headers should not appear alone
        if (isFunctionHeader.call(this, call))
            compileFunctionDefinition.call(this, call, null); // this will throw an appropriate error

        call.compiledMethod = _finalize.call(this, call.compiledMethod, forceInlineObjectConstants, varLookup);
        if (!call.compiledMethod)
            throw new Error("Misplaced variable declaration");
        var params = call.compiledParams;
        if (params) {
            for (i = 0; i < params.length; i++) {
                params[i] = _finalize.call(this, params[i], forceInlineObjectConstants, varLookup);
                if (params[i] === null) // variable declaration eliminated?
                    params.splice(i--, 1);
            }
        }
        call.evaluateConstants();

        var method = call.evaluatedMethod;

        if (method === this.operators[':'])
            throw new Error("Invalid object literal syntax");

        // remove var declarations from their current locations
        if (method === this.operators[Compiler.ST_VAR]) {
            call.evaluatedParams[0].forEach(function (name) {
                varLookup[name] = true;
            });
            return null;
        }

        if (method === this.operators[';'] || method === this.operators[','] || method === this.operators['(']) {
            if (params.length === 0) {
                if (this.debug)
                    console.log('optimized empty expression to undefined constant:', this.decompileObject(compiledObject));
                return newUndefinedConstant();
            }
            if (params.length === 1) {
                if (this.debug)
                    console.log('optimized unnecessary wrapper function call:', this.decompileObject(compiledObject));
                return _finalize.call(this, params[0], forceInlineObjectConstants, varLookup);
            }

            // flatten nested grouping operators
            i = params.length;
            while (i--) {
                var nestedCall = (params[i] && params[i] instanceof weavecore.CompiledFunctionCall) ? params[i] : null;
                if (!nestedCall)
                    continue;
                var nestedMethod = nestedCall.evaluatedMethod;
                if (nestedMethod === this.operators[';'] || nestedMethod === this.operators[','] || nestedMethod === this.operators['(']) {
                    if (this.debug)
                        console.log('flattened nested grouped expressions:', this.decompileObject(nestedCall));
                    nestedCall.compiledParams.unshift(i, 1);
                    params.splice(nestedCall.compiledParams);
                }
            }
            call.evaluateConstants();
        }

        if ((method === this.operators[Compiler.ST_IF] || method === this.operators['?:']) && params[Compiler.INDEX_CONDITION] instanceof weavecore.CompiledConstant) {
            if (this.debug)
                console.log('optimized short-circuited ?: operator:', this.decompileObject(compiledObject));

            var index = call.evaluatedParams[Compiler.INDEX_CONDITION] ? Compiler.INDEX_TRUE : Compiler.INDEX_FALSE;
            return index < params.length ? params[index] : newUndefinedConstant();
        }

        if (method === this.operators['&&'] && params.length === 2 && params[Compiler.INDEX_CONDITION] instanceof weavecore.CompiledConstant && !call.evaluatedParams[Compiler.INDEX_CONDITION]) {
            if (this.debug)
                console.log('optimized short-circuited && operator:', this.decompileObject(compiledObject));
            return params[Compiler.INDEX_CONDITION];
        }

        if (method === this.operators['||'] && params.length === 2 && params[Compiler.INDEX_CONDITION] instanceof weavecore.CompiledConstant && call.evaluatedParams[Compiler.INDEX_CONDITION]) {
            if (this.debug)
                console.log('optimized short-circuited || operator:', this.decompileObject(compiledObject));
            return params[Compiler.INDEX_CONDITION];
        }

        if (this.PURE_OP_LOOKUP[method] || (forceInlineObjectConstants && (method === this.operators['{'] || method === this.operators['[']))) {
            // if all parameters are constants, just evaluate the pure operator as a constant.
            for (i = 0; i < params.length; i++) {
                var param = params[i];
                if (!(param instanceof weavecore.CompiledConstant))
                    return call; // cannot be optimized
            }

            if (this.debug)
                console.log('optimized pure operator call to constant:', this.decompileObject(compiledObject));
            return new weavecore.CompiledConstant(this.decompileObject(call), (method).apply(null, call.evaluatedParams));
        }

        return call;
    }


    /**
     * This function is for internal use only.
     * @param compiledObject Either a CompiledConstant or a CompiledFunctionCall.
     * @param symbolTable This is a lookup table containing custom variables and functions that can be used in the expression. Multiple lookup tables can be specified in an Array. The values in the lookup tables may be changed outside the function after compiling.
     * @param errorHandler A function that takes an Error and optionally returns true if execution should continue, behaving as if the current instruction returned undefined.  This may be set to null, which will cause the Error to be thrown.
     * @param useThisScope If this is set to true, properties of 'this' can be accessed as if they were local variables.
     * @param paramNames This specifies local variable names to be associated with the arguments passed in as parameters to the compiled function.
     * @param paramDefaults This specifies default values corresponding to the parameter names.  This must be the same length as the paramNames array.
     * @param flattenFunctionDefinition If set to true and the compiledObject represents a function definition, that function definition will be evaluated and returned.
     * @param bindThis If non-null, the <code>this</code> symbol will be bound to the given value. Otherwise, it will be dynamically determined by how the function is called.
     * @return A Function that takes any number of parameters and returns the result of evaluating the ICompiledObject.
     */
    p.compileObjectToFunction = function (compiledObject, symbolTable, errorHandler, useThisScope, paramNames, paramDefaults, flattenFunctionDefinition, bindThis) {
        paramNames = (paramNames === undefined) ? null : paramNames;
        paramDefaults = (paramDefaults === undefined) ? null : paramDefaults;
        flattenFunctionDefinition = (flattenFunctionDefinition === undefined) ? null : flattenFunctionDefinition;
        bindThis = (bindThis === undefined) ? null : bindThis;

        if (compiledObject === null)
            return null;
        if (paramNames) {
            if (!paramDefaults) {
                paramDefaults = [];
                paramDefaults.length = paramNames.length
            } else if (paramNames.length != paramDefaults.length)
                throw new Error("paramNames and paramDefaults Arrays must have same length");
        }

        if (symbolTable === null)
            symbolTable = {};

        if (compiledObject instanceof weavecore.CompiledConstant) {
            // create a new variable for the value to avoid the overhead of
            // accessing a member variable of the CompiledConstant object.
            const value = (compiledObject).value;
            return function () {
                return value;
            };
        }

        // create the variables that will be used inside the wrapper function

        const builtInSymbolTable = {};
        builtInSymbolTable['eval'] = undefined;
        builtInSymbolTable['this'] = bindThis;

        // set up Array of symbol tables in the correct scope order: built-in, local, params, this, global
        const allSymbolTables = [builtInSymbolTable]; // buit-in first
        const LOCAL_SYMBOL_TABLE_INDEX = allSymbolTables.push(null) - 1; // placeholder

        // add custom symbol table(s)
        if (symbolTable.constructor === Array) {
            symbolTable.forEach(function (_symbolTable) {
                allSymbolTables.push(_symbolTable);
            })
        } else {
            allSymbolTables.push(symbolTable);
        }

        // push placeholder for 'this' symbol table
        const THIS_SYMBOL_TABLE_INDEX = allSymbolTables.push(null) - 1;

        // add libraries in reverse order so the last one will be checked first
        var i = this.libraries.length;
        while (i--)
            allSymbolTables.push(this.libraries[i]);
        // check this.globals last
        allSymbolTables.push(this.globals);

        // this flag is set to useThisScope when the compiledObject is a function definition
        var cascadeThisScope = false;

        // Each recursive call must use a clone of the CompiledFunctionCall,
        // so we keep track of recursion depth and re-use copies of the CompiledFunctionCall.
        var recursion = 0;
        var recursiveCalls = [compiledObject];

        // this function avoids unnecessary function call overhead by keeping its own call stack rather than using recursion.
        var wrapperFunction = function () {
            const stack = []; // used as a queue of function calls
            const localSymbolTable = {};
            var call;
            var subCall;
            var compiledParams;
            var method;
            var result;
            var symbolName;
            var i;
            var propertyHost;
            var propertyName;

            if (bindThis === null)
                builtInSymbolTable['this'] = this;
            builtInSymbolTable['arguments'] = arguments;

            allSymbolTables[LOCAL_SYMBOL_TABLE_INDEX] = localSymbolTable;
            if (useThisScope)
                allSymbolTables[THIS_SYMBOL_TABLE_INDEX] = builtInSymbolTable['this'];

            // make function parameters available under the specified parameter names
            if (paramNames)
                for (i = 0; i < paramNames.length; i++) {
                    var parName = (paramNames[i].constructor === String) ? paramNames[i] : null;
                    localSymbolTable[parName] = i < (arguments.length ? arguments[i] : paramDefaults[i]);
                }

            // initialize top-level function and push it onto the stack
            call = (recursiveCalls[recursion] && recursiveCalls[recursion] instanceof weavecore.CompiledFunctionCall) ? recursiveCalls[recursion] : null;
            if (!call)
                recursiveCalls[recursion] = call = (compiledObject).clone();
            recursion++;

            call.evalIndex = Compiler.INDEX_METHOD;
            stack.length = 1;
            stack[0] = call;
            stackLoop: while (true) {
                // evaluate the CompiledFunctionCall on top of the stack
                call = (stack[stack.length - 1] && stack[stack.length - 1] instanceof weavecore.CompiledFunctionCall) ? stack[stack.length - 1] : null;

                // if we got here because of a break, advance evalIndex
                if (method === this.operators[Compiler.ST_BREAK])
                    call.evalIndex++;

                method = call.evaluatedMethod;
                compiledParams = call.compiledParams;

                if (compiledParams) {
                    if (this.LOOP_LOOKUP.get(method) && call.evalIndex === Compiler.INDEX_METHOD) {
                        if (method === this.operators[Compiler.ST_DO] || method === this.operators[Compiler.ST_FOR_DO]) {
                            // skip first evaluation of loop condition
                            call.evaluatedParams[Compiler.INDEX_CONDITION] = true;
                            call.evalIndex = Compiler.INDEX_TRUE;
                        }
                    }

                    // check which parameters should be evaluated
                    for (; call.evalIndex < compiledParams.length; call.evalIndex++) {
                        //trace(StringLib.lpad('', stack.length, '\t') + "[" + call.evalIndex + "] " + compiledParams[call.evalIndex].name);

                        // handle branching and short-circuiting
                        // skip evaluation of true or false branch depending on condition and branch operator
                        if (this.BRANCH_LOOKUP.get(method) !== undefined && call.evalIndex > Compiler.INDEX_CONDITION)
                            if (this.BRANCH_LOOKUP.get(method) === (call.evalIndex != (call.evaluatedParams[Compiler.INDEX_CONDITION] ? Compiler.INDEX_TRUE : Compiler.INDEX_FALSE)))
                                continue;

                        if (call.evalIndex === Compiler.INDEX_METHOD)
                            subCall = (call.compiledMethod && call.compiledMethod instanceof weavecore.CompiledFunctionCall) ? call.compiledMethod : null;
                        else
                            subCall = (compiledParams[call.evalIndex] && compiledParams[call.evalIndex] instanceof weavecore.CompiledFunctionCall) ? compiledParams[call.evalIndex] : null;

                        if (subCall != null) {
                            // special case for for-in and for-each
                            // implemented as "for (each|in)(\in(list), item=undefined, stmt)
                            if (this.LOOP_LOOKUP.get(method) && call.evalIndex === Compiler.INDEX_FOR_ITEM && (method === this.operators[Compiler.ST_FOR_IN] || method === this.operators[Compiler.ST_FOR_EACH])) {
                                if ((call.evaluatedParams[Compiler.INDEX_FOR_LIST]).length > 0) {
                                    // next item
                                    result = (call.evaluatedParams[Compiler.INDEX_FOR_LIST]).shift(); // property name
                                    if (method === this.operators[Compiler.ST_FOR_EACH]) {
                                        // get property value from property name
                                        var _in = (call.compiledParams[Compiler.INDEX_FOR_LIST] && call.compiledParams[Compiler.INDEX_FOR_LIST] instanceof weavecore.CompiledFunctionCall) ? call.compiledParams[Compiler.INDEX_FOR_LIST] : null;
                                        result = _in.evaluatedParams[0][result]; // property value
                                    }
                                    // set item value
                                    subCall.evaluatedParams[subCall.evaluatedParams.length - 1] = result;
                                } else {
                                    // break out of loop
                                    method = this.operators[Compiler.ST_BREAK];
                                    break;
                                }
                            }

                            // initialize subCall and push onto stack
                            subCall.evalIndex = Compiler.INDEX_METHOD;
                            stack.push(subCall);
                            continue stackLoop;
                        }
                    }
                }
                // no parameters need to be evaluated, so make the function call now
                try {
                    // reset _propertyHost and _propertyName prior to method apply in case we are calling operator '.'
                    propertyHost = this._propertyHost = null;
                    propertyName = this._propertyName = null;

                    if (!compiledParams) // no compiled params means it's a variable lookup
                    {
                        // call.compiledMethod is a constant and call.evaluatedMethod is the method name
                        method = (method && method.constructor === String) ? method : null;
                        symbolName = method;
                        // find the variable
                        for (i = 0; i < allSymbolTables.length; i++) // max i after loop will be length
                        {
                            if (allSymbolTables[i] && allSymbolTables[i].hasOwnProperty(symbolName)) {
                                /*if (i === THIS_SYMBOL_TABLE_INDEX || allSymbolTables[i] is Proxy) {
                                    propertyHost = allSymbolTables[i];
                                    propertyName = symbolName;
                                }*/
                                result = allSymbolTables[i][symbolName];
                                break;
                            }
                        }

                        if (i === allSymbolTables.length)
                            result = Compiler.getDefinition.call(this, symbolName);
                    } else if (this.JUMP_LOOKUP.get(method)) {
                        if (method === this.operators[Compiler.ST_RETURN]) {
                            recursion--;
                            return compiledParams.length ? call.evaluatedParams[0] : undefined;
                        } else if (method === this.operators[Compiler.ST_CONTINUE]) {
                            while (true) {
                                stack.pop();
                                if (stack.length === 0) {
                                    recursion--;
                                    return result; // executing continue at top level of script
                                }

                                call = (stack[stack.length - 1] && stack[stack.length - 1] instanceof weavecore.CompiledFunctionCall) ? stack[stack.length - 1] : null;
                                method = call.evaluatedMethod;
                                if (this.LOOP_LOOKUP.get(method) && this.LOOP_LOOKUP.get(method) !== Compiler.ST_BREAK)
                                    break; // loop will be handled below.
                            }
                        } else if (method === this.operators[Compiler.ST_BREAK]) {
                            while (stack.length > 1) {
                                var popedCall = stack.pop();
                                call = (popedCall && popedCall instanceof weavecore.CompiledFunctionCall) ? popedCall : null;
                                method = call.evaluatedMethod;
                                if (this.LOOP_LOOKUP.get(method) && this.LOOP_LOOKUP.get(method) != Compiler.ST_CONTINUE) {
                                    method = this.operators[Compiler.ST_BREAK];
                                    continue stackLoop;
                                }
                            }
                            recursion--;
                            return result; // executing break at top level
                        } else if (method === this.operators[Compiler.ST_THROW]) {
                            //TODO - find try/catch/finally
                            throw call.evaluatedParams[0];
                        }
                    } else if (this.ASSIGN_OP_LOOKUP.get(method) && compiledParams.length === 2) // two params means local assignment
                    {
                        // local assignment
                        symbolName = call.evaluatedParams[0];
                        if (builtInSymbolTable.hasOwnProperty(symbolName))
                            throw new Error("Cannot assign built-in symbol: " + symbolName);

                        // find the most local symbol table that has the variable
                        for (i = LOCAL_SYMBOL_TABLE_INDEX; i <= THIS_SYMBOL_TABLE_INDEX; i++)
                            if (allSymbolTables[i] && allSymbolTables[i].hasOwnProperty(symbolName))
                                break;
                            // if no symbol table has the variable, create a new local variable
                        if (i > THIS_SYMBOL_TABLE_INDEX)
                            i = LOCAL_SYMBOL_TABLE_INDEX;

                        // assignment operator expects parameters like (host, ...chain, value)
                        result = method(allSymbolTables[i], symbolName, call.evaluatedParams[1]);
                    } else if (method === this.operators[Compiler.ST_IMPORT]) {
                        call.evaluatedParams.forEach(function (result) {
                            result = (result.constructor === String) ? result : null;
                            symbolName = result;
                            if (symbolName)
                                result = Compiler.getDefinition.call(this, result);
                            else if (!Compiler.isClass(result))
                                throw new Error("Unable to import non-Class: " + this.decompileObject(call));

                            if (!symbolName)
                                symbolName = result.constructor.appName;

                            symbolName = symbolName.substr(Math.max(symbolName.lastIndexOf('.'), symbolName.lastIndexOf(':')) + 1);
                            allSymbolTables[LOCAL_SYMBOL_TABLE_INDEX][symbolName] = result;
                        }.bind(this));
                    } else if (method && Compiler.isClass(method)) {
                        // type casting
                        if (method === Array) // special case for Array
                        {
                            result = call.evaluatedParams.concat();
                        } else if (call.evaluatedParams.length != 1) {
                            // special case for Object('prop1', value1, ...)
                            if (method === Object) {
                                var params = call.evaluatedParams;
                                result = {};
                                for (i = 0; i < params.length - 1; i += 2)
                                    result[params[i]] = params[i + 1];
                            } else
                                throw new Error("Incorrect number of arguments for type casting.  Expected 1.");
                        }
                        // special case for Class('some.qualified.ClassName')
                        else if (Compiler.isClass(method) && call.evaluatedParams[0].constructor === String) {
                            result = Compiler.getDefinition.call(this, call.evaluatedParams[0]);
                        } else // all other single-parameter type casting operations
                        {
                            result = cast(call.evaluatedParams[0], method);
                        }
                    } else if (method === this.operators[Compiler.ST_VAR]) // variable initialization
                    {
                        call.evaluatedParams[0].forEach(function (result) {
                            if (!localSymbolTable.hasOwnProperty(result))
                                localSymbolTable[result] = undefined;
                        })
                        result = undefined;
                    } else if (method === this.operators[Compiler.FUNCTION] || method === this.operators['=>']) // inline function definition
                    {
                        var _symbolTables = [localSymbolTable].concat(symbolTable); // works whether symbolTable is an Array or Object
                        if (useThisScope)
                            _symbolTables.push(builtInSymbolTable['this']);

                        var funcParams = call.evaluatedParams[0];
                        result = this.compileObjectToFunction.call(this,
                            funcParams[Compiler.FUNCTION_CODE],
                            _symbolTables,
                            errorHandler,
                            cascadeThisScope,
                            funcParams[Compiler.FUNCTION_PARAM_NAMES],
                            funcParams[Compiler.FUNCTION_PARAM_VALUES],
                            false,
                            method === this.operators['=>'] || (cascadeThisScope && bindThis !== null) ? builtInSymbolTable['this'] : null
                        );
                    }
                    /*else if (call.evaluatedHost is Proxy)
                    {
                    	// use Proxy.callProperty
                    	var proxyParams = call.evaluatedParams.concat();
                    	proxyParams.unshift(call.evaluatedMethodName);
                    	result = (call.evaluatedHost as Proxy).callProperty.apply(call.evaluatedHost, proxyParams);
                    }*/
                    else {
                        // normal function call
                        result = method.apply(call.evaluatedHost, call.evaluatedParams);
                        // in case this is operator '.', save these values
                        propertyHost = this._propertyHost;
                        propertyName = this._propertyName;
                        // then reset them so they do not get re-used by mistake
                        this._propertyHost = null;
                        this._propertyName = null;
                    }
                } catch (e) {
                    recursion--;

                    var decompiled = this.decompileObject(call);
                    var err = e;
                    if (err) {
                        //to-do
                        //fixErrorMessage(err);
                        err.message = decompiled + '\n' + err.message;
                        // console.log(err);
                    } else
                        console.log(decompiled);

                    if (errorHandler === null)
                        throw e;

                    if (errorHandler(e))
                        result = undefined; // ignore and continue
                    else
                        return undefined; // halt
                }

                // handle while and for loops
                if (this.LOOP_LOOKUP.get(method)) {
                    if (method === this.operators[Compiler.ST_FOR_IN] || method === this.operators[Compiler.ST_FOR_EACH]) {
                        // skip evaluation of list to avoid infinite loop
                        call.evalIndex = Compiler.INDEX_FOR_ITEM;
                        continue;
                    } else if (result) {
                        // skip evaluation of method to avoid infinite 'do' loop
                        call.evalIndex = Compiler.INDEX_METHOD + 1;
                        continue;
                    }
                }

                // remove this call from the stack
                stack.pop();
                // if there is no parent function call, return the result
                if (stack.length === 0) {
                    recursion--;
                    return result;
                }
                // otherwise, store the result in the evaluatedParams array of the parent call
                call = (stack[stack.length - 1] && stack[stack.length - 1] instanceof weavecore.CompiledFunctionCall) ? stack[stack.length - 1] : null;
                if (call.evalIndex === Compiler.INDEX_METHOD) {
                    call.evaluatedHost = propertyHost;
                    call.evaluatedMethodName = propertyName;
                    call.evaluatedMethod = result;
                } else
                    call.evaluatedParams[call.evalIndex] = result;
                // advance the evalIndex so the next parameter will be evaluated.
                call.evalIndex++;
            }
            throw new Error("unreachable");
        };

        // if the compiled object is a function definition, return that function definition instead of the wrapper.
        if (flattenFunctionDefinition && this.compiledObjectIsFunctionDefinition.call(this, compiledObject)) {
            cascadeThisScope = useThisScope;
            return wrapperFunction.call(this);
        }

        return wrapperFunction.bind(this);
    }

    /**
     * This will check if the compiled object is a function definition.
     * @param compiledObject A compiled object returned by compileToObject().
     * @return true if the compiledObject is a function definition.
     */
    p.compiledObjectIsFunctionDefinition = function (compiledObject) {
        var cfc = compiledObject;
        return cfc && (cfc.evaluatedMethod === this.operators[Compiler.FUNCTION] || cfc.evaluatedMethod === this.operators['=>']);
    }



    /**
     * @param compiledObject A CompiledFunctionCall or CompiledConstant to decompile into an expression String.
     * @return The expression String generated from the compiledObject.
     */
    p.decompileObject = function (compiledObject) {
        // special case for constants
        if (compiledObject instanceof weavecore.CompiledConstant)
            return (compiledObject).name;

        var i;
        var call = (compiledObject && compiledObject instanceof weavecore.CompiledFunctionCall) ? compiledObject : null;

        // if originalTokens is specified, decompile those instead.
        if (call.originalTokens) {
            var tokens = call.originalTokens.concat();
            for (i = 0; i < tokens.length; i++)
                if (tokens[i] instanceof weavecore.ICompiledObject)
                    tokens[i] = this.decompileObject(tokens[i]);
            return tokens.join(' ');
        }

        // special case for variable lookup
        if (isVariableLookup.call(this, call))
            return this.decompileObject(call.compiledMethod);

        var cMethod = (call.compiledMethod && call.compiledMethod instanceof weavecore.CompiledConstant) ? call.compiledMethod : null;
        var cParams = call.compiledParams;

        // decompile each param
        var params = [];
        for (i = 0; i < cParams.length; i++)
            params[i] = this.decompileObject(cParams[i]);

        var op;
        if (cMethod) {
            op = cMethod.name;
            if (op.substr(0, Compiler.OPERATOR_ESCAPE.length) === Compiler.OPERATOR_ESCAPE)
                op = op.substr(Compiler.OPERATOR_ESCAPE.length);
        }
        if (cMethod && this.constants[cMethod.name] === cMethod.value && this.operators[op] === cMethod.value) {
            var n = cParams.length;
            var isAssignFuncAvailable = this.ASSIGN_OP_LOOKUP.get(cMethod.value);
            if (n > 0 && (isAssignFuncAvailable || op === '.' || op === '..')) {
                var result = params[0];
                for (i = 1; i < n; i++) {
                    // assignment op h parameter -hand-side value
                    if (i === n - 1 && op !== '.' && op !== '..')
                        break;
                    // if the evaluated param compiles  variable, use the '.' syntax
                    var constant = (cParams[i] && cParams[i] instanceof weavecore.CompiledConstant) ? cParams[i] : null;
                    var variable = null;
                    try {
                        var comObj = compileToObject(constant.value);
                        variable = (comObj && comObj instanceof weavecore.CompiledFunctionCall) ? comObj : null;
                        if (!isVariableLookup(variable))
                            variable = null;
                    } catch (e) {}

                    if (op === '..')
                        result += '.descendants(' + params[i] + ')';
                    else if (variable)
                        result += '.' + variable.evaluatedMethod;
                    else
                        result += '[' + params[i] + ']';
                }
                if (op === '.' || op === '..')
                    return result;
                if (op === '#++' || op === '#--')
                    return result + op.substr(1);
                if (op === '++' || op === '--')
                    return op + result;
                if (op === 'delete')
                    return op + ' ' + result;

                return weavecore.StandardLib.substitute("({0} {1} {2})", result, op, params[n - 1]); // example: "(a.b = c)"
            }

            // variable number of params
            if (op === '[')
                return '[' + params.join(', ') + ']';

            if (op === ';')
                return '{' + params.join('; ') + '}';

            if (op === ',' && n > 0) // zero params not allowed for this syntax
                return '(' + params.join(', ') + ')';

            if (op === '(' && n > 0) // zero params not allowed for this syntax
                return '(' + params.join('; ') + ')';

            if (op === '{') {
                var str = '';
                for (i = 0; i < params.length - 1; i += 2) {
                    if (str)
                        str += ', ';
                    str += params[i] + ': ' + params[i + 1];
                }
                return '{' + str + '}';
            }

            if (this.PURE_OP_LOOKUP.get(cMethod.value) || op === 'in') {
                if (n === 1) // unary op
                {
                    var param = params[0];
                    var c = op.charAt(0);
                    if (this.operators.hasOwnProperty(c) && c !== param.charAt(0))
                        return op + param;
                    // need a space between operators with identical characters
                    return op + ' ' + param;
                }

                if (n === 2) // infix op
                    return weavecore.StandardLib.substitute("({0} {1} {2})", params[0], op, params[1]);

                if (n === 3 && op === '?:') // ternary op
                    return weavecore.StandardLib.substitute("({0} ? {1} : {2})", params);
            }

            if (op === Compiler.ST_VAR) {
                var comCon = (cParams[0] && cParams[0] instanceof weavecore.CompiledConstant) ? cParams[0] : null
                return Compiler.ST_VAR + ' ' + (comCon.value).join(', ');
            }

            if (op === Compiler.ST_IMPORT)
                return Compiler.ST_IMPORT + ' ' + params.join(', ');
        }

        // normal function syntax
        return this.decompileObject(call.compiledMethod) + '(' + params.join(', ') + ')';
    }

    /**
     * Tests if a token is a variable lookup.
     */
    function isVariableLookup(token) {
        var cfc = (token && token instanceof weavecore.CompiledFunctionCall) ? token : null;
        return cfc && !cfc.compiledParams;
    }

    function isFunctionHeader(token) {
        var cfc = (token && token instanceof weavecore.CompiledFunctionCall) ? token : null;
        return cfc && (cfc.evaluatedMethod === this.operators[Compiler.FUNCTION] || cfc.evaluatedMethod === this.operators['=>']) && cfc.evaluatedParams[0][Compiler.FUNCTION_CODE] === undefined;
    }

    /**
     * This function is for internal use only.
     * This function is necessary because variableName needs to be a new Flash variable each time a wrapper function is created.
     * @param variableName The name of the variable to get when the resulting wrapper function is evaluated.
     * @param A CompiledFunctionCall for getting the variable.
     * @return If the variable name is valid, returns an ICompiledObject.  If not valid, the same variableName String is returned.
     */
    function compileVariable(variableName) {
        // do not treat statement keywords  names
        if (Compiler.statements.hasOwnProperty(variableName) || this.operators.hasOwnProperty(variableName))
            return variableName;
        return new weavecore.CompiledFunctionCall(new weavecore.CompiledConstant(variableName, variableName), null); // params are null  special case
    }

    function compilePostfixOperators(compiledTokens, operatorSymbols) {
        for (var i = 1; i < compiledTokens.length; i++) {
            var op = compiledTokens[i];
            if (operatorSymbols.indexOf(op) < 0)
                continue;

            var call = (compiledTokens[i - 1] && compiledTokens[i - 1] instanceof weavecore.CompiledFunctionCall) ? compiledTokens[i - 1] : null;
            if (!call)
                continue;

            if (!call.compiledParams) // variable lookup
            {
                // 2 parameters for assignment/postfix operator means local variable assignment
                // last parameter is ignored but required for postfix operator
                compiledTokens.splice(--i, 2, compileOperator.call(this, '#' + op, [call.compiledMethod, newUndefinedConstant()]));
                continue;
            } else if (call.evaluatedMethod === this.operators['.']) {
                // switch to the postfix operator
                // last parameter is ignored but required for postfix operator
                call.compiledParams.push(newUndefinedConstant());
                compiledTokens.splice(--i, 2, compileOperator.call(this, '#' + op, call.compiledParams));
                continue;
            }
        }
    }

    /**
     * This function is for internal use only.
     * This will compile infix operators of the given type from left to right.
     * @param compiledTokens An Array of compiled tokens for an expression.  No '(' ')' or ',' tokens should appear in this Array.
     * @param operatorSymbols An Array containing all the infix operator symbols to compile.
     */
    function compileInfixOperators(compiledTokens, operatorSymbols) {
        var index = 0;
        while (index < compiledTokens.length) {
            // skip tokens that are not in the list of infix operators
            if (operatorSymbols.indexOf(compiledTokens[index]) < 0) {
                index++;
                continue;
            }

            // special case code for infix operators ('**') that are evaluated prior to unary operators
            var right = index + 1;
            // find the next ICompiledObject
            while (right < compiledTokens.length && compiledTokens[right].constructor === String)
                right++;
            // if there were String tokens, we need to compile unary operators on the right-hand-side
            if (right > index + 1) {
                // extract the right-hand-side, compile unary operators, and then insert the result to the right of the infix operator
                var rhs = compiledTokens.splice(index + 1, right - index);
                compileUnaryOperators.call(this, rhs, this.unaryOperatorSymbols);
                if (rhs.length !== 1)
                    throw new Error("Unable to parse second parameter of infix operator '" + compiledTokens[index] + "'");
                compiledTokens.splice(index + 1, 0, rhs[0]);
            }

            // stop if infix operator does not have compiled objects on either side
            if (index === 0 || index + 1 === compiledTokens.length || compiledTokens[index - 1].constructor === String || compiledTokens[index + 1].constructor === String)
                throw new Error("Misplaced infix operator '" + compiledTokens[index] + "'");

            // replace the tokens for this infix operator call with the compiled operator call
            if (this.debug)
                console.log("compile infix operator", compiledTokens.slice(index - 1, index + 2).join(' '));

            // special case for comma - simplify multiple comm one operator ',' call
            var call = (compiledTokens[index - 1] && compiledTokens[index - 1] instanceof weavecore.CompiledFunctionCall) ? compiledTokens[index - 1] : null;
            if (compiledTokens[index] === ',' && call && call.evaluatedMethod === this.operators[',']) {
                // append next parameter to existing ',' operator call
                call.compiledParams.push(compiledTokens[index + 1]);
                call.evaluateConstants(); // must be called after modifying compiledParams
                compiledTokens.splice(index, 2); // remove the comma and the next token
            } else {
                // replace three tokens "lhs op rhs" with one CompiledFunctionCall "\op(lhs,rhs)"
                compiledTokens.splice(index - 1, 3, compileOperator.call(this, compiledTokens[index], [compiledTokens[index - 1], compiledTokens[index + 1]]));
            }
        }
    }


    /**
     * This function will compile a list of expressions separated by ',' or ';' tokens.
     * @param tokens
     * @return
     */
    function compileArray(tokens, separator) {
        // avoid compiling an empty set of tokens
        if (tokens.length === 0)
            return [];

        var compiledObjects = [];
        while (true) {
            var index = tokens.indexOf(separator);
            if (index >= 0) {
                // compile the tokens before the comma  parameter
                if (index === 0 && separator === ',')
                    throw new Error("Expecting expression before comma");
                compiledObjects.push(compileTokens.call(this, tokens.splice(0, index), separator === ';'));
                tokens.shift(); // remove comma
            } else {
                if (tokens.length === 0 && separator === ',')
                    throw new Error("Expecting expression after comma");
                // compile remaining group of tokens  parameter
                compiledObjects.push(compileTokens.call(this, tokens, separator === ';'));
                break;
            }
        }
        return compiledObjects;
    }


    function compileFunctionDefinition(functionHeader, body) {
        if (!body)
            throwInvalidSyntax.call(this, (functionHeader.compiledMethod).name.substr(Compiler.OPERATOR_ESCAPE.length));
        var cc = functionHeader.compiledParams[0];
        if (cc.value[Compiler.FUNCTION_CODE] != null)
            throw new Error("Unexpected error: attempting to overwrite function body");
        cc.value[Compiler.FUNCTION_CODE] = finalize.call(this, body);
        functionHeader.evaluateConstants();
        functionHeader.originalTokens.push(body);
        return functionHeader;
    }

    function compileVariableAssignment(variableToken, assignmentOperator, valueToken) {
        var lhs = (variableToken && variableToken instanceof weavecore.CompiledFunctionCall) ? variableToken : null;
        var rhs = (valueToken && valueToken instanceof weavecore.ICompiledObject) ? valueToken : null;

        if (!rhs)
            throw new Error("Invalid right-hand-side of '" + assignmentOperator + "': " + (valueToken || this.decompileObject(valueToken)));

        // lhs should either be a variable lookup or a call to operator '.'
        if (lhs && !lhs.compiledParams) // lhs is a variable lookup
        {
            return compileOperator.call(this, assignmentOperator, [lhs.compiledMethod, rhs]);
        } else if (lhs && lhs.evaluatedMethod === this.operators['.']) {
            // switch to the assignment operator
            lhs.compiledParams.push(rhs);
            return compileOperator.call(this, assignmentOperator, lhs.compiledParams);
        } else
            throw new Error("Invalid left-hand-side of '" + assignmentOperator + "': " + (variableToken || this.decompileObject(variableToken)));
    }



    function assertValidStatementParams(tokens) {
        for (var index = 0; index < tokens.length; index++) {
            var statement = (tokens[index].constructor === String) ? tokens[index] : null;
            if (Compiler.statements[statement]) // requires parameters?
            {
                // statement parameters must be wrapped in operator ';' call
                var params = tokens[index + 1];
                if (!params || params.evaluatedMethod != this.operators['('])
                    throwInvalidSyntax(statement);

                var cpl = params.compiledParams.length;

                // 'for' can have 3 statement params
                if (statement === Compiler.ST_FOR && cpl === 3)
                    continue;

                // all other statements must have only one param
                if (cpl !== 1)
                    throwInvalidSyntax.call(this, statement);

                if (statement === Compiler.ST_FOR || statement === Compiler.ST_FOR_EACH) {
                    // if 'for' or 'for each' has only one param, it must be the 'in' operator
                    var call = (params.compiledParams[0] && params.compiledParams[0] instanceof weavecore.CompiledFunctionCall) ? params.compiledParams[0] : null; // the first statement param
                    if (!call || call.evaluatedMethod !== this.operators['in'] || call.compiledParams.length !== 2)
                        throwInvalidSyntax(statement);

                    // check the first parameter of the 'in' operator
                    call = (call.compiledParams[0] && call.compiledParams[0] instanceof weavecore.CompiledFunctionCall) ? call.compiledParams[0] : null;

                    if (call && call.evaluatedMethod === this.operators[','] && call.compiledParams.length === 2) {
                        var _var = call.compiledParams[0];
                        if (!_var || _var.evaluatedMethod !== this.operators[Compiler.ST_VAR])
                            throwInvalidSyntax(statement);
                        call = (call.compiledParams[1] && call.compiledParams[1] instanceof weavecore.CompiledFunctionCall) ? call.compiledParams[1] : null; // should be the variable
                    }

                    // the 'in' operator must have a variable or property reference  first parameter
                    if (!call || !(call.compiledParams === null || call.evaluatedMethod === this.operators['.'])) // not a variable and not a property
                        throwInvalidSyntax(statement);
                }

            }
        }
    }

    function throwInvalidSyntax(statement) {
        throw new Error("Invalid '" + statement + "' syntax");
    }

    function tokenIsStatement(token) {
        var call = (token && token instanceof weavecore.CompiledFunctionCall) ? token : null;
        if (!call)
            return Compiler.statements.hasOwnProperty(token);

        var method = call.evaluatedMethod;
        return (this.JUMP_LOOKUP.get(method) || this.LOOP_LOOKUP.get(method))
    }

    /**
     * This function assumes that every token except statements have already been compiled.
     * @param tokens
     * @param startIndex The index of the first token to compile
     */
    function compileStatement(tokens, startIndex) {
        var stmt = (tokens[startIndex].constructor === String) ? tokens[startIndex] : null;
        var call;

        // stop if tokens does not start with a statement
        if (!Compiler.statements.hasOwnProperty(stmt)) {
            // complain about missing ';' after non-statement except for last token
            if (startIndex < tokens.length - 1) {
                call = (tokens[startIndex] && tokens[startIndex] instanceof weavecore.CompiledFunctionCall) ? tokens[startIndex] : null;
                if (!call || (call.evaluatedMethod != this.operators[';'] && !tokenIsStatement.call(this, call))) {
                    if (stmt)
                        throw new Error("Unexpected " + stmt);
                    var next = tokens[startIndex + 1];
                    if (next instanceof weavecore.ICompiledObject)
                        next = this.decompileObject(next);
                    throw new Error("Missing ';' before " + next);
                }
            }
            return;
        }

        var varNames;

        // find a matching statement pattern
        nextPattern: for (var index = 0; index < _validStatementPatterns.length; index++) {
            var pattern = _validStatementPatterns[index]
            for (var iPattern = 0; iPattern < pattern.length; iPattern++) {
                if (startIndex + iPattern >= tokens.length)
                    continue nextPattern;

                var type = pattern[iPattern];
                var token = tokens[startIndex + iPattern];
                call = (token && token instanceof weavecore.CompiledFunctionCall) ? token : null;

                if (Compiler.statements.hasOwnProperty(type) && token != type)
                    continue nextPattern;

                if (type === Compiler.PN_PARAMS)
                    continue; // params have already been verified

                // if we get past a statement and its params, if compiling something fails we don't need to check any more patterns

                if (type === Compiler.PN_EXPR) // non-statement
                {
                    if (tokenIsStatement.call(this, token))
                        throw new Error('Unexpected ' + token);
                    if (call && call.evaluatedMethod === this.operators[';'] && call.compiledParams.length > 1)
                        throwInvalidSyntax(stmt);
                }

                if (type === Compiler.PN_STMT) {
                    compileStatement.call(this, tokens, startIndex + iPattern);
                }

                if (type === Compiler.PN_BLOCK) {
                    if (!call || call.evaluatedMethod != this.operators[';'])
                        throwInvalidSyntax(stmt);
                }

                if (type === Compiler.PN_VARS) {
                    // must be function call
                    if (tokenIsStatement.call(this, token) || !call)
                        throwInvalidSyntax(stmt);

                    // must be local variable/assignment or list of local variables/assignments

                    // special case for "y, x = 3;" which at this point is stored as {y, x = 3}
                    if (call.evaluatedMethod === this.operators[';']) {
                        if (!(call.evaluatedParams.length === 1 && call.compiledParams[0] instanceof weavecore.CompiledFunctionCall))
                            throwInvalidSyntax(stmt);
                        // remove the operator ';' wrapper
                        tokens[startIndex + iPattern] = token = call = call.compiledParams[0];
                    }

                    // if there is only a single variable, wrap it in an operator ',' call
                    if (isVariableLookup(call) || call.evaluatedMethod === this.operators['='])
                        tokens[startIndex + iPattern] = token = call = compileOperator.call(this, ',', [call]);

                    // special case for "for (var x in y) { }"
                    if (call.evaluatedMethod === this.operators['in'] && call.compiledParams.length === 2) {
                        // check the variable
                        call = (call.compiledParams[0] && call.compiledParams[0] instanceof weavecore.CompiledFunctionCall) ? call.compiledParams[0] : null;
                        if (!isVariableLookup(call))
                            throwInvalidSyntax(stmt);
                        // save single variable name
                        varNames = [call.evaluatedMethod];
                        continue;
                    }

                    if (call.evaluatedMethod != this.operators[','] || call.compiledParams.length === 0)
                        throwInvalidSyntax(stmt);

                    varNames = [];
                    for (var iParam = 0; iParam < call.compiledParams.length; iParam++) {
                        var variable = (call.compiledParams[iParam] && call.compiledParams[iParam] instanceof weavecore.CompiledFunctionCall) ? call.compiledParams[iParam] : null;
                        if (!variable)
                            throwInvalidSyntax.call(this, stmt);

                        if (isVariableLookup(variable)) // local initialization
                        {
                            // variable initialization only -- remove from ',' params
                            call.compiledParams.splice(iParam--, 1);
                            varNames.push(variable.evaluatedMethod);
                        } else if (variable.evaluatedMethod === this.operators['='] && variable.compiledParams.length === 2) // local assignment
                        {
                            varNames.push(variable.evaluatedParams[0]);
                        } else
                            throwInvalidSyntax.call(this, stmt);
                    }
                    call.evaluateConstants();
                }
            }

            // found matching pattern
            var originalTokens = tokens.slice(startIndex, startIndex + pattern.length);
            var params = tokens.splice(startIndex + 1, pattern.length - 1);

            if (stmt === ST_VAR) {
                token = compileOperator.call(this, Compiler.ST_VAR, [new weavecore.CompiledConstant(null, varNames)]);
                call = params[0];
                if (call.evaluatedMethod === this.operators['in']) {
                    call.compiledParams[0] = compileOperator.call(this, ',', [token, call.compiledParams[0]]);
                    call.evaluateConstants();
                    token = call;
                } else if (call.compiledParams.length > 0) {
                    call.compiledParams.unshift(token);
                    call.evaluateConstants();
                    token = call;
                }
                originalTokens = null; // avoid infinite decompile recursion
                tokens[startIndex] = token;
            } else if (stmt === ST_IMPORT) {
                originalTokens = null;
                call = (params[0] && params[0] instanceof weavecore.CompiledFunctionCall) ? params[0] : null;
                // support multiple imports separated by commas
                if (call && call.evaluatedMethod === this.operators[';'] && call.compiledParams.length === 1)
                    params[0] = call.compiledParams[0];
                if (call && call.evaluatedMethod === this.operators[','])
                    params = call.compiledParams;

                for (var i = 0; i < params.length; i++) {
                    var _lib = (params[i] && params[i] instanceof weavecore.CompiledConstant) ? params[i] : null;
                    if (_lib && _lib.value.constructor === String) {
                        try {
                            var def = Compiler.getDefinition(_lib.value);
                            if (Compiler.isClass(def))
                                _lib.value = def;
                        } catch (e) {
                            /*e.message = 'import ' + decompileObject(_lib) + '\n' + e.message;
                            throw e;*/
                            // ignore compile-time error, hoping it will work at run-time
                        }
                    }
                }
                tokens[startIndex] = compileOperator.call(this, Compiler.ST_IMPORT, params);
            } else if (stmt === Compiler.ST_IF) // if (cond) {stmt} else {stmt}
            {
                // implemented as "cond ? true_stmt : false_stmt"
                params.splice(2, 1); // works whether or not else is present
                tokens[startIndex] = compileOperator.call(this, Compiler.ST_IF, params);
            } else if (stmt === Compiler.ST_DO) // do {stmt} while (cond);
            {
                // implemented as "while (cond && (stmt, true))" with first evaluation of 'cond' skipped
                params = [params[2], compileOperator.call(this, ',', [params[0], newTrueConstant.call(this)])];
                tokens[startIndex] = compileOperator.call(this, Compiler.ST_DO, params);
            } else if (stmt === Compiler.ST_WHILE) // while (cond) {stmt}
            {
                // implemented as "while (cond && (stmt, true));"
                params[1] = compileOperator.call(this, ',', [params[1], newTrueConstant.call(this)]);
                tokens[startIndex] = compileOperator.call(this, Compiler.ST_WHILE, params);
            } else if (stmt === Compiler.ST_FOR || stmt === Compiler.ST_FOR_EACH) // for (params) {stmt}
            {
                var forParams = params[0]; // statement params wrapper
                if (forParams.compiledParams.length === 3) // for (init; cond; inc) {stmt}
                {
                    // implemented as "(init, cond) && while((inc, cond) && (stmt, true))" with first evaluation of "(inc, cond)" skipped

                    var _init = forParams.compiledParams[0];
                    var _cond = forParams.compiledParams[1];
                    var _inc = forParams.compiledParams[2];

                    var _init_cond = compileOperator.call(this, ',', [_init, _cond]);
                    var _inc_cond = compileOperator.call(this, ',', [_inc, _cond]);
                    var _stmt_true = compileOperator.call(this, ',', [params[1], newTrueConstant.call(this)]);
                    var _forDo = compileOperator.call(this, Compiler.ST_FOR_DO, [Compiler._inc_cond, _stmt_true]);

                    tokens[startIndex] = compileOperator.call(this, Compiler.ST_FOR, [_init_cond, _forDo]);
                } else // for [each] (item in list) {stmt}
                {
                    // differentiate from 'for' with 3 statement params
                    if (stmt === Compiler.ST_FOR)
                        stmt = Compiler.ST_FOR_IN;

                    // implemented as "for (each|in)(\in(list), item=undefined, stmt)
                    var _in = forParams.compiledParams[0];
                    var _item;
                    var _var = (_in.compiledParams[0] && _in.compiledParams[0] instanceof weavecore.CompiledFunctionCall) ? _in.compiledParams[0] : null;
                    if (_var.evaluatedMethod === this.operators[','] && _var.compiledParams.length === 2) // represented as (var x, x)
                    {
                        _var.compiledParams[1] = compileVariableAssignment.call(this, _var.compiledParams[1], '=', newUndefinedConstant());
                    } else {
                        _var = compileVariableAssignment.call(this, _in.compiledParams[0], '=', newUndefinedConstant());
                    }
                    var _list = compileOperator.call(this, 'in', [_in.compiledParams[1]]);
                    tokens[startIndex] = compileOperator.call(this, stmt, [_list, _var, params[1]]);
                }
            } else if (Compiler._jumpStatements.indexOf(stmt) >= 0) {
                tokens[startIndex] = compileOperator.call(this, stmt, params);
            } else {
                throw new Error(stmt + " not supported");
            }

            // save original token list for correct decompiling
            (tokens[startIndex]).originalTokens = originalTokens;

            return;
        }

        // no matching pattern found
        throwInvalidSyntax(stmt);
    }


    function compileFunctionHeader(functionOperator, paramsToken) {
        if (functionOperator !== Compiler.FUNCTION && functionOperator !== '=>')
            throw new Error("compileFunctionHeader called with unsupported operator: " + functionOperator);

        // when compiling a function operator, only the argument list should be provided
        var args = (paramsToken && paramsToken instanceof weavecore.CompiledFunctionCall) ? paramsToken : null;
        if (!args)
            throwInvalidSyntax.call(this, functionOperator);

        // if there is only a single variable name, wrap it in an operator ',' call
        if (!args.compiledParams)
            args = compileOperator(',', [args]);

        if (args.evaluatedMethod !== operators[','])
            throwInvalidSyntax.call(this, functionOperator);

        // verify that each parameter inside operator ',' is a variable name or a local assignment to a constant.
        var variableNames = [];
        var variableValues = [];
        args.compiledParams.forEach(function (token) {
            var variable = (token && token instanceof weavecore.CompiledFunctionCall) ? token : null;
            if (!variable)
                throwInvalidSyntax.call(this, functionOperator);

            if (!variable.compiledParams) {
                // local variable
                variableNames.push(variable.evaluatedMethod);
                variableValues.push(undefined);
            } else if (variable.evaluatedMethod === operators['='] && variable.compiledParams.length === 2 && variable.compiledParams[1] instanceof weavecore.CompiledConstant) {
                // local variable assignment
                variableNames.push(variable.evaluatedParams[0]);
                variableValues.push(variable.evaluatedParams[1]);
            } else
                throwInvalidSyntax.call(this, functionOperator);
        })
        var functionParams = {};
        functionParams[Compiler.FUNCTION_PARAM_NAMES] = variableNames;
        functionParams[Compiler.FUNCTION_PARAM_VALUES] = variableValues;

        var op = compileOperator.call(this, functionOperator, [new weavecore.CompiledConstant(null, functionParams)]);
        op.originalTokens = functionOperator === Compiler.FUNCTION ? [Compiler.FUNCTION, paramsToken] : [paramsToken, '=>'];
        return op;
    }


    /**
     * This function will initialize the operators and constants.
     */
    function initialize() {


        if (!Compiler.statements) {
            Compiler.statements = {};
            var stmt;
            Compiler._statementsWithParams.forEach(function (stmt) {
                Compiler.statements[stmt] = true;
            })
            Compiler._statementsWithoutParams.forEach(function (stmt) {
                Compiler.statements[stmt] = false;
            })
        }
        this.constants = {};
        this.globals = {};
        this.operators = {};
        this.pureOperators = {};
        this.assignmentOperators = {};

        // constant, built-in symbols
        [null, true, false, undefined, NaN, Infinity].forEach(function (_const) {
            this.constants[String(_const)] = _const;
        }.bind(this));


        // global classes
        [Array, Boolean, Date, Error, Function, Number, Object, String].forEach(function (_class) {
            this.globals[_class.name] = _class;
        }.bind(this));

        'decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,escape,isFinite,isNaN,isPrototypeOf,parseFloat,parseInt,trace,unescape'.split(',').forEach(function (_funcName) {
            this.globals[_funcName] = _funcName.name;
        }.bind(this));




        /** this.operators **/
        // first, make sure all special characters are defined as operators whether or not they have functions associated with them
        var specialChars = "`~!#%^&*()-+=[{]}\\|;:'\",<.>/?";
        for (var i = 0; i < specialChars.length; i++)
            this.operators[specialChars.charAt(i)] = true;

        // now define the functions

        // impure operators
        this.operators["["] = function () {
            return Array.prototype.slice.call(arguments);
        }; // array creation
        this.operators["{"] = function () // object creation
            {
                var args = Array.prototype.slice.call(arguments)
                var o = {};
                var end = args.length - 1;
                for (var i = 0; i < end; i += 2)
                    o[args[i]] = args[i + 1];
                return o;
            }
        this.operators[Compiler.OPERATOR_NEW] = function (classOrQName) {
            var params = Array.prototype.slice.call(arguments);
            classOrQName = params.shift();
            var classDef = classOrQName;
            if (!classDef && classOrQName)
                classDef = Compiler.getDefinition(String(classOrQName));
            switch (params.length) {
            case 0:
                return new classDef();
            case 1:
                return new classDef(params[0]);
            case 2:
                return new classDef(params[0], params[1]);
            case 3:
                return new classDef(params[0], params[1], params[2]);
            case 4:
                return new classDef(params[0], params[1], params[2], params[3]);
            case 5:
                return new classDef(params[0], params[1], params[2], params[3], params[4]);
            case 6:
                return new classDef(params[0], params[1], params[2], params[3], params[4], params[5]);
            case 7:
                return new classDef(params[0], params[1], params[2], params[3], params[4], params[5], params[6]);
            case 8:
                return new classDef(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7]);
            case 9:
                return new classDef(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7], params[8]);
            case 10:
                return new classDef(params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7], params[8], params[9]);
            default:
                throw new Error("Too many constructor parameters (maximum 10)");
            }
        };
        this.operators[Compiler.FUNCTION] = function () {};
        this.operators['=>'] = function () {};
        this.operators[':'] = function (key, value) {
            this[key] = value;
        };
        // property access should not be optimized to constants
        this.operators["."] = function (object) {
            var chain = Array.prototype.slice.call(arguments);
            object = chain.shift();
            var iHost = chain.length - 2;
            this._propertyHost = object;
            this._propertyName = chain[iHost + 1];
            for (var i = 0; i < chain.length; i++) {
                if (i === iHost)
                    this._propertyHost = object;
                object = object[chain[i]];
            }
            return object;
        };
        this.operators[".."] = function (object, propertyName) {
            /*if (object is XML_Class)
            	return (object as XML_Class).descendants(propertyName);
            if (object is Proxy)
            	return (object as Proxy).getDescendants(propertyName);
            return object.flash_proxy::getDescendants(propertyName);*/
        };
        this.operators['in'] = function () {
            // dual purpose for infix operator and for..in loop initialization
            var args = Array.prototype.slice.call(arguments);
            if (args.length === 2)
                return args[0] in args[1];

            var a = [];
            for (var k in args[0])
                a.push(k);
            return a;
        };
        this.operators[Compiler.ST_VAR] = function () {};
        this.operators[Compiler.ST_IMPORT] = function () {};
        // loop statements
        this.operators[Compiler.ST_DO] = function (x, y) {
            return x && y;
        };
        this.operators[Compiler.ST_WHILE] = function (x, y) {
            return x && y;
        };
        this.operators[Compiler.ST_FOR] = function (x, y) {
            return x && y;
        };
        this.operators[Compiler.ST_FOR_DO] = function (x, y) {
            return x && y;
        };
        this.operators[Compiler.ST_FOR_IN] = function () {};
        this.operators[Compiler.ST_FOR_EACH] = function () {};
        // jump statements
        this.operators[Compiler.ST_BREAK] = function () {};
        this.operators[Compiler.ST_CONTINUE] = function () {};
        this.operators[Compiler.ST_RETURN] = function () {};
        this.operators[Compiler.ST_THROW] = function (e) {
            throw e;
        };

        // 'if' statement can be considered a pure operator
        this.pureOperators[Compiler.ST_IF] = function (c, t, f) {
            return c ? t : f;
        };
        // math
        this.pureOperators["**"] = Math.pow;
        this.pureOperators["*"] = function (x, y) {
            return x * y;
        };
        this.pureOperators["/"] = function (x, y) {
            return x / y;
        };
        this.pureOperators["%"] = function (x, y) {
            return x % y;
        };
        this.pureOperators["+"] = function () {
            // this works as a unary or infix operator
            var args = Array.prototype.slice.call(arguments);
            switch (args.length) {
            case 1:
                return +args[0];
            case 2:
                return args[0] + args[1];
            }
        };
        this.pureOperators["-"] = function () {
            var args = Array.prototype.slice.call(arguments);
            // this works as a unary or infix operator
            switch (args.length) {
            case 1:
                return -args[0];
            case 2:
                return args[0] - args[1];
            }
        };
        // bitwise
        this.pureOperators["~"] = function (x) {
            return ~x;
        };
        this.pureOperators["&"] = function (x, y) {
            return x & y;
        };
        this.pureOperators["|"] = function (x, y) {
            return x | y;
        };
        this.pureOperators["^"] = function (x, y) {
            return x ^ y;
        };
        this.pureOperators["<<"] = function (x, y) {
            return x << y;
        };
        this.pureOperators[">>"] = function (x, y) {
            return x >> y;
        };
        this.pureOperators[">>>"] = function (x, y) {
            return x >>> y;
        };
        // comparison
        this.pureOperators["<"] = function (x, y) {
            return x < y;
        };
        this.pureOperators["<="] = function (x, y) {
            return x <= y;
        };
        this.pureOperators[">"] = function (x, y) {
            return x > y;
        };
        this.pureOperators[">="] = function (x, y) {
            return x >= y;
        };
        this.pureOperators["=="] = function (x, y) {
            return x === y;
        };
        this.pureOperators["==="] = function (x, y) {
            return x === y;
        };
        this.pureOperators["!="] = function (x, y) {
            return x != y;
        };
        this.pureOperators["!=="] = function (x, y) {
            return x !== y;
        };
        // logic
        this.pureOperators["!"] = function (x) {
            return !x;
        };
        this.pureOperators["&&"] = function (x, y) {
            return x && y;
        };
        this.pureOperators["||"] = function (x, y) {
            return x || y;
        };
        // branching
        this.pureOperators["?:"] = function (c, t, f) {
            return c ? t : f;
        };
        // multiple commands - equivalent functionality but must be remembered as different operators
        this.pureOperators[','] = function () {
            var args = Array.prototype.slice.call(arguments);
            return args[args.length - 1];
        };
        this.pureOperators[';'] = function () {
            var args = Array.prototype.slice.call(arguments);
            return args[args.length - 1];
        };
        this.pureOperators['('] = function () {
            var args = Array.prototype.slice.call(arguments);
            return args[args.length - 1];
        };
        // operators with alphabetic names
        this.pureOperators['void'] = function () {};
        this.pureOperators['typeof'] = function (value) {
            return typeof (value);
        };
        //this.pureOperators['as'] = function(a, b) { return a as b; };
        //this.pureOperators['is'] =
        this.pureOperators['instanceof'] = function (a, classOrQName) {
            var classDef = classOrQName;
            if (!classDef && classOrQName)
                classDef = Compiler.getDefinition(String(classOrQName));
            return a instanceof classDef;
        };
        // assignment operators -- first arg is host object, last arg is new value, remaining args are a chain of property names
        this.assignmentOperators['='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] = a[i + 1];
        };
        this.assignmentOperators['+='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] += a[i + 1];
        };
        this.assignmentOperators['-='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] -= a[i + 1];
        };
        this.assignmentOperators['*='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] *= a[i + 1];
        };
        this.assignmentOperators['/='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] /= a[i + 1];
        };
        this.assignmentOperators['%='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] %= a[i + 1];
        };
        this.assignmentOperators['<<='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] <<= a[i + 1];
        };
        this.assignmentOperators['>>='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] >>= a[i + 1];
        };
        this.assignmentOperators['>>>='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] >>>= a[i + 1];
        };
        this.assignmentOperators['&&='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            o[a[i]] = o[a[i]] && a[i + 1];
            return o[a[i]];
        };
        this.assignmentOperators['||='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            o[a[i]] = o[a[i]] || a[i + 1];
            return o[a[i]];
        };
        this.assignmentOperators['&='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] &= a[i + 1];
        };
        this.assignmentOperators['|='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] |= a[i + 1];
        };
        this.assignmentOperators['^='] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]] ^= a[i + 1];
        };
        // special cases: delete, -- and ++ unary operators ignore last parameter
        this.assignmentOperators['--'] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return --o[a[i]];
        };
        this.assignmentOperators['++'] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return ++o[a[i]];
        };
        this.assignmentOperators['#--'] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]]--;
        };
        this.assignmentOperators['#++'] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return o[a[i]]++;
        };
        this.assignmentOperators['delete'] = function (o) {
            var a = Array.prototype.slice.call(arguments);
            o = a.shift();
            for (var i = 0; i < a.length - 2; i++) o = o[a[i]];
            return delete o[a[i]];
        };

        // evaluate operators in the same order as ActionScript
        this.orderedOperators = [
				['*', '/', '%'],
				['+', '-'],
				['<<', '>>', '>>>'],
				['<', '<=', '>', '>=', 'in', 'instanceof'],
				['==', '!=', '===', '!=='],
				['&'],
				['^'],
				['|'],
				['&&'],
				['||']
			];
        // unary operators
        this.unaryOperatorSymbols = ['++', '--', '+', '-', '~', '!', 'delete', 'typeof']; // '#' not listed because it has special evaluation order

        var op;


        // copy over pure and assignment operators
        for (var op in this.pureOperators) {
            this.operators[op] = this.pureOperators[op];
        }
        for (var op in this.assignmentOperators) {
            this.operators[op] = this.assignmentOperators[op];
        }

        for (var op in this.operators) {
            if (this.operators[op].constructor === Function)
                this.constants[Compiler.OPERATOR_ESCAPE + op] = this.operators[op];
        }


        // fill reverse-lookup dictionaries
        this.BRANCH_LOOKUP.set(this.operators[Compiler.ST_IF], true);
        this.BRANCH_LOOKUP.set(this.operators[Compiler.ST_DO], true);
        this.BRANCH_LOOKUP.set(this.operators[Compiler.ST_WHILE], true);
        this.BRANCH_LOOKUP.set(this.operators[Compiler.ST_FOR], true);
        this.BRANCH_LOOKUP.set(this.operators[Compiler.ST_FOR_DO], true);
        this.BRANCH_LOOKUP.set(this.operators['?:'], true);
        this.BRANCH_LOOKUP.set(this.operators['&&'], true);
        this.BRANCH_LOOKUP.set(this.operators['||'], false);

        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_DO], true);
        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_WHILE], true);
        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_FOR], Compiler.ST_BREAK); // break target only
        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_FOR_DO], Compiler.ST_CONTINUE); // continue target only
        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_FOR_IN], true);
        this.LOOP_LOOKUP.set(this.operators[Compiler.ST_FOR_EACH], true);

        this.JUMP_LOOKUP.set(this.operators[Compiler.ST_BREAK], true);
        this.JUMP_LOOKUP.set(this.operators[Compiler.ST_CONTINUE], true);
        this.JUMP_LOOKUP.set(this.operators[Compiler.ST_RETURN], true);
        this.JUMP_LOOKUP.set(this.operators[Compiler.ST_THROW], true);


        var key;
        for (key in this.pureOperators) {
            var func = this.pureOperators[key];
            this.PURE_OP_LOOKUP.set(func, true);
        }

        for (key in this.assignmentOperators) {
            var func = this.assignmentOperators[key];
            this.ASSIGN_OP_LOOKUP.set(func, true);
        }

    }


    //-----------------------------------------------------------------
    // Class('weave.compiler.Compiler').test()
    Compiler.test = function (eqIndex) {
        eqIndex = eqIndex === undefined ? 0 : eqIndex;
        var compiler = new weavecore.Compiler();
        var testEqs = [
				"(a = 1, 0) ? (a = 2, a + 1) : (4, a + 100), a",
				"1 + '\"abc ' + \"'x\\\"y\\\\\\'z\"",
				'0 ? trace("?: BUG") : -v',
				'1 ? ~-~-v : trace("?: BUG")',
				'!true && trace("&& BUG")',
				'true || trace("|| BUG")',
				//'round(.5 - random() < 0 ? "1.6" : "1.4")',
				'(- x * 3) / get("v") + -2 + pow(5,3) +\\**(6,3)',
				'\\+ ( - ( - 2 + 1 ) ** - 4 , - 3 ) - ( - 4 + - 1 * - 7 )',
				'-v- - -3+v2',
				'(x + v) / \\+ ( - ( 2 + 1 ) ** 4 , 3 ) - ( 4 + 1 )',
				'3',
				'-3',
				'v',
				'-v',
				//'roundSignificant(random(),3)',
				'rpad("hello", 4+(v+2)*2, "._,")',
				'lpad("hello", 4+(v+2)*2, "._,")',
				'"hello world".substr(v*2, 5)',
				'asString(random()).length',
				'"(0x" + numberToBase(0xFF00FF,16).toUpperCase() + ") " + lpad(numberToBase(v*20, 2, 4), 9) + ", base10: " + rpad(numberToBase(sign(v) * (v+10),10,3), 6) + ", base16: " + numberToBase(v+10,16)', 'if (false) { trace(3) } else trace(4)',
				'do {} while (random());',
				'if (random()) while (random()); if (random()) 1',
				"x = 10; while (x--) trace('x =',x);",
				"for (y = 0; y < 10; y++) trace('y =',y);",
				"x = 0; do { trace('do',x++); } while (trace('cond'), x < 10);",
				//_do_continue_test,
				"for (trace('y =',0), y = 0; trace(y,'<',10), y < 10; trace('y++'), y++) { trace('loop y =',y); }",
				"for (i = 0; i < 10; i++) if (i === 5) return ; else trace(i);",
				"if (true) return ; else trace('test'); trace('BUG');",
				"for (i = 0; i < 10; i++) { if (i === 3) continue; trace(i); if (i === 5) break; } trace('done');",
				"i = 0; do { if (i === 3) continue; trace(i); if (i === 5) break; } while (i >= 0 && ++i < 10) trace('done');",
				"i = -1; while (++i < 10) { if (i === 3) continue; trace(i); if (i === 5) break; } trace('done');",
				"a = []; o = Object('a',1,'b',2,'c',3,'d',4,'e',5); for (k in o) { a.push(`{k} = {o[k]}`); o['?'+k]=k+'!'; delete o[k]; } for each (p in o) a.push(p); return [a,o];",
				"y = 4; x = 3; var x = 4, y; [x, y]",
				"`abc { function(x,y) { return x+y; } } xyz`",
				"var obj = Object('f', function() { return this === obj; }); var ff = obj.f; [obj.f(), (obj.f)(), ff()]",
				"x = 'x'; function(){ x = 3; return x; }() === x"
			];
        var eqs = [testEqs[eqIndex]];
        var values = [-2, -1, -0.5, 0, 0.5, 1, 2];
        var vars = {};
        vars['v'] = 123;
        vars['v2'] = 222;
        vars['x'] = 10;
        vars['get'] = function (name) {
            //console.log("get variable", name, "=", vars[name]);
            return vars[name];
        };

        compiler.debug = true;
        eqs.forEach(function (eq) {
            console.log("expression: " + eq);

            var tokens = getTokens.call(compiler, eq);
            console.log("    tokens:", tokens.join(' '));
            var decompiled = compiler.decompileObject(compileTokens.call(compiler, tokens, true));
            console.log("decompiled:", decompiled);

            var tokens2 = getTokens.call(compiler, decompiled);
            console.log("   tokens2:", tokens2.join(' '));
            var recompiled = compiler.decompileObject(compileTokens.call(compiler, tokens2, true));
            console.log("recompiled:", recompiled);

            var tokens3 = getTokens.call(compiler, recompiled);
            var decompiled2 = compiler.decompileObject(compileTokens.call(compiler, tokens3, true));
            console.log("decompiled(2):", decompiled2);

            var f = compiler.compileToFunction(eq, vars);
            values.forEach(function (value) {
                vars['v'] = value;
                console.log("f(v=" + value + ")\t= " + f.call(compiler, value));
            });
        });
    }




    weavecore.Compiler = Compiler;
}(this));

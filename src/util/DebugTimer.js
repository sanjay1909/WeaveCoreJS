import StandardLib from "./StandardLib";
import JS from "./JS";
import Language from "./Language";

export default class DebugTimer
{
	constructor()
	{
	}

	REFLECTION_INFO () {
		return {
			variables: function () {
				return {
				};
			},
			accessors: function () {
				return {
				};
			},
			methods: function () {
				return {
				};
			}
		};
	};
}
DebugTimer.prototype.CLASS_INFO = { names: [{ name: 'DebugTimer', qName: 'DebugTimer'}] };


DebugTimer.debugTimes = [];
DebugTimer.begin = function()
{
	DebugTimer.debugTimes.push(JS.now());
};

DebugTimer.cancel = function()
{
	DebugTimer.debugTimes.pop();
};


/**
 * This will report the time since the last call to begin() or lap().
 */
DebugTimer.lap = function(debugString, debugStrings)
{
	debugStrings = Array.prototype.slice.call(arguments, 1);
	debugStrings.unshift(debugString);
	var elapsedTime = DebugTimer.end.apply(null, debugStrings);
	DebugTimer.begin();
	return elapsedTime;
};


/**
 * This will reset the timer so that higher-level functions can resume their use of DebugTimer.
 * Pairs of calls to begin() and end() may be nested.
 */
DebugTimer.end = function(debugString, debugStrings)
{
	debugStrings = Array.prototype.slice.call(arguments, 1);
	debugStrings.unshift(debugString);
	var  elapsedTime = JS.now() - DebugTimer.debugTimes.pop();
	var  elapsed = '[' + elapsedTime + ' ms elapsed] ';
	var  elapsedIndent = StandardLib.lpad('| ', elapsed.length);
	var  indent = StandardLib.rpad('', DebugTimer.debugTimes.length * 2, '| ');
	var  lines = debugStrings.join(' ').split('\n');
	for (var /** @type {number} */ i = 0; i < lines.length; i++) {
		if (lines.length == 1)
			lines[i] = (indent + ',-' + elapsed + lines[i]);
		else if (i == 0)
			lines[i] = (indent + ',-' + elapsed + lines[i]);
		else if (i > 0 && i < lines.length - 1)
			lines[i] = (indent + '| ' + elapsedIndent + lines[i]);
		else
			lines[i] = (indent + '|-' + elapsed + lines[i]);
	}

	Language.trace(lines.join('\n'));
	if (elapsedTime > 1000)
		Language.trace();
	return elapsedTime;
};




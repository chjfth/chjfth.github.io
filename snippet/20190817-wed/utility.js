"use strict"

function foobar(){}

// Simple sprintf alternative: https://stackoverflow.com/a/4673436
// Usage:
//	"{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
// Output:
//	ASP is dead, but ASP.NET is alive! ASP {2}

(function(){
	// First, checks if it isn't implemented yet.
	if (!String.prototype.format) {
		String.prototype.format = function() {
			var args = arguments;
			return this.replace(/{(\d+)}/g, function(match, number) { 
				return typeof args[number] != 'undefined'
					? args[number]
					: match
			 	;
			});
		};
	}
})();


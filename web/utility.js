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


// Simple id() function: https://stackoverflow.com/questions/1997661/unique-object-identifier-in-javascript

(function() {
	if ( typeof Object.id == "undefined" ) {
		var id = 0;

		Object.id = function(o) {
			if ( typeof o.__uniqueid == "undefined" ) {
				Object.defineProperty(o, "__uniqueid", {
					value: ++id,
					enumerable: false,
					// This could go either way, depending on your 
					// interpretation of what an "id" is
					writable: false
				});
			}
			return o.__uniqueid;
		};
	}
})();


// Print assert fail info on webpage. Thanks to the book "Secret of javascript Ninja".

function AssertIt(value, errormsg) {
	
	if(!errormsg)
		alert("AssertIt() missing second parameter!");
	
	if(value)
		return;
	
	// create a <ul> block to place assertion fail message.
	var results = document.getElementById("assert_error");
	if (!results) {
		results = document.createElement("ul");
		results.setAttribute('id','assert_error');
		results.style.cssText="color:red; border:1px solid; background-color:#fee;"
		
		// insert as <body>'s first child.
		document.body.insertBefore(results, document.body.firstElementChild);
	}
	
	var li = document.createElement("li");
	li.appendChild(document.createTextNode(errormsg));
	results.appendChild(li);
}

function AssertFail(errormsg) {
	AssertIt(0, errormsg);
}

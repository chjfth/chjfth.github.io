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


// fillArray: https://stackoverflow.com/a/12503237/151453
// Create an array of length `len` with all elements filled with `value` .
function fillArray(value, len) {
  if (len == 0) return [];
  var a = [value];
  while (a.length * 2 <= len) a = a.concat(a);
  if (a.length < len) a = a.concat(a.slice(0, len - a.length));
  return a;
}

// https://css-tricks.com/snippets/javascript/get-url-variables/
// If the URL ends with ?param=val , get_url_variable("param") will return "val".
function get_url_variable(variable)
{
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable){return pair[1];}
	}
	return(false);
}

//
// querySelector wrapper from https://plainjs.com/javascript/selecting/select-dom-elements-by-css-selector-4/
//
// select a list of matching elements, context is optional
function $(selector, context) {
    return (context || document).querySelectorAll(selector);
}

// select the first match only, context is optional
function $1(selector, context) {
    return (context || document).querySelector(selector);
}

function InEle_remove_matching_class(parent_ele, classname) {
	var childs = $("."+classname, parent_ele);
	for(var child of childs)
		child.classList.remove(classname);
}


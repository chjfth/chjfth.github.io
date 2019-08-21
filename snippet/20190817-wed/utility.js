"use strict"

// Define function IsSafari() .
var IsSafari = (function() {
	
	// according to https://stackoverflow.com/a/31732310/151453
	var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple')>-1 ;

	if(typeof(g_is_simulate_safari)!=='undefined' && g_is_simulate_safari) {
		console.log("Chj utility.js: Simulating Safari.");
		isSafari = true;
	}
	
	return () => isSafari;
})();

function get_scrollTop() { return my_scrollTop(); }
function set_scrollTop(val) { my_scrollTop(val); }
//
var my_scrollTop = (function() {
	
	// Use this function to work around [Chrome,Firefox] and [iOS/Safari]'s 
	// whole-page .scrollTop difference.
	//
	// my_scrollTop(): get current .scrollTop value.
	// my_scrollTop(100): set new .scrollTop value, causing webpage to scroll.
	
	// First, we should check whether we'are on Chrome or Safari.
	// Be aware: Chrome App on Safari is actually using Safari core, and should be 
	// considered Safari.
	
	var isSafari = IsSafari();

	function _scrollTop(val) {
		if(val==undefined) {
			if(!isSafari)
				return document.documentElement.scrollTop;
			else
				return document.body.scrollTop;
		} 
		else {
			if(!isSafari)
				document.documentElement.scrollTop = val;
			else
				document.body.scrollTop = val;
		}
	}
	
	return _scrollTop;
})(); 


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

function InEle_remove_matching_class1(parent_ele, classname) {
	var childs = $("."+classname, parent_ele);
	for(var child of childs)
		child.classList.remove(classname);
}

function InEle_remove_matching_class(parent_ele, classnames /*...*/) {

	for(var i=1; i<arguments.length; i++) {
		InEle_remove_matching_class1(parent_ele, arguments[i]);
	}
}


function InEle_set_html_by_class(parent_ele, classname, html) {
	var childs = $("."+classname, parent_ele);
	for(var child of childs) {
		child.innerHTML = html;
	}
}

function get_ele_xydiff(from1, to2) {
    var rect1 = from1.getBoundingClientRect();
	var rect2 = to2.getBoundingClientRect();
	
	return { x: rect2.x-rect1.x , y: rect2.y-rect1.y };
}

// cs: get computed (css) style 
function cs(element, csspropname, pseudoElt) {
	var s = window.getComputedStyle(element, pseudoElt);
	return s.getPropertyValue(csspropname); // This can get custom property as well.

	// Hint: To get a value from :root{...}, use cs(document.documentElement, "--floatbar-corner")
}

function replace_old_ele_by_class(classname, parent_ele) {

	// Note: All content inside old_ele will be "lost", i.e. not copied to new_ele.

	var old_ele = $1("."+classname, parent_ele);
	
	var new_ele = document.createElement(old_ele.tagName);
	new_ele.classList.add(classname);
	old_ele.parentElement.replaceChild(new_ele, old_ele);
	
	return new_ele;
}




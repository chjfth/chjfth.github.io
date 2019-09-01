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
function get_url_variable(variable, default_val)
{
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		if(pair[0] == variable){return pair[1];}
	}
	return default_val ? default_val : null;
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
	
	return { x: rect2.left-rect1.left , y: rect2.top-rect1.top };
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

////////////////////////////  class MessageBar ///////////////////////////
// Class-instance implementation using UDJS3 CH5 Object-link pattern.

var MessageBar = // the "class" definition
{
	init : function(div_id, cssclass_error, cssclass_warn, cssclass_info)
	{
		this.div_id = div_id;
		this.div = document.getElementById(div_id);
		if(!this.div)
			return false;
		
		this.cssclasses = [cssclass_error, cssclass_warn, cssclass_info];
		
		return true;
	},
	
	addmsg : function(msgtext, msgtype, autoclear_ms)
	{
		if(!(msgtype>=0 && msgtype<=2))
			msgtype = MessageBar.Info;
		
		var msgdiv_innerhtml = `<div style="flex-grow:1"></div>
	<div style="flex-basis:1em; flex-grow:0; flex-shrink:0; cursor:pointer"></div>
`
		var crosssvg = '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><path style="fill:grey;" d="M89.233,21.263L78.737,10.767c-2.484-2.484-6.512-2.484-8.996,0L50,30.508L30.258,10.767 c-2.484-2.484-6.512-2.484-8.996,0L10.767,21.263c-2.484,2.484-2.484,6.512,0,8.996L30.509,50L10.767,69.741 c-2.484,2.484-2.484,6.512,0,8.996l10.496,10.495c2.484,2.484,6.512,2.484,8.996,0L50,69.491l19.742,19.741 c2.484,2.484,6.512,2.484,8.996,0l10.496-10.495c2.484-2.484,2.484-6.512,0-8.996L69.491,50l19.742-19.741 C91.717,27.774,91.717,23.747,89.233,21.263z"/></g></svg>'
			
		var msgdiv = document.createElement("div");
		msgdiv.style.display = "flex";
		msgdiv.innerHTML = msgdiv_innerhtml;
		msgdiv.className = this.cssclasses[msgtype];
		msgdiv.firstElementChild.textContent = msgtext;
		
		this.div.appendChild(msgdiv);
		
		function msgdiv_remove_self(event) {
			msgdiv.parentElement.removeChild(msgdiv);
		}
		
		if(autoclear_ms>0) {
			setTimeout(msgdiv_remove_self, autoclear_ms);
		}
		
		var close_btn = msgdiv.firstElementChild.nextElementSibling;
		close_btn.innerHTML = crosssvg;
		close_btn.addEventListener("click", msgdiv_remove_self);
	},
	
	// msgtype enums:
	Error : 0,
	Warn : 1,
	Info : 2,
};

function create_MessageBar(div_id, cssclass_error, cssclass_warn, cssclass_info) {
	var msgbar = Object.create(MessageBar);
	msgbar.init(div_id, cssclass_error, cssclass_warn, cssclass_info);
	return msgbar;
}

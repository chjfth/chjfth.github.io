"use strict"

// var g_is_simulate_safari = true; // only enable this to test Safari behavior on Chrome/Firefox 

// Define function IsSafari() .
var IsSafari = (function() {
	
	// according to https://stackoverflow.com/a/31732310/151453
	var isSafari = navigator.vendor && navigator.vendor.indexOf('Apple')>-1 ;

	if(typeof(g_is_simulate_safari)!=='undefined' && g_is_simulate_safari) {
		console.log("Chj utility.js: Simulating Safari.");
		isSafari = true;
	}
	
	return () => isSafari; // so always return the cached isSafari value.
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

var g_fixedpos = false;
//
function _AssertIt_fixedpos() {
	g_fixedpos = true;
}
//
function AssertIt(value, errormsg, color) {
	
	if(!errormsg)
		alert("AssertIt() missing second parameter!");
	
	if(value)
		return;
	
	if(!color)
		color = "red";
	
	// create a <ul> block to place assertion fail message.
	var results = document.getElementById("assert_error");
	if (!results) {
		results = document.createElement("ul");
		results.setAttribute('id','assert_error');
		
		var csstext = "color:{0}; ".format(color);
		
		csstext += "border:1px solid; background-color:#fee;" 
		
		if(g_fixedpos) {
			// Enable this to have a always visible error-debugging pane.
			// [2019-07-25] This is useful when I want to debug "scroll" events on an iPad.
			csstext += "position:fixed; z-index:14; left:100px; top:0px; right:0px; bottom:50px; overflow:auto;"
		}
		
		results.style.cssText = csstext;
		
		// insert as <body>'s first child.
		document.body.insertBefore(results, document.body.firstElementChild);
	}
	
	var li = document.createElement("li");
	li.appendChild(document.createTextNode(errormsg));
	results.appendChild(li);
}

function AssertFail(errormsg) {
	AssertIt(0, errormsg, "red");
}

function AssertInfo(msg) {
	AssertIt(0, msg, "blue");
}

// cs: get computed (css) style 
function cs(element, csspropname, pseudoElt) {
	var s = window.getComputedStyle(element, pseudoElt);
	
	// return s[csspropname]; // This cannot get custom property like '--floatbar-corner'.
	
	return s.getPropertyValue(csspropname); // This can get custom property.
	
	// Hint: To get a value from :root{...}, use cs(document.documentElement, "--floatbar-corner")
}

function get_background_parent(ele) {
	
	// Return the ancestor node providing a solid background
	
	var start_ele = ele;
	while(ele.parentElement) {
		var p = ele.parentElement;
		var bgc = cs(p, 'background-color');
		if(bgc=="rgba(0, 0, 0, 0)") { // transparent, skip it
			ele = p;
			continue;
		}
		else {
			// cs(p, 'background-color') will be sth like "rgb(85, 119, 187)"
			return p; 
		}
	}
	return ele; // ele is the <html>, document.documentElement
}

function is_ancestor_class_rematch(ele0, regex) {

	var ele = ele0.parentElement;
	while(ele) {
		for(var cls of ele.classList) {
			if( regex.test(cls) )
				return true;
		}
		ele = ele.parentElement;
	}
	return false;
}

function is_in_langcn(ele) {
	var ret = is_ancestor_class_rematch(ele, /^lang-cn/);
	return ret;
}
function is_in_langen(ele) {
	var ret = is_ancestor_class_rematch(ele, /^lang-en/);
	return ret;
}

function has_ancestor(child, ancestor_ele, is_match_self) {
	// Check if child-element has given ancestor-element.
	
	if(is_match_self && child==ancestor_ele)
		return true;
	
	var ele = child.parentElement;
	while(ele) {
		if(ele==ancestor_ele)
			return true;
		ele = ele.parentElement;
	}
	return false;
}

function make_me_child_of(me_ele, new_parent_tagname) {

	// Usage scenario: If a parent <div> has a child <img>, and we want to wrap the <img>
	// inside an <a>, we want the new <a> to take the *exact* original place of <img>,
	// we can call 
	//		make_me_child_of(me_ele_of_img, "a");
	// The newly created <a> element is returned to caller, and the caller can attach
	// various properties to the new <a> element.

	if(!typeof(new_parent_tagname)=="string") {
		console.log("Error input: make_me_child_of() new_parent_tagname should be a string.");
		return null;
	}
	
	// Implementation Note: We do not abandon me_ele here, so that event-listeners on me_ele 
	// and its children will still be in effect.
	
	var true_parent = me_ele.parentNode;
	
	var orig_place_ele = me_ele.cloneNode(false); // as temp placeholder for original parent's place 
	true_parent.replaceChild(orig_place_ele, me_ele);
	
	var new_parent = document.createElement(new_parent_tagname);
	new_parent.appendChild( me_ele );
	
	true_parent.replaceChild(new_parent, orig_place_ele);
	
	return new_parent;
}

function isInArray(value, array) {
	// https://stackoverflow.com/a/18101063/151453
	return array.indexOf(value) > -1;
}


function* scan_hx_headings(start_ele, start_hx, depth)
{
	var seqs_now = [0];
	var hx_sheet = [null, "h1", "h2", "h3", "h4", "h5", "h6"];
	
	var hx_range = hx_sheet.slice(start_hx, start_hx+depth);
		// Example: start_hx=2, depth=3, will get ["h2", "h3", "h4"]
	var hx_sel = hx_range.join(",");
	if(!hx_sel)
		return null;
	
	var hx_all_eles = start_ele.querySelectorAll(hx_sel);
	
	for(var new_hele of hx_all_eles) {
		
		var new_hnum = parseInt(new_hele.tagName.slice(1));
		
		var new_depth = new_hnum - start_hx;
		
		// Three cases to update seqs_now[]:
		var prev_depth = seqs_now.length-1;
		
		if(new_depth > prev_depth) {
			// Hx goes deeper. H1->H2 or H1->H3 ...
			var diff = new_depth - prev_depth;

			for(var i=0; i<diff; i++)
				seqs_now.push(0);
		}
		else if(new_depth < prev_depth) {
			// Hx return from deeper. H2->H1 or H3->H1 ...
			var diff = prev_depth - new_depth;

			for(var i=0; i<diff; i++) 
				seqs_now.pop()
		}

		// Assert(seqs_now.length-1 == new_depth)

		seqs_now[seqs_now.length-1]++; // update seq for the new ele
		
		var seqs_str = seqs_now.join(".");
		
//		new_hele.innerHTML = seqs_str + ": " + new_hele.innerHTML
//		console.log("See "+ seqs_str);
		yield { hele:new_hele, seqs:seqs_now };
	}
}

function querySelectorAll_directchild(start_ele, querystr) {
	
	var rets = [];
	var eles = start_ele.querySelectorAll(querystr);
	for(var i in eles) {
		if(eles[i].parentNode==start_ele) {
			rets.push(eles[i]);
		}
	}
	return rets;
}

var get_millisec = (function() {
	
	var start_millisec = Date.now();
		
	function in_get_millisec() {
		return Date.now() - start_millisec;
	}
	
	return in_get_millisec;
})(); // get_millisec() returns millisec count since program started.


function do_triggerEvent(target, eventType, eventDetail){
    const evt = new CustomEvent(eventType, {
      detail: eventDetail
    });
    target.dispatchEvent(evt);
}

//////////////// FBRunning (floating toolbar Running state) ////////////////

var FBRunning = 
{
	// three states as enum value:
	Idle : 0, Scrolling : 1 , Showing : 2,
	
	// class members:
	curstate : 0, // default to Idle, how can I write `Idle`?
	starty : -1,
	prevy : -1,
	endy : -1,
	timer1 : undefined, // the calming interval after last scrolling

	delay_show_ms : 150, // caution: can be 50~500, but cannot be smaller than a OS jiffy(16ms).
	
	anti_dither_px : 5, // anti finger dithering when finger leaves the screen. Use 0 and you see problem.
		
	floatbar : undefined, // the floating toolbar to show/hide
	
	Log : function(msg) {
		// Comment the following line to suppress logging output.
//		console.log("[{0}] {1}".format(get_millisec(), msg));
	},
	
	FloatbarShow : function() {
		this.curstate = FBRunning.Showing;
		this.floatbar.style.display= "block";
	},
	
	FloatbarHide : function() {
		this.floatbar.style.display= "none";
			// this.floatbar.style.removeProperty("display"); // This does not cause floatbar to disappear on iPad iOS 12.
		this.curstate = FBRunning.Idle;
	},

	timer1Due : function() {
		
		if(this.curstate!=FBRunning.Scrolling) {
			this.Log("Got stale timer event when curstate==Scrolling.");
			return;
		}
		
		var dbg = "[y: {0}->{1} , diff={2}]".format(this.starty, this.endy, this.endy-this.starty)
		this.Log("FT timer due. Checking whether to show floatbar."+dbg);
		
		// Check whether scrolling distance meet the floatbar showing up rule.
		
		var diffy = this.endy - this.starty;
		var ok = diffy==0 || (diffy<=-this.anti_dither_px && diffy>=-window.innerHeight/2);
			// diffy==0 is for iPad better experience, very special for touch screen scrolling.
		
		if(ok) {
			this.Log("  OK. will show floatbar.");
			this.FloatbarShow();
		}
		else {
			this.Log("  No. Go back to idle.");
			this.FloatbarHide();
		}
	},
		
	OnScroll : function(ypos, floatbar_ele) {
		
		this.floatbar = floatbar_ele;
		
		if(this.curstate==FBRunning.Idle) {
			this.curstate = FBRunning.Scrolling;
			this.starty = this.prevy = this.endy = ypos;
		}
		else if(this.curstate==FBRunning.Scrolling) {
			this.endy = ypos;
		}
		
		if(this.curstate==FBRunning.Idle || this.curstate==FBRunning.Scrolling) {
			
			// Restart timer.
			clearTimeout(this.timer1);
			
			this.timer1 = setTimeout(function(thisobj) {
				// `this` here is the `window`
				thisobj.timer1Due();
			}, this.delay_show_ms, this);
		}
		
		if(this.curstate==FBRunning.Showing) {
			var diffy = ypos - this.prevy;
			if(diffy>=this.anti_dither_px) {
				this.Log("Re-scrolling down. Will hide the float-toolbar");
				this.FloatbarHide();
			}
		}
		
		this.prevy = ypos;
	},
}

function isStartsWith(str, substr) {
	if(str.indexOf(substr)==0)
		return true;
	else
		return false;
}


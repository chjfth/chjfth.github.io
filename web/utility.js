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

// cs: get computed (css) style 
function cs(element, csspropname, pseudoElt) {
	var s = window.getComputedStyle(element, pseudoElt);
	return s[csspropname];
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

function has_ancestor(child, ancestor) {
	// Check if child-element has given ancestor-element.
	var ele = child;
	while(ele) {
		if(ele==ancestor)
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
	
	var hx_all_eles = document.querySelectorAll(hx_sel);
	
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

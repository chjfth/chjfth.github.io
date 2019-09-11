"use strict"

function IsMobileLayoutNow() {
	var element = document.getElementById("css_layout_now");
	var cs = getComputedStyle(element);
	return cs['line-height']=="1px" ? true : false;
}

function get_floatbar_corner_px() {
	var ret = parseInt(cs(document.documentElement, "--floatbar-corner"));
	return ret;
}

var LangState = 
{
	// lang-cn & lang-en can be both "on", but not both "off"
	is_cn_on : true,
	is_en_on : true,
	is_cn_main : false,
	
	toggle : function (is_toggle_cn) {
	
		var is_toggle_en = !is_toggle_cn;
		if(is_toggle_cn)
			this.is_cn_on = !this.is_cn_on;
		if(is_toggle_en)
			this.is_en_on = !this.is_en_on;
		
		if(!this.is_cn_on && !this.is_en_on) {
			// do not allow both off, so we pretend the other lang is clicked
			if(is_toggle_cn) 
				this.is_en_on = true;
			else
				this.is_cn_on = true;
			
			// assume a reverse toggle
			is_toggle_cn = !is_toggle_cn; 
			is_toggle_en = !is_toggle_en;
		}
		
		// determine the selected main-language (true: cn, false: en)
		if(this.is_cn_on && this.is_en_on)
			this.is_cn_main = is_toggle_cn ? true : false;
		else
			this.is_cn_main = this.is_cn_on ? true : false;
		
		this.refresh_ui(true);
	},
	
	refresh_ui : function (is_delay_hide) {
		if(is_delay_hide)
			refresh_cn_en_display_animate(this.is_cn_on, this.is_en_on, this.is_cn_main, true);
		else
			refresh_cn_en_display_now(this.is_cn_on, this.is_en_on, this.is_cn_main, false);
	}
}

function check_cn_en_pairing() {

	// For all .lang-cn0 and .lang-cn2 tag, there should be a succeeding -en0 and -en2 tag,
	// and vice versa.
	var iserr = false;

	function chk_pairing(prefix1, prefix2, suffix, is_reverse) {
		
		var class1 = '{0}{1}'.format(prefix1, suffix);
		var class2 = '{0}{1}'.format(prefix2, suffix);
		var eles = document.querySelectorAll('.'+class1);
		eles.forEach(function(node, idx) {
			var nodetext1 = node.textContent;
			var node2 = node[is_reverse ? "previousElementSibling" : "nextElementSibling"];
			if(!node2 || !node2.classList.contains(class2)) {
				var errmsg = "Error: This '{0}' text is orphan: {1}".format(class1, nodetext1);
				AssertFail(errmsg);
				iserr = true;
			}
		})
	}

	chk_pairing("lang-cn", "lang-en", "0", false);
	chk_pairing("lang-en", "lang-cn", "0", true);
	chk_pairing("lang-cn", "lang-en", "2", false);
	chk_pairing("lang-en", "lang-cn", "2", true);
	if(iserr) {
		alert("check_cn_en_pairing() fail!");
		return;
	}
	
	console.log("check_cn_en_pairing() ok.");
}

function prepare_langbtn_callback() {

	var btn_cn = document.getElementById('btn-cn');
	var btn_en = document.getElementById('btn-en');
	AssertIt(btn_cn, "#btn-cn ele not found!");
	AssertIt(btn_en, "#btn-en ele not found!");
	
	function on_langbtn_click(event) {
		
		event.preventDefault();
		
		// lang-cn & lang-en can be both "on", but not both "off"
		
		var ele_clicked = event.target;
		
		LangState.toggle(has_ancestor(ele_clicked, btn_cn, true));
	}
	
	btn_cn.addEventListener("click", on_langbtn_click);
	btn_en.addEventListener("click", on_langbtn_click);
}

function prepare_duallang_hilight() {
	
	var gframe = document.querySelector(".globalframe");

	// Note for iPad: To register a "global" click event callback, we can't just register it 
	// on document or document.body, we have to register it on an explicit element,
	// `gframe` in this case.
	
	gframe.addEventListener("click", function(event) {
//		AssertInfo("duallang clicked.");
		// Check if it is within a .duallang.bounding ele, if so, toggle its "hilight" class.
		// Effect: on iPad, touch a .duallang blcok will have it highlighted with a dashed boarder,
		// so to easily read CN/EN words in pair.
		var ele = event.target;
		while(ele) {
			if(ele.classList.contains("duallang") && ele.classList.contains("bounding") ) {
				ele.classList.toggle("hilight");
				break;
			}
			ele = ele.parentElement;
		}
	});
}

function hide_if_zeroheight(ele) {
	// "hide" here means "display:none"
	if(ele.style.height=="0px")
		ele.style.display = "none";
	else 
		ele.style.display = "block";
}

function refresh_cn_en_display_animate(is_cn_on, is_en_on, is_cn_main) {

	// Purpose: We have to change .height's "auto" value to actual px value so that 
	// CSS transition works. So I scan for all "auto" values here and make the change.
	// [2019-07-19] As I have tried on Chrome 75, it seems a must to delay the 
	// "actual" .height changing to a timer callback(delayed execution context). 
	// If I merely do 
	//		auto => 21px => 0px 
	// all in this execution context, Chrome will consider it auto => 0px so the 
	// CSS transition does not occur.

	var eles = document.querySelectorAll('[class^="lang-"]');
	eles.forEach(function(ele, idx){
		
		// Set animation "starting" state:
		ele.style.display = "block";
		
		if(ele.style.display=="none") {
			ele.style.height = "0px";
		}
		else if(ele.style.height=="auto") {
			ele.style.height = ele.scrollHeight+"px";
		}
	});
	
	setTimeout(function() {
		refresh_cn_en_display_now(is_cn_on, is_en_on, is_cn_main, true);
	}, 1);

	if(IsSafari()) {

		var ms = parseInt(cs(document.body, "--transition-duration"));
		var ms2 = 500;
		var animation_wait_ms = ms + ms2;
		
		// This is only a work-around for Safari's <li><div> overflow:hidden bullet hiding bug.
		
		console.log("Chj: Safari set overflow:hidden for lang-* <div>s. (timer: {0}+{1}ms)".format(ms, ms2)); // debug
		document.body.classList.add("now_animation");
		
		setTimeout(function(){
			console.log("Chj: Safari re-enable overflow:visible for lang-* <div>s."); // debug
			document.body.classList.remove("now_animation");
		}, animation_wait_ms);
	}
}

function refresh_cn_en_display_now(is_cn_on, is_en_on, is_cn_main, is_animate) {
	
	// If is_cn_on && is_en_on are both true, lang-cn0 and lang-en0 will compete
	// according to is_cn_main.
	
	var both_on = is_cn_on && is_en_on;
	AssertIt(is_cn_on||is_en_on, "Program Error: None of lang-cn and lang-en is ON!");
	if(both_on) {
		if(!is_cn_on)
			AssertIt(!is_cn_main, "!is_cn_on, is_cn_main error.");
		if(!is_en_on)
			AssertIt( is_cn_main, "!is_en_on, is_cn_main error.");
	}
	else {
		is_cn_main = is_cn_on ? true : false;
	}
	
//	AssertIt( (!is_cn_on && !is_cn_main) || (!is_en_on && is_cn_main), "is_cn_main error!" ); // wrong
	
	var btn_cn = document.getElementById('btn-cn');
	var btn_en = document.getElementById('btn-en');
	
	function btn_set_state(ele, is_on) {
		ele.classList[is_on ? "add" : "remove"]("button_on");
	}
	
	btn_set_state(btn_cn, is_cn_on);
	btn_set_state(btn_en, is_en_on);

	function batch_cn_en_text(prefix, suffix, is_display) {
		
		// Enable/Disable cn/en text display according to input-params.
		
		function is_transition_enabled(ele) {
			var anistr = cs(ele, "transition");
			var is_height_ani = anistr.indexOf("height")>=0;
			return is_height_ani ? true : false;
		}

		var eles = document.querySelectorAll('.{0}{1}'.format(prefix, suffix));
		for(var i=0; i<eles.length; i++) {
			var ele = eles[i];
//			if(ele.textContent=="目录列表" || ele.textContent=="Table of Content") // debug
//				console.log((is_display?"[*]":"[ ]") + ">>> "+ ele.textContent);

			var is_ele_animate = is_animate;
			
			if(!is_transition_enabled(ele)) {
				// If there is css height-transition, we can hide this ele at transitionend.
				// But if there is no height-transition, we must hide this ele immediately,
				// otherwise, we will have no chance to hide it later.
				is_ele_animate = false;
			}
			
			if(is_ele_animate) {
				ele.style.height = is_display ? ele.scrollHeight+"px" : "0px";
			}
			else {
				if(is_display) {
					ele.style.display = "block";
					ele.style.height = "auto";
				}
				else {
					ele.style.display = "none";
					ele.style.height = "0px";
				}
			}
		} // for each targeting ele
	}

	batch_cn_en_text("lang-cn", "0", !is_en_on || (both_on&& is_cn_main));
	batch_cn_en_text("lang-en", "0", !is_cn_on || (both_on&&!is_cn_main));
	batch_cn_en_text("lang-cn", "2", is_cn_on);
	batch_cn_en_text("lang-en", "2", is_en_on);
	
	// Add/Remove bounding to all .duallang with .lang-cn2 and .lang-en2 .
	var eles = document.querySelectorAll(".duallang");
	for(var ele of eles) {
		if(ele.firstElementChild 
			&& ele.firstElementChild.classList.contains("lang-cn2") 
			&& ele.firstElementChild.nextElementSibling
			&& ele.firstElementChild.nextElementSibling.classList.contains("lang-en2")) 
		{
			if(both_on)
				ele.classList.add("bounding");
			else
				ele.classList.remove("bounding");
		}
	}
	
	// Add .mainlang-cn or .mainlang-en class to <body>, so that CSS and determine 
	// cn or en to display on lang0 elements.
	if(is_cn_main) {
		document.body.classList.add("mainlang-cn");
		document.body.classList.remove("mainlang-en");
	} else {
		document.body.classList.add("mainlang-en");
		document.body.classList.remove("mainlang-cn");
	}
}

function setup_transitionend() {
	
	document.addEventListener('transitionend', function(event) {
		var is_langtext = event.target.matches('[class^="lang-"]');
		if(is_langtext) {
			
			if(event.target.style.height!="0px") {
				// Set 'auto' so that ele's .height is auto adjusted when "float:right" img is delay loaded.
				event.target.style.height = "auto"; 
				
				// Note that this "auto" will be changed to actual 21px etc in refresh_cn_en_display_animate().
			}

			hide_if_zeroheight(event.target);
		}
	});
}

function setup_fixed_position_sidecol() {
	
	// Purpose: I hope to have the side-column stick on screen when user scrolls down.
	// So I'll change that .sidecol DIV to 'position:fixed' once I have acquired 
	// initial positioning parameters for it.
	// We assume that sidecol's width keeps constant all the time.
	
	var gframe = document.querySelector(".globalframe");
	var sidecol = document.querySelector(".sidecol");
	
	function fix_sidecol_position() {
		
		if(IsMobileLayoutNow()) {
			sidecol.style.position = "static";
			return;
		}
		
		// Desktop layout below:
		
		sidecol.style.position = "fixed";
		
		var sidecol_width = cs(sidecol, "width");
		var sidecol_width_px = parseInt(sidecol_width);
		
		var abs_x = gframe.offsetLeft + gframe.offsetWidth - sidecol_width_px;
		
		// [2019-06-16] NOTE: 'left/top/right/bottom' for a *fixed* DIV determines
		// the *margin corner* , NOT the border corner. So sidecol_mr should be doubly subtracted.
		var sidecol_mr = cs(sidecol, "margin-right");
		sidecol.style.left = 'calc({0}px - {1} - {1})'.format(abs_x, sidecol_mr);
	}
	
	fix_sidecol_position(); 
	
	window.addEventListener("resize", function(event){
		// Making viewport wider can cause .globalframe to move, 
		// so we need to adjust the fixed sidecol position.

		fix_sidecol_position();
		
		make_img_clickable_for_fullsize();
		
		// Test code >>>
		if(event.target.tagName='img') {
			// Weird: some element arises here, but who?
			// console.log('<img> id={0} width={1} '.format(Object.id(event.target), event.target.naturalWidth));
		}
		// Test code <<<
	});
}

function assert_langtext_0edge() {
	var eles = document.querySelectorAll('.lang-cn2 , .lang-cn0');
	for(var ele of eles)
	{
		var cs = getComputedStyle(ele);
		if(cs["border-top-width"]!="0px" || cs["border-bottom-width"]!="0px" 
			|| cs["padding-top"]!="0px" || cs["padding-bottom"]!="0px"
			|| cs["margin-top"]!="0px" || cs["margin-bottom"]!="0px"
			)
			AssertIt(0, ".lang-* elements should not have top/bottom border or padding, otherwise, transitionend will flicker!");
	}
}

function setup_keypress_switch_lang() {
	window.addEventListener("keypress", function(event) {
		if(event.key=="c") {
			LangState.toggle(true);
		} 
		else if (event.key=='e') {
			LangState.toggle(false);
		}
	});
}

function create_curtain_mask(parent_ele, idx_child) {
	
	if(cs(parent_ele, 'position')=='static')
		parent_ele.style['position'] = 'relative'; // must?
	
	
}

function prepare_expandable_block(parent_ele, fixed_spec, curtain_spec) {
	
	// [ fixed region ]                                       |
	// [ ............ ]                                       | visible
	// [ fixed region ]                                       | region
	// [curtain region]   masked with gradient white curtain  |
	// ( dropdown nob )  clicked to expand(reveal) hidden region
	// [ hidden region ]   initially hidden
	
	// fixed_spec & curtain_spec: how many height to show initially.
	// * If a pure number(3 or "3"), tells how many child-elements to account for.
	// * If in a form of "30px", it's the px height to account for.
	//
	// Note: If fixed_spec is in px, curtain_spec must also be in px, bcz there will
	// be no guarantee that curtain region starts from a child-element boundary.
	
	var children = parent_ele.children;
	
	var visible_height_px = undefined; // set later
	var curtain_height_px = undefined; // set later
	
	// check an error case first:
	if( fixed_spec.match(/[0-9]+px$/) && (typeof(curtain_spec)=="number"||curtain_spec.match(/[0-9]+$/)) ) {
		AssertIt(0, "prepare_expandable_block() param error: fixed_spec use px unit but curtain_spec use child-count!");
		return;
	}
	
	function spec_to_height_px(spec, prev_childs) {
		prev_childs = parseInt(prev_childs);
		
		var childs = -1; // set later
		var height_px = -1; // set later
		if(typeof(spec)=="number")
			childs = spec;
		else if(spec.match(/[0-9]+$/))
			childs = parseInt(spec);
		else if(spec.match(/[0-9]+px$/))
			height_px = parseInt(spec);
		
		if(childs==-1 && height_px==-1) {
			AssertIt(0, "prepare_expandable_block() parameter error.");
			return;
		}
		
		if(childs!=-1 && height_px!=-1) {
			AssertIt(0, "prepare_expandable_block() programmer error detected!");
			return;
		}
		
		var prev_y_offset = (prev_childs>=children.length 
			? parent_ele.getBoundingClientRect().bottom
			: children[prev_childs].getBoundingClientRect().top);
		
		if(childs>=0) { // spec by child-elements
			var both_childs = prev_childs + childs;
			var both_y_offset = (both_childs>=children.length
				? parent_ele.getBoundingClientRect().bottom
				: children[both_childs].getBoundingClientRect().top);
			return both_y_offset - prev_y_offset; // may be 0 if prev_y_offset has exceeded parent's height
		}
		else { // spec by explicit height_px
			return height_px;
		}
	}
	
	var fixed_height_px   = spec_to_height_px(fixed_spec, 0);
	var curtain_height_px = spec_to_height_px(curtain_spec, fixed_spec); 
		// 2nd param: No problem if fixed_spec is "20px" or "30px", it will not be used as child-count.
	var visible_height_px = fixed_height_px + curtain_height_px;
	
	if(visible_height_px >= parent_ele.offsetHeight)
		return; // no requirement for expand feature.

	console.log("prepare_expandable_block(#{0}): visible height {1}px -> {2}px"
		.format(parent_ele.id, parent_ele.offsetHeight, visible_height_px));
	
	// create_curtain_mask():
	
	if(cs(parent_ele, 'position')=='static')
		parent_ele.style['position'] = 'relative'; // must?
	
	var curtain = document.createElement('div');
	curtain.style.position = 'absolute';
//	curtain.style.backgroundColor = 'red'; // only for test
	curtain.classList.add("expandable_mask_transparent"); // for future css overriding
	curtain.style.left = '0px';
	var top = fixed_height_px; // children[nfixed].getBoundingClientRect().top - parent_ele.getBoundingClientRect().top;
	curtain.style.top =  top+'px';
	curtain.style.width = "100%";
	curtain.style.height = curtain_height_px+'px';
//	curtain.style.background = 'transparent';
	var bgc_parent = get_background_parent(parent_ele); 
	AssertIt(bgc_parent!=document.documentElement, "Hmm, not right, element(#{0}) does not lie on a colored background".format(parent_ele.id));
	var bgc = cs(bgc_parent, 'background-color'); // bgc sample: "rgb(85, 119, 187)", todo: check for undesired format like "rgb(x,x,x,0.2)"
	curtain.style['background-image'] = 
		"linear-gradient(to bottom, {0} ,0.5), {0}))".format(bgc.slice(0,-1)); // add 0.5 transparent value.
	
	parent_ele.appendChild(curtain);
	
	// Append nob element
	
	var nob_height_em = 2, svg_ems = 1.6;
	var nob = document.createElement('div');
	nob.style.position = 'absolute';
	nob.classList.add("expandable_mask_solid"); // for future css overriding
	nob.style.left = '0px';
	var top = visible_height_px; // children[nvisibles-xxx].getBoundingClientRect().top - parent_ele.getBoundingClientRect().top;
	nob.style.top =  top+'px';
	nob.style.width = "100%";
	nob.style.height = nob_height_em+'em';
	nob.style.backgroundColor = bgc;
	nob.style.padding = '2px';
	nob.style['text-align'] = 'center';
//	nob.style['cursor'] = 'pointer'; // optional
	// Add a down-arrow svg
	nob.innerHTML = '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-circle-down" \
		class="svg-inline--fa fa-chevron-circle-down fa-w-16" \
		role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\
		<path fill="currentColor" d="M504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zM273 369.9l135.5-135.5c9.4-9.4 9.4-24.6 0-33.9l-17-17c-9.4-9.4-24.6-9.4-33.9 0L256 285.1 154.4 183.5c-9.4-9.4-24.6-9.4-33.9 0l-17 17c-9.4 9.4-9.4 24.6 0 33.9L239 369.9c9.4 9.4 24.6 9.4 34 0z"></path></svg>';
	var svg_ele = nob.firstElementChild;
	svg_ele.style.height = svg_ems+'em';
	svg_ele.style.cursor = 'pointer'; // show a hand-shaped cursor on mouse hovering
	
	parent_ele.appendChild(nob);
	
	// Truncate parent_ele's visible height.
	// Be aware: We need a special process for <table> element who neglects .style.height assignment.
	// So we have to wrap a <div> around <table> and set .style.height on that <div>.
	
	var parent_wrapper = parent_ele;
	if( cs(parent_ele, "display")=="table" ) {
		parent_wrapper = make_me_child_of(parent_ele, "div");
	}
	
	parent_wrapper.classList.add("expandable_wrapper_div");
	parent_wrapper.style.height = "calc({0}px + {1}em".format(visible_height_px, nob_height_em);
	parent_wrapper.style.overflow = "hidden";

	// Add mouse-click event 
	parent_wrapper.addEventListener("click", function(event) {
		// event.target can be <path> or <svg>, so I use has_ancestor() check.
		// console.log(">>> "+event.target.tagName);
		if( has_ancestor(event.target, parent_wrapper, true) ) { // nob
			// Restore parent_wrapper's natural height, and remove curtain.
			parent_wrapper.style.height = "auto";
			curtain.style.display = "none";
			nob.style.display = "none";
		}
	});
	
	return;
}

function setup_expandable_blocks() {
	
	// Scan for (block) elements with attribute "expandable_fixed_childs=5" etc, 
	// trim their initial height to contain only 5 children. On the other hand,
	// a down-arrow is displayed and the user can click it to expand to full height.
	
	var eles = document.querySelectorAll("*");
	for(var ele of eles) {
		var fixed_childs_spec = ele.getAttribute("expandable_fixed_childs");
		var curtain_childs_spec = ele.getAttribute("expandable_curtain_childs");
		if(fixed_childs_spec && curtain_childs_spec) {
			prepare_expandable_block(ele, fixed_childs_spec, curtain_childs_spec);
		}
	}
}

function make_img_clickable_for_fullsize() {

	function wrap_img_inside_a_tag(img_ele) {

		var parent = img_ele.parentNode;
		
		var imgwidth = img_ele.width;
		if(img_ele.naturalWidth==0) {
//			console.log("delaying img: "+img_ele.src); // debug
			// The image has not been loaded from network, prepare to retry the manipulation 
			// when that image is finally loaded.
			img_ele.addEventListener("load", function(event) {
				wrap_img_inside_a_tag(img_ele);
			});
		}
		else if(img_ele.width < img_ele.naturalWidth) {
			// Add an <a> wrapper to this <img> so that user can "click for fullsize image",
			// but do it only when there is no <a> wrapper yet, no matter it is a .click_for_fullsize one or not.
			// That is, if there has been a dedicated <a> wrapper, don't touch anything.
			
			if(parent.tagName=="A") // always in upper-case according to spec
				return;
			
			var awrapper = make_me_child_of(img_ele, "a");
			AssertIt(awrapper, "make_img_clickable_for_fullsize(): error on make_me_child_of().");
			awrapper.target = "_blank";
			awrapper.href = img_ele.getAttribute("src");
			awrapper.className = "click_for_fullsize";
			
			img_ele.title = "Click to see fullsize image.";
		}
		else {
			// Remove the <a> wrapper if the wrapper has .click_for_fullsize class set. 
			if(parent.tagName=="A" && parent.classList.contains("click_for_fullsize")) {
				// remove this <a> parent:
				var parent2 = parent.parentNode;
				parent2.replaceChild(parent.firstElementChild, parent);

				img_ele.title = "already in fullsize";
			}
		}
	}
	
	var eles = document.querySelectorAll("img");
	for(var ele of eles) {
		wrap_img_inside_a_tag(ele);
	}
	
}

function hx_section_id(seqs_str) {
	// Construct the html id for main-content.
	return "sec-" + seqs_str;
}

function hx_thumbnail_id(seqs_str) {
	// Construct the html id for TOC area.
	return "toc-" + seqs_str;
}

function prepare_toc_syncing() {
	
	var ar_hx_seqs = [];
	
	var toc_html = '<div class="toc_depth0" id="{0}"><a href="#">\
			<div class="lang-cn0" style="display:{1}">文章开始</div>\
			<div class="lang-en0" style="display:{2}">Artical Start</div>\
		</a></div>'.format(hx_thumbnail_id("0"), 
					LangState.is_cn_main ? "block" : "none",
					LangState.is_cn_main ? "none" : "block"
				);
	
	//
	// "Copy" content from maincol <h1>,<h2>... to TOC area.
	//
	
	var hxgen = scan_hx_headings(document.body, 1, 3);
	for(var hxobj of hxgen) {

		var hele = hxobj.hele; // the html element of <h1>, <h2>, <h3> etc
		var depth = hxobj.seqs.length-1;
		var seqs_str = hxobj.seqs.join("."); // Sample: "1", "1.2", "1.2.3" etc

		ar_hx_seqs.push(seqs_str);
		// console.log(">>> "+seqs_str+ " - " + hele.textContent); // debug

		// Add html id to original <h1> <h2>..., so that we can later link to them from TOC.
		hele.id = hx_section_id(seqs_str);
		
		var inner = "";
		
		// `hele` may probably have `<div class="lang-cn0" style="display: block; height: 43px;">...</div>`
		// in its content. If so, we have to add seqs_str to those child elements. (todo: comment fix)
		var cssqlang = ".lang-cn0 , .lang-en0";
		var langs_ele = hele.querySelectorAll(cssqlang);
		if(langs_ele) {

			// Add small corner numbering to main-content hx.
			var hx_text_ele = hele.querySelector(".hx_text"); // Use ".hx_text" in html is suggested since 2019-08-26
			if(hx_text_ele && hx_text_ele.parentElement==hele) {
				var hx_corner_secnum = document.createElement("div");
				hx_corner_secnum.className = "hx_corner_secnum";
				hx_corner_secnum.textContent = seqs_str;
				hele.insertBefore(hx_corner_secnum, hx_text_ele.nextSibling); // insert after hx_text_ele
			}
			
			//
			// Make a clone of original hx, and tweak it to be an item in TOC.
			//
			
			var hele_clone = hx_text_ele ?  hx_text_ele.cloneNode(true) : hele.cloneNode(true);
			var lang_eles;
			if(hx_text_ele)
				lang_eles = hele_clone.querySelectorAll(".hx_text > *"); 
			else
				lang_eles = querySelectorAll_directchild(hele_clone, "*");
			
			// remove everything except elements with '.lang-cn0 , .lang-en0'
			
			for(var ele of lang_eles) { // note: DO NOT use the live `hele_clone.childNodes`, bcz we'll be removing child from it.
				
				var ok = false;
				if(!ele.classList) {
					// get rid of textNodes
				}
				else if(ele.classList.contains("lang-cn0")) {
					ele.className = "lang-cn0"; // yes, remove other "unrelated" classes
					ok = true;
				}
				else if(ele.classList.contains("lang-en0")) {
					ele.className = "lang-en0";
					ok = true;
				}
				
				if(ok) {
					// reject meaningless attributes from original hx.
					var old_display = ele.style.display; // we need "display", which may be "block" or "none"!
					ele.style = "";
					ele.style.display = old_display;
					
					ele.innerHTML = '<span class="toc_seqs">{0}</span> {1} <span class="toc_pct">(00%)</span>'.format(
						seqs_str, 
						ele.innerHTML
						);
				}
				else {
					ele.parentNode.removeChild(ele);
				}
				
				// Here, hele_clone updating done.
			}
			
			if(!hele_clone.firstElementChild) {
				AssertFail("Error Meet lang-tag wrong position on: " + hele.id);
			}
			
			inner = '<div class="">{0}</div>'.format(hele_clone.innerHTML);
		}
		else {
			// No dual-lang inside this hele, this case untested (todo)
			inner = '{0} {1}'.format(seqs_str, hele.innerHTML);
		}
		
		var div_oneh = '<div class="toc_depth{0}" id="{1}"><a href="#{2}">{3}</a></div>'.format(
			depth, 
			hx_thumbnail_id(seqs_str), 
			hx_section_id(seqs_str), 
			inner);
		
		toc_html += div_oneh;
	
	} // for(var hxobj of hxgen)

	var tocdiv = document.querySelector(".toctext");
	tocdiv.innerHTML = toc_html;
	
	//
	// Monitor whole-page scrolling event so that we can update the TOC thumbnail cursor position.
	//
	var prev_tocfocus = undefined;
	window.addEventListener("scroll", function() {
//		var pagepos = get_scrollTop();
		
		var margin_thres = 33; // 33 is casual to make a section straddle "margin" (may be 0)
		
		// Find out which hx is now in the viewport(at top of viewport).
		var prev_hx_idstem = "0";
		var prev_hx_pos = 0, next_hx_pos = window.innerHeight;
		for(var idstem of ar_hx_seqs) {
			var id = hx_section_id(idstem); // idstem sample: "4.1", return: id="sec-4.1"
			var ele = document.getElementById(id);
			var hxpos = ele.getBoundingClientRect().top; 
				// An hx scrolled beyond viewport top will have hxpos<0 .
				// An hx visible in viewport or far beyond viewport bottom will have hxpos>=0 .
			if(hxpos < margin_thres) {
				prev_hx_idstem = idstem;
				prev_hx_pos = hxpos;
			}
			else {
				next_hx_pos = hxpos;
				break;
			}
		}
		
		var toc_id = hx_thumbnail_id(prev_hx_idstem);
//		console.log("toc-id="+ toc_id); //debug

		var toctext = document.querySelector(".toctext");
		var tocfocus = document.getElementById(toc_id); // strange, here I cannot use querySelector("#toc-4.1") etc
		
		// Now actively scroll the TOC area, by setting toctext.scrollTop .
		// overhang_px is to make the focusing item appear roughly at middle of the scrolling area.
		var overhang_px = toctext.offsetHeight * 0.3;
		toctext.scrollTop = tocfocus.offsetTop - overhang_px; 
		
		if(prev_tocfocus)
			prev_tocfocus.classList.remove("focus");
		
		tocfocus.classList.add("focus");
		prev_tocfocus = tocfocus;

		// Update percent value for current TOC-entry:
		//
		var prev_pct_f = (margin_thres-prev_hx_pos)/(next_hx_pos-prev_hx_pos)*100;
		var prev_pct = Math.min(99, parseInt(prev_pct_f)); // Don't want to see "100%"
//		console.log("prev_pct="+ prev_pct+"%"); // debug
		var pct_eles = tocfocus.querySelectorAll(".toc_pct"); // typically get two(cn & en)
		for(var pct_ele of pct_eles) {
			pct_ele.innerText = "({0}%)".format(prev_pct);
		}
		
	});
	
}

function prepare_toc_popup() {
	
	// (In desktop mode) The TOC area is initially shrunk at right-bottom corner.
	// With a click of the UP-arrow(.svg_arrowup), it slides up to full height in sidecol.
	// The full-height of TOC may shroud my profile-list and portrait, 
	// but the langsel bar should keep visible.

	var sidecol = document.querySelector(".sidecol");
	var langsel = document.querySelector(".langsel");
	var tocframe = document.querySelector(".tocframe");
	var toctitle = document.querySelector(".toctitle");
	var toctitle_arrow = document.querySelector(".toctitle_arrow");
	var toctext = document.querySelector(".toctext");

	var fb_ele = document.querySelector(".floatbartray");
	AssertIt(fb_ele, ".floatbartray NOT found in html.");
	
	var toctitle_height_px = toctitle.offsetHeight;

	
	var is_toc_expanded = false;
	var is_toc_prompted = false;
	
	function toc_arrowup() {
		toctitle_arrow.classList.remove("svg_arrowdown");
		toctitle_arrow.classList.add("svg_arrowup");
	}
	function toc_arrowdown() {
		toctitle_arrow.classList.remove("svg_arrowup");
		toctitle_arrow.classList.add("svg_arrowdown");
	}
	
	function expand_toc_frame() {
		
		if(IsMobileLayoutNow()) {
			// Will recalculate toctext.style.height in Mobile layout.
			
			var toctext_height_limit_px = window.innerHeight 
				- parseInt(cs(tocframe, "padding-top")) - parseInt(cs(tocframe, "padding-bottom"))
				- toctitle.offsetHeight
				- get_floatbar_corner_px();
			
			var toctext_now_height_px = Math.min(toctext_height_limit_px, toctext.scrollHeight);
			
			if(toctext_now_height_px==0)
				; // console.log("toctext_now_height_px=0 !!!"); // debug
			
			toctext.style.height = toctext_now_height_px + "px"; // #20190727-1
		}
		else {
			// Will recalculate tocframe.style.height in Desktop layout.
			
			var tocframe_full_height_px = toctitle.offsetHeight + toctext.scrollHeight;
			var tocframe_height_limit_px = sidecol.offsetHeight - langsel.offsetHeight;

			var tocframe_now_height_px = Math.min(tocframe_full_height_px, tocframe_height_limit_px);
			tocframe.style.height = tocframe_now_height_px + "px";

			is_toc_prompted = true;
			
			toctext.style.height = "auto"; // #20190727-1, in Desktop layout, this should not be explicit px.
		}

		is_toc_expanded = true;
		toc_arrowdown();
	}
	
	function collapse_toc_frame() {
		tocframe.style.height = "initial"; // memo: "initial" will suppress height animation
		
		toc_arrowup();
		is_toc_expanded = false;
	}
	
	function tocframe_set_maxheight() {
		var corner_px = get_floatbar_corner_px();
		tocframe.style["max-height"] = window.innerHeight-corner_px + "px"; 
	}
	
	window.addEventListener("resize", function() {
		
		// For mobile layout: Limit tocframe's max-height.
		tocframe_set_maxheight();
		
		// For both layout:
		// TOC frame's height needs adjust on window size change.
		if(is_toc_expanded)
			expand_toc_frame();
	});
	
	window.addEventListener("scroll", function() {
		// Desktop layout scrolling action:

		// When the user scrolls by window.innerHeight the *first* time,
		// I'll slide up the TOC area automatically prompting my TOC feature,
		// but only do it once so the disturbance is minimal.
		if(is_toc_prompted)
			return;
		
		if(get_scrollTop() > window.innerHeight) {
			
			tocframe.style.height = toctitle_height_px + "px"; // set explicit height for animation
			setTimeout(function() {
				expand_toc_frame();
			}, 1);
			is_toc_prompted = true;
		}

	});
	
	var floatbar = create_Floatbar(fb_ele,
		() => fb_ele.classList.remove("hide"),
		() => fb_ele.classList.add("hide")
		);
	window.addEventListener("scroll", function() {
		// Mobile layout scrolling action:
		floatbar.OnScroll(get_scrollTop());
	});
	
	toctitle.addEventListener("click", function(event) { // For desktop layout:
		
		if(IsMobileLayoutNow()){
			tocframe.classList.remove("mobile_popup");
		}
		else 
		{
			if(!is_toc_expanded)
				expand_toc_frame();
			else
				collapse_toc_frame();
		}
	});
	
	fb_ele.addEventListener("click", function(event) {  // For mobile layout:
		
		// fb_ele is meaningful only for mobile layout:
		tocframe.classList.add("mobile_popup");
		LangState.refresh_ui(false);
		expand_toc_frame();
	});
	
	tocframe_set_maxheight();
	
	collapse_toc_frame();
//	expand_toc_frame(); // Don't initially expand.
}

function prepare_langrefresh_on_resize() {

	var is_prev_mobile = IsMobileLayoutNow();
	
	window.addEventListener("resize", function() {
		var is_now_mobile = IsMobileLayoutNow();
		
		if(is_now_mobile!=is_prev_mobile) {
			LangState.refresh_ui(true); 
			
			// -- When doing refresh_ui, `true`(delayed refresh) is required, bcz 
			// list-entries' `height` may change across desktop/mobile layout change, 
			// so we need a "delay" to change `height`s value to "auto" 
			// instead of concrete 21px etc.
		}
		
		is_prev_mobile = is_now_mobile;
	});
}

function external_links_prepend_arrow() {
	
	var eles = document.getElementsByTagName("a");
	for(var a of eles) {
		
		// For <a href="res/cf-chenjun-2013.png">...</a> ,
		// a.href or a["href"] will return sth like "http://192.168.31.84:88/chjfth.github.io/web/res/cf-chenjun-2013.png",
		// a.getAttribute("href"); will return "res/cf-chenjun-2013.png" -- this is what I need here.
		
		var rawhref = a.getAttribute("href");
		
		if(isStartsWith(rawhref, "http") || isStartsWith(rawhref, "https")) {
			a.classList.add("external");
		}
	}
}

function collect_links_for_final_section() {
	
	var cn_tbody = document.querySelector(".linksummary .lang-cn0 tbody");
	var en_tbody = document.querySelector(".linksummary .lang-en0 tbody");
	
	var cn_tr0 = cn_tbody.firstElementChild;
	var en_tr0 = en_tbody.firstElementChild;
	
	cn_tbody.removeChild(cn_tr0);
	en_tbody.removeChild(en_tr0);

	var maincol = document.querySelector(".maincontent");
	var eles = maincol.getElementsByTagName("a");
	var cycles = eles.length;
	var cnidx = 0, enidx = 0;
	var id_adv = 0;
	//
	for(var i=0; i<cycles; i++) { 
		
		// [2019-08-02] Note: Don't use `for(var a of eles) {...}` to iterate, 
		// because `eles` are *live*, and we are adding *new* <a>s in this for cycle.
		
		var a = eles[i];
		var cnadd= true, enadd = true;

		// Exclude these things:
		//	<a>s with <img> tag.
		//	<a>s with custom attribute collect="no"
		var imgs = a.querySelectorAll("img");
		if(imgs.length>0)
			continue;
		//
		if(a.getAttribute("collect")=="no")
			continue;
		
		// This is a valid <a>, and I'll add auto anchor id to it for summary link-back.
		//
		a.id = "aa" + (++id_adv);
		a.classList.add("refback");
		
		// Check whether the <a> is from lang-cn or lang-en, then add it to cn/en table respectively.
		// If none of lang-cn/lang-en, add to both.
		//
		if(is_in_langcn(a)) {
			enadd = false;
		}
		else if(is_in_langen(a)) {
			cnadd = false;
		}
		
		function tr_setcontent(trnew, a, idx) {
			
			var tds = trnew.querySelectorAll("td");
			
			tds[0].innerHTML = '<a href="#{0}">^{1}</a>'.format(a.id, idx+1);
			
			var brief = a.getAttribute("brief");
			if(brief)
				tds[1].innerHTML = '<b style="color: gray">{0}</b>'.format(brief);
			else
				tds[1].innerHTML = a.textContent;
			
			var href = a.getAttribute("href");
			tds[2].innerHTML = '<a href="{0}" target="_blank">{0}</a>'.format(href);
		}
		
		if(cnadd) {
			var trnew = cn_tr0.cloneNode(true);
			tr_setcontent(trnew, a, cnidx);
			cn_tbody.appendChild(trnew);
			cnidx++;
		}
		if(enadd) {
			var trnew = en_tr0.cloneNode(true);
			tr_setcontent(trnew, a, enidx);
			en_tbody.appendChild(trnew);
			enidx++;
		}
	}
}

function inject_age_at_born_field() {
	
	var ele_born = document.getElementById("born");
	var str_born = ele_born.textContent.trim(); // result should be: "1980.04.29"
	AssertIt(/[0-9]{4}\.[0-9]{2}\.[0-9]{2}/.test(str_born), '#born string is not valid! Expect: "1980.04.29"');
	
	var byear = parseInt(str_born.substring(0, 4));
	var bmonth = parseInt(str_born.substring(5, 7));
	var bdate = parseInt(str_born.substring(8, 10));
	
	var now = new Date();
	var now_year = now.getFullYear();
	var now_month = now.getMonth()+1;
	var age = now_year - byear;
	if( now_month*100+now.getDate() < bmonth*100+bdate )
		age--;
	
//	console.log(">>>"+age);

	var tmpl = '\
		<div class="lang-cn0">{0} ({1} 岁)</div>\
		<div class="lang-en0">{0} (age {1})</div>\
		';
	ele_born.innerHTML = tmpl.format(str_born, age);
}

function fill_last_modified() {
	
	var oLastModif = new Date(document.lastModified);
	
	if(!oLastModif) {
		alert("new Date(document.lastModified); got error!");
		return;
	}
	
	var tsele = document.getElementById("tslastmod");
	tsele.textContent = oLastModif;
}

function fix_for_safari() {
	if(IsSafari()) {
		document.body.classList.add("usesafari");
	}
}

function refresh_initial_langui() {
	
	if(navigator.languages && navigator.languages[0]=="zh-CN")
		LangState.is_cn_main = true;
	else
		LangState.is_cn_main = false;
		
	LangState.refresh_ui(false); 
		// is_delay_hide=false should be used here, 
		// otherwise, setup_expandable_blocks() will see wrong `height`(height of duallang),
		// actually what we need is text heights of a single lang.
}

//////////////////////////////////////////////////////////////////////////////
// Initialization code:
//////////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", function(){

//	alert("AAA");

	chj_check_strict_mode();
	
	fix_for_safari();

	inject_age_at_born_field();
	
	check_cn_en_pairing();
	assert_langtext_0edge();
	
	refresh_initial_langui();
	prepare_duallang_hilight();

	prepare_langbtn_callback();
	
	setup_transitionend();

	setup_fixed_position_sidecol();
	
	setup_keypress_switch_lang();
	
	setup_expandable_blocks();
	
	make_img_clickable_for_fullsize();
	
	prepare_toc_syncing();
	prepare_toc_popup();
	
	prepare_langrefresh_on_resize();
	
	collect_links_for_final_section();
	external_links_prepend_arrow();

	fill_last_modified();
	
//	_AssertIt_fixedpos();
//	AssertInfo(IsSafari() ? "isSafari=true" : "isSafari=false");
});


function chj_check_strict_mode() {

	try {
		var obj1 = {};
		Object.defineProperty(obj1, 'x', { value: 4, writable: false });
		obj1.x = 444; // throws a TypeError
		
		// var bad_octal = 077; 
			// SyntaxError in strict mode.
			// But we can't use this, bcz it throws before this function body is executed.
			
		// [2019-08-31] Alternative to try: undefined(); // TypeError: undefined is not a function
	
	} catch (e) {
		// OK. We catch the error, so strict mode is effective.
//		console.log(e)
		return;
	}
	
	alert("Programmer error! Strict mode is NOT enabled!");
}

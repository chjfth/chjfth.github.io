"use strict"

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
		
		var is_cn_on = btn_cn.classList.contains("button_on");
		var is_en_on = btn_en.classList.contains("button_on");
		
		if(ele_clicked==btn_cn)
			is_cn_on = !is_cn_on;
		if(ele_clicked==btn_en)
			is_en_on = !is_en_on;
		
		if(!is_cn_on && !is_en_on) {
			// but I do not allow both off, so wo pretend the other lang is clicked
			if(ele_clicked==btn_cn) {
				is_en_on = true;
				ele_clicked = btn_en;
			} else {
				is_cn_on = true;
				ele_clicked = btn_cn;
			}
		}
		
		refresh_cn_en_display(is_cn_on, is_en_on, ele_clicked==btn_cn?true:false);
	}
	
	btn_cn.addEventListener('click', on_langbtn_click);
	btn_en.addEventListener('click', on_langbtn_click);
}

function hide_if_zeroheight(ele) {
	// "hide" here means "display:none"
	if(ele.style.height=="0px")
		ele.style.display = "none";
	else 
		ele.style.display = "block";
}

function refresh_cn_en_display(is_cn_on, is_en_on, is_cn_main, is_delay_hide=true) {
	
	// If is_cn_on && is_en_on are both true, lang-cn0 and lang-en0 will compete
	// according to is_cn_main.
	
	AssertIt(is_cn_on||is_en_on, "Program Error: None of lang-cn and lang-en is ON!");
	
	var btn_cn = document.getElementById('btn-cn');
	var btn_en = document.getElementById('btn-en');
	
	function btn_set_state(ele, is_on) {
		ele.classList[is_on ? "add" : "remove"]("button_on");
	}
	
	btn_set_state(btn_cn, is_cn_on);
	btn_set_state(btn_en, is_en_on);

	function batch_cn_en_text(prefix, suffix, is_display) {
		var eles = document.querySelectorAll('.{0}{1}'.format(prefix, suffix));
		for(var ele of eles) {
			if(is_display) {
				// Checking is_display should be done first, otherwise, 
				// ele.scrollHeight will report 0px for a "display:none" element.
				ele.style.display = "block";
			}
			ele.style.height = is_display ? ele.scrollHeight+"px" : "0px";
			
			if(!is_delay_hide)
				hide_if_zeroheight(ele);
		}
	}

	var both_on = is_cn_on && is_en_on;
	batch_cn_en_text("lang-cn", "0", !is_en_on || (both_on&& is_cn_main));
	batch_cn_en_text("lang-en", "0", !is_cn_on || (both_on&&!is_cn_main));
	batch_cn_en_text("lang-cn", "2", is_cn_on);
	batch_cn_en_text("lang-en", "2", is_en_on);
}

function setup_transitionend() {  // TODO: try register event on their parent, register only once
	
	// For each dual-lang text blocks, when css transition ends, I need to call hide_if_zeroheight().
	
	var langs = document.querySelectorAll('[class^="lang-"]');
	langs.forEach(function(ele, idx) {
		ele.addEventListener('transitionend', function(event){
			// console.log(event.target); // debug
			hide_if_zeroheight(event.target);
		});
	});
}

function setup_fixed_position_sidebar() {
	
	// Purpose: I hope to have the side bar stick on screen when user scrolls down.
	// So I'll change that .sidebar DIV to 'position:fixed' once I have acquired 
	// initial positioning parameters for it.
	// We assume that sidebar's width keeps constant all the time.
	
	var gframe = document.querySelector(".globalframe");
	var sidebar = document.querySelector(".sidebar");
	var portrait = document.querySelector('.portrait');
	
	var sidebar_neg_offset = undefined;
	var sidebar_top_margin_px = undefined;
	var sidebar_left_margin_px = undefined;
	
	function try_init_sidebar_fixed_pos() {
		
		// Only when the first time we see the .sidebar is 'position:absolute',
		// will we be able to calculate sidebar_neg_offset.
		// In other word, if user stays in mobile layout, we will not calculate it.
		// By this way, user can adjust .sidebar margin and width solely from CSS.
		
		var cs_sidebar = getComputedStyle(sidebar);
		if(cs_sidebar.position!="absolute")
			return; // already init-ed.
		
		sidebar_neg_offset = sidebar.offsetLeft - gframe.offsetWidth; // typical: -236
		
		sidebar_top_margin_px = cs_sidebar.marginTop;
		sidebar_left_margin_px = cs_sidebar.marginLeft;
	}
	
	// console.log("sidebar_neg_offset="+sidebar_neg_offset);
	
	function fix_sidebar_position() {
		
		try_init_sidebar_fixed_pos(); // we need to get `sidebar_neg_offset` ready
		
		if(sidebar_neg_offset===undefined)
			return; // Don't ruin the "position:absolute" state yet.
		
		var csp = getComputedStyle(portrait); // caution: these code may be fragile
		if(csp.float=='none') { // a real sidebar, desktop layout
			
			sidebar.style.position = "fixed";
			
			var abs_x = gframe.offsetLeft + gframe.offsetWidth + sidebar_neg_offset;
			
			// [2019-06-16] Weird! 'left' and 'top' value for a "fixed" DIV determines
			// the left-top *margin" position, NOT left-top border.
			sidebar.style.left = 'calc({0}px - {1})'.format(abs_x, sidebar_left_margin_px);
			// sidebar.style.top = sidebar_top_margin_px; // no need this
		
		} else { // should be 'right', mobile layout
			sidebar.style.position = "static"; 
		}
	}
	
	fix_sidebar_position(); 
	
	window.addEventListener("resize", function(){
		// Making viewport wider can cause .globalframe to move, 
		// so we need to fix the fixed sidebar position.

		fix_sidebar_position();
	});
}

// Initialization code:
document.addEventListener("DOMContentLoaded", function(){
   
	chj_check_strict_mode();
	
	check_cn_en_pairing();

	prepare_langbtn_callback();
	
	refresh_cn_en_display(true, true, true, false); // TODO: Select one lang according to usr browser lang setting

	setup_transitionend();

	setup_fixed_position_sidebar();
});


function chj_check_strict_mode() {

	try {
		var obj1 = {};
		Object.defineProperty(obj1, 'x', { value: 4, writable: false });
		obj1.x = 444; // throws a TypeError
		
		// var bad_octal = 077; 
			// SyntaxError in strict mode.
			// But we can't use this, bcz it throws before this function body is executed.
	
	} catch (e) {
		// OK. We catch the error, so strict mode is effective.
//		console.log(e)
		return;
	}
	
	alert("Programmer error! Strict mode is NOT enabled!");
}

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

function refresh_cn_en_display(is_cn_on, is_en_on, is_cn_main) {
	
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
			ele.style.height = is_display ? ele.scrollHeight+"px" : "0px";
		}
	}

	var both_on = is_cn_on && is_en_on;
	batch_cn_en_text("lang-cn", "0", !is_en_on || (both_on&& is_cn_main));
	batch_cn_en_text("lang-en", "0", !is_cn_on || (both_on&&!is_cn_main));
	batch_cn_en_text("lang-cn", "2", is_cn_on);
	batch_cn_en_text("lang-en", "2", is_en_on);
}

// Initialization code:
document.addEventListener("DOMContentLoaded", function(){
   
	chj_check_strict_mode();
	
	check_cn_en_pairing();

	prepare_langbtn_callback();
	
	refresh_cn_en_display(true, true, true);
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

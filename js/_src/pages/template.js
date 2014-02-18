;(function() { try {
	//Define the plugin's name here
	var __name = 'template';
	//--
	$.fn[__name] = function(options) {
		//-- Plugin gymnastics - Part 1/3
		//-- ------------------------------------------------------
		var self = this; // prevent from loosing the scope
		self.el = $(this);
		self.el.data(__name, self); // store the plugin instance into the element
		//-- ------------------------------------------------------
		
		
		//-- init
		//-- ------------------------------------------------------
		self.defaults = {
			
		};
		
		self.initialize = function() {
			// merging defaults with passed arguments
			self.options = $.extend({}, self.defaults, options);
			//-
			ignite();
			return self;
		};
		
		//-- Vars
		//-- ------------------------------------------------------
		

		//-- Start
		//-- ------------------------------------------------------

		function ignite() {
			
			bindEvents();
		}

		//-- ------------------------------------------------------
		//-- Events

		function bindEvents() {}

		//-
		return self.initialize();
	}
} catch(e) { err(e);}
})();

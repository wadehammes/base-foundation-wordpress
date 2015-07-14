//(c) W-Shadow

/*global wsEditorData, defaultMenu, customMenu */
/** @namespace wsEditorData */

wsEditorData.wsMenuEditorPro = !!wsEditorData.wsMenuEditorPro; //Cast to boolean.
var wsIdCounter = 0;

var AmeCapabilityManager = (function(roles, users) {
    var me = {};
	users = users || {};

    function parseActorString(actor) {
        var separator = actor.indexOf(':');
        if (separator == -1) {
            throw {
                name: 'InvalidActorException',
                message: "Actor string does not contain a colon.",
                value: actor
            };
        }

        return {
            'type' : actor.substring(0, separator),
            'id' : actor.substring(separator + 1)
        }
    }

    me.hasCap = function(actor, capability, context) {
		context = context || {};
        var actorData = parseActorString(actor);

	    //Super admins have access to everything, unless specifically denied.
	    if ( actor == 'special:super_admin' ) {
		    return (capability != 'do_not_allow');
	    }

	    if (actorData.type == 'role') {
			return me.roleHasCap(actorData.id, capability);
	    } else if (actorData.type == 'user') {
		    return me.userHasCap(actorData.id, capability, context);
	    }

	    throw {
		    name: 'InvalidActorTypeException',
		    message: "The specified actor type is not supported",
		    value: actor,
		    'actorType': actorData.type
	    };
    };

	me.roleHasCap = function(roleId, capability) {
		if (!roles.hasOwnProperty(roleId)) {
			throw {
				name: 'UnknownRoleException',
				message: 'Can not check capabilities for an unknown role',
				value: roleId,
				requireCapability: capability
			};
		}

		var role = roles[roleId];
		if ( role.capabilities.hasOwnProperty(capability) ) {
			return role.capabilities[capability];
		} else if (roleId == capability) {
			return true;
		}
		return false;
	};

	me.userHasCap = function(login, capability, context) {
		context = context || {};
		if (!users.hasOwnProperty(login)) {
			throw {
				name: 'UnknownUserException',
				message: 'Can not check capabilities for an unknown user',
				value: login,
				requireCapability: capability
			};
		}

		var user = users[login];
		if ( user.capabilities.hasOwnProperty(capability) ) {
			return user.capabilities[capability];
		} else {
            //Super Admins have all capabilities, except those explicitly denied.
            //We also need to check if the Super Admin actor is allowed in this context.
            if (user.is_super_admin ) {
                if (context.hasOwnProperty('special:super_admin')) {
                    return context['special:super_admin'];
                }
                return (capability != 'do_not_allow');
            }

			//Check if any of the user's roles have the capability.
			for(var index = 0; index < user.roles.length; index++) {
				var roleId = user.roles[index];

				//Skip roles that are disabled in this context (i.e. via grant_access).
				if (context.hasOwnProperty('role:' + roleId) && !context['role:' + roleId]) {
					continue;
				}

				if (me.roleHasCap(roleId, capability)) {
					return true;
				}
			}
		}

		return false;
	};

	me.roleExists = function(roleId) {
		return roles.hasOwnProperty(roleId);
	};

	/**
	 * Compare the specificity of two actors.
	 *
	 * Returns 1 if the first actor is more specific than the second, 0 if they're both
	 * equally specific, and -1 if the second actor is more specific.
	 *
	 * @param {String} actor1
	 * @param {String} actor2
	 * @return {Number}
	 */
    me.compareActorSpecificity = function(actor1, actor2) {
		var delta = me.getActorSpecificity(actor1) - me.getActorSpecificity(actor2);
		if (delta !== 0) {
			delta = (delta > 0) ? 1 : -1;
		}
		return delta;
    };

    me.getActorSpecificity = function(actorString) {
        var actor = parseActorString(actorString);
		var specificity = 0;
        switch(actor.type) {
            case 'role':
                specificity = 1;
				break;
			case 'special':
				specificity = 2;
				break;
			case 'user':
				specificity = 10;
				break;
			default:
				specificity = 0;
        }
		return specificity;
    };


	return me;
})(wsEditorData.roles, wsEditorData.users);


var AmeEditorApi = {};

(function ($){

var selectedActor = null;

var itemTemplates = {
	templates: wsEditorData.itemTemplates,

	getTemplateById: function(templateId) {
		if (wsEditorData.itemTemplates.hasOwnProperty(templateId)) {
			return wsEditorData.itemTemplates[templateId];
		} else if ((templateId == '') || (templateId == 'custom')) {
			return wsEditorData.customItemTemplate;
		}
		return null;
	},

	getDefaults: function (templateId) {
		var template = this.getTemplateById(templateId);
		if (template) {
			return template.defaults;
		} else {
			return null;
		}
	},

	getDefaultValue: function (templateId, fieldName) {
		if (fieldName == 'template_id') {
			return null;
		}

		var defaults = this.getDefaults(templateId);
		if (defaults && (typeof defaults[fieldName] != 'undefined')) {
			return defaults[fieldName];
		}
		return null;
	},

	hasDefaultValue: function(templateId, fieldName) {
		return (this.getDefaultValue(templateId, fieldName) !== null);
	}
};

/**
 * Set an input field to a value. The only difference from jQuery.val() is that
 * setting a checkbox to true/false will check/clear it.
 *
 * @param input
 * @param value
 */
function setInputValue(input, value) {
	if (input.attr('type') == 'checkbox'){
		input.prop('checked', value);
    } else {
        input.val(value);
    }
}

/**
 * Get the value of an input field. The only difference from jQuery.val() is that
 * checked/unchecked checkboxes will return true/false.
 *
 * @param input
 * @return {*}
 */
function getInputValue(input) {
	if (input.attr('type') == 'checkbox'){
		return input.is(':checked');
	}
	return input.val();
}


/*
 * Utility function for generating pseudo-random alphanumeric menu IDs.
 * Rationale: Simpler than atomically auto-incrementing or globally unique IDs.
 */
function randomMenuId(prefix, size){
	prefix = (typeof prefix == 'undefined') ? 'custom_item_' : prefix;
	size = (typeof size == 'undefined') ? 5 : size;

    var suffix = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < size; i++ ) {
        suffix += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return prefix + suffix;
}

function outputWpMenu(menu){
	var menuCopy = $.extend(true, {}, menu);
	var menuBox = $('#ws_menu_box');

	//Remove the current menu data
	menuBox.empty();
	$('#ws_submenu_box').empty();

	//Display the new menu
	var i = 0;
	for (var filename in menuCopy){
		if (!menuCopy.hasOwnProperty(filename)){
			continue;
		}
		outputTopMenu(menuCopy[filename]);
		i++;
	}

	//Automatically select the first top-level menu
	menuBox.find('.ws_menu:first').click();
}

/*
 * Create edit widgets for a top-level menu and its submenus and append them all to the DOM.
 *
 * Inputs :
 *	menu - an object containing menu data
 *	afterNode - if specified, the new menu widget will be inserted after this node. Otherwise,
 *	            it will be added to the end of the list.
 * Outputs :
 *	Object with two fields - 'menu' and 'submenu' - containing the DOM nodes of the created widgets.
 */
function outputTopMenu(menu, afterNode){
	//Create a container for menu items, even if there are none
	var submenu = buildSubmenu(menu.items);

	//Create the menu widget
	var menu_obj = buildMenuItem(menu, true);
	menu_obj.data('submenu_id', submenu.attr('id'));
	submenu.data('parent_menu_id', menu_obj.attr('id'));

	//Display
	submenu.appendTo('#ws_submenu_box');
	updateItemEditor(menu_obj);
	if ( (typeof afterNode != 'undefined') && (afterNode != null) ){
		$(afterNode).after(menu_obj);
	} else {
		menu_obj.appendTo('#ws_menu_box');
	}

	return {
		'menu' : menu_obj,
		'submenu' : submenu
	};
}

/*
 * Create and populate a submenu container.
 */
function buildSubmenu(items){
	//Create a container for menu items, even if there are none
	var submenu = $('<div class="ws_submenu" style="display:none;"></div>');
	submenu.attr('id', 'ws-submenu-'+(wsIdCounter++));

	//Only show menus that have items.
	//Skip arrays (with a length) because filled menus are encoded as custom objects.
	var entry = null;
	if (items) {
		$.each(items, function(index, item) {
			entry = buildMenuItem(item, false);
			if ( entry ){
				updateItemEditor(entry);
				submenu.append(entry);
			}
		});
	}

	//Make the submenu sortable
	makeBoxSortable(submenu);

	return submenu;
}

/**
 * Create an edit widget for a menu item.
 *
 * @param {Object} itemData
 * @param {Boolean} [isTopLevel] Specify if this is a top-level menu or a sub-menu item. Defaults to false (= sub-item).
 * @return {*} The created widget as a jQuery object.
 */
function buildMenuItem(itemData, isTopLevel) {
	isTopLevel = (typeof isTopLevel == 'undefined') ? false : isTopLevel;

	//Create the menu HTML
	var item = $('<div></div>')
		.attr('class', "ws_container")
		.attr('id', 'ws-menu-item-' + (wsIdCounter++))
		.data('menu_item', itemData)
		.data('field_editors_created', false);

	item.addClass(isTopLevel ? 'ws_menu' : 'ws_item');
	if ( itemData.separator ) {
		item.addClass('ws_menu_separator');
	}

	//Add a header and a container for property editors (to improve performance
	//the editors themselves are created later, when the user tries to access them
	//for the first time).
	var contents = [];
	var menuTitle = ((itemData.menu_title != null) ? itemData.menu_title : itemData.defaults.menu_title);
	if (menuTitle === '') {
		menuTitle = '&nbsp;';
	}

	contents.push(
		'<div class="ws_item_head">',
			itemData.separator ? '' : '<a class="ws_edit_link"> </a><div class="ws_flag_container"> </div>',
			'<input type="checkbox" class="ws_actor_access_checkbox">',
			'<span class="ws_item_title">',
				stripAllTags(menuTitle),
			'&nbsp;</span>',

		'</div>',
		'<div class="ws_editbox" style="display: none;"></div>'
	);
	item.append(contents.join(''));

	//Apply flags based on the item's state
	var flags = ['hidden', 'unused', 'custom'];
	for (var i = 0; i < flags.length; i++) {
		setMenuFlag(item, flags[i], getFieldValue(itemData, flags[i], false));
	}

	if ( isTopLevel && !itemData.separator ){
		//Allow the user to drag menu items to top-level menus
		item.droppable({
			'hoverClass' : 'ws_menu_drop_hover',

			'accept' : (function(thing){
				return thing.hasClass('ws_item');
			}),

			'drop' : (function(event, ui){
				var droppedItemData = readItemState(ui.draggable);
				var new_item = buildMenuItem(droppedItemData, false);

				var sourceSubmenu = ui.draggable.parent();
				var submenu = $('#' + item.data('submenu_id'));
				submenu.append(new_item);

				if ( !event.ctrlKey ) {
					ui.draggable.remove();
				}

				updateItemEditor(new_item);

				//Moving an item can change aggregate menu permissions. Update the UI accordingly.
				updateParentAccessUi(submenu);
				updateParentAccessUi(sourceSubmenu);
			})
		});
	}

	return item;
}

function jsTrim(str){
	return str.replace(/^\s+|\s+$/g, "");
}

function stripAllTags(input) {
	//Based on: http://phpjs.org/functions/strip_tags/
	var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
		commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
	return input.replace(commentsAndPhpTags, '').replace(tags, '');
}

//Editor field spec template.
var baseField = {
	caption : '[No caption]',
    standardCaption : true,
	advanced : false,
	type : 'text',
	defaultValue: '',
	onlyForTopMenus: false,
	addDropdown : false,
	visible: true,

	write: null,
	display: null
};

/*
 * List of all menu fields that have an associated editor
 */
var knownMenuFields = {
	'menu_title' : $.extend({}, baseField, {
		caption : 'Menu title',
		display: function(menuItem, displayValue, input, containerNode) {
			//Update the header as well.
			containerNode.find('.ws_item_title').html(stripAllTags(displayValue) + '&nbsp;');
			return displayValue;
		},
		write: function(menuItem, value, input, containerNode) {
			menuItem.menu_title = value;
			containerNode.find('.ws_item_title').html(stripAllTags(input.val()) + '&nbsp;');
		}
	}),

	'template_id' : $.extend({}, baseField, {
		caption : 'Target page',
		type : 'select',
		options : (function(){
			//Generate name => id mappings for all item templates + the special "Custom" template.
			var itemTemplateIds = [];
			itemTemplateIds.push([wsEditorData.customItemTemplate.name, '']);

			for (var template_id in wsEditorData.itemTemplates) {
				if (wsEditorData.itemTemplates.hasOwnProperty(template_id)) {
					itemTemplateIds.push([wsEditorData.itemTemplates[template_id].name, template_id]);
				}
			}

			itemTemplateIds.sort(function(a, b) {
				if (a[1] === b[1]) {
					return 0;
				}

				//The "Custom" item is always first.
				if (a[1] === '') {
					return -1;
				} else if (b[1] === '') {
					return 1;
				}

				//Top-level items go before submenus.
				var aIsTop = (a[1].charAt(0) === '>') ? 1 : 0;
				var bIsTop = (b[1].charAt(0) === '>') ? 1 : 0;
				if (aIsTop !== bIsTop) {
					return bIsTop - aIsTop;
				}

				//Everything else is sorted by name, in alphabetical order.
				if (a[0] > b[0]) {
					return 1;
				} else if (a[0] < b[0]) {
					return -1;
				}
				return 0;
			});

			return itemTemplateIds;
		})(),

		write: function(menuItem, value, input, containerNode) {
			var oldTemplateId = menuItem.template_id;

			menuItem.template_id = value;
			menuItem.defaults = itemTemplates.getDefaults(menuItem.template_id);
		    menuItem.custom = (menuItem.template_id == '');

		    // The file/URL of non-custom items is read-only and equal to the default
		    // value. Rationale: simplifies menu generation, prevents some user mistakes.
		    if (menuItem.template_id !== '') {
			    menuItem.file = null;
		    }

		    // The new template might not have default values for some of the fields
		    // currently set to null (= "default"). In those cases, we need to make
		    // the current values explicit.
		    containerNode.find('.ws_edit_field').each(function(index, field){
			    field = $(field);
			    var fieldName = field.data('field_name');
			    var isSetToDefault = (menuItem[fieldName] === null);
			    var hasDefaultValue = itemTemplates.hasDefaultValue(menuItem.template_id, fieldName);

			    if (isSetToDefault && !hasDefaultValue) {
					var oldDefaultValue = itemTemplates.getDefaultValue(oldTemplateId, fieldName);
					if (oldDefaultValue !== null) {
						menuItem[fieldName] = oldDefaultValue;
					}
			    }
		    });
		}
	}),

	'file' : $.extend({}, baseField, {
		caption: 'URL',
		display: function(menuItem, displayValue, input) {
			// The URL/file field is read-only for default menus. Also, since the "file"
			// field is usually set to a page slug or plugin filename for plugin/hook pages,
			// we display the dynamically generated "url" field here (i.e. the actual URL) instead.
			if (menuItem.template_id !== '') {
				input.attr('readonly', 'readonly');
				displayValue = itemTemplates.getDefaultValue(menuItem.template_id, 'url');
			} else {
				input.removeAttr('readonly');
			}
			return displayValue;
		},

		write: function(menuItem, value) {
			// A menu must always have a non-empty URL. If the user deletes the current value,
			// reset it to the old value.
			if (value === '') {
				value = menuItem.file;
			}
			// Default menus always point to the default file/URL.
			if (menuItem.template_id !== '') {
				value = null;
			}
			menuItem.file = value;
		}
	}),

	'access_level' : $.extend({}, baseField, {
		caption: 'Permissions',
		defaultValue: 'read',
		type: 'access_editor',
		visible: false, //Will be set to visible only in Pro version.

		display: function(menuItem) {
			//Permissions display is a little complicated and could use improvement.
			var requiredCap = getFieldValue(menuItem, 'access_level', '');
			var extraCap = getFieldValue(menuItem, 'extra_capability', '');

			var displayValue = (menuItem.template_id === '') ? '< Custom >' : requiredCap;
			if (extraCap !== '') {
				if (menuItem.template_id === '') {
					displayValue = extraCap;
				} else {
					displayValue = displayValue + '+' + extraCap;
				}
			}

			return displayValue;
		},

		write: function(menuItem) {
			//The required capability can't be directly edited and always equals the default.
			menuItem.access_level = null;
		}
	}),

	'extra_capability' : $.extend({}, baseField, {
		caption: 'Required capability',
		defaultValue: 'read',
		type: 'text',
		addDropdown: 'ws_cap_selector',

		display: function(menuItem) {
			//Permissions display is a little complicated and could use improvement.
			var requiredCap = getFieldValue(menuItem, 'access_level', '');
			var extraCap = getFieldValue(menuItem, 'extra_capability', '');

			var displayValue = extraCap;
			if ((extraCap === '') || (extraCap === null)) {
				displayValue = requiredCap;
			}

			return displayValue;
		},

		write: function(menuItem, value) {
			value = jsTrim(value);

			//Reset to default if the user clears the input.
			if (value === '') {
				menuItem.extra_capability = null;
				return;
			}

			//It would be redundant to set an extra_capability that it matches access_level.
			var requiredCap = getFieldValue(menuItem, 'access_level', '');
			var extraCap = getFieldValue(menuItem, 'extra_capability', '');
			if (extraCap === '' && value === requiredCap) {
				return;
			}

			menuItem.extra_capability = value;
		}
	}),

	'page_title' : $.extend({}, baseField, {
		caption: "Window title",
        standardCaption : true,
		advanced : true
	}),

	'open_in' : $.extend({}, baseField, {
		caption: 'Open in',
		advanced : true,
		type : 'select',
		options : [
			['Same window or tab', 'same_window'],
			['New window', 'new_window'],
			['Frame', 'iframe']
		],
		defaultValue: 'same_window',
		visible: false
	}),

	'css_class' : $.extend({}, baseField, {
		caption: 'CSS classes',
		advanced : true,
		onlyForTopMenus: true
	}),

	'icon_url' : $.extend({}, baseField, {
		caption: 'Icon URL',
		type : 'icon_selector',
		advanced : true,
		defaultValue: 'div',
		onlyForTopMenus: true,

		display: function(menuItem, displayValue, input, containerNode) {
			//Display the current icon in the selector.
			var cssClass = getFieldValue(menuItem, 'css_class', '');
			var iconUrl = getFieldValue(menuItem, 'icon_url', '');

			//When submenu icon visibility is set to "only if manually selected",
			//don't show the default submenu icons.
			var isDefault = (typeof menuItem['icon_url'] === 'undefined') || (menuItem['icon_url'] === null);
			if (isDefault && (wsEditorData.submenuIconsEnabled === 'if_custom') && containerNode.hasClass('ws_item')) {
				iconUrl = 'none';
				cssClass = '';
			}

			var selectButton = input.closest('.ws_edit_field').find('.ws_select_icon');
			var cssIcon = selectButton.find('.icon16');
			var imageIcon = selectButton.find('img');

			var matches = cssClass.match(/\b(ame-)?menu-icon-([^\s]+)\b/);
			var dashiconMatches = iconUrl && iconUrl.match(/^\s*(dashicons-[a-z0-9\-]+)/);

			//Icon URL takes precedence over icon class.
			if ( iconUrl && iconUrl !== 'none' && iconUrl !== 'div' && !dashiconMatches ) {
				//Regular image icon.
				cssIcon.hide();
				imageIcon.prop('src', iconUrl).show();
			} else if ( dashiconMatches ) {
				//Dashicon.
				imageIcon.hide();
				cssIcon.removeClass().addClass('icon16 dashicons ' + dashiconMatches[1]).show();
			} else if ( matches ) {
				//Other CSS-based icon.
				imageIcon.hide();
				var iconClass = (matches[1] ? matches[1] : '') + 'icon-' + matches[2];
				cssIcon.removeClass().addClass('icon16 ' + iconClass).show();
			} else {
				//This menu has no icon at all. This is actually a valid state
				//and WordPress will display a menu like that correctly.
				imageIcon.hide();
				cssIcon.removeClass().addClass('icon16').show();
			}

			return displayValue;
		}
	}),

	'colors' : $.extend({}, baseField, {
		caption: 'Color scheme',
		defaultValue: 'Default',
		type: 'color_scheme_editor',
		onlyForTopMenus: true,
		visible: false,
		advanced : true,

		display: function(menuItem, displayValue, input, containerNode) {
			var colors = getFieldValue(menuItem, 'colors', {});
			var colorList = containerNode.find('.ws_color_scheme_display');

			colorList.empty();
			var count = 0, maxColorsToShow = 7;

			$.each(colors, function(name, value) {
				if ( !value || (count >= maxColorsToShow) ) {
					return;
				}

				colorList.append(
					$('<span></span>').addClass('ws_color_display_item').css('background-color', value)
				);
				count++;
			});

			if (count === 0) {
				colorList.append('Default');
			}

			return 'Placeholder. You should never see this.';
		},

		write: function(menuItem) {
			//Menu colors can't be directly edited.
		}
	}),

	'page_heading' : $.extend({}, baseField, {
		caption: 'Page heading',
		advanced : true,
		onlyForTopMenus: false,
		visible: false
	}),

	'hookname' : $.extend({}, baseField, {
		caption: 'Hook name',
		advanced : true,
		onlyForTopMenus: true
	})
};

/*
 * Create editors for the visible fields of a menu entry and append them to the specified node.
 */
function buildEditboxFields(fieldContainer, entry, isTopLevel){
	isTopLevel = (typeof isTopLevel == 'undefined') ? false : isTopLevel;

	var basicFields = $('<div class="ws_edit_panel ws_basic"></div>').appendTo(fieldContainer);
    var advancedFields = $('<div class="ws_edit_panel ws_advanced"></div>').appendTo(fieldContainer);

    if ( wsEditorData.hideAdvancedSettings ){
    	advancedFields.css('display', 'none');
    }

	for (var field_name in knownMenuFields){
		if (!knownMenuFields.hasOwnProperty(field_name)) {
			continue;
		}

		var fieldSpec = knownMenuFields[field_name];
		if (fieldSpec.onlyForTopMenus && !isTopLevel) {
			continue;
		}

		var field = buildEditboxField(entry, field_name, fieldSpec);
		if (field){
            if (fieldSpec.advanced){
                advancedFields.append(field);
            } else {
                basicFields.append(field);
            }
		}
	}

	//Add a link that shows/hides advanced fields
	fieldContainer.append(
		'<div class="ws_toggle_container"><a href="#" class="ws_toggle_advanced_fields"'+
		(wsEditorData.hideAdvancedSettings ? '' : ' style="display:none;"')+'>'+
		(wsEditorData.hideAdvancedSettings ? wsEditorData.captionShowAdvanced : wsEditorData.captionHideAdvanced)
		+'</a></div>'
	);
}

/*
 * Create an editor for a specified field.
 */
//noinspection JSUnusedLocalSymbols
function buildEditboxField(entry, field_name, field_settings){
	//Build a form field of the appropriate type
	var inputBox = null;
	var basicTextField = '<input type="text" class="ws_field_value">';
	//noinspection FallthroughInSwitchStatementJS
	switch(field_settings.type){
		case 'select':
			inputBox = $('<select class="ws_field_value">');
			var option = null;
			for( var index = 0; index < field_settings.options.length; index++ ){
				var optionTitle = field_settings.options[index][0];
				var optionValue = field_settings.options[index][1];

				option = $('<option>')
					.val(optionValue)
					.text(optionTitle);
				option.appendTo(inputBox);
			}
			break;

        case 'checkbox':
            inputBox = $('<label><input type="checkbox" class="ws_field_value"> '+
                field_settings.caption+'</label>'
            );
            break;

		case 'access_editor':
			inputBox = $('<input type="text" class="ws_field_value" readonly="readonly">')
                .add('<input type="button" class="button ws_launch_access_editor" value="Edit...">');
			break;

		case 'icon_selector':
			inputBox = $(basicTextField)
                .add('<button class="button ws_select_icon" title="Select icon"><div class="icon16 icon-settings"></div><img src="" style="display:none;"></button>');
			break;

		case 'color_scheme_editor':
			inputBox = $('<span class="ws_color_scheme_display">Placeholder</span>')
				.add('<input type="button" class="button ws_open_color_editor" value="Edit...">');
			break;

		case 'text': //Intentional fall-through.
		default:
			inputBox = $(basicTextField);
	}


	var className = "ws_edit_field ws_edit_field-"+field_name;
	if (field_settings.addDropdown){
		className += ' ws_has_dropdown';
	}

	var editField = $('<div>' + (field_settings.standardCaption ? (field_settings.caption+'<br>') : '') + '</div>')
		.attr('class', className)
		.append(inputBox);

	if (field_settings.addDropdown) {
		//Add a dropdown button
		var dropdownId = field_settings.addDropdown;
		editField.append(
			$('<input type="button" value="&#9660;">')
				.addClass('button ws_dropdown_button')
				.attr('tabindex', '-1')
				.data('dropdownId', dropdownId)
		);
	}

	editField
		.append('<img src="' + wsEditorData.imagesUrl + '/transparent16.png" class="ws_reset_button" title="Reset to default value">&nbsp;</img>')
		.data('field_name', field_name);

	if ( !field_settings.visible ){
		editField.css('display', 'none');
	}

	return editField;
}

/**
 * Update the UI elements that that indicate whether the currently selected
 * actor can access a menu item.
 *
 * @param containerNode
 */
function updateActorAccessUi(containerNode) {
	//Update the permissions checkbox & UI
	if (selectedActor != null) {
		var menuItem = containerNode.data('menu_item');
		var hasAccess = actorCanAccessMenu(menuItem, selectedActor);
		var hasCustomPermissions = actorHasCustomPermissions(menuItem, selectedActor);

		var checkbox = containerNode.find('.ws_actor_access_checkbox');
		checkbox.prop('checked', hasAccess);

		//Display the checkbox differently if some items of this menu are hidden and some are visible,
		//or if their permissions don't match this menu's permissions.
		var submenuId = containerNode.data('submenu_id');
		var submenuItems = submenuId ? $('#' + submenuId).children('.ws_container') : [];
		if (!submenuId || submenuItems.length === 0) {
			//This menu doesn't contain any items.
			checkbox.prop('indeterminate', false);
		} else {
			var differentPermissions = false;
			submenuItems.each(function() {
				var item = $(this).data('menu_item');
				if ( !item ) { //Skip placeholder items created by drag & drop operations.
					return true;
				}
				var hasSubmenuAccess = actorCanAccessMenu(item, selectedActor);
				if (hasSubmenuAccess !== hasAccess) {
					differentPermissions = true;
					return false;
				}
				return true;
			});

			checkbox.prop('indeterminate', differentPermissions);
		}

		containerNode.toggleClass('ws_is_hidden_for_actor', !hasAccess);
		containerNode.toggleClass('ws_has_custom_permissions_for_actor', hasCustomPermissions);
		setMenuFlag(containerNode, 'custom_actor_permissions', hasCustomPermissions)
	} else {
		containerNode.removeClass('ws_is_hidden_for_actor ws_has_custom_permissions_for_actor');
		setMenuFlag(containerNode, 'custom_actor_permissions', false);
	}
}

/**
 * Like updateActorAccessUi() except it updates the specified menu's parent, not the menu itself.
 * If the menu has no parent (i.e. it's a top-level menu), this function does nothing.
 *
 * @param containerNode Either a menu item or a submenu container.
 */
function updateParentAccessUi(containerNode) {
	var submenu;
	if ( containerNode.is('.ws_submenu') ) {
		submenu = containerNode;
	} else {
		submenu = containerNode.parent();
	}

	var parentId = submenu.data('parent_menu_id');
	if (parentId) {
		updateActorAccessUi($('#' + parentId));
	}
}

/**
 * Update an edit widget with the current menu item settings.
 *
 * @param containerNode
 */
function updateItemEditor(containerNode) {
	var menuItem = containerNode.data('menu_item');

	//Apply flags based on the item's state.
	var flags = ['hidden', 'unused', 'custom'];
	for (var i = 0; i < flags.length; i++) {
		setMenuFlag(containerNode, flags[i], getFieldValue(menuItem, flags[i], false));
	}

	//Update the permissions checkbox & other actor-specific UI
	updateActorAccessUi(containerNode);

	//Update all input fields with the current values.
	containerNode.find('.ws_edit_field').each(function(index, field) {
		field = $(field);
		var fieldName = field.data('field_name');
		var input = field.find('.ws_field_value').first();

		var hasADefaultValue = itemTemplates.hasDefaultValue(menuItem.template_id, fieldName);
		var defaultValue = itemTemplates.getDefaultValue(menuItem.template_id, fieldName);
		var isDefault = hasADefaultValue && (menuItem[fieldName] === null);

        if (fieldName == 'access_level') {
            isDefault = (getFieldValue(menuItem, 'extra_capability', '') === '') && isEmptyObject(menuItem.grant_access);
        }

		field.toggleClass('ws_has_no_default', !hasADefaultValue);
		field.toggleClass('ws_input_default', isDefault);

		var displayValue = isDefault ? defaultValue : menuItem[fieldName];
		if (knownMenuFields[fieldName].display !== null) {
			displayValue = knownMenuFields[fieldName].display(menuItem, displayValue, input, containerNode);
		}

        setInputValue(input, displayValue);
    });
}

function isEmptyObject(obj) {
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            return false;
        }
    }
    return true;
}

/*
 * Get the current value of a single menu field.
 *
 * If the specified field is not set, this function will attempt to retrieve it
 * from the "defaults" property of the menu object. If *that* fails, it will return
 * the value of the optional third argument defaultValue.
 */
function getFieldValue(entry, fieldName, defaultValue){
	if ( (typeof entry[fieldName] === 'undefined') || (entry[fieldName] === null) ) {
		if ( (typeof entry['defaults'] === 'undefined') || (typeof entry['defaults'][fieldName] === 'undefined') ){
			return defaultValue;
		} else {
			return entry.defaults[fieldName];
		}
	} else {
		return entry[fieldName];
	}
}

/*
 * Make a menu container sortable
 */
function makeBoxSortable(menuBox){
	//Make the submenu sortable
	menuBox.sortable({
		items: '> .ws_container',
		cursor: 'move',
		dropOnEmpty: true,
		cancel : '.ws_editbox, .ws_edit_link'
	});
}

/***************************************************************************
                       Parsing & encoding menu inputs
 ***************************************************************************/

/**
 * Encode the current menu structure as JSON
 *
 * @return {String} A JSON-encoded string representing the current menu tree loaded in the editor.
 */
function encodeMenuAsJSON(tree){
	if (typeof tree == 'undefined' || !tree) {
		tree = readMenuTreeState();
	}
	tree.format = {
		name: wsEditorData.menuFormatName,
		version: wsEditorData.menuFormatVersion
	};
	return $.toJSON(tree);
}

function readMenuTreeState(){
	var tree = {};
	var menuPosition = 0;
	var itemsByFilename = {};

	//Gather all menus and their items
	$('#ws_menu_box').find('.ws_menu').each(function() {
		var containerNode = this;
		var menu = readItemState(containerNode, menuPosition++);

		//Attach the current menu to the main structure.
		var filename = (menu.file !== null) ? menu.file : menu.defaults.file;

		//Give unclickable items unique keys.
		if (menu.template_id === wsEditorData.unclickableTemplateId) {
			ws_paste_count++;
			filename = '#' + wsEditorData.unclickableTemplateClass + '-' + ws_paste_count;
		}

		//Prevent the user from saving top level items with duplicate URLs.
		//WordPress indexes the submenu array by parent URL and AME uses a {url : menu_data} hashtable internally.
		//Duplicate URLs would cause problems for both.
		if (itemsByFilename.hasOwnProperty(filename)) {
			throw {
				code: 'duplicate_top_level_url',
				message: 'Error: Found a duplicate URL! All top level menus must have unique URLs.',
				duplicates: [itemsByFilename[filename], containerNode]
			}
		}

		tree[filename] = menu;
		itemsByFilename[filename] = containerNode;
	});

	return {
		tree: tree
	};
}

AmeEditorApi.readMenuTreeState = readMenuTreeState;

/**
 * Extract the current menu item settings from its editor widget.
 *
 * @param itemDiv DOM node containing the editor widget, usually with the .ws_item or .ws_menu class.
 * @param {Number} [position] Menu item position among its sibling menu items. Defaults to zero.
 * @return {Object} A menu object in the tree format.
 */
function readItemState(itemDiv, position){
	position = (typeof position == 'undefined') ? 0 : position;

	itemDiv = $(itemDiv);
	var item = $.extend({}, wsEditorData.blankMenuItem, itemDiv.data('menu_item'), readAllFields(itemDiv));

	item.defaults = itemDiv.data('menu_item').defaults;

	//Save the position data
	item.position = position;
	item.defaults.position = position; //The real default value will later overwrite this

	item.separator = itemDiv.hasClass('ws_menu_separator');
	item.hidden = menuHasFlag(itemDiv, 'hidden');
	item.custom = menuHasFlag(itemDiv, 'custom');

	//Gather the menu's sub-items, if any
	item.items = [];
	var subMenuId = itemDiv.data('submenu_id');
	if (subMenuId) {
		var itemPosition = 0;
		$('#' + subMenuId).find('.ws_item').each(function () {
			var sub_item = readItemState(this, itemPosition++);
			item.items.push(sub_item);
		});
	}

	return item;
}

/*
 * Extract the values of all menu/item fields present in a container node
 *
 * Inputs:
 *	container - a jQuery collection representing the node to read.
 */
function readAllFields(container){
	if ( !container.hasClass('ws_container') ){
		container = container.closest('.ws_container');
	}

	if ( !container.data('field_editors_created') ){
		return container.data('menu_item');
	}

	var state = {};

	//Iterate over all fields of the item
	container.find('.ws_edit_field').each(function() {
		var field = $(this);

		//Get the name of this field
		var field_name = field.data('field_name');
		//Skip if unnamed
		if (!field_name) {
			return true;
		}

		//Find the field (usually an input or select element).
		var input_box = field.find('.ws_field_value');

		//Save null if default used, custom value otherwise
		if (field.hasClass('ws_input_default')){
			state[field_name] = null;
		} else {
			state[field_name] = getInputValue(input_box);
		}
		return true;
	});

    //Permission settings are not stored in the visible access_level field (that's just for show),
    //so do not attempt to read them from there.
    state['access_level'] = null;

	return state;
}


/***************************************************************************
 Flag manipulation
 ***************************************************************************/

var item_flags = {
	'custom':'This is a custom menu item',
	'unused':'This item was automatically recreated. You cannot delete a non-custom item, but you could hide it.',
	'hidden':'This item is hidden from ALL roles and users',
	'custom_actor_permissions' : "The selected role has custom permissions for this item."
};

function setMenuFlag(item, flag, state) {
	item = $(item);

	var item_class = 'ws_' + flag;
	var img_class = 'ws_' + flag + '_flag';

	item.toggleClass(item_class, state);
	if (state) {
		//Add the flag image,
		var flag_container = item.find('.ws_flag_container');
		if ( flag_container.find('.' + img_class).length == 0 ){
			flag_container.append('<div class="ws_flag '+img_class+'" title="'+item_flags[flag]+'"></div>');
		}
	} else {
		//Remove the flag image.
		item.find('.' + img_class).remove();
	}
}

function menuHasFlag(item, flag){
	return $(item).hasClass('ws_'+flag);
}

/***********************************************************
                  Capability manipulation
 ************************************************************/

function actorCanAccessMenu(menuItem, actor) {
	if (!$.isPlainObject(menuItem.grant_access)) {
		menuItem.grant_access = {};
	}

	//By default, any actor that has the required cap has access to the menu.
	//Users can override this on a per-menu basis.
	var requiredCap = getFieldValue(menuItem, 'access_level', '< Error: access_level is missing! >');
	var actorHasAccess = false;
	if (menuItem.grant_access.hasOwnProperty(actor)) {
		actorHasAccess = menuItem.grant_access[actor];
	} else {
		actorHasAccess = AmeCapabilityManager.hasCap(actor, requiredCap, menuItem.grant_access);
	}
	return actorHasAccess;
}

AmeEditorApi.actorCanAccessMenu = actorCanAccessMenu;

function actorHasCustomPermissions(menuItem, actor) {
	if (menuItem.grant_access && menuItem.grant_access.hasOwnProperty && menuItem.grant_access.hasOwnProperty(actor)) {
		return (menuItem.grant_access[actor] !== null);
	}
	return false;
}

function setActorAccess(containerNode, actor, allowAccess) {
	var menuItem = containerNode.data('menu_item');

	//grant_access comes from PHP, which JSON-encodes empty assoc. arrays as arrays.
	//However, we want it to be a dictionary.
	if (!$.isPlainObject(menuItem.grant_access)) {
		menuItem.grant_access = {};
	}

	menuItem.grant_access[actor] = allowAccess;
}

function setSelectedActor(actor) {
	//Check if the specified actor really exists. The actor ID
	//could be invalid if it was supplied by the user.
	if (actor !== null) {
		var newSelectedItem = $('a[href$="#'+ actor +'"]');
		if (newSelectedItem.length === 0) {
			return;
		}
	}

	selectedActor = actor;

	//Highlight the actor.
	var actorSelector = $('#ws_actor_selector');
	$('.current', actorSelector).removeClass('current');

	if (selectedActor == null) {
		$('a.ws_no_actor').addClass('current');
	} else {
		newSelectedItem.addClass('current');
	}

	//There are some UI elements that can be visible or hidden depending on whether an actor is selected.
	var editorNode = $('#ws_menu_editor');
	editorNode.toggleClass('ws_is_actor_view', (selectedActor != null));

	//Update the menu item states to indicate whether they're accessible.
	editorNode.find('.ws_container').each(function() {
		updateActorAccessUi($(this));
	});
}

/**
 * Make a menu item inaccessible to everyone except a particular actor.
 *
 * Will not change access settings for actors that are more specific than the input actor.
 * For example, if the input actor is a "role:", this function will only disable other roles,
 * but will leave "user:" actors untouched.
 *
 * @param {Object} menuItem
 * @param {String} actor
 * @return {Object}
 */
function denyAccessForAllExcept(menuItem, actor) {
	//grant_access comes from PHP, which JSON-encodes empty assoc. arrays as arrays.
	//However, we want it to be a dictionary.
	if (!$.isPlainObject(menuItem.grant_access)) {
		menuItem.grant_access = {};
	}

	$.each(wsEditorData.actors, function(otherActor) {
		//If the input actor is more or equally specific...
		if ((actor === null) || (AmeCapabilityManager.compareActorSpecificity(actor, otherActor) >= 0)) {
			menuItem.grant_access[otherActor] = false;
		}
	});

	if (actor !== null) {
		menuItem.grant_access[actor] = true;
	}
	return menuItem;
}

/***************************************************************************
 Event handlers
 ***************************************************************************/

//Cut & paste stuff
var menu_in_clipboard = null;
var ws_paste_count = 0;

$(document).ready(function(){
	//Some editor elements are only available in the Pro version.
	if (wsEditorData.wsMenuEditorPro) {
		knownMenuFields['open_in'].visible = true;
		knownMenuFields['access_level'].visible = true;
		knownMenuFields['page_heading'].visible = true;
		knownMenuFields['colors'].visible = true;
		knownMenuFields['extra_capability'].visible = false; //Superseded by the "access_level" field.

		//The Pro version supports submenu icons, but they can be disabled by the user.
		knownMenuFields['icon_url'].onlyForTopMenus = (wsEditorData.submenuIconsEnabled == 'never');

		$('.ws_hide_if_pro').hide();
	}

	//Let other plugins filter knownMenuFields.
	$(document).trigger('filterMenuFields.adminMenuEditor', [knownMenuFields, baseField]);

	//Make the top menu box sortable (we only need to do this once)
    var mainMenuBox = $('#ws_menu_box');
    makeBoxSortable(mainMenuBox);

	/***************************************************************************
	                  Event handlers for editor widgets
	 ***************************************************************************/
	var menuEditorNode = $('#ws_menu_editor');

	//Highlight the clicked menu item and show it's submenu
	var currentVisibleSubmenu = null;
    menuEditorNode.on('click', '.ws_container', (function () {
		var container = $(this);
		if ( container.hasClass('ws_active') ){
			return;
		}

		//Highlight the active item and un-highlight the previous one
		container.addClass('ws_active');
		container.siblings('.ws_active').removeClass('ws_active');
		if ( container.hasClass('ws_menu') ){
			//Show/hide the appropriate submenu
			if ( currentVisibleSubmenu ){
				currentVisibleSubmenu.hide();
			}
			currentVisibleSubmenu = $('#'+container.data('submenu_id')).show();
		}
    }));

    //Show/hide a menu's properties
    menuEditorNode.on('click', '.ws_edit_link', (function () {
    	var container = $(this).parents('.ws_container').first();
		var box = container.find('.ws_editbox');

		//For performance, the property editors for each menu are only created
		//when the user tries to access access them for the first time.
		if ( !container.data('field_editors_created') ){
			buildEditboxFields(box, container.data('menu_item'), container.hasClass('ws_menu'));
			container.data('field_editors_created', true);
			updateItemEditor(container);
		}

		$(this).toggleClass('ws_edit_link_expanded');
		//show/hide the editbox
		if ($(this).hasClass('ws_edit_link_expanded')){
			box.show();
		} else {
			//Make sure changes are applied before the menu is collapsed
			box.find('input').change();
			box.hide();
		}
    }));

    //The "Default" button : Reset to default value when clicked
    menuEditorNode.on('click', '.ws_reset_button', (function () {
        //Find the field div (it holds the field name)
        var field = $(this).parents('.ws_edit_field');
	    var fieldName = field.data('field_name');

		if ( (field.length > 0) && fieldName ) {
			//Extract the default value from the menu item.
            var containerNode = field.closest('.ws_container');
			var menuItem = containerNode.data('menu_item');

			if (fieldName == 'access_level') {
	            //This is a pretty nasty hack.
	            menuItem.grant_access = {};
	            menuItem.extra_capability = null;
            }

			if (itemTemplates.hasDefaultValue(menuItem.template_id, fieldName)) {
				menuItem[fieldName] = null;
				updateItemEditor(containerNode);
				updateParentAccessUi(containerNode);
			}
		}
	}));

	//When a field is edited, change it's appearance if it's contents don't match the default value.
    function fieldValueChange(){
        var input = $(this);
		var field = input.parents('.ws_edit_field').first();
	    var fieldName = field.data('field_name');

        if (fieldName == 'access_level') {
            //This field is read-only and can never be directly edited by the user.
            //Ignore spurious change events.
            return;
        }

	    var containerNode = field.parents('.ws_container').first();
	    var menuItem = containerNode.data('menu_item');

	    var oldValue = menuItem[fieldName];
	    var value = getInputValue(input);
	    var defaultValue = itemTemplates.getDefaultValue(menuItem.template_id, fieldName);
        var hasADefaultValue = (defaultValue !== null);

	    //Some fields/templates have no default values.
        field.toggleClass('ws_has_no_default', !hasADefaultValue);
        if (!hasADefaultValue) {
            field.removeClass('ws_input_default');
        }

        if (field.hasClass('ws_input_default') && (value == defaultValue)) {
            value = null; //null = use default.
        }

	    //Ignore changes where the new value is the same as the old one.
	    if (value === oldValue) {
		    return;
	    }

	    //Update the item.
	    if (knownMenuFields[fieldName].write !== null) {
		    knownMenuFields[fieldName].write(menuItem, value, input, containerNode);
	    } else {
		    menuItem[fieldName] = value;
	    }

	    updateItemEditor(containerNode);
	    updateParentAccessUi(containerNode)
    }
	menuEditorNode.on('click change', '.ws_field_value', fieldValueChange);

	//Show/hide advanced fields
	menuEditorNode.on('click', '.ws_toggle_advanced_fields', function(){
		var self = $(this);
		var advancedFields = self.parents('.ws_container').first().find('.ws_advanced');

		if ( advancedFields.is(':visible') ){
			advancedFields.hide();
			self.text(wsEditorData.captionShowAdvanced);
		} else {
			advancedFields.show();
			self.text(wsEditorData.captionHideAdvanced);
		}

		return false;
	});

	//Allow/forbid items in actor-specific views
	menuEditorNode.on('click', 'input.ws_actor_access_checkbox', function() {
		if (selectedActor == null) {
			return;
		}

		var checked = $(this).is(':checked');
		var containerNode = $(this).closest('.ws_container');

		var menu = containerNode.data('menu_item');
		//Ask for confirmation if the user tries to hide Dashboard -> Home.
		if ( !checked && ((menu.template_id == 'index.php>index.php') || (menu.template_id == '>index.php')) ) {
			updateItemEditor(containerNode); //Resets the checkbox back to the old value.
			confirmDashboardHiding(function(ok) {
				if (ok) {
					setActorAccessForTreeAndUpdateUi(containerNode, selectedActor, checked);
				}
			});
		} else {
			setActorAccessForTreeAndUpdateUi(containerNode, selectedActor, checked);
		}
	});

	/**
	 * This confusingly named function sets actor access for the specified menu item
	 * and all of its children (if any). It also updates the UI with the new settings.
	 *
	 * (And it violates SRP in a particularly egregious manner.)
	 *
	 * @param containerNode
	 * @param {String} actor
	 * @param {Boolean} allowAccess
	 */
	function setActorAccessForTreeAndUpdateUi(containerNode, actor, allowAccess) {
		setActorAccess(containerNode, actor, allowAccess);

		//Apply the same permissions to sub-menus.
		var subMenuId = containerNode.data('submenu_id');
		if (subMenuId && containerNode.hasClass('ws_menu')) {
			$('.ws_item', '#' + subMenuId).each(function() {
				var node = $(this);
				setActorAccess(node, actor, allowAccess);
				updateItemEditor(node);
			});
		}

		updateItemEditor(containerNode);
		updateParentAccessUi(containerNode);
	}

	/**
	 * Confirm with the user that they want to hide "Dashboard -> Home".
	 *
	 * This particular menu is important because hiding it can cause an "insufficient permissions" error
	 * to be displayed right when someone logs in, making it look like login failed.
	 */
	var permissionConfirmationDialog = $('#ws-ame-dashboard-hide-confirmation').dialog({
		autoOpen: false,
		modal: true,
		closeText: ' ',
		width: 380,
		title: 'Warning'
	});
	var currentConfirmationCallback = function(ok) {};

	/**
	 * Confirm hiding "Dashboard -> Home".
	 *
	 * @param callback Called when the user selects an option. True = confirmed.
	 */
	function confirmDashboardHiding(callback) {
		//The user can disable the confirmation dialog.
		if (!wsEditorData.dashboardHidingConfirmationEnabled) {
			callback(true);
			return;
		}

		currentConfirmationCallback = callback;
		permissionConfirmationDialog.dialog('open');
	}

	$('#ws_confirm_menu_hiding, #ws_cancel_menu_hiding').click(function() {
		var confirmed = $(this).is('#ws_confirm_menu_hiding');
		var dontShowAgain = permissionConfirmationDialog.find('.ws_dont_show_again input[type="checkbox"]').is(':checked');

		currentConfirmationCallback(confirmed);
		permissionConfirmationDialog.dialog('close');

		if (dontShowAgain) {
			wsEditorData.dashboardHidingConfirmationEnabled = false;
			//Run an AJAX request to disable the dialog for this user.
			$.post(
				wsEditorData.adminAjaxUrl,
				{
					'action' : 'ws_ame_disable_dashboard_hiding_confirmation',
					'_ajax_nonce' : wsEditorData.disableDashboardConfirmationNonce
				}
			);
		}
	});


	/*************************************************************************
	                  Access editor dialog
	 *************************************************************************/

	var accessEditorState = {
		containerNode : null,
		menuItem: null,
		rowPrefix: 'access_settings_for-'
	};

	$('#ws_menu_access_editor').dialog({
		autoOpen: false,
		closeText: ' ',
		modal: true,
		minHeight: 100,
		draggable: false
	});

	menuEditorNode.on('click', '.ws_launch_access_editor', function() {
		var containerNode = $(this).parents('.ws_container').first();
		var menuItem = containerNode.data('menu_item');

		//Write the values of this item to the editor fields.
		var editor = $('#ws_menu_access_editor');

		var requiredCap = getFieldValue(menuItem, 'access_level', '< Error: access_level is missing! >');
		var requiredCapField = editor.find('#ws_required_capability').empty();
		if (menuItem.template_id === '') {
			//Custom items have no required caps, only what users set.
			requiredCapField.empty().append('<em>None</em>');
		} else {
			requiredCapField.text(requiredCap);
		}

		editor.find('#ws_extra_capability').val(getFieldValue(menuItem, 'extra_capability', ''));

		//Generate the actor list.
		var table = editor.find('.ws_role_table_body tbody').empty();
		var alternate = '';
		for(var actor in wsEditorData.actors) {
			if (!wsEditorData.actors.hasOwnProperty(actor)) {
				continue;
			}
			var actorName = wsEditorData.actors[actor];

			var checkboxId = 'allow_' + actor.replace(/[^a-zA-Z0-9_]/g, '_');
			var checkbox = $('<input type="checkbox">').addClass('ws_role_access').attr('id', checkboxId);

			var actorHasAccess = actorCanAccessMenu(menuItem, actor);
			if (actorHasAccess) {
				checkbox.prop('checked', true);
			}

			alternate = (alternate == '') ? 'alternate' : '';

			var cell = '<td>';
			var row = $('<tr>').data('actor', actor).attr('class', alternate).append(
				$(cell).addClass('ws_column_role post-title').append(
					$('<label>').attr('for', checkboxId).append(
						$('<strong>').text(actorName)
					)
				),
				$(cell).addClass('ws_column_access').append(checkbox)
			);

			table.append(row);
		}

		accessEditorState.containerNode = containerNode;
		accessEditorState.menuItem = menuItem;

		//Show/hide the hint about sub menus overriding menu permissions.
		var itemHasSubmenus = !!(containerNode.data('submenu_id')) &&
			$('#' + containerNode.data('submenu_id')).find('.ws_item').length > 0;
		var hintIsEnabled = !wsEditorData.showHints.hasOwnProperty('ws_hint_menu_permissions') || wsEditorData.showHints['ws_hint_menu_permissions'];
		$('#ws_hint_menu_permissions').toggle(hintIsEnabled && itemHasSubmenus);

		//Warn the user if the required capability == role. Can't make it less restrictive.
		var roleError = $('#ws_hardcoded_role_error');
		if (requiredCap && AmeCapabilityManager.roleExists(requiredCap)) {
			roleError.show();
			$('#ws_hardcoded_role_name').text(requiredCap);
		} else {
			roleError.hide();
		}

		editor.dialog('open');
	});

	$('#ws_save_access_settings').click(function() {
		//Save the new settings.
		var extraCapability = jsTrim($('#ws_extra_capability').val());
		accessEditorState.menuItem.extra_capability = (extraCapability === '') ? null : extraCapability;

		var grantAccess = accessEditorState.menuItem.grant_access;
		if (!$.isPlainObject(grantAccess)) {
			grantAccess = {};
		}
		var editor = $('#ws_menu_access_editor');
		editor.find('.ws_role_table_body tbody tr').each(function() {
			var row = $(this);
			var actor = row.data('actor');
			grantAccess[actor] = row.find('input.ws_role_access').is(':checked');
		});
		accessEditorState.menuItem.grant_access = grantAccess;

		updateItemEditor(accessEditorState.containerNode);
		editor.dialog('close');
	});

	/***************************************************************************
		              General dialog handlers
	 ***************************************************************************/

	$(document).on('click', '.ws_close_dialog', function() {
		$(this).parents('.ui-dialog-content').dialog('close');
	});


	/***************************************************************************
	              Drop-down list for combo-box fields
	 ***************************************************************************/

	var capSelectorDropdown = $('#ws_cap_selector');
	var currentDropdownOwner = null; //The input element that the dropdown is currently associated with.
	var isDropdownBeingHidden = false;

	//Show/hide the capability drop-down list when the trigger button is clicked
	$('#ws_trigger_capability_dropdown').on('mousedown click', onDropdownTriggerClicked);
	menuEditorNode.on('mousedown click', '.ws_dropdown_button', onDropdownTriggerClicked);

	function onDropdownTriggerClicked(event){
		var inputBox = null;
		var button = $(this);

		//Find the input associated with the button that was clicked.
		if ( button.attr('id') == 'ws_trigger_capability_dropdown' ) {
			inputBox = $('#ws_extra_capability');
		} else {
			inputBox = button.closest('.ws_edit_field').find('.ws_field_value').first();
		}

		//If the user clicks the same button again while the dropdown is already visible,
		//ignore the click. The dropdown will be hidden by its "blur" handler.
		if (event.type == 'mousedown') {
			if ( capSelectorDropdown.is(':visible') && inputBox.is(currentDropdownOwner) ) {
				isDropdownBeingHidden = true;
			}
			return;
		} else if (isDropdownBeingHidden) {
			isDropdownBeingHidden = false; //Ignore the click event.
			return;
		}

		//A jQuery UI dialog widget will prevent focus from leaving the dialog. So if we want
		//the dropdown to be properly focused when displaying it in a dialog, we must make it
		//a child of the dialog's DOM node (and vice versa when it's not in a dialog).
		var parentContainer = $(this).closest('.ui-dialog, #ws_menu_editor');
		if ((parentContainer.length > 0) && (capSelectorDropdown.closest(parentContainer).length == 0)) {
			var oldHeight = capSelectorDropdown.height(); //Height seems to reset when moving to a new parent.
			capSelectorDropdown.detach().appendTo(parentContainer).height(oldHeight);
		}

		//Pre-select the current capability (will clear selection if there's no match).
		capSelectorDropdown.val(inputBox.val()).show();

		//Move the drop-down near the input box.
		var inputPos = inputBox.offset();
		capSelectorDropdown
			.css({
				position: 'absolute',
				zIndex: 1010 //Must be higher than the permissions dialog overlay.
			})
			.offset({
				left: inputPos.left,
				top : inputPos.top + inputBox.outerHeight()
			}).
			width(inputBox.outerWidth());

		currentDropdownOwner = inputBox;
		capSelectorDropdown.focus();
	}

	//Also show it when the user presses the down arrow in the input field (doesn't work in Opera).
	$('#ws_extra_capability').bind('keyup', function(event){
		if ( event.which == 40 ){
			$('#ws_trigger_capability_dropdown').click();
		}
	});

	//Event handlers for the drop-down lists themselves
	var dropdownNodes = $('.ws_dropdown');

	// Hide capability drop-down when it loses focus.
	dropdownNodes.blur(function(event){
		console.log('Hiding dropdown because it lost focus.', event);
		capSelectorDropdown.hide();
	});

	dropdownNodes.keydown(function(event){

		//Hide it when the user presses Esc
		if ( event.which == 27 ){
			capSelectorDropdown.hide();
			if (currentDropdownOwner) {
				currentDropdownOwner.focus();
			}

		//Select an item & hide the list when the user presses Enter or Tab
		} else if ( (event.which == 13) || (event.which == 9) ){
			capSelectorDropdown.hide();

			if (currentDropdownOwner) {
				if ( capSelectorDropdown.val() ){
					currentDropdownOwner.val(capSelectorDropdown.val()).change();
				}
				currentDropdownOwner.focus();
			}

			event.preventDefault();
		}
	});

	//Eat Tab keys to prevent focus theft. Required to make the "select item on Tab" thing work.
	dropdownNodes.keyup(function(event){
		if ( event.which == 9 ){
			event.preventDefault();
		}
	});


	//Update the input & hide the list when an option is clicked
	dropdownNodes.click(function(){
		if (capSelectorDropdown.val()){
			capSelectorDropdown.hide();
			if (currentDropdownOwner) {
				currentDropdownOwner.val(capSelectorDropdown.val()).change().focus();
			}
		}
	});

	//Highlight an option when the user mouses over it (doesn't work in IE)
	dropdownNodes.mousemove(function(event){
		if ( !event.target ){
			return;
		}

		var option = event.target;
		if ( (typeof option['selected'] !== 'undefined') && !option.selected && option.value ){
			option.selected = true;
		}
	});

	/*************************************************************************
	                           Icon selector
	 *************************************************************************/
	var iconSelector = $('#ws_icon_selector');
	var currentIconButton = null; //Keep track of the last clicked icon button.

	//When the user clicks one of the available icons, update the menu item.
	iconSelector.on('click', '.ws_icon_option', function() {
		var selectedIcon = $(this).addClass('ws_selected_icon');
		iconSelector.hide();

		//Assign the selected icon to the menu.
		if (currentIconButton) {
			var container = currentIconButton.closest('.ws_container');
			var item = container.data('menu_item');

			//Remove the existing icon class, if any.
			var cssClass = getFieldValue(item, 'css_class', '');
			cssClass = jsTrim( cssClass.replace(/\b(ame-)?menu-icon-[^\s]+\b/, '') );

			if (selectedIcon.data('icon-class')) {
				//Add the new class.
				cssClass = selectedIcon.data('icon-class') + ' ' + cssClass;
				//Can't have both a class and an image or we'll get two overlapping icons.
				item.icon_url = '';
			} else if (selectedIcon.data('icon-url')) {
				item.icon_url = selectedIcon.data('icon-url');
			}
			item.css_class = cssClass;

			updateItemEditor(container);
		}

		currentIconButton = null;
	});

	//Show/hide the icon selector when the user clicks the icon button.
	menuEditorNode.on('click', '.ws_select_icon', function() {
		var button = $(this);
		//Clicking the same button a second time hides the icon list.
		if ( currentIconButton && button.is(currentIconButton) ) {
			iconSelector.hide();
			//noinspection JSUnusedAssignment
			currentIconButton = null;
			return;
		}

		currentIconButton = button;

		var menuItem = currentIconButton.closest('.ws_container').data('menu_item');
		var cssClass = getFieldValue(menuItem, 'css_class', '');
		var iconUrl = getFieldValue(menuItem, 'icon_url', '');

		var customImageOption = iconSelector.find('.ws_custom_image_icon').hide();

		//Highlight the currently selected icon.
		iconSelector.find('.ws_selected_icon').removeClass('ws_selected_icon');

		var expandSelector = false;
		var classMatches = cssClass.match(/\b(ame-)?menu-icon-([^\s]+)\b/);
		//Dashicons are set via the icon URL field, but they are actually CSS-based.
		var dashiconMatches = iconUrl && iconUrl.match('^\s*(dashicons-[a-z0-9\-]+)\s*$');

		if ( iconUrl && iconUrl !== 'none' && iconUrl !== 'div' && !dashiconMatches ) {
			var currentIcon = iconSelector.find('.ws_icon_option img[src="' + iconUrl + '"]').first().closest('.ws_icon_option');
			if ( currentIcon.length > 0 ) {
				currentIcon.addClass('ws_selected_icon').show();
			} else {
				//Display and highlight the custom image.
				customImageOption.find('img').prop('src', iconUrl);
				customImageOption.addClass('ws_selected_icon').show().data('icon-url', iconUrl);
			}
		} else if ( classMatches || dashiconMatches ) {
			//Highlight the icon that corresponds to the current CSS class or Dashicon name.
			var iconClass = dashiconMatches ? dashiconMatches[1] : ((classMatches[1] ? classMatches[1] : '') + 'icon-' + classMatches[2]);
			var selectedIcon = iconSelector.find('.' + iconClass).closest('.ws_icon_option').addClass('ws_selected_icon');
			//If the icon is one of those hidden by default, automatically expand the selector so it becomes visible.
			if (selectedIcon.hasClass('ws_icon_extra')) {
				expandSelector = true;
			}
		}

		expandSelector = expandSelector || (!!wsEditorData.showExtraIcons); //Second argument to toggleClass() must be a boolean, not just truthy/falsy.
		iconSelector.toggleClass('ws_with_more_icons', expandSelector);
		$('#ws_show_more_icons').val(expandSelector ? 'Less \u25B2' : 'More \u25BC');

		iconSelector.show();
		iconSelector.position({ //Requires jQuery UI.
			my: 'left top',
			at: 'left bottom',
			of: button
		});
	});

	//Alternatively, use the WordPress media uploader to select a custom icon.
	//This code is based on the header selection script in /wp-admin/js/custom-header.js.
	$('#ws_choose_icon_from_media').click(function(event) {
		event.preventDefault();
		var frame = null;

		//This option is not usable on the demo site since the filesystem is usually read-only.
		if (wsEditorData.isDemoMode) {
			alert('Sorry, image upload is disabled in demo mode!');
			return;
		}

        //If the media frame already exists, reopen it.
        if ( frame ) {
            frame.open();
            return;
        }

        //Create a custom media frame.
        frame = wp.media.frames.customAdminMenuIcon = wp.media({
            //Set the title of the modal.
            title: 'Choose a Custom Icon (20x20)',

            //Tell it to show only images.
            library: {
                type: 'image'
            },

            //Customize the submit button.
            button: {
                text: 'Set as icon', //Button text.
                close: true //Clicking the button closes the frame.
            }
        });

        //When an image is selected, set it as the menu icon.
        frame.on( 'select', function() {
            //Grab the selected attachment.
            var attachment = frame.state().get('selection').first();
            //TODO: Warn the user if the image exceeds 16x16 pixels.

	        //Set the menu icon to the attachment URL.
            if (currentIconButton) {
                var container = currentIconButton.closest('.ws_container');
                var item = container.data('menu_item');

                //Remove the existing icon class, if any.
                var cssClass = getFieldValue(item, 'css_class', '');
	            item.css_class = jsTrim( cssClass.replace(/\b(ame-)?menu-icon-[^\s]+\b/, '') );

	            //Set the new icon URL.
	            item.icon_url = attachment.attributes.url;

                updateItemEditor(container);
            }

            currentIconButton = null;
        });

		//If the user closes the frame by via Esc or the "X" button, clear up state.
		frame.on('escape', function(){
			currentIconButton = null;
		});

        frame.open();
		iconSelector.hide();
	});

	//Show/hide additional icons.
	$('#ws_show_more_icons').click(function() {
		iconSelector.toggleClass('ws_with_more_icons');
		wsEditorData.showExtraIcons = iconSelector.hasClass('ws_with_more_icons');
		$(this).val(wsEditorData.showExtraIcons ? 'Less \u25B2' : 'More \u25BC');

		//Remember the user's choice.
		$.cookie('ame-show-extra-icons', wsEditorData.showExtraIcons ? '1' : '0', {expires: 90});
	});

	//Hide the icon selector if the user clicks outside of it.
	//Exception: Clicks on "Select icon" buttons are handled above.
	$(document).on('mouseup', function(event) {
		if ( !iconSelector.is(':visible') ) {
			return;
		}

		if (
			!iconSelector.is(event.target)
			&& iconSelector.has(event.target).length === 0
			&& $(event.target).closest('.ws_select_icon').length == 0
		) {
			iconSelector.hide();
			currentIconButton = null;
		}
	});


	/*************************************************************************
	                             Color picker
	 *************************************************************************/

	var menuColorDialog = $('#ws-ame-menu-color-settings');
	if (menuColorDialog.length > 0) {
		menuColorDialog.dialog({
			autoOpen: false,
			closeText: ' ',
			draggable: false,
			modal: true,
			minHeight: 400,
			minWidth: 520
		});
	}

	var colorDialogState = {
		menuItem: null
	};

	var menuColorVariables = [
		'base-color',
		'text-color',
		'highlight-color',
		'icon-color',

		'menu-highlight-text',
		'menu-highlight-icon',
		'menu-highlight-background',

		'menu-current-text',
		'menu-current-icon',
		'menu-current-background',

		'menu-submenu-text',
		'menu-submenu-background',
		'menu-submenu-focus-text',
		'menu-submenu-current-text',

		'menu-bubble-text',
		'menu-bubble-background',
		'menu-bubble-current-text',
		'menu-bubble-current-background'
	];

	//Show only the primary color settings by default.
	var showAdvancedColors = false;
	$('#ws-ame-show-advanced-colors').click(function() {
		showAdvancedColors = !showAdvancedColors;
		$('#ws-ame-menu-color-settings').find('.ame-advanced-menu-color').toggle(showAdvancedColors);
		$(this).text(showAdvancedColors ? 'Hide advanced options' : 'Show advanced options');
	});

	//"Edit.." color schemes.
	var colorPickersInitialized = false;
	menuEditorNode.on('click', '.ws_open_color_editor, .ws_color_scheme_display', function() {
		//Initializing the color pickers takes a while, so we only do it when needed instead of on document ready.
		if ( !colorPickersInitialized ) {
			menuColorDialog.find('.ame-color-picker').wpColorPicker();
			colorPickersInitialized = true;
		}

		var containerNode = $(this).parents('.ws_container').first();
		var menuItem = containerNode.data('menu_item');

		colorDialogState.containerNode = containerNode;
		colorDialogState.menuItem = menuItem;

		var colors = getFieldValue(menuItem, 'colors', {});
		var customColorCount = 0;
		for (var i = 0; i < menuColorVariables.length; i++) {
			var name = menuColorVariables[i];
			var value = colors.hasOwnProperty(name) ? colors[name] : false;

			if ( value ) {
				$('#ame-color-' + name).wpColorPicker('color', value);
				customColorCount++;
			} else {
				$('#ame-color-' + name).closest('.wp-picker-container').find('.wp-picker-clear').click();
			}
		}

		if ( customColorCount > 0 ) {
			menuItem.colors = colors;
		} else {
			menuItem.colors = null;
		}

		//Add menu title to the dialog caption.
		var title = getFieldValue(menuItem, 'menu_title', null);
		menuColorDialog.dialog(
			'option',
			'title',
			title ? ('Colors: ' + title.substring(0, 30)) : 'Colors'
		);
		menuColorDialog.dialog('open');
	});

	//The "Save Changes" button in the color dialog.
	$('#ws-ame-save-menu-colors').click(function() {
		menuColorDialog.dialog('close');
		if ( !colorDialogState.menuItem ) {
			return;
		}
		var menuItem = colorDialogState.menuItem;
		var colors = {}, colorCount = 0;

		for (var i = 0; i < menuColorVariables.length; i++) {
			var name = menuColorVariables[i];
			var value = $('#ame-color-' + name).val();
			if (value) {
				colors[name] = value;
				colorCount++;
			}
		}

		menuItem.colors = colorCount > 0 ? colors : null;
		updateItemEditor(colorDialogState.containerNode);

		colorDialogState.containerNode = null;
		colorDialogState.menuItem = null;
	});

    /*************************************************************************
	                           Menu toolbar buttons
	 *************************************************************************/
    function getSelectedMenu() {
	    return $('#ws_menu_box').find('.ws_active');
    }

	//Show/Hide menu
	$('#ws_hide_menu').click(function () {
		//Get the selected menu
		var selection = getSelectedMenu();
		if (!selection.length) return;

		//Mark the menu as hidden/visible
		var menuItem = selection.data('menu_item');
		menuItem.hidden = !menuItem.hidden;
		setMenuFlag(selection, 'hidden', menuItem.hidden);

		//Also mark all of it's submenus as hidden/visible
		$('#' + selection.data('submenu_id') + ' .ws_item').each(function(){
			var submenuItem = $(this).data('menu_item');
			submenuItem.hidden = menuItem.hidden;
			setMenuFlag(this, 'hidden', submenuItem.hidden);
		});
	});

	//Delete error dialog. It shows up when the user tries to delete one of the default menus.
	var menuDeletionDialog = $('#ws-ame-menu-deletion-error').dialog({
		autoOpen: false,
		modal: true,
		closeText: ' ',
		title: 'Error',
		draggable: false
	});
	var menuDeletionCallback = function(hide) {
		menuDeletionDialog.dialog('close');
		var selection = menuDeletionDialog.data('selected_menu');

		function applyCallbackRecursively(containerNode, callback) {
			callback(containerNode.data('menu_item'));

			var subMenuId = containerNode.data('submenu_id');
			if (subMenuId && containerNode.hasClass('ws_menu')) {
				$('.ws_item', '#' + subMenuId).each(function() {
					var node = $(this);
					callback(node.data('menu_item'));
					updateItemEditor(node);
				});
			}

			updateItemEditor(containerNode);
		}

		function hideRecursively(containerNode, exceptActor) {
			applyCallbackRecursively(containerNode, function(menuItem) {
				denyAccessForAllExcept(menuItem, exceptActor);
			});
			updateParentAccessUi(containerNode);
		}

		if (hide === 'all') {
			if (wsEditorData.wsMenuEditorPro) {
				hideRecursively(selection, null);
			} else {
				//The free version doesn't have role permissions, so use the global "hidden" flag.
				applyCallbackRecursively(selection, function(menuItem) {
					menuItem.hidden = true;
				});
			}
		} else if (hide === 'except_current_user') {
			hideRecursively(selection, 'user:' + wsEditorData.currentUserLogin);
		} else if (hide === 'except_administrator' && !wsEditorData.wsMenuEditorPro) {
			//Set "required capability" to something only the Administrator role would have.
			var adminOnlyCap = 'manage_options';
			applyCallbackRecursively(selection, function(menuItem) {
				menuItem.extra_capability = adminOnlyCap;
			});
			alert('The "required capability" field was set to "' + adminOnlyCap + '".')
		}
	};

	//Callbacks for each of the dialog buttons.
	$('#ws_cancel_menu_deletion').click(function() {
		menuDeletionCallback(false);
	});
	$('#ws_hide_menu_from_everyone').click(function() {
		menuDeletionCallback('all');
	});
	$('#ws_hide_menu_except_current_user').click(function() {
		menuDeletionCallback('except_current_user');
	});
	$('#ws_hide_menu_except_administrator').click(function() {
		menuDeletionCallback('except_administrator');
	});

	/**
	 * Attempt to delete a menu item. Will check if the item can actually be deleted and ask the user for confirmation.
	 * UI callback.
	 *
	 * @param selection The selected menu item (DOM node).
	 */
	function tryDeleteItem(selection) {
		var menuItem = selection.data('menu_item');
		var isDefaultItem =
			( menuItem.template_id !== '')
				&& ( menuItem.template_id !== wsEditorData.unclickableTemplateId)
				&& (!menuItem.separator);

		var otherCopiesExist = false;
		var shouldDelete = false;

		if (isDefaultItem) {
			//Check if there are any other menus with the same template ID.
			$('#ws_menu_editor').find('.ws_container').each(function() {
				var otherItem = $(this).data('menu_item');
				if ((menuItem != otherItem) && (menuItem.template_id == otherItem.template_id)) {
					otherCopiesExist = true;
					return false;
				}
				return true;
			});
		}

		if (!isDefaultItem || otherCopiesExist) {
			//Custom and duplicate items can be deleted normally.
			shouldDelete = confirm('Delete this menu?');
		} else {
			//Non-custom items can not be deleted, but they can be hidden. Ask the user if they want to do that.
			menuDeletionDialog.find('#ws-ame-menu-type-desc').text(
				menuItem.defaults.is_plugin_page ? 'an item added by another plugin' : 'a built-in menu item'
			);
			menuDeletionDialog.data('selected_menu', selection);

			//Different versions get slightly different options because only the Pro version has
			//role-specific permissions.
			$('#ws_hide_menu_except_current_user').toggleClass('hidden', !wsEditorData.wsMenuEditorPro);
			$('#ws_hide_menu_except_administrator').toggleClass('hidden', wsEditorData.wsMenuEditorPro);

			menuDeletionDialog.dialog('open');

			//Select "Cancel" as the default button.
			menuDeletionDialog.find('#ws_cancel_menu_deletion').focus();
		}

		if (shouldDelete) {
			//Delete this menu's submenu first, if any.
			var submenuId = selection.data('submenu_id');
			if (submenuId) {
				$('#' + submenuId).remove();
			}
			var parentSubmenu = selection.closest('.ws_submenu');

			//Delete the menu.
			selection.remove();

			if (parentSubmenu) {
				//Refresh permissions UI for this menu's parent (if any).
				updateParentAccessUi(parentSubmenu);
			}
		}
	}

	//Delete menu
	$('#ws_delete_menu').click(function () {
		//Get the selected menu
		var selection = getSelectedMenu();
		if (!selection.length) return;

		tryDeleteItem(selection);
	});

	//Copy menu
	$('#ws_copy_menu').click(function () {
		//Get the selected menu
		var selection = $('#ws_menu_box').find('.ws_active');
		if (!selection.length) return;

		//Store a copy of the current menu state in clipboard
		menu_in_clipboard = readItemState(selection);
	});

	//Cut menu
	$('#ws_cut_menu').click(function () {
		//Get the selected menu
		var selection = $('#ws_menu_box').find('.ws_active');
		if (!selection.length) return;

		//Store a copy of the current menu state in clipboard
		menu_in_clipboard = readItemState(selection);

		//Remove the original menu and submenu
		$('#'+selection.data('submenu_id')).remove();
		selection.remove();
	});

	//Paste menu
	function pasteMenu(menu, afterMenu) {
		//The user shouldn't need to worry about giving separators a unique filename.
		if (menu.separator) {
			menu.defaults.file = randomMenuId('separator_');
		}

		//If we're pasting from a sub-menu, we may need to fix some properties
		//that are blank for sub-menu items but required for top-level menus.
		if (getFieldValue(menu, 'css_class', '') == '') {
			menu.css_class = 'menu-top';
		}
		if (getFieldValue(menu, 'icon_url', '') == '') {
			menu.icon_url = 'dashicons-admin-generic';
		}
		if (getFieldValue(menu, 'hookname', '') == '') {
			menu.hookname = randomMenuId();
		}

		//Paste the menu after the specified one, or at the end of the list.
		if (afterMenu) {
			outputTopMenu(menu, afterMenu);
		} else {
			outputTopMenu(menu);
		}
	}

	$('#ws_paste_menu').click(function () {
		//Check if anything has been copied/cut
		if (!menu_in_clipboard) return;

		var menu = $.extend(true, {}, menu_in_clipboard);

		//Get the selected menu
		var selection = $('#ws_menu_box').find('.ws_active');
		//Paste the menu after the selection.
		pasteMenu(menu, (selection.length > 0) ? selection : null);
	});

	//New menu
	$('#ws_new_menu').click(function () {
		ws_paste_count++;

		//The new menu starts out rather bare
		var randomId = randomMenuId();
		var menu = $.extend({}, wsEditorData.blankMenuItem, {
			custom: true, //Important : flag the new menu as custom, or it won't show up after saving.
			template_id : '',
			menu_title : 'Custom Menu ' + ws_paste_count,
			file : randomId,
			items: [],
			defaults: $.extend({}, itemTemplates.getDefaults(''))
		});

		//Make it accessible only to the current actor if one is selected.
		if (selectedActor != null) {
			denyAccessForAllExcept(menu, selectedActor);
		}

		//Insert the new menu
		var selection = $('#ws_menu_box').find('.ws_active');
		var result = outputTopMenu(menu, (selection.length > 0) ? selection : null);

		//The menus's editbox is always open
		result.menu.find('.ws_edit_link').click();
	});

	//New separator
	$('#ws_new_separator, #ws_new_submenu_separator').click(function () {
		ws_paste_count++;

		//The new menu starts out rather bare
		var randomId = randomMenuId('separator_');
		var menu = $.extend(true, {}, wsEditorData.blankMenuItem, {
			separator: true, //Flag as a separator
			custom: false,   //Separators don't need to flagged as custom to be retained.
			items: [],
			defaults: {
				separator: true,
				css_class : 'wp-menu-separator',
				access_level : 'read',
				file : randomId,
				hookname : randomId
			}
		});

		if ( $(this).attr('id').indexOf('submenu') == -1 ) {
			//Insert in the top-level menu.
			var selection = $('#ws_menu_box').find('.ws_active');
			outputTopMenu(menu, (selection.length > 0) ? selection : null);
		} else {
			//Insert in the currently visible submenu.
			pasteItem(menu);
		}
	});

	//Toggle all menus for the currently selected actor
	$('#ws_toggle_all_menus').click(function() {
		if ( selectedActor == null ) {
			alert("This button enables/disables all menus for the selected role. To use it, click a role and then click this button again.");
			return;
		}

		var topMenuNodes = $('.ws_menu', '#ws_menu_box');
		//Look at the first menu's permissions and set everything to the opposite.
		var allow = ! actorCanAccessMenu(topMenuNodes.eq(0).data('menu_item'), selectedActor);

		topMenuNodes.each(function() {
			var containerNode = $(this);
			setActorAccessForTreeAndUpdateUi(containerNode, selectedActor, allow);
		});
	});

	//Copy all menu permissions from one role to another.
	var copyPermissionsDialog = $('#ws-ame-copy-permissions-dialog').dialog({
		autoOpen: false,
		modal: true,
		closeText: ' ',
		draggable: false
	});

	//Populate source/destination lists.
	var sourceActorList = $('#ame-copy-source-actor'), destinationActorList = $('#ame-copy-destination-actor');
	$.each(wsEditorData.actors, function(actor, name) {
		var option = $('<option>', {val: actor, text: name});
		sourceActorList.append(option);
		destinationActorList.append(option.clone());
	});

	//The "Copy permissions" toolbar button.
	$('#ws_copy_role_permissions').click(function() {
		//Pre-select the current actor as the destination.
		if (selectedActor !== null) {
			destinationActorList.val(selectedActor);
		}
		copyPermissionsDialog.dialog('open');
	});

	//Actually copy the permissions when the user click the confirmation button.
	var copyConfirmationButton = $('#ws-ame-confirm-copy-permissions');
	copyConfirmationButton.click(function() {
		var sourceActor = sourceActorList.val();
		var destinationActor = destinationActorList.val();

		if (sourceActor === null || destinationActor === null) {
			alert('Select a source and a destination first.');
			return;
		}

		//Iterate over all menu items and copy the permissions from one actor to the other.
		var allMenuNodes = $('.ws_menu', '#ws_menu_box').add('.ws_item', '#ws_submenu_box');
		allMenuNodes.each(function() {
			var node = $(this);
			var menuItem = node.data('menu_item');

			//Only change permissions when they don't match. This ensures we won't unnecessarily overwrite default
			//permissions and bloat the configuration with extra grant_access entries.
			var sourceAccess      = actorCanAccessMenu(menuItem, sourceActor);
			var destinationAccess = actorCanAccessMenu(menuItem, destinationActor);
			if (sourceAccess !== destinationAccess) {
				setActorAccess(node, destinationActor, sourceAccess);
				//Note: In theory, we could also look at the default permissions for destinationActor and
				//revert to default instead of overwriting if that would make the two actors' permissions match.
			}
		});

		//If the user is currently looking at the destination actor, force the UI to refresh
		//so that they can see the new permissions.
		if (selectedActor === destinationActor) {
			//This is a bit of a hack, but right now there's no better way to refresh all items at once.
			setSelectedActor(null);
			setSelectedActor(destinationActor);
		}

		//All done.
		copyPermissionsDialog.dialog('close');
	});

	//Only enable the copy button when the user selects a valid source and destination.
	copyConfirmationButton.prop('disabled', true);
	sourceActorList.add(destinationActorList).click(function() {
		var sourceActor = sourceActorList.val();
		var destinationActor = destinationActorList.val();

		var validInputs = (sourceActor !== null) && (destinationActor !== null) && (sourceActor !== destinationActor);
		copyConfirmationButton.prop('disabled', !validInputs);
	});


	/*************************************************************************
	                          Item toolbar buttons
	 *************************************************************************/
	function getSelectedSubmenuItem() {
		return $('#ws_submenu_box').find('.ws_submenu:visible .ws_active');
	}

	//Show/Hide item
	$('#ws_hide_item').click(function () {
		//Get the selected item
		var selection = getSelectedSubmenuItem();
		if (!selection.length) return;

		//Mark the item as hidden/visible
		var menuItem = selection.data('menu_item');
		menuItem.hidden = !menuItem.hidden;
		setMenuFlag(selection, 'hidden', menuItem.hidden);
	});

	//Delete item
	$('#ws_delete_item').click(function () {
		var selection = getSelectedSubmenuItem();
		if (!selection.length) return;

		tryDeleteItem(selection);
	});

	//Copy item
	$('#ws_copy_item').click(function () {
		//Get the selected item
		var selection = getSelectedSubmenuItem();
		if (!selection.length) return;

		//Store a copy of item state in the clipboard
		menu_in_clipboard = readItemState(selection);
	});

	//Cut item
	$('#ws_cut_item').click(function () {
		//Get the selected item
		var selection = getSelectedSubmenuItem();
		if (!selection.length) return;

		//Store a copy of item state in the clipboard
		menu_in_clipboard = readItemState(selection);

		var submenu = selection.parent();
		//Remove the original item
		selection.remove();
		updateParentAccessUi(submenu);
	});

	//Paste item
	function pasteItem(item) {
		//We're pasting this item into a sub-menu, so it can't have a sub-menu of its own.
		//Instead, any sub-menu items belonging to this item will be pasted after the item.
		var newItems = [];
		for (var file in item.items) {
			if (item.items.hasOwnProperty(file)) {
				newItems.push(buildMenuItem(item.items[file], false));
			}
		}
		item.items = [];

		newItems.unshift(buildMenuItem(item, false));

		//Get the selected menu
		var visibleSubmenu = $('#ws_submenu_box').find('.ws_submenu:visible');
		var selection = visibleSubmenu.find('.ws_active');
		for(var i = 0; i < newItems.length; i++) {
			if (selection.length > 0) {
				//If an item is selected add the pasted items after it
				selection.after(newItems[i]);
			} else {
				//Otherwise add the pasted items at the end
				visibleSubmenu.append(newItems[i]);
			}

			updateItemEditor(newItems[i]);
			newItems[i].show();
		}

		updateParentAccessUi(visibleSubmenu);
	}

	$('#ws_paste_item').click(function () {
		//Check if anything has been copied/cut
		if (!menu_in_clipboard) return;

		//You can only add separators to submenus in the Pro version.
		if ( menu_in_clipboard.separator && !wsEditorData.wsMenuEditorPro ) {
			return;
		}

		//Paste it.
		var item = $.extend(true, {}, menu_in_clipboard);
		pasteItem(item);
	});

	//New item
	$('#ws_new_item').click(function () {
		if ($('.ws_submenu:visible').length < 1) {
			return; //Abort if no submenu visible
		}

		ws_paste_count++;

		var entry = $.extend({}, wsEditorData.blankMenuItem, {
			custom: true,
			template_id : '',
			menu_title : 'Custom Item ' + ws_paste_count,
			file : randomMenuId(),
			items: [],
			defaults: $.extend({}, itemTemplates.getDefaults(''))
		});

		//Make it accessible to only the currently selected actor.
		if (selectedActor != null) {
			denyAccessForAllExcept(entry, selectedActor);
		}

		var menu = buildMenuItem(entry);
		updateItemEditor(menu);

		//Insert the item into the currently open submenu.
		var visibleSubmenu = $('#ws_submenu_box').find('.ws_submenu:visible');
		var selection = visibleSubmenu.find('.ws_active');
		if (selection.length > 0) {
			selection.after(menu);
		} else {
			visibleSubmenu.append(menu);
		}

		//The items's editbox is always open
		menu.find('.ws_edit_link').click();

		updateParentAccessUi(menu);
	});

	function compareMenus(a, b){
		var aTitle = jsTrim( $(a).find('.ws_item_title').text() );
		var bTitle = jsTrim( $(b).find('.ws_item_title').text() );

		aTitle = aTitle.toLowerCase();
		bTitle = bTitle.toLowerCase();

		return aTitle > bTitle ? 1 : -1;
	}

	//Sort items in ascending order
	$('#ws_sort_ascending').click(function () {
		var submenu = $('#ws_submenu_box').find('.ws_submenu:visible');
		if (submenu.length < 1) {
			return; //Abort if no submenu visible
		}

		submenu.find('.ws_container').sort(compareMenus);
	});

	//Sort items in descending order
	$('#ws_sort_descending').click(function () {
		var submenu = $('#ws_submenu_box').find('.ws_submenu:visible');
		if (submenu.length < 1) {
			return; //Abort if no submenu visible
		}

		submenu.find('.ws_container').sort((function(a, b){
			return -compareMenus(a, b);
		}));
	});

	//==============================================
	//				Main buttons
	//==============================================

	//Save Changes - encode the current menu as JSON and save
	$('#ws_save_menu').click(function () {
		try {
			var tree = readMenuTreeState();
		} catch (error) {
			//Right now the only known error condition is duplicate top level URLs.
			if (error.hasOwnProperty('code') && (error.code === 'duplicate_top_level_url')) {
				var message = 'Error: Duplicate menu URLs. The following top level menus have the same URL:\n\n' ;
				for (var i = 0; i < error.duplicates.length; i++) {
					var containerNode = $(error.duplicates[i]);
					message += (i + 1) + '. ' + containerNode.find('.ws_item_title').first().text() + '\n';
				}
				message += '\nPlease change the URLs to be unique or delete the duplicates.';
				alert(message);
			} else {
				alert(error.message);
			}
			return;
		}

		function findItemByTemplateId(items, templateId) {
			var foundItem = null;

			$.each(items, function(index, item) {
				if (item.template_id == templateId) {
					foundItem = item;
					return false;
				}
				if (item.hasOwnProperty('items') && (item.items.length > 0)) {
					foundItem = findItemByTemplateId(item.items, templateId);
					if (foundItem != null) {
						return false;
					}
				}
				return true;
			});

			return foundItem;
		}

		//Abort the save if it would make the editor inaccessible.
        if (wsEditorData.wsMenuEditorPro) {
            var myMenuItem = findItemByTemplateId(tree.tree, 'options-general.php>menu_editor');
            if (myMenuItem == null) {
                //This is OK - the missing menu item will be re-inserted automatically.
            } else if (!actorCanAccessMenu(myMenuItem, 'user:' + wsEditorData.currentUserLogin)) {
                alert(
	                "Error: This configuration would make you unable to access the menu editor!\n\n" +
	                "Please click either your role name or \"Current user (" + wsEditorData.currentUserLogin + ")\" "+
	                "and enable the \"Menu Editor Pro\" menu item."
                );
                return;
            }
        }

		var data = encodeMenuAsJSON(tree);
		$('#ws_data').val(data);
		$('#ws_data_length').val(data.length);
		$('#ws_selected_actor').val(selectedActor === null ? '' : selectedActor);
		$('#ws_main_form').submit();
	});

	//Load default menu - load the default WordPress menu
	$('#ws_load_menu').click(function () {
		if (confirm('Are you sure you want to load the default WordPress menu?')){
			outputWpMenu(defaultMenu.tree);
		}
	});

	//Reset menu - re-load the custom menu. Discards any changes made by user.
	$('#ws_reset_menu').click(function () {
		if (confirm('Undo all changes made in the current editing session?')){
			outputWpMenu(customMenu.tree);
		}
	});

	//Export menu - download the current menu as a file
	$('#export_dialog').dialog({
		autoOpen: false,
		closeText: ' ',
		modal: true,
		minHeight: 100
	});

	$('#ws_export_menu').click(function(){
		var button = $(this);
		button.prop('disabled', true);
		button.val('Exporting...');

		$('#export_complete_notice, #download_menu_button').hide();
		$('#export_progress_notice').show();
		var exportDialog = $('#export_dialog');
		exportDialog.dialog('open');

		//Encode the menu.
		try {
			var exportData = encodeMenuAsJSON();
		} catch (error) {
			exportDialog.dialog('close');
			alert(error.message);

			button.val('Export');
			button.prop('disabled', false);
			return;
		}

		//Store the menu for download.
		$.post(
			wsEditorData.adminAjaxUrl,
			{
				'data' : exportData,
				'action' : 'export_custom_menu',
				'_ajax_nonce' : wsEditorData.exportMenuNonce
			},
			function(data){
				button.val('Export');
				button.prop('disabled', false);

				if ( typeof data['error'] != 'undefined' ){
					exportDialog.dialog('close');
					alert(data.error);
				}

				if ( (typeof data['download_url'] != 'undefined') && data.download_url ){
					//window.location = data.download_url;
					$('#download_menu_button').attr('href', data.download_url).data('filesize', data.filesize);
					$('#export_progress_notice').hide();
					$('#export_complete_notice, #download_menu_button').show();
				}
			},
			'json'
		);
	});

	$('#ws_cancel_export').click(function(){
		$('#export_dialog').dialog('close');
	});

	$('#download_menu_button').click(function(){
		$('#export_dialog').dialog('close');
	});

	//Import menu - upload an exported menu and show it in the editor
	$('#import_dialog').dialog({
		autoOpen: false,
		closeText: ' ',
		modal: true
	});

	$('#ws_cancel_import').click(function(){
		$('#import_dialog').dialog('close');
	});

	$('#ws_import_menu').click(function(){
		$('#import_progress_notice, #import_progress_notice2, #import_complete_notice, #ws_import_error').hide();
		$('#ws_import_panel').show();
		$('#import_menu_form').resetForm();
		//The "Upload" button is disabled until the user selects a file
		$('#ws_start_import').attr('disabled', 'disabled');

		var importDialog = $('#import_dialog');
		importDialog.find('.hide-when-uploading').show();
		importDialog.dialog('open');
	});

	$('#import_file_selector').change(function(){
		$('#ws_start_import').prop('disabled', ! $(this).val() );
	});

	//This function displays unhandled server side errors. In theory, our upload handler always returns a well-formed
	//response even if there's an error. In practice, stuff can go wrong in unexpected ways (e.g. plugin conflicts).
	function handleUnexpectedImportError(xhr, errorMessage) {
		//The server-side code didn't catch this error, so it's probably something serious
		//and retrying won't work.
		$('#import_menu_form').resetForm();
		$('#ws_import_panel').hide();

		//Display error information.
		$('#ws_import_error_message').text(errorMessage);
		$('#ws_import_error_http_code').text(xhr.status);
		$('#ws_import_error_response').text((xhr.responseText !== '') ? xhr.responseText : '[Empty response]');
		$('#ws_import_error').show();
	}

	//AJAXify the upload form
	$('#import_menu_form').ajaxForm({
		dataType : 'json',
		beforeSubmit: function(formData) {

			//Check if the user has selected a file
			for(var i = 0; i < formData.length; i++){
				if ( formData[i].name == 'menu' ){
					if ( (typeof formData[i]['value'] == 'undefined') || !formData[i]['value']){
						alert('Select a file first!');
						return false;
					}
				}
			}

			$('#import_dialog').find('.hide-when-uploading').hide();
			$('#import_progress_notice').show();

			$('#ws_start_import').attr('disabled', 'disabled');
			return true;
		},
		success: function(data, status, xhr) {
			$('#import_progress_notice').hide();

			var importDialog = $('#import_dialog');
			if ( !importDialog.dialog('isOpen') ){
				//Whoops, the user closed the dialog while the upload was in progress.
				//Discard the response silently.
				return;
			}

			if ( data === null ) {
				handleUnexpectedImportError(xhr, 'Invalid response from server. Please check your PHP error log.');
				return;
			}

			if ( typeof data['error'] != 'undefined' ){
				alert(data.error);
				//Let the user try again
				$('#import_menu_form').resetForm();
				importDialog.find('.hide-when-uploading').show();
			}

			if ( (typeof data['tree'] != 'undefined') && data.tree ){
				//Whee, we got back a (seemingly) valid menu. A veritable miracle!
				//Lets load it into the editor.
				var progressNotice = $('#import_progress_notice2').show();
				outputWpMenu(data.tree);
				progressNotice.hide();
				//Display a success notice, then automatically close the window after a few moments
				$('#import_complete_notice').show();
				setTimeout((function(){
					//Close the import dialog
					$('#import_dialog').dialog('close');
				}), 500);
			}

		},
		error: function(xhr, status, errorMessage) {
			handleUnexpectedImportError(xhr, errorMessage);
		}
	});

	/*************************************************************************
	                 Drag & drop items between menu levels
	 *************************************************************************/

	if (wsEditorData.wsMenuEditorPro) {
		//Allow the user to drag sub-menu items to the top level.
		$('#ws_top_menu_dropzone').droppable({
			'hoverClass' : 'ws_dropzone_hover',

			'accept' : (function(thing){
				return thing.hasClass('ws_item');
			}),

			'drop' : (function(event, ui){
				var droppedItemData = readItemState(ui.draggable);
				pasteMenu(droppedItemData);
				if ( !event.ctrlKey ) {
					ui.draggable.remove();
				}
			})
		});

		//...and to drag top level menus to a sub-menu.
		$('#ws_sub_menu_dropzone').droppable({
			'hoverClass' : 'ws_dropzone_hover',

			'accept' : (function(thing){
				var visibleSubmenu = $('#ws_submenu_box').find('.ws_submenu:visible');
				return (
					//Accept top-level menus
					thing.hasClass('ws_menu') &&

					//Prevent users from dropping a menu on its own sub-menu.
					(visibleSubmenu.attr('id') != thing.data('submenu_id'))
				);
			}),

			'drop' : (function(event, ui){
				var droppedItemData = readItemState(ui.draggable);
				pasteItem(droppedItemData);
				if ( !event.ctrlKey ) {
					ui.draggable.remove();
				}
			})
		});
	}


	//Set up tooltips
	$('.ws_tooltip_trigger').qtip();

	//Flag closed hints as hidden by sending the appropriate AJAX request to the backend.
	$('.ws_hint_close').click(function() {
		var hint = $(this).parents('.ws_hint').first();
		hint.hide();
		wsEditorData.showHints[hint.attr('id')] = false;
		$.post(
			wsEditorData.adminAjaxUrl,
			{
				'action' : 'ws_ame_hide_hint',
				'hint' : hint.attr('id')
			}
		);
	});


	/******************************************************************
	                           Actor views
	 ******************************************************************/

	//Build the list of available actors
	var actorSelector = $('#ws_actor_selector').empty();
	actorSelector.append('<li><a href="#" class="current ws_no_actor">All</a></li>');

	if (wsEditorData.wsMenuEditorPro) {
		for(var actor in wsEditorData.actors) {
			if (!wsEditorData.actors.hasOwnProperty(actor)) {
				continue;
			}
			actorSelector.append(
				$('<li></li>').append(
					$('<a></a>')
						.attr('href', '#' + actor)
						.text(wsEditorData.actors[actor])
				)
			);
		}
		actorSelector.show();

		if ( wsEditorData.hasOwnProperty('selectedActor') && wsEditorData.selectedActor ) {
			setSelectedActor(wsEditorData.selectedActor);
		} else {
			setSelectedActor(null);
		}
	}

	$('li a', actorSelector).click(function(event) {
		var actor = $(this).attr('href').substring(1);
		if (actor == '') {
			actor = null;
		}

		setSelectedActor(actor);

		event.preventDefault();
	});

	//Finally, show the menu
    outputWpMenu(customMenu.tree);
  });

})(jQuery);

//==============================================
//				Screen options
//==============================================

jQuery(function($){
	var screenOptions = $('#ws-ame-screen-meta-contents');
	var hideSettingsCheckbox = screenOptions.find('#ws-hide-advanced-settings');
	var extraIconsCheckbox = screenOptions.find('#ws-show-extra-icons');

	hideSettingsCheckbox.prop('checked', wsEditorData.hideAdvancedSettings);
	extraIconsCheckbox.prop('checked', wsEditorData.showExtraIcons);

	//Update editor state when settings change
	$('#ws-hide-advanced-settings, #ws-show-extra-icons').click(function(){
		wsEditorData.hideAdvancedSettings = hideSettingsCheckbox.prop('checked');
		wsEditorData.showExtraIcons = extraIconsCheckbox.prop('checked');

		//Show/hide advanced settings dynamically as the user changes the setting.
		if ($(this).is(hideSettingsCheckbox)) {
			var menuEditorNode = $('#ws_menu_editor');
			if ( wsEditorData.hideAdvancedSettings ){
				menuEditorNode.find('div.ws_advanced').hide();
				menuEditorNode.find('a.ws_toggle_advanced_fields').text(wsEditorData.captionShowAdvanced).show();
			} else {
				menuEditorNode.find('div.ws_advanced').show();
				menuEditorNode.find('a.ws_toggle_advanced_fields').text(wsEditorData.captionHideAdvanced).hide();
			}
		}

		$.post(
			wsEditorData.adminAjaxUrl,
			{
				'action' : 'ws_ame_save_screen_options',
				'hide_advanced_settings' : wsEditorData.hideAdvancedSettings ? 1 : 0,
				'show_extra_icons' : wsEditorData.showExtraIcons ? 1 : 0,
				'_ajax_nonce' : wsEditorData.hideAdvancedSettingsNonce
			}
		);

		//We also have a cookie for the current user.
		$.cookie('ame-show-extra-icons', wsEditorData.showExtraIcons ? '1' : '0', {expires: 90});
	});

	//Move our options into the screen meta panel
	$('#adv-settings').empty().append(screenOptions.show());
});
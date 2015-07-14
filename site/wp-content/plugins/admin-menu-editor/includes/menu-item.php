<?php

/**
 * This class contains a number of static methods for working with individual menu items.
 *
 * Note: This class is not fully self-contained. Some of the methods will query global state.
 * This is necessary because the interpretation of certain menu fields depends on things like
 * currently registered hooks and the presence of specific files in admin/plugin folders.
 */
abstract class ameMenuItem {
	const unclickableTemplateId = '>special:none';
	const unclickableTemplateClass = 'ame-unclickable-menu-item';

	/**
	 * @var array A partial list of files in /wp-admin/. Correct as of WP 3.8-RC1, 2013.12.04.
	 * When trying to determine if a menu links to one of the default WP admin pages, it's faster
	 * to check this list than to hit the disk.
	 */
	private static $known_wp_admin_files = array(
		'customize.php' => true, 'edit-comments.php' => true, 'edit-tags.php' => true, 'edit.php' => true,
		'export.php' => true, 'import.php' => true, 'index.php' => true, 'link-add.php' => true,
		'link-manager.php' => true, 'media-new.php' => true, 'nav-menus.php' => true, 'options-discussion.php' => true,
		'options-general.php' => true, 'options-media.php' => true, 'options-permalink.php' => true,
		'options-reading.php' => true, 'options-writing.php' => true, 'plugin-editor.php' => true,
		'plugin-install.php' => true, 'plugins.php' => true, 'post-new.php' => true, 'profile.php' => true,
		'theme-editor.php' => true, 'themes.php' => true, 'tools.php' => true, 'update-core.php' => true,
		'upload.php' => true, 'user-new.php' => true, 'users.php' => true, 'widgets.php' => true,
	);

	/**
	 * Convert a WP menu structure to an associative array.
	 *
	 * @param array $item An menu item.
	 * @param int $position The position (index) of the the menu item.
	 * @param string $parent The slug of the parent menu that owns this item. Blank for top level menus.
	 * @return array
	 */
	public static function fromWpItem($item, $position = 0, $parent = '') {
		static $separator_count = 0;
		$default_css_class = empty($parent) ? 'menu-top' : '';
		$item = array(
			'menu_title'   => $item[0],
			'access_level' => $item[1], //= required capability
			'file'         => $item[2],
			'page_title'   => (isset($item[3]) ? $item[3] : ''),
			'css_class'    => (isset($item[4]) ? $item[4] : $default_css_class),
			'hookname'     => (isset($item[5]) ? $item[5] : ''), //Used as the ID attr. of the generated HTML tag.
			'icon_url'     => (isset($item[6]) ? $item[6] : 'dashicons-admin-generic'),
			'position'     => $position,
			'parent'       => $parent,
		);

		if ( is_numeric($item['access_level']) ) {
			$dummyUser = new WP_User;
			$item['access_level'] = $dummyUser->translate_level_to_cap($item['access_level']);
		}

		if ( empty($parent) ) {
			$item['separator'] = empty($item['file']) || empty($item['menu_title']) || (strpos($item['css_class'], 'wp-menu-separator') !== false);
			//WP 3.0 in multisite mode has two separators with the same filename. Fix by reindexing separators.
			if ( $item['separator'] ) {
				$item['file'] = 'separator_' . ($separator_count++);
			}
		} else {
			//Submenus can't contain separators.
			$item['separator'] = false;
		}

		//Flag plugin pages
		$item['is_plugin_page'] = (get_plugin_page_hook($item['file'], $parent) != null);

		if ( !$item['separator'] ) {
			$item['url'] = self::generate_url($item['file'], $parent);
		}

		$item['template_id'] = self::template_id($item, $parent);

		return array_merge(self::basic_defaults(), $item);
	}

	public static function basic_defaults() {
		static $basic_defaults = null;
		if ( $basic_defaults !== null ) {
			return $basic_defaults;
		}

		$basic_defaults = array(
	        //Fields that apply to all menu items.
            'page_title' => '',
			'menu_title' => '',
			'access_level' => 'read',
			'extra_capability' => '',
			'file' => '',
			'page_heading' => '',
	        'position' => 0,
	        'parent' => '',

	        //Fields that apply only to top level menus.
	        'css_class' => 'menu-top',
	        'hookname' => '',
	        'icon_url' => 'dashicons-admin-generic',
	        'separator' => false,
			'colors' => false,

	        //Internal fields that may not map directly to WP menu structures.
			'open_in' => 'same_window', //'new_window', 'iframe' or 'same_window' (the default)
			'template_id' => '', //The default menu item that this item is based on.
			'is_plugin_page' => false,
			'custom' => false,
			'url' => '',
		);

		return $basic_defaults;
	}

	public static function blank_menu() {
		static $blank_menu = null;
		if ( $blank_menu !== null ) {
			return $blank_menu;
		}

		//Template for a basic menu item.
		$blank_menu = array_fill_keys(array_keys(self::basic_defaults()), null);
		$blank_menu = array_merge($blank_menu, array(
			'items' => array(), //List of sub-menu items.
			'grant_access' => array(), //Per-role and per-user access. Supersedes role_access.
			'colors' => null,

			'custom' => false,  //True if item is made-from-scratch and has no template.
			'missing' => false, //True if our template is no longer present in the default admin menu. Note: Stored values will be ignored. Set upon merging.
			'unused' => false,  //True if this item was generated from an unused default menu. Note: Stored values will be ignored. Set upon merging.
			'hidden' => false,  //Hide/show the item. Hiding is purely cosmetic, the item remains accessible.
			'separator' => false,  //True if the item is a menu separator.

			'defaults' => self::basic_defaults(),
		));
		return $blank_menu;
	}

	public static function custom_item_defaults() {
		return array(
			'menu_title' => 'Custom Menu',
			'access_level' => 'read',
			'extra_capability' => '',
			'page_title' => '',
			'css_class' => 'menu-top',
			'hookname' => '',
			'icon_url' => 'dashicons-admin-generic',
			'open_in' => 'same_window',
			'is_plugin_page' => false,
			'page_heading' => '',
			'colors' => false,
		);
	}

	/**
	  * Get the value of a menu/submenu field.
	  * Will return the corresponding value from the 'defaults' entry of $item if the
	  * specified field is not set in the item itself.
	  *
	  * @param array $item
	  * @param string $field_name
	  * @param mixed $default Returned if the requested field is not set and is not listed in $item['defaults']. Defaults to null.
	  * @return mixed Field value.
	  */
	public static function get($item, $field_name, $default = null){
		if ( isset($item[$field_name]) ){
			return $item[$field_name];
		} else {
			if ( isset($item['defaults'], $item['defaults'][$field_name]) ){
				return $item['defaults'][$field_name];
			} else {
				return $default;
			}
		}
	}

	/**
	  * Generate or retrieve an ID that semi-uniquely identifies the template
	  * of the  given menu item.
	  *
	  * Note that custom items (i.e. those that do not point to any of the default
	  * admin menu pages) have no template IDs.
	  *
	  * The ID is generated from the item's and its parent's file attributes.
	  * Since WordPress technically allows two copies of the same menu to exist
	  * in the same sub-menu, this combination is not necessarily unique.
	  *
	  * @param array|string $item The menu item in question.
	  * @param string $parent_file The parent menu. If omitted, $item['defaults']['parent'] will be used.
	  * @return string Template ID, or an empty string if this is a custom item.
	  */
	public static function template_id($item, $parent_file = ''){
		if (is_string($item)) {
			return $parent_file . '>' . $item;
		}

		if ( self::get($item, 'custom') ) {
			return '';
		}

		//Maybe it already has an ID?
		$template_id = self::get($item, 'template_id');
		if ( !empty($template_id) ) {
			return $template_id;
		}

		if ( isset($item['defaults']['file']) ) {
			$item_file = $item['defaults']['file'];
		} else {
			$item_file = self::get($item, 'file');
		}

		if ( empty($parent_file) ) {
			if ( isset($item['defaults']['parent']) ) {
				$parent_file = $item['defaults']['parent'];
			} else {
				$parent_file = self::get($item, 'parent');
			}
		}

		if ($parent_file === 'profile.php') {
			$parent_file = 'users.php';
		}

		//Special case: In WP 4.0+ the URL of the "Appearance -> Customize" item is different on every admin page.
		//This is because the URL includes a "return" parameter that contains the current page's URL. It also makes
		//the template ID different on every page, so it's impossible to identify the menu. To fix that, lets remove
		//the "return" parameter from the ID.
		if ( ($parent_file === 'themes.php') && (strpos($item_file, 'customize.php?') === 0) ) {
			$item_file = remove_query_arg('return', $item_file);
		}

		return $parent_file . '>' . $item_file;
	}

  /**
   * Set all undefined menu fields to the default value.
   *
   * @param array $item Menu item in the plugin's internal form
   * @return array
   */
	public static function apply_defaults($item){
		foreach($item as $key => $value){
			//Is the field set?
			if ($value === null){
				//Use default, if available
				if (isset($item['defaults'], $item['defaults'][$key])){
					$item[$key] = $item['defaults'][$key];
				}
			}
		}
		return $item;
	}

  /**
   * Apply custom menu filters to an item of the custom menu.
   *
   * Calls a 'custom_admin_$item_type' filter with the entire $item passed as the argument.
   * Used when converting the current custom menu to a WP-format menu.
   *
   * @param array $item Associative array representing one menu item (either top-level or submenu).
   * @param string $item_type 'menu' or 'submenu'
   * @param mixed $extra Optional extra data to pass to hooks.
   * @return array Filtered menu item.
   */
	public static function apply_filters($item, $item_type, $extra = null){
		return apply_filters("custom_admin_{$item_type}", $item, $extra);
	}

	/**
	 * Recursively normalize a menu item and all of its sub-items.
	 *
	 * This will also ensure that the item has all the required fields.
	 *
	 * @static
	 * @param array $item
	 * @return array
	 */
	public static function normalize($item) {
		if ( isset($item['defaults']) ) {
			$item['defaults'] = array_merge(self::basic_defaults(), $item['defaults']);
		}
		$item = array_merge(self::blank_menu(), $item);

		$item['unused'] = false;
		$item['missing'] = false;
		$item['template_id'] = self::template_id($item);

		//Items pointing to a default page can't have a custom file/URL.
		if ( ($item['template_id'] !== '') && ($item['file'] !== null) ) {
			if ( $item['file'] == $item['defaults']['file'] ) {
				//Identical to default, so just set it to use that.
				$item['file'] = null;
			} else {
				//Different file = convert to a custom item. Need to call fix_defaults()
				//to fix other fields that are currently set to defaults custom items don't have.
				$item['template_id'] = '';
			}
		}

		$item['custom'] = $item['custom'] || ($item['template_id'] == '');
		$item = self::fix_defaults($item);

		//Older versions would allow the user to set the required capability directly.
		//This was incorrect since for default menu items the default cap was *always*
		//applied anyway, and the new cap was applied on top of that. We make that explicit
		//by storing the custom cap in a separate field - extra_capability - and keeping
		//access_level (required cap) at the default value.
		if ( isset($item['defaults']) && $item['access_level'] !== null ) {
			if ( empty($item['extra_capability']) ) {
				$item['extra_capability'] = $item['access_level'];
			}
			$item['access_level'] = null;
		}

		//Convert per-role access settings to the more general grant_access format.
		if ( isset($item['role_access']) ) {
			foreach($item['role_access'] as $role_id => $has_access) {
				$item['grant_access']['role:' . $role_id] = $has_access;
			}
			unset($item['role_access']);
		}

		if ( isset($item['items']) ) {
			foreach($item['items'] as $index => $sub_item) {
				$item['items'][$index] = self::normalize($sub_item);
			}
		}

		return $item;
	}

	/**
	 * Fix obsolete default values on custom items.
	 *
	 * In older versions of the plugin, each custom item had its own set of defaults.
	 * It was also possible to create a pseudo-custom item from a default item by
	 * freely overwriting its fields with custom values.
	 *
     * The current version uses the same defaults for all custom items. To avoid data
     * loss, we'll check for any mismatches and make such defaults explicit.
	 *
	 * @static
	 * @param array $item
	 * @return array
	 */
	private static function fix_defaults($item) {
		if ( $item['custom'] && isset($item['defaults']) ) {
			$new_defaults = self::custom_item_defaults();
			foreach($item as $field => $value) {
				$is_mismatch = is_null($value)
					&& array_key_exists($field, $item['defaults'])
					&& (
						!array_key_exists($field, $new_defaults) //No default.
						|| ($item['defaults'][$field] != $new_defaults[$field]) //Different default.
					);

				if ( $is_mismatch ) {
					$item[$field] = $item['defaults'][$field];
				}
			}
			$item['defaults'] = $new_defaults;
		}
		return $item;
	}

	/**
	 * Sanitize item properties.
	 *
	 * Strips disallowed HTML and invalid characters from many fields. For example, only users who
	 * have the "unfiltered_html" capability can use arbitrary HTML in menu titles.
	 *
	 * To avoid the performance hit of calling current_user_can('unfiltered_html') for every item,
	 * you can call it once and pass the result to this function.
	 *
	 * @param array $item Menu item in the internal format.
	 * @param bool|null $user_can_unfiltered_html
	 * @return array Sanitized menu item.
	 */
	public static function sanitize($item, $user_can_unfiltered_html = null) {
		if ( $user_can_unfiltered_html === null ) {
			$user_can_unfiltered_html = current_user_can('unfiltered_html');
		}

		if ( !$user_can_unfiltered_html ) {
			$kses_fields = array('menu_title', 'page_title', 'file', 'page_heading');
			foreach($kses_fields as $field) {
				$value = self::get($item, $field);
				if ( is_string($value) && !empty($value) && !self::is_default($item, $field) ) {
					$item[$field] = wp_kses_post($value);
				}
			}
		}

		//Sanitize CSS class names. Note that the WP implementation of sanitize_html_class() is very basic
		//and doesn't comply with the CSS2 spec, but that's probably OK in this case.
		$css_class = self::get($item, 'css_class');
		if ( !self::is_default($item, 'css_class') && is_string($css_class) && function_exists('sanitize_html_class') ) {
			$item['css_class'] = implode(' ', array_map('sanitize_html_class', explode(' ', $css_class)));
		}

		//While menu capabilities are generally not displayed anywhere except this plugin (which already
		//escapes them properly), lets sanitize them anyway in case another plugin displays them as-is.
		$capability_fields = array('access_level', 'extra_capability');
		foreach($capability_fields as $field) {
			$value = self::get($item, $field);
			if ( !self::is_default($item, $field) && is_string($value) ) {
				$item[$field] = strip_tags($value);
			}
		}

		//Menu icons can be all kinds of stuff (dashicons, data URIs, etc), but they can't contain HTML.
		//See /wp-admin/menu-header.php line #90 and onwards for how WordPress handles icons.
		if ( !self::is_default($item, 'icon_url') ) {
			$item['icon_url'] = strip_tags($item['icon_url']);
		}

		//WordPress already sanitizes the menu ID (hookname) on display, but, again, lets clean it just in case.
		if ( !self::is_default($item, 'hookname') ) {
			//Regex from menu-header.php, WP 4.1.
			$item['hookname'] = preg_replace('@[^a-zA-Z0-9_:.]@', '-', self::get($item, 'hookname'));
		}

		return $item;
	}

  /**
   * Custom comparison function that compares menu items based on their position in the menu.
   *
   * @param array $a
   * @param array $b
   * @return int
   */
	public static function compare_position($a, $b){
		return self::get($a, 'position', 0) - self::get($b, 'position', 0);
	}

	/**
	 * Generate a URL for a menu item.
	 *
	 * @param string $item_slug
	 * @param string $parent_slug
	 * @return string An URL relative to the /wp-admin/ directory.
	 */
	public static function generate_url($item_slug, $parent_slug = '') {
		$menu_url = is_array($item_slug) ? self::get($item_slug, 'file') : $item_slug;
		$parent_url = !empty($parent_slug) ? $parent_slug : 'admin.php';

		//Workaround for WooCommerce 2.1.12: For some reason, it uses "&amp;" instead of a plain "&" to separate
		//query parameters. We need a plain URL, not a HTML-entity-encoded one.
		//It is theoretically possible that another plugin might want to use a literal "&amp;", but its very unlikely.
		$menu_url = str_replace('&amp;', '&', $menu_url);

		if ( strpos($menu_url, '://') !== false ) {
			return $menu_url;
		}

		if ( self::is_hook_or_plugin_page($menu_url, $parent_url) ) {
			$base_file = self::is_wp_admin_file($parent_url) ? $parent_url : 'admin.php';
			$url = add_query_arg(array('page' => $menu_url), $base_file);
		} else {
			$url = $menu_url;
		}
		return $url;
	}

	private static function is_hook_or_plugin_page($page_url, $parent_page_url = '') {
		if ( empty($parent_page_url) ) {
			$parent_page_url = 'admin.php';
		}
		$pageFile = self::remove_query_from($page_url);

		//Files in /wp-admin are part of WP core so they're not plugin pages.
		if ( self::is_wp_admin_file($pageFile) ) {
			return false;
		}

		$hasHook = (get_plugin_page_hook($page_url, $parent_page_url) !== null);
		if ( $hasHook ) {
			return true;
		}

		/*
		 * Special case: Absolute paths.
		 *
		 * - add_submenu_page() applies plugin_basename() to the menu slug, so we don't need to worry about plugin
		 * paths. However, absolute paths that *don't* point point to the plugins directory can be a problem.
		 *
		 * - Due to a known PHP bug, certain invalid paths can crash PHP. See self::is_safe_to_append().
		 *
		 * - WP 3.9.2 and 4.0+ unintentionally break menu URLs like "foo.php?page=c:\a\b.php" because esc_url()
		 * interprets the part before the colon as an invalid protocol. As a result, such links have an empty URL
		 * on Windows (but they might still work on other OS).
		 *
		 * - Recent versions of WP won't let you load a PHP file from outside the plugins and mu-plugins directories
		 * with "admin.php?page=filename". See the validate_file() call in /wp-admin/admin.php. However, such filenames
		 * can still be used as unique slugs for menus with hook callbacks, so we shouldn't reject them outright.
		 * Related: https://core.trac.wordpress.org/ticket/10011
		 */
		$allowPathConcatenation = self::is_safe_to_append($pageFile);

		$pluginFileExists = $allowPathConcatenation
			&& ($page_url != 'index.php')
			&& is_file(WP_PLUGIN_DIR . '/' . $pageFile);
		if ( $pluginFileExists ) {
			return true;
		}

		return false;
	}

	/**
	 * Check if a file exists inside the /wp-admin subdirectory.
	 *
	 * @param string $filename
	 * @return bool
	 */
	private static function is_wp_admin_file($filename) {
		//Check our hard-coded list of admin pages first. It's measurably faster than
		//hitting the disk with is_file().
		if ( isset(self::$known_wp_admin_files[$filename]) ) {
			return self::$known_wp_admin_files[$filename];
		}

		//Now actually check the filesystem.
		$adminFileExists = self::is_safe_to_append($filename)
			&& is_file(ABSPATH . 'wp-admin/' . $filename);

		//Cache the result for later. We can generally expect more than one call per top level menu URL.
		self::$known_wp_admin_files[$filename] = $adminFileExists;

		return $adminFileExists;
	}

	/**
	 * Verify that it's safe to append a given filename to another path.
	 *
	 * If we blindly append an absolute path to another path, we can get something like "C:\a\b/wp-admin/C:\c\d.php".
	 * PHP 5.2.5 has a known bug where calling file_exists() on that kind of an invalid filename will cause
	 * a timeout and a crash in some configurations. See: https://bugs.php.net/bug.php?id=44412
	 *
	 * @param string $filename
	 * @return bool
	 */
	private static function is_safe_to_append($filename) {
		return (substr($filename, 1, 1) !== ':'); //Reject "C:\whatever" and similar.
	}

	/**
	 * Check if a field is currently set to its default value.
	 *
	 * @param array $item
	 * @param string $field_name
	 * @return bool
	 */
	public static function is_default($item, $field_name) {
		if ( isset($item[$field_name]) ){
			return false;
		} else {
			return isset($item['defaults'], $item['defaults'][$field_name]);
		}
	}

	public static function remove_query_from($url) {
		$pos = strpos($url, '?');
		if ( $pos !== false ) {
			return substr($url, 0, $pos);
		}
		return $url;
	}
}
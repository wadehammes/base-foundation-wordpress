<?php
/*
Plugin Name: Async JS and CSS
Plugin URI: http://wordpress.org/extend/plugins/asyncJSandCSS/
Description: Converts render-blocking CSS and JS files into NON-render-blocking, improving performance of web page.
Version: 1.7.13
Author: elCHAVALdelaWEB
Author URI: http://elchavaldelaweb.com
Author Email: dmikam@gmail.com
*/

//~ ini_set('display_errors','on');

add_action('plugins_loaded', 'ajc_plugin_loaded');
function ajc_plugin_loaded(){
        //~ load_plugin_textdomain('ajc', false, basename( dirname( __FILE__ ) ) . '/languages/' );
        load_plugin_textdomain('ajc', false,  '/async-js-and-css/languages/' );
}


require_once('functions.php');
require_once('settings_page.php');

define('AJC_FIRST',1);
define('AJC_LAST',999999);

register_activation_hook( __FILE__, 'ajc_activate' );
function ajc_activate(){
	if (get_option('ajc_async_js')===FALSE){
		update_option('ajc_async_js',							'on');
		update_option('ajc_async_css',						'on');
		update_option('ajc_detect_scripts_in_wp_head',	'on');
		update_option('ajc_detect_scripts_in_wp_foot',	'on');
		update_option('ajc_css_loading_method',			'inline_header');
		update_option('ajc_css_minify',						'on');
	}
}

// Add settings link on plugin page
function ajc_settings_link($links) {
	$settings_link = '<a href="options-general.php?page=asyncJSandCSS">'.__('Settings','ajc').'</a>';
	array_unshift($links, $settings_link);
	return $links;
}

$plugin = plugin_basename(__FILE__);
add_filter("plugin_action_links_{$plugin}", 'ajc_settings_link' );


add_action('init',					'ajc_init');

// ACTION init
function ajc_init(){
	$ajc_async_js							= get_option('ajc_async_js');
	$ajc_async_css							= get_option('ajc_async_css');
	$ajc_detect_scripts_in_wp_head	= get_option('ajc_detect_scripts_in_wp_head');
	$ajc_detect_scripts_in_wp_foot	= get_option('ajc_detect_scripts_in_wp_foot');
	$ajc_css_loading_method				= get_option('ajc_css_loading_method');

	if ($ajc_async_css){
		add_action('wp_print_styles',		'ajc_print_styles',									AJC_LAST);
		add_action('wp_footer',				'ajc_print_delayed_styles',						AJC_LAST+1);
	}


	if ($ajc_async_js || ($ajc_async_css && $ajc_css_loading_method=='js')){
		add_action('wp_head',				'ajc_loader_init',									AJC_FIRST-1);
		add_action('wp_footer',				'ajc_loader_execute',								AJC_LAST);
	}


	if ($ajc_async_js){
		add_action('wp_print_scripts',	'ajc_print_scripts',										AJC_LAST);

		if ($ajc_detect_scripts_in_wp_head){
			add_action('wp_head',				'ajc_detect_scripts_in_wp_head_pre',			AJC_FIRST);
			add_action('wp_head',				'ajc_detect_scripts_in_wp_head_post',			AJC_LAST);
		}


		if ($ajc_detect_scripts_in_wp_foot){
			add_action('wp_footer',				'ajc_detect_scripts_in_wp_foot_pre',			AJC_FIRST);
			add_action('wp_footer',				'ajc_detect_scripts_in_wp_foot_post',			AJC_LAST-1);
		}
	}
}


// ACTION wp_head
function ajc_loader_init(){
	$loaded = get_exceptions_script_names();
	?>
	<script type="text/javascript">
		var asyncScripts = [];
		var asyncFunctions = [];
		var loadedScripts = [<?php echo (!empty($loaded) ? "'".implode("','",$loaded)."'" : ''); ?>];
		var scriptsToLoad = 0;
		function execOnReady(func){
			asyncFunctions.push(func);
		}
	</script>
	<?php
}

// ACTION wp_footer
function ajc_loader_execute(){
	global $ajc_scripts;
	generate_inline_script($ajc_scripts);
}

// ACTION wp_print_scripts
function ajc_print_scripts($custom_script=''){
	global $ajc_scripts_are_async;
	global $ajc_scripts;

	/*
	 *	this function is loaded twisely for some reason, to avoid its duplicate execution using $ajc_scripts_are_async flag
	 */
	if ( is_admin() || !empty($ajc_scripts_are_async) ) {
		return;
	}
	$ajc_scripts_are_async = true;

	$ajc_scripts = get_ordered_script_list();
	unregister_all_scripts();

	//~ $concatenate_scripts = true;
	//~ $wp_scripts->do_concat = true;
}


// ACTION wp_print_styles
function ajc_print_styles(){
	global $ajc_styles_are_async;
	global $ajc_styles;

	if ( is_admin() || !empty($ajc_styles_are_async) ) {
		return;
	}

	$ajc_styles_are_async = true;

	$ajc_styles = get_styles_list();

	//~ dump(get_option('ajc_css_loading_method'));
	if (get_option('ajc_css_loading_method')=='inline_header'){
		$not_inlined = array();
		$minify = get_option('ajc_css_minify');
                //~ $ajc_styles = array_reverse($ajc_styles,true);
		foreach ($ajc_styles as $style){
			echo "<style type=\"text/css\" ".($style['media'] ? "media=\"{$style['media']}\"" : '' ).">";
			if (!inline_css($style['src'],$minify)){
				$not_inlined[] = $style;
			}
			echo "</style>";
		}
		if (!empty($not_inlined)){
			foreach ($not_inlined as $style){
				?><link rel="stylesheet"  href="<?php echo $style['src']?>" type="text/css" <?php echo $style['media'] ? "media=\"{$style['media']}\"" : ''?> /><?php
			}
		}
	}

	unregister_all_styles();
}

// ACTION wp_footer
function ajc_print_delayed_styles(){
	global $ajc_styles;

	$ajc_css_loading_method				= get_option('ajc_css_loading_method');

	switch ($ajc_css_loading_method){
		case "import":{
			echo "<style type=\"text/css\">";
			foreach ($ajc_styles as $style){
				echo "@import url(\"{$style['src']}\")".($style['media'] ? " ".$style['media'] : '').";";
			}
			echo "</style>";
			break;
		}
		case "js": {
			?>
			<script type="text/javascript">
				execOnReady(function(){
					var cssFiles = <?php echo json_encode($ajc_styles)?>;
					for (i = 0; i < cssFiles.length; i++){
						var css = document.createElement("link");
						css.setAttribute('rel','stylesheet');
						css.setAttribute('type','text/css');
						if (cssFiles[i].media){
							css.setAttribute('media',cssFiles[i].media);
						}
						css.setAttribute('href',cssFiles[i].src);
						document.body.appendChild(css);
					}
				});
			</script>
			<?php
			break;
		}
		case "inline":
		case "inline_footer": {
			$not_inlined = array();
			$minify = get_option('ajc_css_minify');
                        //~ $ajc_styles = array_reverse($ajc_styles,true);
			foreach ($ajc_styles as $style){
				echo "<style type=\"text/css\" ".($style['media'] ? "media=\"{$style['media']}\"" : '' ).">";
				if (!inline_css($style['src'],$minify)){
					$not_inlined[] = $style;
				}
				echo "</style>";
			}
			if (!empty($not_inlined)){
				foreach ($not_inlined as $style){
					?><link rel="stylesheet"  href="<?php echo $style['src']?>" type="text/css" <?php echo $style['media'] ? "media=\"{$style['media']}\"" : ''?> /><?php
				}
			}
			break;
		}
		case "link":{
			foreach ($ajc_styles as $style){
				?><link rel="stylesheet"  href="<?php echo $style['src']?>" type="text/css" <?php echo $style['media'] ? "media=\"{$style['media']}\"" : ''?> /><?php
			}
		}
	}
}

// ACTION wp_head
function ajc_detect_scripts_in_wp_head_pre(){
	ob_start();
}

// ACTION wp_head
function ajc_detect_scripts_in_wp_head_post(){
	$content = ob_get_contents();
	ob_end_clean();

	$content = preg_replace('/(<script.*>)([^<]*)(<\/script>)/i','$1 execOnReady(function(){$2}); $3',$content);

	echo $content;
}

// ACTION wp_footer
function ajc_detect_scripts_in_wp_foot_pre(){
	ob_start();
}

// ACTION wp_footer
function ajc_detect_scripts_in_wp_foot_post(){
	global $ajc_scripts;

	$content = ob_get_contents();
	ob_end_clean();
	$scripts = array();

	preg_match_all('/<script.*src=[\'|\"](.*)[\'|\"]><\/script>/i',$content,$scripts);
	$content = preg_replace('/<script[^>]*?src=[\'|\"](.*)[\'|\"]><\/script>/i','<!--script-->',$content);

	$content = preg_replace('/(<script[^>]*?>)([^<]*)(<\/script>)/i','$1 execOnReady(function(){$2}); $3',$content);

	foreach ($scripts[1] as $key=>$script){
		$ajc_scripts[] = array(
			'name'	=> 'footer_script_'.$key,
			'src'		=> $script,
			'deps'	=> array(),
			'extra'	=> ''
		);
	}
	echo $content;
}

?>
<?php

	add_action('admin_menu', 'ajc_admin_menu');

	function ajc_admin_menu() {
		add_options_page('Async JS and CSS', 'Async Settings', 'manage_options', 'asyncJSandCSS', 'ajc_settings_page');
	}

	function ajc_settings_page(){
	?>
		<form method="POST" action="options.php">
			<div class="thanks-block">
				<a class="donation" href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DNZ7D68MBS6KN" target="_blank"><?php _e('Make donation','ajc')?></a>
				<a class="review" href="http://wordpress.org/support/view/plugin-reviews/async-js-and-css#postform" target="_blank"><?php _e('or Write Review','ajc')?></a>
			</div>
		<?php
			settings_fields('ajc_options');
			do_settings_sections('ajc_options_form');
			submit_button();
		?>
		</form>
		<style>
			.radio-group {
				margin:0px;
			}
			textarea {
				width:450px;
				height:100px;
			}
			.thanks-block {
				float:right;
				width:220px;
				clear:right;
			}
			.thanks-block .donation,
			.thanks-block .review {
				display:block;
				margin:0px 0px 20px;
				padding:15px;
				text-align:center;
				background:#ECECEC;
				border:#666;
				color:#666;
				text-decoration:none;
				font-size:22px;
				-webkit-border-top-left-radius: 10px;
				-webkit-border-bottom-left-radius: 10px;
				-moz-border-radius-topleft: 10px;
				-moz-border-radius-bottomleft: 10px;
				border-top-left-radius: 10px;
				border-bottom-left-radius: 10px;
			}
			.thanks-block .donation:hover,
			.thanks-block .review:hover {
				background:#21759b;
				color:#ECECEC;
			}
			.form-table {
				clear:left;
				width:auto;
			}
		</style>
		<script>
			if (typeof(jQuery)!='undefined'){
				jQuery(document).ready(function (){
					validate();
					jQuery('input').change(function (){
						validate();
					})
				});
				function validate(){
					if (jQuery('input[name=ajc_async_js]').is(':checked')){
						jQuery('input[name=ajc_detect_scripts_in_wp_head],input[name=ajc_detect_scripts_in_wp_foot]').css({
							opacity:1
						});
					}else{
						jQuery('input[name=ajc_detect_scripts_in_wp_head],input[name=ajc_detect_scripts_in_wp_foot]').css({
							opacity:0.4
						});
					}
					if (jQuery('input[name=ajc_async_css]').is(':checked')){
						jQuery('.radio-group.css_loading_method').css({
							opacity: 1
						});
					}else{
						jQuery('.radio-group.css_loading_method').css({
							opacity: 0.4
						});
					}

					if (jQuery('input[name=ajc_async_css]').is(':checked') && (jQuery('input[name=ajc_css_loading_method][value=inline_footer]').is(':checked') || jQuery('input[name=ajc_css_loading_method][value=inline_header]').is(':checked'))){
						jQuery('input[name=ajc_css_minify]').css({
							opacity: 1
						});
					}else{
						jQuery('input[name=ajc_css_minify]').css({
							opacity: 0.4
						});
					}
				}
			}
		</script>
	<?php
	}

	add_action( 'admin_init', 'ajc_admin_init' );

	function ajc_admin_init() {
		add_settings_section('ajc_main_config',
			__('Async JS and CSS settings','ajc'),
			'ajc_main_config_render',
			'ajc_options_form'
		);

		add_settings_field('ajc_async_js',
			__('Load Javascript asynchronously','ajc'),
			'ajc_setting_async_js',
			'ajc_options_form',
			'ajc_main_config'
		);

		add_settings_field('ajc_detect_scripts_in_wp_head',
			__('Detect &lt;script&gt; tags in wp_head','ajc'),
			'ajc_setting_detect_scripts_in_wp_head',
			'ajc_options_form',
			'ajc_main_config'
		);

		add_settings_field('ajc_detect_scripts_in_wp_foot',
			__('Detect &lt;script&gt; tags in wp_footer','ajc'),
			'ajc_setting_detect_scripts_in_wp_foot',
			'ajc_options_form',
			'ajc_main_config'
		);

		add_settings_field('ajc_async_css',
			__('Load CSS asynchronously','ajc'),
			'ajc_setting_async_css',
			'ajc_options_form',
			'ajc_main_config'
		);

		add_settings_field('ajc_css_loading_method',
			__('CSS loading method','ajc'),
			'ajc_setting_css_loading_method',
			'ajc_options_form',
			'ajc_main_config'
		);

		add_settings_field('ajc_css_minify',
			__('Minify CSS','ajc'),
			'ajc_setting_css_minify',
			'ajc_options_form',
			'ajc_main_config'
		);

		add_settings_field('ajc_remove_GET_part',
			__('Remove "?ver=XXX" part from URLs','ajc'),
			'ajc_setting_remove_GET_part',
			'ajc_options_form',
			'ajc_main_config'
		);

		add_settings_field('ajc_exceptions',
			__('Exceptions (files to ignore and load in render-blocking way)','ajc'),
			'ajc_setting_exceptions',
			'ajc_options_form',
			'ajc_main_config'
		);

		register_setting( 'ajc_options', 'ajc_async_js');
		register_setting( 'ajc_options', 'ajc_async_css');
		register_setting( 'ajc_options', 'ajc_detect_scripts_in_wp_head');
		register_setting( 'ajc_options', 'ajc_detect_scripts_in_wp_foot');
		register_setting( 'ajc_options', 'ajc_css_loading_method');
		register_setting( 'ajc_options', 'ajc_css_minify');
		register_setting( 'ajc_options', 'ajc_exceptions');
		register_setting( 'ajc_options', 'ajc_remove_GET_part');
	}

	function ajc_main_config_render($attr){
                _e('Here you can configure desired functionality of "Async JS and CSS" plugin.','ajc');
	}

	function ajc_setting_async_js(){
	?>
		<input type="checkbox" name="ajc_async_js" value="on" <?php echo get_option('ajc_async_js')=='on' ? 'checked="checked"' : '' ?> />
	<?php
	}

	function ajc_setting_async_css(){
	?>
		<input type="checkbox" name="ajc_async_css" value="on" <?php echo get_option('ajc_async_css')=='on' ? 'checked="checked"' : '' ?> />
	<?php
	}

	function ajc_setting_detect_scripts_in_wp_head(){
	?>
		<input type="checkbox" name="ajc_detect_scripts_in_wp_head" value="on" <?php echo get_option('ajc_detect_scripts_in_wp_head')=='on' ? 'checked="checked"' : '' ?> />
                <span class="description"><?php _e('If there is something broken after plugin activation, try to disable this option','ajc')?></span>
	<?php
	}

	function ajc_setting_detect_scripts_in_wp_foot(){
	?>
		<input type="checkbox" name="ajc_detect_scripts_in_wp_foot" value="on" <?php echo get_option('ajc_detect_scripts_in_wp_foot')=='on' ? 'checked="checked"' : '' ?> />
                <span class="description"><?php _e('If there is something broken after plugin activation, try to disable this option','ajc')?></span>
	<?php
	}

	function ajc_setting_css_loading_method(){
		$method = get_option('ajc_css_loading_method');
		$options = array(
			'link'		=> __("Using <b>&lt;link rel='stylesheet' ...&gt;</b> tags on the foot of document", 'ajc'),
			'import'	=> __("Using <b>@import url(...)</b> css rules on the foot of document",'ajc'),
			'js'		=> __("Creating <b>&lt;link rel='stylesheet' ...&gt; tags using javascript</b> afted document loaded",'ajc'),
			'inline_footer'	=> __("Inserting all CSS styles <b>inline</b> into the document FOOTER",'ajc'),
			'inline_header'	=> __('(default)','ajc').__("Inserting all CSS styles <b>inline</b> into the document HEADER",'ajc'),
		);
		?>
			<ul class="radio-group css_loading_method">
			<?php
				foreach ($options as $key=>$description){
				?>
					<li>
						<input type="radio" name="ajc_css_loading_method" value="<?php echo $key?>" id="ajc_css_loading_method-<?php echo $key ?>" <?php echo $method==$key || ($method=='inline' && $key=='inline_footer') ? 'checked="checked"' : '' ?> />
						<label for="ajc_css_loading_method-<?php echo $key ?>">
							<?php echo $description?>
						</label>
					</li>
				<?php
				}
			?>
			</ul>
		<?php
	}

	function ajc_setting_css_minify(){
	?>
		<input type="checkbox" name="ajc_css_minify" value="on" <?php echo get_option('ajc_css_minify')=='on' ? 'checked="checked"' : '' ?> />
	<?php
	}

	function ajc_setting_remove_GET_part(){
	?>
		<input type="checkbox" name="ajc_remove_GET_part" value="on" <?php echo get_option('ajc_remove_GET_part')=='on' ? 'checked="checked"' : '' ?> />
	<?php
	}

	function ajc_setting_exceptions(){
		$exceptions = get_option('ajc_exceptions');
		?>
			<textarea name="ajc_exceptions"><?php echo $exceptions?></textarea>
			<p class="description">
                                <?php _e('You can use script/style name (aka "jquery") or part of script/style URL (like "-min.js").<br />One by line, please :)','ajc'); ?>
			</p>
		<?php
	}
?>
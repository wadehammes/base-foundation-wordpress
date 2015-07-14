<?php
/**
 * This is the HTML template for the plugin settings page.
 *
 * These variables are provided by the plugin:
 * @var array $settings Plugin settings.
 * @var string $editor_page_url A fully qualified URL of the admin menu editor page.
 * @var string $settings_page_url
 */

$currentUser = wp_get_current_user();
$isMultisite = is_multisite();
$isSuperAdmin = is_super_admin();
$formActionUrl = add_query_arg('noheader', 1, $settings_page_url);
$isProVersion = apply_filters('admin_menu_editor_is_pro', false);
?>

<div class="wrap">
	<?php screen_icon(); ?>
	<h2>
		<?php echo apply_filters('admin_menu_editor-self_page_title', 'Menu Editor'); ?> Settings
		<a href="<?php echo esc_attr($editor_page_url); ?>" class="add-new-h2"
		   title="Back to Admin Menu Editor">Editor</a>
	</h2>

	<form method="post" action="<?php echo esc_attr($formActionUrl); ?>" id="ws_plugin_settings_form">

		<table class="form-table">
			<tbody>
			<tr>
				<th scope="row">
					Who can access this plugin
				</th>
				<td>
					<fieldset>
						<p>
							<label>
								<input type="radio" name="plugin_access" value="super_admin"
									<?php checked('super_admin', $settings['plugin_access']); ?>
									<?php disabled( !$isSuperAdmin ); ?>>
								Super Admin

								<?php if ( !$isMultisite ) : ?>
									<br><span class="description">
										On a single site installation this is usually
										the same as the Administrator role.
									</span>
								<?php endif; ?>
							</label>
						</p>

						<p>
							<label>
								<input type="radio" name="plugin_access" value="manage_options"
									<?php checked('manage_options', $settings['plugin_access']); ?>
									<?php disabled( !current_user_can('manage_options') ); ?>>
								Anyone with the "manage_options" capability

								<br><span class="description">
									By default only Administrators have this capability.
								</span>
							</label>
						</p>

						<p>
							<label>
								<input type="radio" name="plugin_access" value="specific_user"
									<?php checked('specific_user', $settings['plugin_access']); ?>
									<?php disabled( $isMultisite && !$isSuperAdmin ); ?>>
								Only the current user

								<br>
								<span class="description">
									Login: <?php echo $currentUser->user_login; ?>,
								 	user ID: <?php echo get_current_user_id(); ?>
								</span>
							</label>
						</p>
					</fieldset>

					<p>
						<label>
							<input type="checkbox" name="hide_plugin_from_others" value="1"
								<?php checked( $settings['plugins_page_allowed_user_id'] !== null ); ?>
								<?php disabled( !$isProVersion || ($isMultisite && !is_super_admin()) ); ?>
							>
							Hide the "Admin Menu Editor<?php if ( $isProVersion ) { echo ' Pro'; } ?>" entry on the "Plugins" page from other users
							<?php if ( !$isProVersion ) {
								echo '(Pro version only)';
							} ?>
						</label>
					</p>
				</td>
			</tr>

			<tr>
				<th scope="row">
					Multisite settings
				</th>
				<td>
					<fieldset id="ame-menu-scope-settings">
						<p>
							<label>
								<input type="radio" name="menu_config_scope" value="global"
								       id="ame-menu-config-scope-global"
									<?php checked('global', $settings['menu_config_scope']); ?>
									<?php disabled(!$isMultisite || !$isSuperAdmin); ?>>
								Global &mdash;
								Use the same admin menu settings for all network sites.
							</label><br>
						</p>


						<label>
							<input type="radio" name="menu_config_scope" value="site"
								<?php checked('site', $settings['menu_config_scope']); ?>
								<?php disabled(!$isMultisite || !$isSuperAdmin); ?>>
							Per-site &mdash;
							Use different admin menu settings for each site.
						</label>
					</fieldset>
				</td>
			</tr>

			<tr>
				<th scope="row">Interface</th>
				<td>
					<p>
						<label>
							<input type="checkbox" name="hide_advanced_settings"
								<?php checked($settings['hide_advanced_settings']); ?>>
							Hide advanced menu options by default
						</label>
					</p>

					<?php if ($isProVersion): ?>
						<p>
						<label>
							<input type="checkbox" name="show_deprecated_hide_button"
								<?php checked($settings['show_deprecated_hide_button']); ?>>
							Enable the "Show/Hide" toolbar button (not recommended)
						</label>
						<br><span class="description">
							This feature is deprecated and is only kept for backwards compatibility purposes.
						</span>
						</p>
					<?php endif; ?>
				</td>
			</tr>

			<tr>
				<th scope="row">Editor colour scheme</th>
				<td>
					<fieldset>
						<p>
							<label>
								<input type="radio" name="ui_colour_scheme" value="classic"
									<?php checked('classic', $settings['ui_colour_scheme']); ?>>
								Blue and yellow
							</label>
						</p>

						<p>
							<label>
								<input type="radio" name="ui_colour_scheme" value="wp-grey"
									<?php checked('wp-grey', $settings['ui_colour_scheme']); ?>>
								Grey
							</label>
						</p>
					</fieldset>
				</td>
			</tr>

			<?php if ($isProVersion): ?>
			<tr>
				<th scope="row">Show submenu icons</th>
				<td>
					<fieldset id="ame-submenu-icons-settings">
						<p>
							<label>
								<input type="radio" name="submenu_icons_enabled" value="always"
									<?php checked('always', $settings['submenu_icons_enabled']); ?>>
								Always
							</label>
						</p>

						<p>
							<label>
								<input type="radio" name="submenu_icons_enabled" value="if_custom"
									<?php checked('if_custom', $settings['submenu_icons_enabled']); ?>>
								Only when manually selected
							</label>
						</p>

						<p>
							<label>
								<input type="radio" name="submenu_icons_enabled" value="never"
									<?php checked('never', $settings['submenu_icons_enabled']); ?>>
								Never
							</label>
						</p>
					</fieldset>
				</td>
			</tr>
			<?php endif; ?>

			<tr>
				<th scope="row">Debugging</th>
				<td>
					<label>
						<input type="checkbox" name="security_logging_enabled"
							<?php checked($settings['security_logging_enabled']); ?>>
						Show menu access checks performed by the plugin on every admin page
					</label>
					<br><span class="description">
						This can help track down configuration problems and figure out why
						your menu permissions don't work the way they should.

						Note: It's not recommended to use this option on a live site as
						it can reveal information about your menu configuration.
					</span>
				</td>
			</tr>
			</tbody>
		</table>

		<input type="hidden" name="action" value="save_settings">
		<?php
		wp_nonce_field('save_settings');
		submit_button();
		?>
	</form>

</div>
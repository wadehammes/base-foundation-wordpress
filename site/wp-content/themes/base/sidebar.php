<aside id="sidebar" class="sidebar" role="complementary">

	<?php if ( is_active_sidebar( 'sidebar' ) ) : ?>

		<?php dynamic_sidebar( 'sidebar' ); ?>

	<?php else : ?>

		<div class="alert help">
			<p><?php _e("Please activate some Widgets.", "jointstheme");  ?></p>
		</div>

	<?php endif; ?>

</aside>
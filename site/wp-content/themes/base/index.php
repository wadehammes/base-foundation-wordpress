<?php get_header(); ?>

		<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
			<?php get_template_part( 'partials/loop', 'archive' ); ?>
		<?php endwhile; ?>

		<?php if (function_exists('joints_page_navi')) { ?>
			<?php joints_page_navi(); ?>
		<?php } else { ?>

		<nav class="prev-next">
		  <ul class="clearfix">
		    <li class="prev-link"><?php next_posts_link(__('Older Entries', "jointstheme")) ?></li>
		    <li class="next-link"><?php previous_posts_link(__('Newer Entries', "jointstheme")) ?></li>
		  </ul>
		</nav>
		<?php } ?>

		<?php else : ?>
			<?php get_template_part( 'partials/missing', 'content' ); ?>
		<?php endif; ?>

<?php get_footer(); ?>

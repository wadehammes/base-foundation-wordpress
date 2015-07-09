<?php get_header(); ?>

		<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

			<?php get_template_part( 'partials/loop', 'single' ); ?>

		<?php endwhile; else : ?>

			<?php get_template_part( 'partials/missing', 'content' ); ?>

		<?php endif; ?>

<?php get_footer(); ?>

<?php
/*
Template Name: NAME HERE
*/

// GET CONTENT AMOUNT & SORT (for custom post types using Pods)
$args = array(
    'order' => 'ASC',
    'orderby' => '',
    'post_status' => 'publish',
    'post_type' => '',
    'posts_per_page' => 999
);

query_posts($args);

if (have_posts()) : while (have_posts()) : the_post();

    $thisID = $post->ID;
    $pMetaData = get_post_meta($thisID);

    $exampleLoop_html .= " 
        <li class='team-member row'>
            <div class='two columns'>" .
                get_the_post_thumbnail($thisID)
            . "</div>
            <div class'ten columns'>
                <h2>" . get_the_title() . ", " . $pMetaData['job_title'][0] . "</h2>
                <p>" . get_the_excerpt() . "</p>
            </div>
        </li>
    ";

endwhile; endif;

?>

<?php get_header(); ?>

			<main id="content">

				<div id="inner-content">

						<div id="main" class="eight columns clearfix" role="main">

							<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
								<ul>
									<?=$exampleLoop_html // LOOP FROM ABOVE ?> 
								</ul>
							<?php endwhile; ?>

							<?php else : ?>

									<article id="post-not-found" class="hentry clearfix">
											<header class="article-header">
												<h1><?php _e( 'Oops, Post Not Found!', 'bonestheme' ); ?></h1>
										</header>
											<section class="entry-content">
												<p><?php _e( 'Uh Oh. Something is missing. Try double checking things.', 'bonestheme' ); ?></p>
										</section>
										<footer class="article-footer">
												<p><?php _e( 'This is the error message in the index.php template.', 'bonestheme' ); ?></p>
										</footer>
									</article>

							<?php endif; ?>

						</div> <?php // end #main ?>

						<?php get_sidebar(); ?>

				</div> <?php // end #inner-content ?>

			</main> <?php // end #content ?>

<?php get_footer(); ?>

<?php
function joints_scripts_and_styles() {
  global $wp_styles; // Call global $wp_styles variable to add conditional wrapper around ie stylesheet the WordPress way
  if (!is_admin()) {
    $theme_version = wp_get_theme()->Version;

  	// Removes WP version of jQuery
  	wp_deregister_script('jquery');

    // Loads jQuery from CDNJS
    wp_enqueue_script( 'jquery', 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', array(), '2.1.4', true );

    // Adding scripts file in the footer
    wp_enqueue_script( 'site-js', get_template_directory_uri() . '/library/js/app.min.js', array( 'jquery' ), '', true );

    // Register main stylesheet
    wp_enqueue_style( 'site-css', get_template_directory_uri() . '/library/css/style.min.css', array(), '', 'all' );

    // Register Foundation icons
    // wp_enqueue_style( 'foundation-icons', get_stylesheet_directory_uri() . '/library/icons/foundation-icons.css', array(), '', 'all' );

    // Register Entypo icons
    wp_enqueue_style( 'entypo-icons', get_stylesheet_directory_uri() . '/library/icons/entypo.css', array(), '', 'all' );

    // Comment reply script for threaded comments
    if ( is_singular() AND comments_open() AND (get_option('thread_comments') == 1)) {
      wp_enqueue_script( 'comment-reply' );
    }
  }
}
add_action('wp_enqueue_scripts', 'joints_scripts_and_styles', 999);
?>
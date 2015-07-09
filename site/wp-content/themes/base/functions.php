<?php
// Theme support options
require_once(get_template_directory().'/library/functions/theme-support.php');

// WP Head and other cleanup functions
require_once(get_template_directory().'/library/functions/cleanup.php');

// Register scripts and stylesheets
require_once(get_template_directory().'/library/functions/enqueue-scripts.php');

// Register custom menus and menu walkers
require_once(get_template_directory().'/library/functions/menu.php');
require_once(get_template_directory().'/library/functions/menu-walkers.php');

// Register sidebars/widget areas
require_once(get_template_directory().'/library/functions/sidebar.php');

// Makes WordPress comments suck less
require_once(get_template_directory().'/library/functions/comments.php');

// Replace 'older/newer' post links with numbered navigation
require_once(get_template_directory().'/library/functions/page-navi.php');

// Adds support for multiple languages
require_once(get_template_directory().'/library/translation/translation.php');

// Adds site styles to the WordPress editor
// require_once(get_template_directory().'/library/functions/editor-styles.php');

// Related post function - no need to rely on plugins
// require_once(get_template_directory().'/library/functions/related-posts.php');

// Use this as a template for custom post types
// require_once(get_template_directory().'/library/functions/custom-post-type.php');

// Customize the WordPress login menu
// require_once(get_template_directory().'/library/functions/login.php');

// Customize the WordPress admin
// require_once(get_template_directory().'/library/functions/admin.php');

/*========================================
=            Custom Functions            =
========================================*/

/**
* Hyphenate - used to turn strings into slugs
**/
function hyphenate($str, array $noStrip = []) {
  // non-alpha and non-numeric characters become spaces
  $str = preg_replace('/[^a-z0-9' . implode("", $noStrip) . ']+/i', ' ', $str);
  $str = trim($str);
  $str = str_replace(" ", "-", $str);
  $str = strtolower($str);

  return $str;
}

/**
* Get Post Count - returns number of published posts in a Taxonomy
**/
function get_post_count($categories) {
  global $wpdb;
  $post_count = 0;

  foreach($categories as $cat) {
    $querystr = "
      SELECT count
      FROM $wpdb->term_taxonomy, $wpdb->posts, $wpdb->term_relationships
      WHERE $wpdb->posts.ID = $wpdb->term_relationships.object_id
      AND $wpdb->term_relationships.term_taxonomy_id = $wpdb->term_taxonomy.term_taxonomy_id
      AND $wpdb->term_taxonomy.term_id = $cat
      AND $wpdb->posts.post_status = 'publish'
    ";
    $result = $wpdb->get_var($querystr);
    $post_count += $result;
  }

  return $post_count;
}

?>
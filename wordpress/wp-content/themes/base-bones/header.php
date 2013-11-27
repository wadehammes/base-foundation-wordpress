<?php
/**
 * The Kitchen Sink Header for our theme.
 *
 * Displays all of the <head> section and everything up till <div id="main">
 *
 * @package WordPress
 * @subpackage Pappas_Group
 * @since 1.0
 */

//for some reason, necessary to generate proper <title> and body ID
wp_reset_query();

//get correct page ID (replace type1 with whatever, add more as needed)
if (is_page("home")) {
    $body_id = "index";
} elseif (get_post_type() == "type1" || is_page("type1")) {
    $body_id = "type1";
} else {
    $body_id = "other";
}

?><!doctype html>

<!--[if lt IE 7]><html <?php language_attributes(); ?> class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if (IE 7)&!(IEMobile)]><html <?php language_attributes(); ?> class="no-js lt-ie9 lt-ie8"><![endif]-->
<!--[if (IE 8)&!(IEMobile)]><html <?php language_attributes(); ?> class="no-js lt-ie9"><![endif]-->
<!--[if gt IE 8]><!--> <html <?php language_attributes(); ?> class="no-js"><!--<![endif]-->

	<head>
		<meta charset="utf-8">

		<?php // Google Chrome Frame for IE ?>
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

		<title><?php wp_title('|', true, 'right'); ?></title>
		<meta name="description" content="<?php bloginfo('description'); ?>" />

		<?php // mobile meta ?>
		<meta name="HandheldFriendly" content="True">
		<meta name="MobileOptimized" content="320">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1, user-scalable=no" />

		<?php // icons ?>
		<link rel="icon" href="<?php echo get_template_directory_uri(); ?>/favicon.png">
		<!--[if IE]>
			<link rel="shortcut icon" href="<?php echo get_template_directory_uri(); ?>/favicon.ico">
		<![endif]-->

		<link rel="pingback" href="<?php bloginfo('pingback_url'); ?>">

		<?php // facebook open graph ?>
		<meta property="og:title" content="<?php wp_title('')?>"/>
		<meta property="og:image" content="<?php echo get_template_directory_uri(); ?>/screenshot.png"/>
		<meta property="og:site_name" content="<?php wp_title('')?>"/>
		<meta property="og:description" content="<?php bloginfo('description'); ?>" />

		<!-- SCRIPT -->
		<script type="text/javascript">window.root = '/';</script>
		<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/js/main.min.js"></script>
		<script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/js/vendor/html5shiv.js"></script>

		<?php wp_head(); ?>

	</head>

	<body id="<?=$body_id?>" <?php body_class(); ?>>

		<?php // remove row here if not using fixed width island, or make .row width 100% in screen.scss" ?>
		<div id="container" class="row" role="main-wrapper">
			
			<header class="header" role="banner">
				
				<div id="inner-header" class="clearfix">
					
					<p id="logo"><a href="<?php echo home_url(); ?>" rel="nofollow"><img src="" alt="<?php bloginfo('name'); ?>" /></a></p>
					
					<nav role="navigation">
						<?php bones_main_nav(); ?>
					</nav>
				
				</div> <?php // end #inner-header ?>
			
			</header> <?php // end header ?>

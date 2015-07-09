<!--[if lt IE 7 ]><html<?php language_attributes(); ?> class="ie6"><![endif]-->
<!--[if (IE 7)&!(IEMobile) ]><html <?php language_attributes(); ?> class="ie7"><![endif]-->
<!--[if (IE 8)&!(IEMobile) ]><html <?php language_attributes(); ?> class="ie8"><![endif]-->
<!--[if (IE 9)&!(IEMobile) ]><html <?php language_attributes(); ?> class="ie9"><![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--><html <?php language_attributes(); ?> class="no-js"><!--<![endif]-->
<html>
  <head>
    <title><?php bloginfo('name'); ?><?php wp_title('|'); ?></title>

    <!-- GOOGLE -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

    <!-- MOBILE -->
    <meta name="HandheldFriendly" content="True">
    <meta name="MobileOptimized" content="320">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

    <!-- FAVICON -->
    <link rel="icon" href="<?php echo get_template_directory_uri(); ?>/favicon.png">
    <link rel="pingback" href="<?php bloginfo('pingback_url'); ?>">

    <!-- RSS -->
    <link rel="feed" type="application/atom+xml" href="<?php bloginfo('atom_url'); ?>" title="Atom Feed">
    <link rel="feed" type="application/rss+xml" href="<?php bloginfo('rss2_url'); ?>" title="RSS Feed">

    <!-- DETECT SMART BROWSERS -->
    <script type="text/javascript" defer="defer">
      /*=============================================
      =            Detect Smart Browsers            =
      =============================================*/
      if ('visibilityState' in document) {
        var doc = document.getElementsByTagName("html");
        doc[0].className = 'modern-browser';
      }
    </script>

    <?php wp_head(); ?>

    <!-- TYPEKIT ACCOUNT -->

    <!-- SCRIPT -->
    <script async="async" type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/modernizr/2.8.3/modernizr.min.js"></script>
    <script async="async" type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7.2/html5shiv.min.js"></script>

    <!-- GA -->

  </head>

  <body <?php body_class(); ?>>

    <nav class="navigation navigation--mobile navigation--off-canvas">
      <?php joints_off_canvas(); ?>
    </nav>
    <!-- End Mobile Nav -->

    <div class="site site--container">

      <header class="header <?php if(is_front_page()) { echo 'header--blog'; } ?>" role="banner">
        <?php joints_top_nav(); ?>
      </header>
      <!-- End Header -->

      <main class="content" role="application">

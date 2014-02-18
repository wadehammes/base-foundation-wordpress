<?php error_reporting(0); ?>

<!doctype html>

<!--[if lt IE 7]><html <?php language_attributes(); ?> class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if (IE 7)&!(IEMobile)]><html <?php language_attributes(); ?> class="no-js lt-ie9 lt-ie8"><![endif]-->
<!--[if (IE 8)&!(IEMobile)]><html <?php language_attributes(); ?> class="no-js lt-ie9"><![endif]-->
<!--[if gt IE 8]><!--> <html <?php language_attributes(); ?> class="no-js"><!--<![endif]-->

	<head>
		<meta charset="utf-8">

		<title><?php bloginfo('name'); ?><?php wp_title('|'); ?></title>

		<!-- Google Chrome Frame for IE -->
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

		<!-- mobile meta -->
		<meta name="HandheldFriendly" content="True">
		<meta name="MobileOptimized" content="320">
		<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

		<!-- icons & favicons -->
		<link rel="apple-touch-icon" href="<?php echo get_template_directory_uri(); ?>/library/images/apple-icon-touch.png">
		<link rel="icon" href="<?php echo get_template_directory_uri(); ?>/favicon.png">
		<!--[if IE]>
			<link rel="shortcut icon" href="<?php echo get_template_directory_uri(); ?>/favicon.ico">
		<![endif]-->
		<meta name="msapplication-TileColor" content="#f01d4f">
		<meta name="msapplication-TileImage" content="<?php echo get_template_directory_uri(); ?>/library/images/win8-tile-icon.png">

  		<link rel="pingback" href="<?php bloginfo('pingback_url'); ?>">

		<?php wp_head(); ?>

	    <!-- SOCIAL META -->
	    <meta property="og:title" content="<?php wp_title( '|', true, 'right' ); ?> <?php bloginfo('name'); ?>"/>
	    <meta property="og:image" content="<?php echo get_template_directory_uri(); ?>/images/icons/fav64.png"/>
	    <meta property="og:site_name" content="<?php bloginfo('name'); ?>"/>
	    <meta property="og:description" content="<?php bloginfo('content'); ?>" />

	    <!-- TYPEKIT ACCOUNT -->

	    <!-- SCRIPT -->
	    <script type="text/javascript">window._root = '<?php echo get_template_directory_uri(); ?>/';</script>
	    <script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>
	    <!-- <script type="text/javascript" src="/wp-includes/js/jquery/jquery.js"></script> -->
	    <script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/library/js/vendor/modernizr.min.js?<?php echo rand(0,10000000);?>"></script>
	    <script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/library/js/base.min.js?<?php echo rand(0,10000000);?>"></script>
	    <script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/library/js/plugins.min.js?<?php echo rand(0,10000000);?>"></script>
	    <script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/library/js/app.min.js?<?php echo rand(0,10000000);?>"></script>
	    <script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/library/js/main.min.js?<?php echo rand(0,10000000);?>"></script>
	    <script type="text/javascript" src="<?php echo get_template_directory_uri(); ?>/library/js/vendor/html5shiv.js?<?php echo rand(0,10000000);?>"></script>
		
		<!-- drop Google Analytics Here -->

		<!-- end analytics -->

	</head>

	<body <?php body_class(); ?>>

		<nav id="mobile-nav" class="show-for-small-only columns">
			<?php joints_main_nav(); ?>		
		</nav>
			
		<div id="container">

			<header class="header" role="banner">

				<div id="inner-header" class="row">
					<div class="large-3 medium-3 columns">
						
					</div>
					<nav id="desktop-nav" class="large-9 medium-9 hide-for-small-only columns">
						<?php joints_main_nav(); ?>
					</nav>
					<a class="menu show-for-small-only"><i class="entypo list"></i></a>
				</div> <!-- end #inner-header -->

			</header> <!-- end header -->
			

			

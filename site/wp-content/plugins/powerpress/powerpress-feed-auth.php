<?php
	// powerpress-feed-auth.php
	
	function powerpress_feed_auth($feed_slug)
	{
		// See if a filter exists to perform the authentication...
		$authenticated = apply_filters('powerpress_feed_auth', false, 'channel', $feed_slug);
		if( !$authenticated )
		{
			$FeedSettings = get_option('powerpress_feed_'.$feed_slug);
			
			if( !isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW']) )
				powerpress_feed_auth_basic( $FeedSettings['title'] );
				
			$user = $_SERVER['PHP_AUTH_USER'];
			$password = $_SERVER['PHP_AUTH_PW'];
			
			
			
			$userObj = wp_authenticate($user, $password);
			
			
			
			if( !is_wp_error($userObj) )
			{
				// Check capability...
				if( $userObj->has_cap( $FeedSettings['premium'] ) )
					return; // Nice, let us continue...
				
				powerpress_feed_auth_basic( $FeedSettings['title'], __('Access Denied', 'powerpress') );
			}
			
			// user authenticated here
			powerpress_feed_auth_basic( $FeedSettings['title'], __('Authorization Failed', 'powerpress') );
		}
	}
	
	function powerpress_feed_auth_basic($realm_name, $error = false )
	{
		if( !$error )
			$error = __('Unauthorized', 'powerpress');
		header('HTTP/1.0 401 Unauthorized');
		header('WWW-Authenticate: Basic realm="'. str_replace('"', '', $realm_name).'"');
		
		echo '<!DOCTYPE html>'; // HTML5!
		echo "\n";
?>
<html>
<head>
	<meta http-equiv="Content-Type" content="<?php bloginfo('html_type'); ?>; charset=<?php bloginfo('charset'); ?>" />
	<meta name="robots" content="noindex" />
	<title><?php echo htmlspecialchars($error); ?></title>
</head>
<body>
	<p><?php echo htmlspecialchars($error); ?></p>
</body>
</html>
<?php
		exit;
	}

?>
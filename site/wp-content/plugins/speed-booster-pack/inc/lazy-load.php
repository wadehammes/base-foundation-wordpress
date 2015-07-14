<?php
/* Lazy Load v. 0.5 => Lazy load images to improve page load times. Uses jQuery.sonar to only load an image when it's visible in the viewport.
 * http://wordpress.org/plugins/lazy-load/
 * Author & copyright WordPress.com VIP team, TechCrunch 2011 Redesign team, and Jake Goldman (10up LLC).
 * Uses jQuery.sonar by Dave Artz (AOL): http://www.artzstudio.com/files/jquery-boston-2010/jquery.sonar/
 * License: GPL2 */

if ( ! class_exists( 'Speed_Booster_Pack_Lazy_Load' ) ) :

class Speed_Booster_Pack_Lazy_Load {

	static function init() {
		if ( is_admin() )
			return;

		add_filter( 'the_content', array( __CLASS__, 'add_sbp_image_placeholders' ), 99 ); // run this later, so other content filters have run, including image_add_wh on WP.com
		add_filter( 'post_thumbnail_html', array( __CLASS__, 'add_sbp_image_placeholders' ), 11 );
		add_filter( 'get_avatar', array( __CLASS__, 'add_sbp_image_placeholders' ), 11 );
	}



	static function add_sbp_image_placeholders( $content ) {
		// Don't lazyload for feeds, previews, mobile
		if( is_feed() || is_preview() || ( function_exists( 'wp_is_mobile' ) && wp_is_mobile() ) )
			return $content;

		// Don't lazy-load if the content has already been run through previously
		if ( false !== strpos( $content, 'data-lazy-src' ) )
			return $content;

		// In case you want to change the placeholder image
		$sbp_placeholder_image = apply_filters( 'lazyload_images_placeholder_image', self::get_url( 'images/1x1.trans.gif' ) );

		// This is a pretty simple regex, but it works
		$content = preg_replace( '#<img([^>]+?)src=[\'"]?([^\'"\s>]+)[\'"]?([^>]*)>#', sprintf( '<img${1}src="%s" data-lazy-src="${2}"${3}><noscript><img${1}src="${2}"${3}></noscript>', $sbp_placeholder_image ), $content );

		return $content;
	}

	static function get_url( $path = '' ) {
		return plugins_url( ltrim( $path, '/' ), __FILE__ );
	}
}

function sbp_lazyload_images_add_placeholders( $content ) {
	return Speed_Booster_Pack_Lazy_Load::add_sbp_image_placeholders( $content );
}

Speed_Booster_Pack_Lazy_Load::init();

endif;

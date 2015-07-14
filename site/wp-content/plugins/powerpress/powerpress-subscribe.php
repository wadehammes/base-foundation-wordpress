<?php

function powerpresssubscribe_get_subscribe_page($Settings)
{
	if( !empty($Settings['subscribe_page_link_id']) && is_numeric($Settings['subscribe_page_link_id']) )
		return get_page_link($Settings['subscribe_page_link_id']);
	if( !empty($Settings['subscribe_page_link_href']) )
		return $Settings['subscribe_page_link_href'];
	return '';
}

function powerpresssubscribe_get_itunes_url($Settings)
{
	if( !empty($Settings['itunes_url']) )
	{
		// Make URL https://, always add ?mt=2 to end of itunes.apple.com URLs, include l1 to load iTunes store if installed, and always remove uo=X if it's there
		return preg_replace("/^http:\/\//i", "https://", add_query_arg( array('uo' => false, 'mt' => '2', 'ls' => '1'), trim($Settings['itunes_url']) ) );
	}

	if( !empty($Settings['feed_url']) && !empty($Settings['itpc']) )
		return preg_replace('/(^https?:\/\/)/i', 'itpc://', $Settings['feed_url']);
	
	return '';
}

function powerpresssubscribe_get_settings($ExtraData)
{
	$GeneralSettings = get_option('powerpress_general');
	
	$feed_slug = (empty($ExtraData['feed'])?'podcast': $ExtraData['feed']);
	$post_type = (empty($ExtraData['post_type'])?false: $ExtraData['post_type']);
	$category_id = (empty($ExtraData['cat_id'])?false: $ExtraData['cat_id']);
	$taxonomy_term_id = (empty($ExtraData['taxonomy_term_id'])?false: $ExtraData['taxonomy_term_id']);
	
	if( empty($ExtraData['subscribe_type']) ) // Make sure this value is set
		$ExtraData['subscribe_type'] = '';
	
	switch( $ExtraData['subscribe_type'] )
	{
		case 'post_type': {
			$category_id = 0;
			$taxonomy_term_id = 0;
		};
		case 'category': {
			$feed_slug = 'podcast';
			$taxonomy_term_id = 0;
			$post_type = 0;
		}; break;
		case 'ttid': {
			$feed_slug = 'podcast';
			$category_id = 0;
			$post_type = 0;
		}; break;
		case 'channel': 
		case 'general': 
		default: {
			$category_id = 0;
			$post_type = 0;
			$taxonomy_term_id = 0;
		}; break;
	}
	
	// We need to know if category podcasting is enabled, if it is then we may need to dig deeper for this info....
	if( !empty($GeneralSettings['cat_casting']) && $feed_slug == 'podcast' && (empty($ExtraData['subscribe_type']) || $ExtraData['subscribe_type'] == 'category' ) )
	{
		if( !$category_id && is_category() )
		{
			$category_id = get_query_var('cat');
		}
		if( !$category_id && is_single() )
		{
			$categories = wp_get_post_categories( get_the_ID() );
			if( count($categories) == 1 )
				list($null,$category_id) = each($categories);
		}
		
		if( $category_id ) // We are on a category page, makes it easy...
		{
			$Settings = get_option('powerpress_cat_feed_'.$category_id );
			
			if( !empty($Settings) )
			{
				$Settings['title'] = $Settings['title'];
				if( empty($Settings['title']) )
					$Settings['title'] = get_bloginfo('name') . get_wp_title_rss(); // Get category title
				if( !empty($Settings['feed_redirect_url']) )
					$Settings['feed_url'] = $Settings['feed_redirect_url'];
				else
					$Settings['feed_url'] = get_category_feed_link( $category_id ); // Get category feed URL
				$Settings['subscribe_page_url'] = powerpresssubscribe_get_subscribe_page($Settings);
				$Settings['itunes_url'] = powerpresssubscribe_get_itunes_url($Settings);
				$Settings['image_url'] = $Settings['itunes_image'];
				return $Settings;
			}
		}
		
		if($ExtraData['subscribe_type'] == 'category') // If we specifically wanted a category, then we need to return false so we don't miss-represent
		{
			return false;
		}
		// let fall through to find better settings
	}
	
	// Taxonomy
	if( $ExtraData['subscribe_type'] == 'ttid' )
	{
		if( !empty($GeneralSettings['taxonomy_podcasting']) )
		{
			// TODO! Taxonomy Podcasting subscription options
		}
		return false;
	}
	
	// Post Type Podcasting
	if( $ExtraData['subscribe_type'] == 'post_type' )
	{
		if( !empty($GeneralSettings['posttype_podcasting']) )
		{
			if( empty($post_type) && !empty($ExtraData['id']) )
				$post_type = get_post_type( $ExtraData['id'] );
			
			switch( $post_type )
			{
				case 'page':
				case 'post':
				{
					// SWEET, CARRY ON!
				}; break;
				default: {
					// TODO
					// $url = get_post_type_archive_feed_link($post_type, $feed_slug);
					return false; // Not suported for now
				}; break;
			}
		}
		
		return false;
	}
	
	
	// Podcast default and channel feed settings
	$FeedSettings = get_option('powerpress_feed_'. $feed_slug);
	
	if( empty($FeedSettings) && $feed_slug == 'podcast' )
		$FeedSettings = get_option('powerpress_feed'); // Get the main feed settings
	
	if( !empty($FeedSettings) )
	{
		$FeedSettings['title'] = $FeedSettings['title'];
		if( empty($FeedSettings['title']) )
			$FeedSettings['title'] = get_bloginfo('name'); // Get blog title
		if( !empty($FeedSettings['feed_redirect_url']) )
			$FeedSettings['feed_url'] = $FeedSettings['feed_redirect_url'];
		else
			$FeedSettings['feed_url'] =  get_feed_link($feed_slug); // Get Podcast RSS Feed
		$FeedSettings['subscribe_page_url'] = powerpresssubscribe_get_subscribe_page($FeedSettings);
		$FeedSettings['itunes_url'] = powerpresssubscribe_get_itunes_url($FeedSettings);
		$FeedSettings['image_url'] = $FeedSettings['itunes_image'];
		return $FeedSettings;
	}
	return false;
}

/*
case 'ttid':
		case 'category': {
			echo get_category_feed_link($cat_ID);
		}; break;
		case 'channel': {
			echo get_feed_link($feed_slug);
		}; break;
		case 'post_type': {
			
		}; break;
		case 'general':
		default: {
			echo get_feed_link('podcast');
		}
*/

// 1: Subscribe widget added to the links...
function powerpressplayer_link_subscribe_pre($content, $media_url, $ExtraData = array() )
{
	$SubscribeSettings = powerpresssubscribe_get_settings( $ExtraData );
	if( empty($SubscribeSettings) )
		return $content;
	
	if( !isset($SubscribeSettings['subscribe_links']) )
		$SubscribeSettings['subscribe_links'] = 1; // Default make this the first link option
		
	if( $SubscribeSettings['subscribe_links'] != 1 ) // beginning of links
		return $content;
		
	$feed_url = $SubscribeSettings['feed_url'];
	$itunes_url = trim($SubscribeSettings['itunes_url']);
	if( empty($itunes_url) )
		$itunes_url = preg_replace('/(^https?:\/\/)/i', 'itpc://', $feed_url);
	
	$player_links = '';
	$separator = false;
	if( !empty($itunes_url) ) {
		$player_links .= "<a href=\"".  htmlspecialchars($itunes_url) ."\" class=\"powerpress_link_subscribe powerpress_link_subscribe_itunes\" title=\"". __('Subscribe on iTunes', 'powerpress') ."\" rel=\"nofollow\">". __('iTunes','powerpress') ."</a>".PHP_EOL;
		$separator = true;
	}
	
	if( preg_match('/^(https?:\/\/)(.*)$/i', $feed_url, $matches ) ) {
		if( $separator )
			$player_links .= ' '.POWERPRESS_LINK_SEPARATOR .' ';
		else
			$separator = true;
		
		$android_url =  $matches[1] . 'subscribeonandroid.com/' . $matches[2];
		$player_links .= "<a href=\"".  htmlspecialchars($android_url) ."\" class=\"powerpress_link_subscribe powerpress_link_subscribe_rss\" title=\"". __('Subscribe on Android', 'powerpress') ."\" rel=\"nofollow\">". __('Android','powerpress') ."</a>".PHP_EOL;
	}
	
	if( $separator )
		$player_links .= ' '.POWERPRESS_LINK_SEPARATOR .' ';
	else
		$separator = true;
	$player_links .= "<a href=\"". htmlspecialchars($feed_url) ."\" class=\"powerpress_link_subscribe powerpress_link_subscribe_rss\" title=\"". __('Subscribe via RSS', 'powerpress') ."\" rel=\"nofollow\">". __('RSS','powerpress') ."</a>".PHP_EOL;
	
	if( !empty($SubscribeSettings['subscribe_page_url']) )
	{
		if( $separator )
			$player_links .= ' '.POWERPRESS_LINK_SEPARATOR .' ';
		else
			$separator = true;
			
		$label = (empty($SubscribeSettings['subscribe_page_link_text'])?__('More Subscribe Options', 'powerpress'):$SubscribeSettings['subscribe_page_link_text']);
		$player_links .= "<a href=\"{$SubscribeSettings['subscribe_page_url']}\" class=\"powerpress_link_subscribe powerpress_link_subscribe_more\" title=\"". htmlspecialchars($label) ."\" rel=\"nofollow\">". htmlspecialchars($label) ."</a>".PHP_EOL;
	}
	$content .= $player_links;
	return $content;
}

function powerpressplayer_link_subscribe_post($content, $media_url, $ExtraData = array() )
{
	if( $content )
	{
		$GeneralSettings = get_option('powerpress_general');
		
		$label = __('Subscribe:', 'powerpress');
		if( !empty($GeneralSettings['subscribe_label']) )
			$label = $GeneralSettings['subscribe_label'];
		// Get label setting from $GeneralSettings
		$prefix = htmlspecialchars($label) . ' ';
		
		$return = '<p class="powerpress_links powerpress_subsribe_links">'. $prefix . $content . '</p>';
		return $return;
	}
	return $content;
}

function powerpress_subscribe_shortcode( $attr ) {
	
	if ( is_feed() ) {
		return '';
	}
	
	// Only works on pages...
	if ( !is_singular() ) {
		return '';
	}

	/*
	extract( shortcode_atts( array(
		'channel'=>'', // Used for PowerPress Podcast Channels
		'slug' => '', // Used for PowerPress (alt for 'channel')
		'feed' => '', // Used for PowerPress (alt for 'channel')
		'post_type' => 'post', // Used for PowerPress 
		'category'=>'', // Used for PowerPress (specify category ID, name or slug)
		'term_taxonomy_id'=>'', // Used for PowerPress (specify term taxonomy ID)
		//'term_id'=>'', // Used for PowerPress (specify term ID, name or slug)
		//'taxonomy'=>'', // Used for PowerPress (specify taxonomy name)
		
		'title'	=> '', // Display custom title of show/program
		'feed_url'=>'', // provide subscribe widget for specific RSS feed
		'itunes_url'=>'', // provide subscribe widget for specific iTunes subscribe URL
		'image_url'=>'', // provide subscribe widget for specific iTunes subscribe URL
		'heading'=>'', // heading label for 
		
		// Appearance attributes
		'itunes_button'=>'', // Set to 'true' to use only the iTunes button
		'itunes_banner'=>'', // Set to 'true' to use only the iTunes banner
		'style'=>'' // Set to 'true' to use only the iTunes banner
	), $attr, 'powerpresssubscribe' ) );
	//return print_r($attr, true);
	*/
	
	/**/
	if( empty($attr['slug']) && !empty($attr['feed']) )
		$attr['slug'] = $attr['feed'];
	else if( empty($attr['slug']) && !empty($attr['channel']) )
		$attr['slug'] = $attr['channel'];
	else if( empty($attr['slug']) )
		$attr['slug'] = 'podcast';
	
	// Set empty args to prevent warnings
	if( !isset($attr['term_taxonomy_id']) )
		$attr['term_taxonomy_id'] = '';
	if( !isset($attr['category_id']) )
		$attr['category_id'] = '';
	if( !isset($attr['post_type']) )
		$attr['post_type'] = '';

	$subscribe_type = '';
	$category_id = '';
		
	if(!empty($attr['category']) )
	{
		$CategoryObj = false;
		if( preg_match('/^[0-9]*$/', $attr['category']) ) // If it is a numeric ID, lets try finding it by ID first...
			$CategoryObj = get_term_by('id', $attr['category'], 'category');
		if( empty($CategoryObj) )
			$CategoryObj = get_term_by('name', $attr['category'], 'category');
		if( empty($CategoryObj) )
			$CategoryObj = get_term_by('slug', $attr['category'], 'category');
		if( !empty($CategoryObj) )
		{
			$category_id = $CategoryObj->term_id;
		}
	}
	
	if( !empty($attr['category']) )
		$subscribe_type = 'category';
	if( !empty($attr['term_taxonomy_id']) )
		$subscribe_type = 'ttid';
	if( !empty($attr['post_type']) )
		$subscribe_type = 'post_type';
	if( !empty($attr['slug']) && $attr['slug'] != 'podcast' )
		$subscribe_type = 'channel';

	$Settings = array();
	if( !empty($attr['feed_url']) )
	{
		$Settings['feed_url'] = $attr['feed_url'];
	}
	else
	{
		$Settings = powerpresssubscribe_get_settings(  array('feed'=>$attr['slug'], 'taxonomy_term_id'=>$attr['term_taxonomy_id'], 'cat_id'=>$category_id, 'post_type'=>$attr['post_type'], 'subscribe_type'=>$subscribe_type) );
	}
	
	// Podcast title handling
	if( isset($attr['title']) && empty($attr['title']) && isset($Settings['title']) )
		unset( $Settings['title'] ); // Special case, if the title is unset, then it shuld not be displayed
	else if( !empty($attr['title']) )
		$Settings['title'] = $attr['title'];
	else if( !isset($Settings['title']) )
		$Settings['title'] = ''; // This way the title can be detected
	
	if( !empty($attr['itunes_url']) )
		$Settings['itunes_url'] = $attr['itunes_url'];
	if( !empty($attr['style']) )
		$Settings['style'] = $attr['style'];
	if( !empty($attr['image_url']) )
		$Settings['image_url'] = $attr['image_url'];	
	if( isset($attr['heading']) ) // If a custom heading is set
		$Settings['heading'] = $attr['heading'];
		
	if( empty($Settings) )
		return '';	
		
	$Settings['itunes_url'] = powerpresssubscribe_get_itunes_url($Settings);
	
	if( !empty($attr['itunes_button']) && !empty($Settings['itunes_url']) )
	{
		$html .= '<div>';
		$html .= '';
		$html .='<a href="';
		$html .= esc_url($Settings['itunes_url']);
		$html .= '" target="itunes_store" style="display:inline-block;overflow:hidden;background:url(https://linkmaker.itunes.apple.com/htmlResources/assets/en_us//images/web/linkmaker/badge_subscribe-lrg.png) no-repeat;width:135px;height:40px;}"></a>';
		$html .= '</div>';
		return $html;
	}
	
	if( !empty($attr['itunes_banner']) && !empty($Settings['itunes_url']) )
	{
		$apple_id = powerpress_get_apple_id($Settings['itunes_url'], true);
		if( !empty($apple_id) && $apple_id > 0 )
		{
			$html = '';
			$html .= '<div id="ibb-widget-root-'.$apple_id.'"></div>';
			$html .= "<script>(function(t,e,i,d){var o=t.getElementById(i),n=t.createElement(e);o.style.height=250;o.style.width=300;o.style.display='inline-block';n.id='ibb-widget',n.setAttribute('src',('https:'===t.location.protocol?'https://':'http://')+d),n.setAttribute('width','300'),n.setAttribute('height','250'),n.setAttribute('frameborder','0'),n.setAttribute('scrolling','no'),o.appendChild(n)})(document,'iframe','ibb-widget-root-".$apple_id."'";
			$html .= ',"banners.itunes.apple.com/banner.html?partnerId=&aId=&bt=catalog&t=catalog_blur&id='.$apple_id.'&c=us&l=en-US&w=300&h=250");</script>';
			return $html;
		}
		return '';
	}
	
	
	return powerpress_do_subscribe_widget($Settings);
}

add_shortcode( 'powerpresssubscribe', 'powerpress_subscribe_shortcode' );
add_shortcode( 'powerpress_subscribe', 'powerpress_subscribe_shortcode' );
	
require_once( POWERPRESS_ABSPATH . '/class.powerpress-subscribe-widget.php' );

function powerpress_do_subscribe_widget($settings)
{
	if( empty($settings['feed_url']) )
	{
		return '';
	}
	
	if( isset($settings['title']) && empty($settings['title']) )
	{
		$settings['title'] = get_bloginfo('name');
	}
	
	if( empty($settings['itunes_url']) )
	{
		$settings['itunes_url'] = powerpresssubscribe_get_itunes_url( $settings );
	}
	
	if( empty($settings['style']) )
	{
		$settings['style'] = 'modern';
	}
	
	if( empty($settings['image_url']) )
	{
		$settings['image_url'] = powerpress_get_root_url() . 'itunes_default.jpg'; // Default PowerPress image used in this case.
	}
	
	$htmlX = '';
	$html = '';
	$html .= '<div class="pp-sub-widget pp-sub-widget-'. esc_attr($settings['style']) .'">';
	if( !empty($settings['title']) )
	{
		if( !isset($settings['heading']) )
				$settings['heading'] = __('Subscribe to', 'powerpress');
			
		if( !empty($settings['heading']) ) {
			$html .= '<div class="pp-sub-h">'.  esc_html($settings['heading']) .'</div>'; }
		$html .= '<h2 class="pp-sub-t">'.  esc_html( $settings['title'] ) .'</h2>';
	}
	else
	{
		$settings['title'] = ''; // Make sure it's an empty string
	}
			$html .= '<div class="pp-sub-bx">';
				$html .= '<img class="pp-sub-l" src="'. esc_url( $settings['image_url'] ) .'" '. (!empty($settings['title'])?' title="'.  esc_attr($settings['title']).'" ':'') .'/>';
				$html .= '<div class="pp-sub-btns">';
				if( !empty($settings['itunes_url']) ) {
					$html .= '<a href="'.  esc_url( $settings['itunes_url'] ) .'" class="pp-sub-btn pp-sub-itunes"><span class="pp-sub-ic"></span>'.  esc_html( __('on iTunes', 'powerpress') ) .'</a>';
				}
				
				if( preg_match('/^(https?:\/\/)(.*)$/i', $settings['feed_url'], $matches ) ) {
					$android_url =  $matches[1] . 'subscribeonandroid.com/' . $matches[2];
					$html .= '<a href="'.  esc_url( $android_url ) .'" class="pp-sub-btn pp-sub-android"><span class="pp-sub-ic"></span>'.  esc_html( __('on Android', 'powerpress') ) .'</a>';
				}
				
				$html .= '<a href="'.  esc_url( $settings['feed_url'] ) .'" class="pp-sub-btn pp-sub-rss"><span class="pp-sub-ic"></span>'.  esc_html( __('via RSS', 'powerpress') ) .'</a>';
				
				// May want these back, not sure.
				//$html .= '<a href="'.  esc_url( $settings['feed_url'] ) .'" class="pp-sub-btn pp-sub-bp"><span class="pp-sub-ic"></span>'.  esc_html( __('BeyondPod for Android', 'powerpress') ) .'</a>';
				//$html .= '<a href="'.  esc_url( $settings['feed_url'] ) .'" class="pp-sub-btn pp-sub-pr"><span class="pp-sub-ic"></span>'.  esc_html( __('Podcast Republic for Android', 'powerpress') ) .'</a>';
				
			$html .= '</div>';
		$html .= '</div>';
		$html .= '<div class="pp-sub-m">';
			$html .= '<p class="pp-sub-m-p">'.  esc_html( __('Or subscribe with your favorite app by using the address below', 'powerpress') ) .'</p>';
			$html .= '<input class="pp-sub-m-i" type="text" name="NULL'. rand(0,9999) .'" value="'.  esc_attr( $settings['feed_url'] ) .'" onclick="this.focus();this.select();" />';
		$html .= '</div>';
	$html .= '</div>';

	return $html;
}

function powerpress_do_subscribe_sidebar_widget($settings)
{
	
	if( empty($settings['feed_url']) )
	{
		return '';
	}
	
	if( empty($settings['itunes_url']) )
	{
		$settings['itunes_url'] = powerpresssubscribe_get_itunes_url( $settings );
	}
	
	if( empty($settings['style']) )
	{
		$settings['style'] = 'modern';
	}
	

	
	
	$htmlX = '';
	$html = '';

	$html .= '<div class="pp-ssb-widget pp-ssb-widget-'. esc_attr($settings['style']) .'">';
		if( !empty($settings['itunes_url']) ) {
			$html .= '<a href="'.  esc_url( $settings['itunes_url'] ) .'" class="pp-ssb-btn pp-ssb-itunes"><span class="pp-ssb-ic"></span>'.  esc_html( __('on iTunes', 'powerpress') ) .'</a>';
		}
		
		if( preg_match('/^(https?:\/\/)(.*)$/i', $settings['feed_url'], $matches ) ) {
			$android_url =  $matches[1] . 'subscribeonandroid.com/' . $matches[2];
			$html .= '<a href="'.  esc_url( $android_url ) .'" class="pp-ssb-btn pp-ssb-android"><span class="pp-ssb-ic"></span>'.  esc_html( __('on Android', 'powerpress') ) .'</a>';
		}
		
		$html .= '<a href="'.  esc_url( $settings['feed_url'] ) .'" class="pp-ssb-btn pp-ssb-rss"><span class="pp-ssb-ic"></span>'.  esc_html( __('via RSS', 'powerpress') ) .'</a>';
		$htmlX .= '<a href="" class="pp-ssb-btn pp-ssb-email"><span class="pp--ic"></span>'.  esc_html( __('via Email', 'powerpress') ) .'</a>';
		if( !empty($settings['subscribe_page_url']) )
			$html .= '<a href="'.  esc_url( $settings['subscribe_page_url'] ) .'" class="pp-ssb-btn pp-ssb-more"><span class="pp-ssb-ic"></span>'.  esc_html( __('More Subscribe Options', 'powerpress') ) .'</a>';
	$html .= '</div>';

	return $html;
}
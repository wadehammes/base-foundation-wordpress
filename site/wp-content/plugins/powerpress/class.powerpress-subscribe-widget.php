<?php
/**
 * @package PowerPressSubscribe_Widget
 */
class PowerPressSubscribe_Widget extends WP_Widget {

	function __construct() {
		load_plugin_textdomain( 'powerpress' );
		
		parent::__construct(
			'powerpress_subscribe',
			__( 'Subscribe to Podcast' , 'powerpress'),
			array( 'description' => __( 'Display subscribe to podcast links.' , 'powerpress') )
		);

		if ( is_active_widget( false, false, $this->id_base ) ) {
			add_action( 'wp_head', array( $this, 'css' ) );
		}
	}

	function css() {
?>

<style type="text/css">

/*
PowerPress subscribe sidebar widget
*/
.widget-area .widget_powerpress_subscribe h2,
.widget-area .widget_powerpress_subscribe h3,
.widget-area .widget_powerpress_subscribe h4,
.widget_powerpress_subscribe h2,
.widget_powerpress_subscribe h3,
.widget_powerpress_subscribe h4 {
	margin-bottom: 0;
	padding-bottom: 0;
}

.pp-ssb-widget {
	width: 100%;
	margin: 0 auto;
	font-family: Sans-serif;
	color: #FFFFFF;
}
body .pp-ssb-widget a.pp-ssb-btn {
	width: 100% !important;
	height: 48px;
	padding: 0;
	color: #FFFFFF;
	display: inline-block;
	margin: 10px 0 10px 0;
	text-decoration: none;
	text-align:left;
	vertical-align: middle;
	line-height: 48px;
	font-size: 90% !important;
	font-weight: bold !important;
	overflow: hidden;
	border-radius: 1px;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2); 
}

body .sidebar .widget .pp-ssb-widget a:link,
body .sidebar .widget .pp-ssb-widget a:visited,
body .sidebar .widget .pp-ssb-widget a:active,
body .sidebar .widget .pp-ssb-widget a:hover,
body .pp-ssb-widget a.pp-ssb-btn:link,
body .pp-ssb-widget a.pp-ssb-btn:visited,
body .pp-ssb-widget a.pp-ssb-btn:active,
body .pp-ssb-widget a.pp-ssb-btn:hover {
	text-decoration: none !important;
	color: #FFFFFF !important;
}
.pp-ssb-widget-dark a,
.pp-ssb-widget-modern a {
	background-color: #222222;
}
.pp-ssb-widget-modern a.pp-ssb-itunes {
	background-color: #732BBE;
}
.pp-ssb-widget-modern a.pp-ssb-email {
	background-color: #337EC9;
}
.pp-ssb-widget-modern a.pp-ssb-android {
	background-color: #6AB344;
}
.pp-ssb-widget-modern a.pp-ssb-rss {
	background-color: #FF8800;
}
.pp-ssb-ic {
	width: 48px;
   height: 48px;
	border: 0;
	display: inline-block;
	vertical-align: middle;
	margin-right: 2px;
	background-image: url(<?php echo powerpress_get_root_url(); ?>images/spriteStandard.png);
	background-repeat: no-repeat;
	background-size: 294px;
}
.pp-ssb-itunes .pp-ssb-ic {
    background-position: -49px 0;
}
.pp-ssb-rss .pp-ssb-ic {
   background-position: 0 -49px;
}
.pp-ssb-email .pp-ssb-ic {
  background-position: -196px -49px;
}
.pp-ssb-android .pp-ssb-ic {
	background-position: -98px -98px;
}
.pp-ssb-more .pp-ssb-ic {
  background-position: -49px -49px;
}
/* Retina-specific stuff here */
@media only screen and (-webkit-min-device-pixel-ratio: 2.0),
       only screen and (min--moz-device-pixel-ratio: 2.0),
       only screen and (-o-min-device-pixel-ratio: 200/100),
       only screen and (min-device-pixel-ratio: 2.0) {
	.pp-sub-ic {
		background-image: url(<?php echo powerpress_get_root_url(); ?>images/spriteRetina.png);
	}
}
</style>
<?php
	}

	function form( $instance ) {
		if ( empty($instance['title']) ) {
			$instance['title'] = __( 'Subscribe to Podcast' , 'powerpress');
		}
		if ( empty($instance['subscribe_type']) ) {
			$instance['subscribe_type'] = '';
		}
		if ( empty($instance['subscribe_post_type']) ) {
			$instance['subscribe_post_type'] = '';
		}
		if ( empty($instance['subscribe_feed_slug']) ) {
			$instance['subscribe_feed_slug'] = '';
		}
		if ( empty($instance['subscribe_category_id']) ) {
			$instance['subscribe_category_id'] = '';
		}


?>
		<p>
		<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:' , 'powerpress'); ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
		</p>
		<p>
		<label for="<?php echo $this->get_field_id('subscribe_type'); ?>"><?php _e( 'Select Podcast Type:', 'powerpress' ); ?></label>
		<select class="widefat" id="<?php echo $this->get_field_id('subscribe_type'); ?>" name="<?php echo $this->get_field_name('subscribe_type'); ?>">
		<?php
		$types = array(''=>__('Default Podcast','powerpress'), 'channel'=>__('Podcast Channel','powerpress'), 'category'=>__('Category Podcasting','powerpress') ); //, 'post_type'=>__('Post Type Podcasting','powerpress'), 'ttid'=>__('Taxonomy Podcasting','powerpress'));
		while( list($type, $label) = each($types) ) {
			echo '<option value="' . $type . '"'
				. selected( $instance['subscribe_type'], $type, false )
				. '>' . $label . "</option>\n";
		}
		?>
		</select>
		</p>
<?php
		/*
?>
		<p id="<?php echo $this->get_field_id('subscribe_post_type_section'); ?>">
		<label for="<?php echo $this->get_field_id('subscribe_post_type'); ?>"><?php _e( 'Select Post Type:', 'powerpress' ); ?></label>
		<select class="widefat" id="<?php echo $this->get_field_id('subscribe_post_type'); ?>" name="<?php echo $this->get_field_name('subscribe_post_type'); ?>">
		<option value=""><?php echo __('Select Post Type', 'powerpress'); ?></option>
<?php
		$post_types = powerpress_admin_get_post_types(false);
		while( list($index, $label) = each($post_types) ) {
			echo '<option value="' . $label . '"'
				. selected( $instance['subscribe_post_type'], $label, false )
				. '>' . $label . "</option>\n";
		}
?>
		</select>
		</p>
<?php */ ?>
		
		<p id="<?php echo $this->get_field_id('subscribe_feed_slug_section'); ?>">
		<label for="<?php echo $this->get_field_id( 'subscribe_feed_slug' ); ?>"><?php esc_html_e( 'Feed Slug:' , 'powerpress'); ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'subscribe_feed_slug' ); ?>" name="<?php echo $this->get_field_name( 'subscribe_feed_slug' ); ?>" type="text" value="<?php echo esc_attr( $instance['subscribe_feed_slug'] ); ?>" />
		</p>
		
		<p id="<?php echo $this->get_field_id('subscribe_category_id_section'); ?>">
		<label for="<?php echo $this->get_field_id( 'subscribe_category_id' ); ?>"><?php esc_html_e( 'Category ID:' , 'powerpress'); ?></label>
		<input class="widefat" id="<?php echo $this->get_field_id( 'subscribe_category_id' ); ?>" name="<?php echo $this->get_field_name( 'subscribe_category_id' ); ?>" type="text" value="<?php echo esc_attr( $instance['subscribe_category_id'] ); ?>" />
		</p>
		
<?php
	}

	function update( $new_instance, $old_instance ) {
		$instance['title'] = strip_tags( $new_instance['title'] );
		$instance['subscribe_type'] = strip_tags( $new_instance['subscribe_type'] ); // general, channel, category, post_type, ttid
		$instance['subscribe_post_type'] = strip_tags( $new_instance['subscribe_post_type'] );; // eg sermons
		$instance['subscribe_feed_slug'] = strip_tags( $new_instance['subscribe_feed_slug'] );; // e.g. podcast
		$instance['subscribe_category_id'] = strip_tags( $new_instance['subscribe_category_id'] );; // e.g. 456
		//$instance['subscribe_term_taxonomy_id'] = strip_tags( $new_instance['subscribe_term_taxonomy_id'] );; // e.g. 345
		return $instance;
	}

	function widget( $args, $instance ) {

		$ExtraData = array('subscribe_type'=>'general', 'feed'=>'', 'taxonomy_term_id'=>'', 'cat_id'=>'', 'post_type'=>'');
		if( !empty($instance['subscribe_type']) )
			$ExtraData['subscribe_type'] = $instance['subscribe_type'];
			
		switch( $instance['subscribe_type'] )
		{
			case 'post_type': {
				if( empty($instance['subscribe_post_type']) )
					return;
				$ExtraData['post_type'] = $instance['subscribe_post_type'];
			}; 
			case 'channel': {
				if( empty($instance['subscribe_feed_slug']) )
					return;
				$ExtraData['feed'] = $instance['subscribe_feed_slug'];
			}; break;
			case 'ttid': {
				if( empty($instance['subscribe_term_taxonomy_id']) || !is_numeric($instance['subscribe_term_taxonomy_id']) )
					return;
				$ExtraData['taxonomy_term_id'] = $instance['subscribe_term_taxonomy_id'];
			}; break;
			case 'category': {
				if( empty($instance['subscribe_category_id']) || !is_numeric($instance['subscribe_category_id']) )
					return;
				$ExtraData['cat_id'] = $instance['subscribe_category_id'];
			}; break;
			default: {
				// Doesn't matter, we'r using the default podcast channel 

			};
		}
		
		$Settings = powerpresssubscribe_get_settings(  $ExtraData );
		if( empty($Settings) )
			return;

		echo $args['before_widget'];
		if ( ! empty( $instance['title'] ) ) {
			echo $args['before_title'];
			echo esc_html( $instance['title'] );
			echo $args['after_title'];
		}
		
		echo  powerpress_do_subscribe_sidebar_widget( $Settings );
		echo $args['after_widget'];
		return;
	}
}

function powerpress_subscribe_register_widget() {
	register_widget( 'PowerPressSubscribe_Widget' );
}

add_action( 'widgets_init', 'powerpress_subscribe_register_widget' );

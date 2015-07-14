=== Async JS and CSS ===
Contributors: elCHAVALdelaWEB
Donate link: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DNZ7D68MBS6KN
Tags: async,js,headjs,asynchronous,javascript,css,performance,pagespeed,insights,non-blocking
Requires at least: 2.6
Tested up to: 3.7.1
Stable tag: trunk

Converts render-blocking CSS and JS files into NON-render-blocking, improving performance of web page.

== Description ==

When your page is loaded by browser - all that stuff placed in HEAD tag is loaded before the page content - in blocking way. So the content is delivered to user in the last moment, after all javascript and css files are loaded.

If you are a webmaster or just want to make your web to make better your positions on search engines (yes, they preffer faster webs), just take a look on Google PageSpeed Insights - you'll see that one of the mos important things is fastenes and one of the reason why your page is not so fast - is "Render-blocking JavaScript and CSS".

This plugin makes ALL scripts loaded by other plugins to be loaded in asynchronous way just like Google PageSpeed Insights recommends.
All CSS files will be inserted inline into the document code or moved from the document beginning to the end, just before closing BODY tag (or just where you placed wp_foot() function). There are various methods to do that - they are all in plugin's configuration page.

Plugin makes all scripts to be loaded asynchronously using wp_enqueue_script and also can detect scrips included inside of wp_head and wp_footer hooks.

All CSS files loaded using wp_enqueue_style can be loaded just before closing BODY tag by four methods:

	* inserting <link rel="stylesheet" ...> tag

	* inserting <style>@import url(...);</style>

	* generating <link rel="stylesheet" ...> tag with javascript after all have loaded

	* inserting ALL CSS CODE INLINE into the document (the fastest way)

I was inspired to create this small plugin by Asynchronous Javascript but it works in completely different way.

== Installation ==

Like any other plugin

	1. Upload `asyncJSandCSS` folder to the `/wp-content/plugins/` directory

	2. Activate the plugin through the 'Plugins' menu in WordPress

	3. Configure the plugin if needed (Settings/Async Settings)

Plugin can affect only those files loaded using worpdress's queue (using wp_enqueue_script and wp_enqueue_style), so if you include your CSS file inserting <link rel="stylesheet"  href="..." type="text/css" media="all" /> into head.php of your theme - it WILL NOT be affected and will be loaded in standart render-blocking way.

== Frequently Asked Questions ==

= What can I do with a "Leverage browser caching" warning in Google's PageSpeed Insights ? =

You just need to include cache configuration in your .htaccess file. For example:

`<IfModule mod_expires.c>
	ExpiresActive On
	ExpiresByType image/gif "access plus 6 month"
	ExpiresByType image/jpeg "access plus 6 month"
	ExpiresByType image/png "access plus 6 month"
	ExpiresByType application/javascript "modification plus 1 month"
	ExpiresByType text/css "modification plus 1 month"
</IfModule>`


= Errors with jQuery =

Add this line to exceptions box:

`jquery`

or if you are using jQuery from Google Hosted Libraries, you need to put:

`jquery.min.js`

= Colorbox is not working =

Add this line to exceptions box:

`colorbox
colorbox-wrapper`


== Screenshots ==

1. Settings page

2. PageSpeed Insights results

== Known incompatibilities ==

	* Internet Explorer 7 - Some scripts could be loaded impropertly (trying to fix it)

	* Plugin - WP JetPack - Share - everithing works but "More" dropdown menú

	* Plugin - Google Analyticator

== Special thanks ==

	* NicMic

== TODO ==

	* Inline JS
	* Minify JS
	* Cache

== Changelog ==

=1.7.13=

Removed foreach PHP warnings

=1.7.12=

Minify CSS method is more reliable with multiline commments.

Minify CSS compression bettered.

Added localization support

Added Spanish language

Added Russian language

Default CSS loading method is changed to "Inline in HEAD"

=1.7.11=

Better dependencies list build.

=1.7.10=

Changed hooks min priority to make them always non-negative.

Removed unsetting of dependencies of excluded scripts.

=1.7.9=

Fixed some path issues in CSS url(...)

Fixed some warnings

=1.7.7=

Support for dependensy only enqueued scripts with no src specyfied.

Fixed Wordpress dependency jquery-core for jquery-migrate.

Added support to CSS inlined resourses like url(data:application/font....)

=1.7.6=

Added support for CSS media conditions and queries.

Converting JS files relative URLs to absolute form.

=1.7.5=

Fix: CSS minify function

Fix: Incorrectly detected wordpress installation URL for CSS inlineing

=1.7.2=

Option to include inline CSS in HEAD tag

=1.7.1=

Fixed .css files exclusion option

=1.7=

Option to remove an ?ver=XXX part from scripts and css files URLs

Option to exclude some files and to load them in default render-blocking way.

=1.6=

Added Settings page

Possibility to load CSS in inline mode and to minify it

Some other improvements

=1.5=

Better regular expression used to get scripts loaded in wp_foot.

CSS files are loaded using javascript onload event to get better scores on Google PageSpeed Insights and make loading of css REALLY asynchronous.

=1.4=

Added detection of scripts added through wp_head hook

=1.2=

Incompatibility with jQuery lightbox solved.

=1.1=

Some workaround about compatibility with jQuery Colorbox and JetPack

=1.0=

First release


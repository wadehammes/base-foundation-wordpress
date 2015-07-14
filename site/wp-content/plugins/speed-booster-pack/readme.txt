=== Speed Booster Pack ===
Contributors: tiguan
Donate link: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=EH65WAWPEYPXU
Tags: speed, optimization, performance, scripts to the footer, google libraries, font awesome cdn, defer parsing of javascript, remove query strings, lazy load images, gtmetrix, google pageSpeed, yslow, eliminate external render-blocking javascript and css, compression, async, render-blocking css
Requires at least: 3.6
Tested up to: 4.0
Stable tag: 2.7
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Features options to improve your website performance and get a higher score on the major speed testing services.

== Description ==

Speed Booster Pack allows you to improve your page loading speed and get a higher score on the major speed testing services such as [GTmetrix](http://gtmetrix.com/), [Google PageSpeed](http://developers.google.com/speed/pagespeed/insights/), [YSlow](https://developer.yahoo.com/yslow/), [Pingdom](http://tools.pingdom.com/fpt/), [Webpagetest](http://www.webpagetest.org/) or other speed testing tools.

= Why Site Speed Is Important =

When visitors lands on your site for the first time, you only have 3 seconds to capture their attention and convince them to stick around. That's not convinced you? Read on:

* Google incorporating site speed in search rankings
* 47% of online consumers expect a web page to load in 2 seconds or less
* 40% of people will abandon a site that takes more than 3 seconds to load
* 80% of online consumers are less likely to return to a slow website

The following video is not about "how to get a score of 100 in Google Page Speed" but want to show the difference in points Before and After activating Speed ​​Booster Pack plugin:

https://www.youtube.com/watch?v=u0G6pk2mX4M

= Main Plugin Features =

* **Eliminates external render-blocking javascript and css** in above-the-fold content.
* **Moves scripts to the footer** to improve page loading speed.
* **Loads CSS asynchronously** to render your page more quickly and get a higher score on the major speed testing services.
* **Minify and inline all CSS styles and move them to the footer** to eliminate external render-blocking CSS and optimize CSS delivery.
* **Lazy loads images** to improve page load times and save bandwidth.
* **Changes image compression level** to keep file sizes smaller.
* **Loads javascript files from Google Libraries** rather than serving them from your WordPress install directly, to reduce latency, increase parallelism and improve caching.
* **Defers parsing of javascript files** to reduce the initial load time of your page.
* **Removes query strings from static resources** to improve your speed scores.
* **Removes extra Font Awesome stylesheets** added to your theme by certain plugins, if *Font Awesome* is already used in your theme.
* **Removes junk header tags** to clean up your WordPress Header.
* **Displays page loading time** in the plugin options page.
* **Displays the number of executed queries** in the plugin options page.
* **Displays the Peak Memory Used** in the plugin options page.

For complete usage instructions visit [Plugin Documentation](http://tiguandesign.com/docs/speed-booster/)

= Recommended Plugins =

The following are other recommended plugins by the author of Speed Booster Pack:

* [Simple Author Box](http://wordpress.org/plugins/simple-author-box/) - A simple but cool author box with social icons.
* [Verify Ownership](http://wordpress.org/plugins/verify-ownership/) - Adds meta tag verification codes to your site.

= Translators are welcome! =
* Romanian (ro_RO) - [Liviu Costache](http://tiguandesign.com/)
* Spanish (es_ES) - [Andrew Kurtis](http://www.webhostinghub.com/)

== Installation ==

1. Download the plugin (.zip file) on your hard drive.
2. Unzip the zip file contents.
3. Upload the `speed-booster-pack` folder to the `/wp-content/plugins/` directory.
4. Activate the plugin through the 'Plugins' menu in WordPress.
5. A new sub menu item `Speed Booster Pack` will appear in your main Settings menu.

== Screenshots ==
1. Plugin options page, simple view (v2.5)
2. The Google Page Speed results on our [testing site](http://tiguandesign.com/testing-speed-booster/) (v2.5)

== Changelog ==

= 2.7 =
* All important options switched to off by default (on first plugin activation).

= 2.6 =
* Added Spanish translation by [Andrew Kurtis](http://www.webhostinghub.com/)

= 2.5 =
* Added option to exclude certain JS files from being moved to the footer.
* Added option to exclude certain JS files from being defered.
* Added a list of handles of all scripts and styles enqueued by your theme, useful for excluding options.
* Removed FOUC option since is useless with W3 Total Cache.
* Some visual changes on plugin options page.
* Translation updated with the new strings.
* Moved some admin inline scripts to js files.

= 2.4 =
* Fixed TypeError: $ is not a function when Prevent Flash of Unstyled Content (FOUC) option is active. Thanks to [@Marcio Duarte](http://profiles.wordpress.org/pagelab) for the [bug report](http://wordpress.org/support/topic/javascript-error-53).

= 2.3 =
* Added option to exclude certain CSS files from being loaded asynchronously.
* Changed the position of the styles when they are inlined to the footer (before js files).
* Added an experimental option to eliminate flash of unstyled content (FOUC) when all CSS styles are inlined to the footer.
* Translations updated.

= 2.2 =
* Fixed option to disable all CSS Async features on mobile devices.
* Fixed incompatibility with WPtouch plugin. Thanks to [@DevilIce](http://profiles.wordpress.org/devilice) for the [bug report](http://wordpress.org/support/topic/css-asynchronously-and-wptouch-issue).
* Updated function wp_is_mobile() on lazy load images to really disabled this feature on mobile devices.

= 2.1 =
*Added an option to disable all CSS Async features on mobile devices, to avoid some appearance issues until finding a clean solution to fix it.

= 2.0 =
*Modified: amended previous except for the admin toolbar css to enqueue its stylesheets only if admin bar is showing, to not break the render blocking plugin option.

= 1.9 =
* Fix: breaking the SEO by Yoast plugin interface (perhaps as well as to others too). Thanks to [@JahLive](http://profiles.wordpress.org/jahlive) for the [bug report](http://wordpress.org/support/topic/yoast-wordpress-seo-broken-after-update).
* Added an except for the admin toolbar css since the Load CSS asynchronously option removes its dashicons and stylesheets.


= 1.8 =
* Added option to load CSS asynchronously to render your page more quickly and get a higher score on the major speed testing services
* Added option to inline and minify all CSS styles and move them to the header or to the footer, to eliminate external render-blocking CSS and optimize CSS delivery.
* Added option to change the default image compression level, to help your pages load faster and keep file sizes smaller.
* Added memory usage information and active plugins number in the plugin options page.
* Replaced PHP version info with memory usage information (more useful).
* Added Romanian translation and POT file. Translators are welcome!

= 1.7 =
* Fixed Lazy Load missed js.

= 1.6 =
* Fixed some errors and missed codes from plugin functions.

= 1.5 =
* Added Lazy Load feature to improve the web page loading times of your images.
* Added an option to remove all rss feed links from WP Head.
* Added plugin options informations to the footer, visible in page source(hidden in front end), useful for debugging.

= 1.4 =
* Added a new option to remove extra Font Awesome stylesheets added to your theme by certain plugins, if Font Awesome is already used in your theme.
* Added a new option to remove WordPress Version Number.

= 1.3 =
* Fixed strict standards error: redefining already defined constructor for class.

= 1.2 =
* Modified the plugin version number variable in plugin options page.

= 1.1 =
* Modified Readme file

= 1.0 =
* Initial release

== Page Load Stats ==

Page Load Stats is a brief statistic displayed in the plugin options page. It displays your homepage loading speed (in seconds) and number of processed queries.

**Page loading time** – the progress bar color will be:

* *green* if the page load takes less than a second
* *orange* when loading the page takes between 1 and 2 seconds
* *red* if the page loading takes longer than 2 seconds

**Number of executed queries** – the progress bar color will be:

* *green* if there were less than 100 queries
* *orange* if there were between 100 and 200 queries
* *red* if the page required more than 200 queries

== Credits ==

* Thanks to [Jason Penney](http://jasonpenney.net/) for Google Libraries feature.
* Credits for Lazy Load feature belongs to: WordPress.com VIP team at Automattic, the TechCrunch 2011 Redesign team, and Jake Goldman (10up LLC).
* CSS option was implemented from Async JS and CSS plugin and updated to our plugin.
* The plugin uses [jQuery.sonar](http://www.artzstudio.com/files/jquery-boston-2010/jquery.sonar/) by Dave Artz (AOL).
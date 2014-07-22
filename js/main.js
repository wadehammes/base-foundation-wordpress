//- LOAD LIBS
//- ---------------------------------------------
(function ($) {
    //- Environment variables and references
    var js = base.path.js;

    //  * * *
    //- Libraries
    var aLibs = {
        'modernizr' : js + 'vendor/modernizr.min.js',
        //'jquery'      : '/wp-includes/js/jquery/jquery.js'
        //'plugins'     : js + 'plugins.min.js',
        //'app'         : js + 'app.min.js'
    };

    //- READY
    var ready = {
        modernizr : function(libs) {

            //- GLOBAL INTERACTION EVENTS
            window.base.events = {
                click       : Modernizr.touch ? 'touchend' : 'click',
                hoverstart  : Modernizr.touch ? 'touchstart' : 'mouseenter',
                hoverend    : Modernizr.touch ? 'touchend' : 'mouseleave'
            };

            typeof jQuery == 'function' ? ready.jquery(libs) :
            $script(libs.jquery, 'jquery', function() {
                ready.jquery(libs)
            });
        },
        jquery : function(libs) {
            // bind global event listeners
            ready.events();
            /*
            $script(libs['plugins'], 'plugins', function() {
                $script(libs['app'], 'app', function() {
                    ready.app();
                });
            });*/
        },
        events : function() {
            $(window).on('injectElem', function(evt, sSelector, fnFunction, eElement, fnCallback) {
                $(sSelector)[fnFunction](eElement);
                typeof fnCallback == 'undefined' || fnCallback();
            });

            ready.app();
        },
        app : function() {

            $(document).ready(function() {
                //- DOM READY
                var eNode;
            });
        }
    };
    typeof Modernizr == 'object' ? ready.modernizr(aLibs) :
    $script(aLibs.modernizr, 'modernizr', function() {
        ready.modernizr(aLibs);
    });
})(jQuery);

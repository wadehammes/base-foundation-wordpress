//- ASYNCHRONOUS SCRIPT LOADER
//- $script.js
//- ---------------------------------------------
(function(e,t,n){if(typeof module!="undefined"&&module.exports)module.exports=n();else if(typeof define=="function"&&define.amd)define(n);else t[e]=n()})("$script",this,function(){function v(e,t){for(var n=0,r=e.length;n<r;++n)if(!t(e[n]))return f;return 1}function m(e,t){v(e,function(e){return!t(e)})}function g(e,t,a){function d(e){return e.call?e():r[e]}function b(){if(!--p){r[h]=1;c&&c();for(var e in s){v(e.split("|"),d)&&!m(s[e],d)&&(s[e]=[])}}}e=e[l]?e:[e];var f=t&&t.call,c=f?t:a,h=f?e.join(""):t,p=e.length;setTimeout(function(){m(e,function(e){if(e===null)return b();if(u[e]){h&&(i[h]=1);return u[e]==2&&b()}u[e]=1;h&&(i[h]=1);y(!n.test(e)&&o?o+e+".js":e,b)})},0);return g}function y(n,r){var i=e.createElement("script"),s=f;i.onload=i.onerror=i[d]=function(){if(i[h]&&!/^c|loade/.test(i[h])||s)return;i.onload=i[d]=null;s=1;u[n]=2;r()};i.async=1;i.src=n;t.insertBefore(i,t.firstChild)}var e=document,t=e.getElementsByTagName("head")[0],n=/^https?:\/\//,r={},i={},s={},o,u={},a="string",f=false,l="push",c="DOMContentLoaded",h="readyState",p="addEventListener",d="onreadystatechange";if(!e[h]&&e[p]){e[p](c,function b(){e.removeEventListener(c,b,f);e[h]="complete"},f);e[h]="loading"}g.get=y;g.order=function(e,t,n){(function r(i){i=e.shift();if(!e.length)g(i,t,n);else g(i,r)})()};g.path=function(e){o=e};g.ready=function(e,t,n){e=e[l]?e:[e];var i=[];!m(e,function(e){r[e]||i[l](e)})&&v(e,function(e){return r[e]})?t():!function(e){s[e]=s[e]||[];s[e][l](t);n&&n(i)}(e.join("|"));return g};g.done=function(e){g([null],e)};return g});

//- ERROR CATCHING CONSOLE
//- ---------------------------------------------
function err(e){
	if(typeof e==="object"){if(e.message){console.log("\nMessage: "+e.message)}if(e.stack){console.log("\nStacktrace:");console.log("====================");console.log(e.stack)}}else{console.log("dumpError :: argument is not an object")}
};

//- ---------------------------------------------
//- ---------------------------------------------
//- APP START
//- GLOBAL VARS
//- ---------------------------------------------
var base = 	{
	path 	: {
		js 	: window.js
	},
	dev 	: true,
	mobile 	: function() {
		return $(window).width() <= 768;
	}
};
delete window.js;
//- LOAD LIBS
//- ---------------------------------------------
(function () {
    //- Environment variables and references
    var js = base.path.js;

    //  * * *
    //- Libraries
    var aLibs = {
        'modernizr' : js + 'vendor/modernizr.min.js',
        'jquery'  : '//ajax.googleapis.com/ajax/libs/jquery/1.8/jquery.min.js',
        //'jquery'    : js + 'vendor/jquery.min.js',
        'plugins'   : js + 'plugins.min.js',
        'app'       : js + 'app.min.js'
    };
	

	var Ready = {
        modernizr : function() {

            //- GLOBAL INTERACTION EVENTS
            base.events = {
                click       : Modernizr.touch ? 'touchend' : 'click',
                hoverstart  : Modernizr.touch ? 'touchstart' : 'mouseenter',
                hoverend    : Modernizr.touch ? 'touchend' : 'mouseleave'
            };

            //- jQuery loaded from head ?
            typeof jQuery == 'function' ? Ready.jquery() :
            $script(aLibs.jquery, 'jquery', function() {
                $ = jQuery;
                $(function() {
                    Ready.jquery();
                });
            });
        },
        jquery : function() {
            //- bind global event listeners
            Ready.events();

            //- Load plugins then app modules
            $script(aLibs['plugins'], 'plugins', function() {
                $script(aLibs['app'], 'app', function() {
                    Ready.app();
                });
            });
        },
        events : function() {
        },
        app : function() {
            // initialize Gumby and all included UI modules
            Gumby.init();

        }
    };
    //- Modernizr loaded in document head ?
    typeof Modernizr == 'object' ? Ready.modernizr() :
    $script(aLibs.modernizr, 'modernizr', function() {
        Ready.modernizr();
    });
})();

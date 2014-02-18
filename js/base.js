//- ASYNCHRONOUS SCRIPT LOADER
//- $script.js
//- ---------------------------------------------
(function(e,t,n){if(typeof module!="undefined"&&module.exports)module.exports=n();else if(typeof define=="function"&&define.amd)define(n);else t[e]=n()})("$script",this,function(){function v(e,t){for(var n=0,r=e.length;n<r;++n)if(!t(e[n]))return f;return 1}function m(e,t){v(e,function(e){return!t(e)})}function g(e,t,a){function d(e){return e.call?e():r[e]}function b(){if(!--p){r[h]=1;c&&c();for(var e in s){v(e.split("|"),d)&&!m(s[e],d)&&(s[e]=[])}}}e=e[l]?e:[e];var f=t&&t.call,c=f?t:a,h=f?e.join(""):t,p=e.length;setTimeout(function(){m(e,function(e){if(e===null)return b();if(u[e]){h&&(i[h]=1);return u[e]==2&&b()}u[e]=1;h&&(i[h]=1);y(!n.test(e)&&o?o+e+".js":e,b)})},0);return g}function y(n,r){var i=e.createElement("script"),s=f;i.onload=i.onerror=i[d]=function(){if(i[h]&&!/^c|loade/.test(i[h])||s)return;i.onload=i[d]=null;s=1;u[n]=2;r()};i.async=1;i.src=n;t.insertBefore(i,t.firstChild)}var e=document,t=e.getElementsByTagName("head")[0],n=/^https?:\/\//,r={},i={},s={},o,u={},a="string",f=false,l="push",c="DOMContentLoaded",h="readyState",p="addEventListener",d="onreadystatechange";if(!e[h]&&e[p]){e[p](c,function b(){e.removeEventListener(c,b,f);e[h]="complete"},f);e[h]="loading"}g.get=y;g.order=function(e,t,n){(function r(i){i=e.shift();if(!e.length)g(i,t,n);else g(i,r)})()};g.path=function(e){o=e};g.ready=function(e,t,n){e=e[l]?e:[e];var i=[];!m(e,function(e){r[e]||i[l](e)})&&v(e,function(e){return r[e]})?t():!function(e){s[e]=s[e]||[];s[e][l](t);n&&n(i)}(e.join("|"));return g};g.done=function(e){g([null],e)};return g});

//- GLOBAL VARS
//- ---------------------------------------------
(function($) {
    window.base = {
        path    : {
            root: window.root,
            img : window.root + 'library/images/',
            js  : window.root + 'library/js/'
        },
        fn: {
            mobile  : function() {
                return $(window).width() <= 768;
            },
            phone: function() {
                return $(window).width() <= 767;
            },
            mobileNav   : function() {
                return $(window).width() <= 1023;
            },
            ten24   : function() {
                return $(window).width() <= 1024;
            },
            und: function(v) {
                return typeof(v) == 'undefined';
            },
            ie : navigator.appName == 'Microsoft Internet Explorer',
            ie8: false,
            ie9: false,
            host : function() {
                var aURI = document.location.href.parseURI();
                var aDir = aURI['directory'].split('/');
                return aURI['protocol'] + '://' + aURI['authority'] + '/' + (aDir[1] == base.path.root ? aDir[1] + '/' : '');
            },
            browser: {
                version: navigator.userAgent.toLowerCase().match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)[1],
                msie: navigator.userAgent.toLowerCase().indexOf('msie') != -1
            },
            err : function(e) {
                if(typeof e==="object") {
                    if(e.message) {
                        console.log("\nMessage: "+e.message);
                    }
                    if(e.stack) {
                        console.log("\nStacktrace:");
                        console.log("====================");
                        console.log(e.stack);
                    }
                } else {
                    console.log("dumpError :: argument is not an object");
                }
            }
        }
    };
    delete window._root;
})(jQuery);

Base
======
This base structure is what I think is the best starting point for development of static sites, templates, prototypes and more. It is a great beginners framework for learning <a href="http://sass-lang.com">SASS</a> and an even more excellent way to learn responsive design using the amazing mixin offered by <a href="http://compass-style.org">Compass</a> and Foundation. It sits on top of <a href="http://gruntjs.com/">Grunt</a>, a JS Task Runner, which is used to concatenate and minify all the Javascript and CSS, ass well as compiling the Compass/SASS. It takes a bit to set up Grunt, so see below for installation articles.

####PRIOR TO USAGE:
You will need to make sure you have the following installed to your machine (via Terminal):

Install NPM first:
<a href="http://nodejs.org/download/">http://nodejs.org/download/</a>

Then Grunt:
<a href="http://gruntjs.com/getting-started">http://gruntjs.com/getting-started</a>

Then Bower:
<code>$ sudo gem install -g bower</code>

After that, install some other dependencies:
<code>$ sudo gem install -g sass</code>

Once you are ready to compile the project, download these files as a zip, decompress, and move them to your project directory. Then, in terminal:
<code>$ cd your/project/directory</code>
<code>$ npm install</code>
<code>$ bower install</code>
<code>$ grunt</code>

This will start the grunt interface and your project should compile, and you will recieve notifications of things changing.

Start building something awesome.

####OTHER TIDBITS:
- Use project/global for creating style guide classes and other reusuable, global elements.
- Use project/media/screen.scss for screen styles
- Use project/media/print.scss for print styles

This template makes use of all Compass mixins (for full list and documentation see here: http://compass-style.org/)
It's foundation is the Gumby Framework grid: http://gumbyframework.com/docs/grid/

####RELEASE LOG:
<a href="https://github.com/wadehammes/Base/releases">https://github.com/wadehammes/Base/releases</a>

####CONTRIBUTORS:
Special thanks to <a href="http://ca.linkedin.com/pub/simon-sarrasin/7/5b8/b0b">Simon Sarrasin</a> for the Javascript architecture

Base Foundation for Wordpress (with Joints Theme) (v4)
===

#####PRIOR TO FIRST USE (if you don't have these below installed already):
You will need to make sure you have the following installed to your machine (via Terminal):

Install NPM first:
<a href="http://nodejs.org/download/">http://nodejs.org/download/</a>

Then Bower:
```
$ npm install -g bower
```

And Bourbon:
```
$ sudo gem install -g bourbon
```

#####AFTER ABOVE DEPENDENCIES ARE INSTALLED:

Install this repo into your code directory:
```
$ cd your/development/directory/
$ git clone git@github.com:wadehammes/base-foundation-wordpress.git
// Move them into your project directory
$ cp -i base-foundation-wordpress /your/project/directory/
```

<b>NOTE: you may have to precede these next commands with 'sudo' if they are ERRoring on you.</b>

Install the Node Modules into the project:
```
$ npm install -g gulp
$ npm install
```

<b>NOTE: if you get an error about node-sass not being installed, take a look at this Stack Overflow (and the answer):</b>
<a href="http://stackoverflow.com/questions/29461831/libsass-bindings-not-found-when-using-node-sass-in-nodejs">http://stackoverflow.com/questions/29461831/libsass-bindings-not-found-when-using-node-sass-in-nodejs</a>

```
$ npm rebuild
```

Install the Bower dependencies into the project:
```
$ bower install
```

Install the Bourbon library into the theme directory project:
```
$ cd wp-content/themes/base/
$ bourbon install
$ bourbon update
```

Run Gulp:
```
$ gulp
```

Your project should compile successfully.

##### In order to optimize your SVG
```
$ gulp svg
```

##### In order to optimize your images
```
$ gulp images
```

##### In order to update packages:
```
$ bourbon update
$ bower update
$ npm update
```

Launching Wordpress
===
To get up and running, you will need to setup an environment using MAMP, <a href="https://www.mamp.info/en/">download it here</a>.

Once installed, point your MAMP to the <b>site/</b> directory, and then visit it in your browser at:
```
http://localhost:8888/
```

You will then be asked to start setting up your config files. At this point, you should use MAMP to acces your local databases (click the MySQL tab, and launch PHPMyAdmin, and create a new database), and fill out the respective information into the config setup.

Once you are setup and logged in, upgrade Wordpress to the latest version, and then click Appearance -> Themes, and Activate the Base Joints theme. You should now see a bare website at the url above.

Styling and Coding
===
All theme development is done in the <b>assets/</b> directory within the base theme.

Make sure you have Gulp running (outlined above).

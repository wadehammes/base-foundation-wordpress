/* DEPENDENCIES */
var gulp = require('gulp'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  minifyCSS = require('gulp-minify-css'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  rename = require('gulp-rename'),
  svgmin = require('gulp-svgmin'),
  imagemin = require('gulp-imagemin'),
  livereload = require('gulp-livereload'),
  notify = require("gulp-notify"),
  util = require('gulp-util'),
  watch = require('gulp-watch'),
  streamqueue  = require('streamqueue'),
  plumber = require('gulp-plumber');

/* PATHS */
var themeName = 'base';

// Style Path
var stylePathSrc = './site/wp-content/themes/' + themeName + '/assets/scss/**/*.scss';
var stylePathDest = './site/wp-content/themes/' + themeName + '/library/css/';

// Script Path
var scriptsPathSrc = ['./site/wp-content/themes/' + themeName + '/assets/js/_lib/**/*.js', './site/wp-content/themes/' + themeName + '/assets/js/_src/**/*.js', './site/wp-content/themes/' + themeName + '/assets/js/app.js'];
var scriptsPathWatch = './site/wp-content/themes/' + themeName + '/assets/js/**/*.js';
var scriptsPathDest = './site/wp-content/themes/' + themeName + '/library/js/';

// Sprites Path
var svgPathWatch = './site/wp-content/themes/' + themeName + '/assets/svg/*.svg';
var svgDest = './site/wp-content/themes/' + themeName + '/library/svg';

// Image Path
var imgPathWatch = './site/wp-content/themes/' + themeName + '/assets/img/*';
var imgDest = './site/wp-content/themes/' + themeName + '/library/img';

// PHP Paths
var phpPath = './site/wp-content/themes/' + themeName + '/**/*.php';

// Copy all files from Bower we need
gulp.task('copy', function() {
  gulp.src([
    /* add bower src files here */
    ])
  .pipe(gulp.dest('./site/wp-content/themes/' + themeName + '/assets/js/_lib/'));
  });

// Compile, prefix, minify and move our SCSS files
gulp.task('sass', function() {
  return gulp.src(stylePathSrc)
  .pipe(plumber())
  .pipe(sass({
    style: 'expanded',
    errLogToConsole: true
    }))
  .pipe(autoprefixer('last 2 versions', 'opera 12.1', 'ios 6', 'android 4'))
  .pipe(minifyCSS())
  .pipe(gulp.dest(stylePathDest))
  .pipe(livereload({start: true}))
  .pipe(notify({ message: 'Styles task complete' }));
  });

// Compile (in order), concatenate, minify, rename and move our JS files
gulp.task('scripts', function() {
  return streamqueue({ objectMode: true },
    gulp.src('./site/wp-content/themes/' + themeName + '/assets/js/_lib/**/*.js'),
    gulp.src('./site/wp-content/themes/' + themeName + '/assets/js/_src/**/*.js'),
    gulp.src('./site/wp-content/themes/' + themeName + '/assets/js/app.js')
    )
  .pipe(plumber())
  .pipe(concat('app.js', {newLine: ';'}))
  .pipe(uglify())
  .pipe(rename('app.min.js'))
  .pipe(gulp.dest(scriptsPathDest))
  .pipe(livereload({start: true}))
  .pipe(notify({ message: 'Scripts task complete' }));
  });

// Optimize images
gulp.task('img-opt', function () {
  return gulp.src(imgPathWatch)
  .pipe(imagemin({
    progressive: true
    }))
  .pipe(gulp.dest(imgDest))
  .pipe(notify({ message: 'Images task complete' }));
  });

// Optimize our SVGS
gulp.task('svg-opt', function () {
  return gulp.src(svgPathWatch)
  .pipe(svgmin({
    plugins: [
    {removeEmptyAttrs: false},
    {removeEmptyNS: false},
    {cleanupIDs: false},
    {unknownAttrs: false},
    {unknownContent: false},
    {defaultAttrs: false},
    {removeTitle: true},
    {removeDesc: true},
    {removeDoctype: true}
    ],
    }))
  .pipe(gulp.dest(svgDest))
  .pipe(notify({ message: 'SVG task complete' }));
  });

// Watch for any task changes
gulp.task('watch', function() {
  livereload.listen();

  gulp.watch(phpPath).on('change', function(file) {
    livereload.changed(file.path);
    util.log(util.colors.blue('PHP file changed' + ' (' + file.path + ')'));
    });

  gulp.watch(stylePathSrc, ['sass']);
  gulp.watch(scriptsPathWatch, ['scripts']);
  gulp.watch(svgPathWatch, ['svg-opt']);
  gulp.watch(imgPathWatch, ['img-opt']);
  });

/* RUN */
gulp.task('default', ['copy', 'sass', 'scripts', 'watch']);
gulp.task('images', ['img-opt']);
gulp.task('svg', ['svg-opt']);
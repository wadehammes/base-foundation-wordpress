module.exports = function(grunt) {

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        notify_hooks: {
            options: {
                enabled: true,
                max_jshint_notifications: 5,
                title: "Base Template" // Change this to your project
            }
        },
        //- Concat JS into single files
        concat: {
            plugins : {
                src: [
                    'js/_lib/**/*.js',
                    //'bowers_components/foundation/js/foundation.js'
                ],
                dest :
                    'wordpress/wp-content/themes/base/library/js/_plugins.concat.js'
            },
            app : {
                src: ['js/_src/**/*.js'],
                dest :
                    'wordpress/wp-content/themes/base/library/js/_app.concat.js'
            }
        },
        //- Uglify concatenated and other JS files
        uglify: {
            plugins : {
                files: {
                    'templates/js/plugins.min.js': ['<%= concat.plugins.dest %>'],
                    'wordpress/wp-content/themes/base/library/js/plugins.min.js': ['<%= concat.plugins.dest %>']
                }
            },
            app : {
                files: {
                    'templates/js/app.min.js': ['<%= concat.app.dest %>'],
                    'wordpress/wp-content/themes/base/library/js/app.min.js': ['<%= concat.app.dest %>']
                }
            },
            main : {
                files: {
                    'templates/js/main.min.js': ['js/main.js'],
                    'wordpress/wp-content/themes/base/library/js/main.min.js': ['js/main.js']
                }
            },
            base : {
                files: {
                    'templates/js/base.min.js': ['js/base.js'],
                    'wordpress/wp-content/themes/base/library/js/base.min.js': ['js/base.js']
                }
            }
        },
        //- Compile SASS
        sass: {
            dist: {
                options: {
                  outputStyle: 'expanded',
                },
                files: {
                    'css/app-unprefixed.css': 'scss/style.scss',
                }
            },
            ie: {
               options: {
                  outputStyle: 'expanded',
                },
                files: {
                    'wordpress/wp-content/themes/base/library/css/ie.min.css': 'scss/ie.scss',
                }
            }
        },
        // Prefix the CSS
        autoprefixer: {
            options: {
                browsers: ["last 2 versions", "> 1%", "ie 8", "ie 7"]
            },
            templates: {
                src: 'css/app-unprefixed.css',
                dest: 'templates/css/app.css'
            },
        },
        // Minify CSS
        cssmin: {
            minify: {
                expand: true,
                cwd: 'templates/css/',
                src: ['*.css', '!*.min.css'],
                dest: 'wordpress/wp-content/themes/base/library/css/',
                ext: '.min.css'
            },
        },
        // Move images to theme that are used within templates (only needed in our CMS installs)
        sync: {
            main: {
                files: [{
                    cwd: 'templates/img',
                    src: '**',
                    dest: 'wordpress/wp-content/themes/base/library/images/',
                }]
            }
        },
        // Optimize all images
        imageoptim: {
          main: {
            options: {
              jpegMini: false
            },
            src: ['templates/img/', 'wordpress/wp-content/uploads/**/**/']
          }
        },
        //- Notify when task is complete
        notify: {
            app_change: {
                options: {
                    title: 'Javascript',  // optional
                    message: 'Concatenatated and minifed successfully', //required
                }
            },
            css_complete: {
                options: {
                    title: 'SASS -> CSS',  // optional
                    message: 'Compiled, prefixed, and moved successfully', //required
                }
            },
            images_complete: {
                options: {
                    title: 'Images optimized.',  // optional
                    message: 'Images ran through ImageOptim succesfully', //required
                }
            }
        },
        //- Watchers
        watch: {
            grunt: {
                files: ['gruntfile.js'],
                tasks: ['default'],
            },
            sass: {
                files: ['scss/**/*.scss'],
                tasks: ['sass_change']
            },
            css: {
                files: ['wordpress/wp-content/themes/base/*.css', 'css/*.css'],
                tasks: ['notify:css_complete', 'css_prefixed', 'css_min']
            },
            js: {
                files: ['<%= concat.app.src %>', '<%= concat.plugins.src %>', 'js/base.js', 'js/main.js'],
                tasks: ['notify:app_change','app_change']
            },
            sync: {
                files: ['wordpress/wp-content/themes/base/**', 'templates/img/**'],
                tasks: ['sync_files']
            },
            images: {
                files: ['templates/img/**/', 'wordpress/wp-content/uploads/**/'],
                tasks: ['notify:images_complete', 'imageoptim']
            }
        }
    });
    //- REGISTER ALL OUR GRUNT TASKS
    grunt.task.run('notify_hooks');
    grunt.registerTask('default', ['sass', 'autoprefixer','cssmin', 'concat', 'uglify', 'imageoptim', 'sync', 'watch']);
    grunt.registerTask('app_change', ['concat:app', 'uglify:app', 'uglify:main', 'uglify:base']);
    grunt.registerTask('concat_change', ['uglify:app', 'uglify:main']);
    grunt.registerTask('sass_change', ['sass']);
    grunt.registerTask('css_prefixed', ['autoprefixer']);
    grunt.registerTask('css_min', ['cssmin']);
    grunt.registerTask('sync_files', ['sync']);
    grunt.registerTask('images', ['imageoptim']);
};

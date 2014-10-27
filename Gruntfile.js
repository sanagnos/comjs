// ============================================================================
// Gruntfile.js
// ============================================================================
// 
// Gruntfile for production tasks.
// 
// Copyright (c) 2014, Stelios Anagnostopoulos (stelios@outlook.com)
// All rights reserved.
// ============================================================================

'use strict';

module.exports = function (grunt) {

    // ============================================================================
    // Templating
    // ============================================================================

    var concatBanner = [
        '// ============================================================================',
        '// <%= pkg.name %>',
        '// ============================================================================',
        '// Name      : <%= pkg.name %>',
        '// Version   : <%= pkg.version %>',
        '// Build date: <%= grunt.template.today("dd-mm-yyyy") %>',
        '// ',
        '// Copyright (c) 2014, <%= pkg.author %>',
        '// All rights reserved.',
        '// ============================================================================',
        '',
        '\'use strict\';',
        '',
        'var com = {};',
        '',
        ''
    ].join('\n');

    var concatFooter = [
        '',
        '',
        'if (typeof window === \'undefined\')',
        '    module.exports = com;',
        'else',
        '    window.com = com;',
        ''
    ].join('\n');

    // ============================================================================
    // Tasks
    // ============================================================================

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        concat: {

            options: {
                banner: concatBanner,
                footer: concatFooter,

                stripBanners: {
                    block: false,
                    line : false
                }
            },

            bcom: {
                src : 'src/bcom/*.js',
                dest: 'builds/bcom.js'
            },

            ncom: {
                src : 'src/ncom/*.js',
                dest: 'builds/ncom.js'
            }
        },

        uglify: {

            options: {
                preserveComments: false,
                compress: true
            },

            bcom: {
                src : 'builds/bcom.js',
                dest: 'builds/bcom.min.js'
            },

            ncom: {
                src : 'builds/ncom.js',
                dest: 'builds/ncom.min.js'
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // ============================================================================
    // Registration
    // ============================================================================

    grunt.registerTask('default', [
        'concat',
        'uglify'
    ]);
};

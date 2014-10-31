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

    var banner = [
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
        ''
    ].join('\n');

    // ============================================================================
    // Tasks
    // ============================================================================

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        uglify: {

            options: {
                banner: banner,
                preserveComments: false,
                compress: true
            },

            bcom: {
                src : 'src/bcom.js',
                dest: 'bcom.js'
            },

            ncom: {
                src : 'src/ncom.js',
                dest: 'ncom.js'
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // ============================================================================
    // Registration
    // ============================================================================

    grunt.registerTask('default', 'uglify');
};

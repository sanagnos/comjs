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
        '// Copyright (c) 2015, <%= pkg.author %>',
        '// All rights reserved.',
        '// ============================================================================',
        '',
        ''
    ].join('\n');

    // ============================================================================
    // Tasks
    // ============================================================================

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        concat: {

            bcom: {

                options: {
                    banner          : banner,
                    preserveComments: false
                },

                src : [
                    'lib/bcom/_header.js', 
                    'lib/bcom/lib.*.js', 
                    'lib/bcom/amd.loader.js',
                    'lib/bcom/amd.registry.js',
                    'lib/bcom/net.*.js',
                    'lib/bcom/gfx.*.js',
                    'lib/bcom/_footer.js', 
                ],

                dest: 'build/bcom.dist.js'
            }
        },

        uglify: {

            options: {
                banner: banner,
                preserveComments: false,
                mangle: {
                    except  : ['bcom', 'proxy'],
                    sort    : true,
                    toplevel: true
                }, 
                compress: {
                    sequences    : true,
                    properties   : true,
                    dead_code    : true,
                    drop_debugger: true,
                    unsafe       : true,
                    conditionals : true,
                    comparisons  : true,
                    evaluate     : true,
                    booleans     : true,
                    loops        : true,
                    unused       : true,
                    hoist_funs   : true,
                    hoist_vars   : true,
                    warnings     : true,
                    negate_iife  : true,
                    pure_getters : false,
                    pure_funcs   : null,
                    drop_console : true,
                    if_return    : true,
                    join_vars    : true,
                    cascade      : true

                }
            },

            bcom: {
                src : 'build/bcom.dist.js',
                dest: 'build/bcom.js'
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // ============================================================================
    // Registration
    // ============================================================================

    grunt.registerTask('default', ['concat', 'uglify']);
};

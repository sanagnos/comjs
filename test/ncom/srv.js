// ============================================================================
// comjs/test/ncom/srv.js
// ============================================================================
// 
// Indexer testing.
// 
// Copyright (c) 2014, Stelios Anagnostopoulos (stelios@outlook.com)
// All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Imports
// ============================================================================

var assert = require('better-assert'),
    com    = require('../../builds/ncom');

// ============================================================================
// Main
// ============================================================================

describe('# ncom/srv', function () {

    it('can init', function (done) {
        com.srv.open({
    
            port: 80,

            services: {
                name: 'Calc',

                add: function (a, b, res) {
                    res.done(a + b);
                }
            },

            requests: {
                '/': function (req, res) {
                    res.end('hello');
                }
            },

            files: [
                './README.md'
            ]
        }, function () {
            assert(typeof com.srv.registerRequests === 'function');
            assert(typeof com.srv.registerFiles === 'function');
            assert(typeof com.srv.registerServices === 'function');
            done();
        });
    });

    after(function (done) {
        com.srv.close(function () {
            done()
        });
    });
});
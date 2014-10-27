// ============================================================================
// comjs/test/ncom/rpc.js
// ============================================================================
// 
// RPC tests for ncom.
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

describe('# ncom/amd', function () {
    
    before(function (done) {
        com.srv.open({
    
            port: 80,

            services: {
                name: 'calc',

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
            com.rpc.open('http://localhost', function () {
                done();
            });
        });
    });

    it('can invoke script from web', function (done) {
        com.amd.invoke('http://underscorejs.org/underscore-min.js', function (underscore) {
            assert(typeof underscore === 'object');
            assert(typeof underscore._ === 'function');

            var arr = underscore._.map({
                one: 1, 
                two: 2, 
                three: 3
            }, function (num, key) { 
                return num * 3;
            });
            assert(arr[0] === 3);
            assert(arr[1] === 6);
            assert(arr[2] === 9);
            done();
        });
    });
    
    after(function (done) {
        com.srv.close(function () {
            done()
        });
    });
});
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

describe('# ncom/rpc', function () {
    
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

    it('can call the proxy', function (done) {
        com.rpc.proxy.calc.add(1, 2, function (res) {
            assert(res === 3);
            done();
        });
    });

    it('can get the proxy', function (done) {
        assert(typeof com.rpc.proxy === 'object');
        assert(typeof com.rpc.proxy.calc === 'object');
        assert(typeof com.rpc.proxy.calc.add === 'function');
        done();
    });

    it('can call the proxy', function (done) {
        com.rpc.proxy.calc.add(1, 2, function (res) {
            assert(res === 3);
            done();
        });
    });

    it('can call the proxy on new service', function (done) {
        com.srv.registerServices({
            name: 'geo',
            mapToState: function (city, res) {
                if (city === 'bellevue')
                    res.done('washington');
                else
                    res.done('unknown');
            }
        });
        com.rpc.close();
        com.rpc.open('http://localhost', function () {
            com.rpc.proxy.geo.mapToState('bellevue', function (res) {
                assert(res === 'washington');
                done();
            });
        });
    });


    after(function (done) {
        com.srv.close(function () {
            done()
        });
    });
});
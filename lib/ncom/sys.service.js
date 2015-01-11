// ============================================================================
// comjs/lib/ncom/sys.service.js
// ============================================================================
// 
// Core initializer.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Imports
// ============================================================================

var path    = require('path'),
    server  = require('./rpc.server'),
    router  = require('./rpc.router'),
    runtime = require('./rpc.runtime');

// ============================================================================
// Cache
// ============================================================================

var oninitevt = [],
    onexitevt = [],
    pubdir    = null,
    bcomPath  = path.join(__dirname, '../../build/bcom.js');

// ============================================================================
// Lifetime
// ============================================================================

function init (config, cb) {
    
    if (!cb && typeof config === 'function') {
        cb     = config;
        config = null;
    }

    if (config) {
        if (config.rpc)  rpc(config.rpc);
        if (config.req)  req(config.req);
        if (config.amd)  amd(config.amd);
        if (config.idx)  idx(config.idx);
        if (config.auth) auth = config.auth;
    }

    if (!router.register['bcom'])
        amd({ '/': bcomPath });

    server.start(function () {
        var i = oninitevt.length;
        while (i--)
            oninitevt[i]();
        oninitevt = [];
        if (cb) cb();
    });
};

function exit (cb) {
    server.stop(function () {
        var i = onexitevt.length;
        while (i--)
            onexitevt[i]();
        onexitevt = [];
        if (cb) cb();
    });
};

// ============================================================================
// Registration
// ============================================================================

function rpc (map) {
    runtime.register(map);
};

function req (map) {
    router.register(map);
};

function amd (map) {
    router.register(map);
};

function idx (file) {
    redirect('/', file);
};

// ============================================================================
// Helpers
// ============================================================================

function redirect (from, to) {

    var req = {};

    req[from] = function (req, res) {
        res.writeHead(301, {
            'location': to
        });
        res.end();
    };

    router.register(req);
};

// ============================================================================
// Exports
// ============================================================================

module.exports = {

    init: init,
    exit: exit,

    set auth (fn) {
        server.auth = fn;
    },

    get auth () {
        return server.auth
    },

    set oninit (fn) {
        if (initialized)
            fn();
        else
            oninitevt[oninitevt.length] = fn;
    },

    set onexit (fn) {
        if (!initialized)
            fn();
        else
            onexitevt[onexitevt.length] = fn;
    }
};
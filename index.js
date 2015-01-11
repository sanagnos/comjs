// ============================================================================
// ncom/index.
// ============================================================================
// 
// Native exports.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

var scope = {

    lib: {
        class: require('./lib/ncom/lib.class'),
        filer: require('./lib/ncom/lib.filer'),
        iter : require('./lib/ncom/lib.iter'),
        path : require('./lib/ncom/lib.path')
    },

    net: {
        channel: require('./lib/ncom/net.channel'),
        request: require('./lib/ncom/net.request')
    },

    rpc: {
        router : require('./lib/ncom/rpc.router'),
        runtime: require('./lib/ncom/rpc.runtime'),
        server : require('./lib/ncom/rpc.server')
    },

    sys: {
        service: require('./lib/ncom/sys.service')
    }
};

scope.sys.service.lib = scope.lib;
scope.sys.service.net = scope.net;
scope.sys.service.rpc = scope.rpc;
scope.sys.service.sys = scope.sys;

module.exports = scope.sys.service;
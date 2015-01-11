// ============================================================================
// comjs/lib/ncom/rpc.runtime.js
// ============================================================================
// 
// Runtime namespace for RPC modules.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Cache
// ============================================================================

var namespace  = {}, // key   -> [ task, ... ]
    permission = {}, // key   -> [ group, ... ]
    permgroup  = {}, // group -> [ key, ... ]

    publicStub  = {},
    publicProxy = {};

// ============================================================================
// Core
// ============================================================================

function registerService (key, groups, module, delegated) {
    
    if (!module) {
        module = groups;
        groups = null;
    }

    if (groups && groups.length) {

        if (typeof groups === 'string') groups = [groups];

        permission[key] = groups;

        var idx = groups.length;

        while (idx--) {

            if (permgroup[ groups[idx] ])
                permgroup[ groups[idx] ][ permgroup[ groups[idx] ].length ] = key;
            else
                permgroup[ groups[idx] ] = [ key ];
        }
    }

    if (!namespace[key])
        namespace[key] = {};

    if (typeof module === 'function')
        namespace[key] = new module;

    for (var sym in module)
        namespace[key][sym] = module[sym];

    if (!delegated)
        updatePublicProxyStub();
};

function register (map) {

    if (arguments.length > 1)
        return registerService(arguments[1], arguments[2], arguments[3], true);

    var key,
        entry,
        module,
        groups, 
        sym;

    for (key in map) {

        entry  = map[key];
        groups = null;
        module = {};

        if (entry.groups !== 'undefined') {
            groups = entry.groups;
            delete entry.groups;
        }

        for (sym in entry)
            module[sym] = entry[sym];

        registerService(key, groups, module, true);
    }

    updatePublicProxyStub();
};

function unregister (key) {

    if (!namespace[key]) return;

    delete namespace[key];

    if (permission[key]) {

        var arr = permission[key],
            len = arr.length;
        while (len--)
            if (permgroup[ arr[len] ] && permgroup[ arr[len] ].length === 1)
                delete permgroup[ arr[len] ];

        delete permission[key];
    }

    updatePublicProxyStub();
};

// ============================================================================
// Internal
// ============================================================================

function updatePublicProxyStub () {
    
    var key, 
        mod,
        sym;

    publicStub  = {};
    publicProxy = {};

    for (key in namespace) {

        mod = namespace[key];

        if (permission[key]) continue;
            
        publicStub[key]  = mod;
        publicProxy[key] = {};

        for (sym in publicStub[key])
            publicProxy[key][sym] = 1;
    }
};

function generateProxyStub (permgroups) {

    if (!arguments.length) {
        updatePublicProxyStub();
        return { proxy: proxy, stub: stub };
    }

    if (typeof permgroups === 'string')
        permgroups = [ permgroups ];

    var proxy,
        stub,
        key,
        gi, 
        si,
        arr,
        mod,
        sym;

    // clone public proxy & stub
    
    proxy = {};
    stub  = {};
    for (key in publicStub) {
        
        stub[key]  = publicStub[key];
        proxy[key] = {};

        for (sym in publicStub[key])
            proxy[key][sym] = 1;
    }

    // append to proxy & stub allowed non-public modules

    gi = permgroups.length;

    while (gi--) {
        
        arr = permgroup[ permgroups[gi] ];
        si  = arr.length;
        
        while (si--) {

            key = arr[si];

            if (stub[key]) continue;

            stub[key] = namespace[key];

            for (sym in publicStub[key])
                proxy[key][sym] = 1;
        }
    }

    return { proxy: proxy, stub: stub };
};


// ============================================================================
// Exports
// ============================================================================

module.exports = {

    register  : register,
    unregister: unregister,


    namespace  : namespace,
    publicStub : publicStub,
    publicProxy: publicProxy,

    generateProxyStub: generateProxyStub
};
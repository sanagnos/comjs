// ============================================================================
// comjs/lib/bcom/amd.registry.js
// ============================================================================
// 
// AMD cache.
// 
// Copyright (c) 2014, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['amd.registry'] = function () {

// ============================================================================
// Imports
// ============================================================================

var classify = bcom.lib.path.classify,
    each     = bcom.lib.iter.each,
    append   = bcom.amd.loader.append;

// ============================================================================
// Cache
// ============================================================================

var mod = {},
    dep = {},
    fun = {};

// ============================================================================
// Core
// ============================================================================

function set (key, dependencies, module) {

    if (arguments.length < 3) {
        module       = dependencies;
        dependencies = [];
    }

    mod[key] = module;
    dep[key] = dependencies;

    if (typeof mod[key] === 'function')
        fun[key] = 1;
};

function get (key, cb) {
    var js = classify(key) === 'js';

    if ( !mod[key] )
        return append(key, function () {
            if (js) 
                get(key, cb);
            else
                cb();
        });

    else if ( !fun[key] )
        return cb( mod[key] );

    delete fun[key];

    if ( !dep[key] )
        return cb( ( mod[key] = new mod[key] ) );

    var allDep     = dep[key],
        presentDep = new Array(allDep.length),
        missingDep = new Array(allDep.length);
    
    for (var i = 0, len = allDep.length; i < len; i++)
        if ( !mod[ allDep[i] ] || fun[ allDep[i] ] )
            missingDep[i] = allDep[i].indexOf('/') === -1 ? 
                allDep[i] : 
                allDep[i].match(/\/\/(.*)/)[1].replace(/\./g, '/');
        else
            presentDep[i] = mod[ allDep[i] ];
    
    each(missingDep, get, function () {

        for (var i in missingDep)
            presentDep[i] = mod[ missingDep[i] ];

        mod[key].apply( ( mod[key] = {} ), presentDep);

        delete dep[key];
        delete fun[key];

        cb( mod[key] );
    });

    return mod[key];
};

function del (key) {

    if (!mod[key]) return;

    delete mod[key];
    
    if (dep[key]) delete dep[key];
    if (fun[key]) delete fun[key];
};

function has (key) {
    return typeof mod[key] !== 'undefined';
};

// ============================================================================
// Exports
// ============================================================================

this.set = set;
this.get = get;
this.del = del;
this.has = has;

this.invoke  = get;
this.declare = set;

};
// ============================================================================
// comjs/lib/ncom/lib.filer.js
// ============================================================================
//
// Collection of file system utilities.
// 
// Copyright (c) 2014, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Imports
// ============================================================================

var fs   = require('fs'),
    path = require('path');

var statSync    = fs.statSync,
    readdirSync = fs.readdirSync,
    join        = path.join,
    resolve     = path.resolve;

// ============================================================================
// Core
// ============================================================================

/**
 * Walks one or multiple directories, iterating on each file path.
 * 
 * @param  {String}   dir
 * @param  {Function} iter
 */
function walkSync (dir, iter) {
    if (dir instanceof Array) {

        if (!dir.length) return;

        var idx = dir.length;
        while (idx--)
            walkSync(dir[idx], function (file) {
                iter(file, dir[idx]);
            });
        
        return;
    }

    dir = resolve('./', dir);
    
    if (!fs.statSync(dir).isDirectory()) 
        return iter(dir, dir);

    var files = fs.readdirSync(dir),
        idx   = files.length,
        file, stat;

    while (idx--) {
        file = path.join(dir, files[idx]);    
        stat = fs.statSync(file);
        if (stat.isDirectory())
            walkSync(file, iter);
        else
            iter(file, dir);
    }
};

// ============================================================================
// Exports
// ============================================================================

module.exports = {
    walkSync: walkSync
};
// ============================================================================
// comjs/lib/ncom/lib.iter.js
// ============================================================================
// 
// Path utilities.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Core
// ============================================================================

/**
 * Maps paths to corresponding extensions.
 * 
 * @param  {Array}    paths (Can be single item)
 * @param  {Function} cb
 * @return {Object}         (String if singular)
 */
function classify (paths) {

    var arr, map, idx, len, dot, pfx;

    map = {};
    arr = arguments.length > 1 ? Array.prototype.slice.call(arguments) : 
        ( paths instanceof Array ? paths : [paths] );

    for (idx = 0, len = arr.length; idx < len; idx++) {

        dot = arr[idx].lastIndexOf('.');
        pfx = dot > -1 ? arr[idx].substr( dot + 1 ) : 'js';

        if (!map[pfx]) map[pfx] = [];

        map[pfx][map[pfx].length] = arr[idx];
    }

    if (arr.length > 1)
        return map;

    for (pfx in map)
        break;

    return pfx;
};

// ============================================================================
// Exports
// ============================================================================

module.exports = {
    classify: classify
};

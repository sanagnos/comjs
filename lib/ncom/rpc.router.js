// ============================================================================
// comjs/lib/ncom/rpc.router.js
// ============================================================================
// 
// Router.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Imports
// ============================================================================

var fs    = require('fs'),
    path  = require('path'),
    filer = require('./lib.filer'); 

// ============================================================================
// Cache
// ============================================================================

var walkSync         = filer.walkSync,
    slice            = Array.prototype.slice,
    basename         = path.basename,
    resolve          = path.resolve,
    createReadStream = fs.createReadStream;

// ============================================================================
// Cache
// ============================================================================

// state
var registry = {};

// ============================================================================
// Core
// ============================================================================

/**
 * Registers requests.
 * 
 * @param  {Object} map Route-handler or route-path (dir or file) entries
 *                      or 
 *                      path to file or dir of modules exporting map
 *                      or
 *                      collection of either
 */
function register (map) {

    if (typeof map === 'string')
        return walkSync(map, function (file) {
            register( require( resolve(file) ) ); 
        });
    
    else if (map instanceof Array) {
        var idx = map.length;
        while (idx--)
            register(map[idx]);
        return;
    }

    var route,
        path,
        postfix,
        ctype;

    for (route in map) {

        // if request handler entry
        if (typeof map[route] === 'function') {
            registry[route] = map[route];
            continue;
        }

        // walk dir/dirs & read any files
        walkSync(map[route], function (file, ofile) {
            
            postfix = file.match(/.*\.(.*)/);
            ctype   = null;

            switch ( !postfix || postfix[postfix.length - 1] ) {
                case 'js':
                    ctype = 'script/javascript';
                    break;
                case 'css':
                    ctype = 'text/css';
                    break;
                case 'html':
                    ctype = 'text/html';
                    break;
                default:
                    ctype = 'text/plain';
                    break;
            }

            if ( file === ofile )
                path = resolve(route, basename(file))
                    .replace(/\\/g, '/');
            else
                path = resolve(route, file)
                    .replace(/\\/g, '/').replace(route, '');
        
            path = path.slice(path.indexOf('/'));
            
            registry[path] = (function (ctype) {

                return function (req, res) {
                    res.writeHead(200, {'Content-Type': ctype });
                    createReadStream(file).pipe(res);
                };

            })(ctype);
        });
    }
};

/**
 * Unregister requests.
 * 
 * @param  {Array} items Array of urls (can be String)
 */
function unregister (routes) {
    
    if (typeof routes === 'string')
        routes = [routes];
    
    var len = routes.length;
    
    while (len--) {
        if (typeof routes === 'string')
            delete registry[routes];
        else {
            var idx = routes.length;
            while (idx--)
                delete registry[ routes[idx] ];
        }
    }
};

// ============================================================================
// Exports
// ============================================================================

module.exports = {
    registry  : registry,
    register  : register,
    unregister: unregister
};
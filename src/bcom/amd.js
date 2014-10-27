// ============================================================================
// comjs/lib/browser/amd.js
// ============================================================================
// 
// Browser AMD client.
// 
// @author
//      10/26/14    Stelios Anagnostopoulos     stelios@outlook.com
//      
// Copyright 2014, @author. All rights reserved.
// ============================================================================

'use strict';

com.amd = (function amd () {

// ============================================================================
// Cache
// ============================================================================

var registry = {};

// ============================================================================
// Definition
// ============================================================================

/**
 * Declares a module.
 * 
 * @param  {String}   identifier   Relative path      
 * @param  {Array}    dependencies List of required files
 * @param  {Function} module       Passed module dependecies
 */
function declare (identifier, dependencies, module) {

    // transform module identifier to relative path
    var path = identifier;
    if (!path.match(/.js$/)) 
        path += '.js';
    if (!path.match(/^.\//)) {
        if (path.match(/^\//))
            path = '.' + path;
        else
            path = './' + path;
    }

    // register module
    registry[path] = {
        module      : arguments.length === 3 ? module : dependencies,
        dependencies: arguments.length === 3 ? transformPaths(dependencies).js : [],
        status      : 0
    };
};

/**
 * Invokes a module.
 * 
 * @param  {Array}    identifiers (can also be string)
 * @param  {Function} cb
 */
function invoke (identifiers, cb) {

    var paths = transformPaths(identifiers);

    eachGroup([
        [ paths.css,  loadCSS  ],
        [ paths.html, loadHTML ],
        [ paths.text, loadHTML ]
    ], function () {
        
        each( paths.js, function (path) {

            // if not registered, load from server & recur
            if ( !registry[path] ) {
                loadJS( path, function() {
                    invoke( path, cb );
                });

            // if registered and unloaded
            } else if ( registry[path].status === 0 ) {

                // if declared as a function, load conditionally with dependencies
                if ( typeof registry[path].module === 'function' ) {
                    if ( registry[path].dependencies ) {
                        each( registry[path].dependencies, invoke, function (res) {
                            delete registry[path].dependencies;
                            var ctx = {};
                            registry[path].module = registry[path].module.apply(ctx, res);
                            if (!registry[path].module)
                                registry[path].module = ctx;
                            registry[path].status = 1;
                            cb( registry[path].module );
                        });
                    } else {
                        var ctx = {};
                        registry[path].module = registry[path].module.call(ctx);
                        if (!registry[path].module)
                            registry[path].module = ctx;
                        registry[path].status = 1;
                        cb( registry[path].module );
                    }

                // if a non-function declaration, propagate
                } else {
                    registry[path].status = 1;
                    cb( registry[path].module );
                }

            // if already loaded
            } else if ( registry[path].status === 1 ) {
                cb( registry[path].module );
            }

        }, function (modules) { 
            cb.apply(null, modules);
        });
    });
};

// ============================================================================
// Internal
// ============================================================================

function transformPaths (paths, cb) {

    var paths = paths instanceof Array ? paths : [paths],
        idx   = paths.length,
        js    = [],
        css   = [],
        html  = [],
        text  = [],
        postfix;
    while (idx--) {

        postfix = paths[idx].match(/.*\.(.*)/);
        if ( postfix && postfix[ postfix.length - 1 ][0] !== '/' ) {
            postfix = postfix[ postfix.length - 1 ];
        } else {
            postfix    = 'js';
            paths[idx] += '.js';
        }
        if ( !paths[idx].match(/^.\//) ) {
            if ( paths[idx].match(/^\//) )
                paths[idx] = '.' + paths[idx];
            else
                paths[idx] = './' + paths[idx];
        }

        switch (postfix) {
            case 'js':
                js[js.length] = paths[idx];
                break;
            case 'css':
                css[css.length] = paths[idx];
                break;
            case 'html':
                html[html.length] = paths[idx];
                break;
            default:
                text[text.length] = paths[idx];
                break;
        }
    }

    return { js: js, html: html, css: css, text: text };
};

/**
 * Appends CSS to DOM.
 * 
 * @param  {String}          path   Relative path to file
 * @param  {HTMLBodyElement} parent Parent dom element (optional)
 * @param  {Function}        cb     Callback (optional)
 */
function loadCSS(path, parent, cb) {
    cb = arguments[ arguments.length - 1 ];
    if (!path) return cb();
    if (!path.match(/.css$/)) 
        path += '.css';
    if (typeof cb !== 'function')
        cb = null;
    if (!parent || typeof parent === 'function')
        parent = document.body;

    var css = document.createElement('link');
    css.href   = path;
    css.rel    = 'stylesheet';
    css.type   = 'text/css';
    css.onload = function() { if (cb) cb() };
    parent.appendChild(css);
};

/**
 * Appends HTML to DOM.
 * 
 * @param  {String}          path   Relative path to file
 * @param  {HTMLBodyElement} parent Parent dom element (optional)
 * @param  {Function}        cb     Callback (optional)
 */
function loadHTML(path, parent, cb) { 
    cb = arguments[arguments.length - 1];
    if (!path) return cb();
    if (!path.match(/.html$/)) 
        path += '.html';
    if (typeof cb !== 'function')
        cb = null;
    if (!parent || typeof parent === 'function')
        parent = document.body;

    var req = new XMLHttpRequest();
    req.open('GET', path, true);
    req.onload = function() {
        if (req.readyState === 4 && req.status === 200)
            parent.insertAdjacentHTML('beforeend', req.responseText);
        else
            throw new Error('http failed with status: '+ req.status + ', reason: ' + req.statusText);
        if (cb) cb();
    };
    req.send();
};

/**
 * Appends Javascript to DOM.
 * 
 * @param  {String}          path   Relative path to file
 * @param  {HTMLBodyElement} parent Parent dom element (optional)
 * @param  {Function}        cb     Callback (optional)
 */
function loadJS(path, parent, cb) {
    cb = arguments[arguments.length - 1];
    if (!path) return cb();
    if (typeof cb !== 'function')
        cb = null;
    if (!parent || typeof parent === 'function')
        parent = document.body;
    if (!path.match(/.js$/)) 
        path += '.js';

    var script     = document.createElement('script');
    script.type    = 'text\/javascript';
    script.async   = true;
    script.onload  = function() { if (cb) cb() };
    script.onerror = function(err) {
        throw new URIError('the script ' + err.target.src + ' is not accessible.');
    };
    script.src = path;
    parent.appendChild(script);
};

/**
 * Applies async task to items & propagates to cb when done.
 * 
 * @param  {Function} task  
 * @param  {Array}    items (Can be non-array/single item)
 * @param  {Function} cb    Passed array of res for each item applied to task
 */
function each (items, task, cb) { // adapted from https://github.com/caolan/async

    if ( !(items instanceof Array) )
        items = [items];

    var idx = 0,
        len = items.length,
        res = [];

    if (!len)
        return cb([]);

    var iter = function () {
        task(items[idx++], function (out) {
            res[res.length] = out;
            if (idx >= len)
                cb(res);
            else
                iter();
        });
    };
    
    iter();
};

/**
 * Applies async task to items for each group & propagates to cb when done.
 * (See each)
 * 
 * @param  {Array}    groups List of [ [items, task], ... ]
 * @param  {Function} cb     Passed array of results for each group
 */
function eachGroup (groups, cb) {

    if ( !(groups instanceof Array) )
        groups = [].concat(groups);
    
    each(groups, function (group, done) {
        each(group[0], group[1], done);
    }, cb);
};

// ============================================================================
// Exports
// ============================================================================

return {
    get registry () { return registry },

    declare: declare,
    invoke : invoke,

    create: function () { return new amd }
};

})();

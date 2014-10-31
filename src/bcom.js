// ============================================================================
// bcom.js
// ============================================================================
// 
// Browser implementation of RPC-based AMD server-client middleware.
// 
// Copyright (c) 2014, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

window.com = window.bcom = (function () {

// ============================================================================
// Cache
// ============================================================================

var slice            = Array.prototype.slice,
    serialize        = JSON.stringify,
    parseJSON        = JSON.parse,
    defineProperty   = Object.defineProperty,
    defineProperties = Object.defineProperties,
    keysOf           = Object.keys,
    floor            = Math.floor;

// ============================================================================
// RPC client
// ============================================================================
// - open
// - close
// - proxy
// - get
// - post
// ============================================================================

// ============================================================================
// Cache
// ============================================================================

var url,
    websocket,         // websocket channel
    proxy,             // service proxy
    callback,          // callback registry as { timestampN: fn }
    connected = false; // connection flag

// ============================================================================
// Channel connection
// ============================================================================

/**
 * Connects to websocket channel.
 *
 * @param  {Object}   config Connection endpoint as url string or config map of {path, auth, wss}
 * @param  {Function} cb     Callback
 */
function open (config, cb) {
    var path,
        wss,
        auth;

    if (typeof config === 'string') {
        path = config;
        auth = [];
        wss  = false;
    } else {
        path = config.path;
        wss  = config.wss;
        auth = config.auth || [];
    }
    if (arguments.length < 3) {
        if (typeof wss === 'function') {
            cb  = wss;
            wss = false;
        }
    }

    var path = (wss ? 'wss://' : 'ws://') + path.match(/\/\/(.*)/)[1];

    if (connected)
        websocket.close();

    // flush callback registry
    callback = {};

    // init
    websocket = new WebSocket(path);

    // on connection open
    websocket.onopen = function () {
        connected = true;
        send('root', 'auth', auth, function (proxyStencil) {
            proxify(proxyStencil);
            cb();
        });
    };

    // on connection closed
    websocket.onclose = function () {
        connected = false;
    };

    // on received message
    websocket.onmessage = function (e) {

        if (!e.data.length)
            return;

        // parse data
        var data = parseJSON(e.data),
            resp = data[0],
            time = data[1],
            done = data[2];

        if (callback[time])
            callback[time].apply({
                done: done === 1
            }, resp);

        if (done) delete callback[time];
    };
};

/**
 * Closes websocket channel.
 */
function close () {
    if (!connected)
        return;
    if (websocket.bufferredAmount)
        var id = setInterval(function () {
            clearInterval(id);
            websocket.close();
        }, 100);
    else
        websocket.close();
};

/**
 * Sends RPC task call to channel.
 * 
 * @param  {String}   name
 * @param  {String}   task     
 * @param  {Array}    args     
 * @param  {Function} cb        
 */
function send (name, task, args, cb) {

    // attempt to connect
    if (!connected) connect();

    // package data
    var time = performance.now(),
        data = serialize([name, task, args, time]);

    // cache callback
    callback[time] = cb;

    // send
    websocket.send(data);
};

/**
 * Generates proxy.
 * 
 * @param  {Object} stencil     
 */
function proxify (stencil) {

    proxy = {};

    var name,
        task;

    // for each module definition
    for (name in stencil) {
        if (!proxy[name])
            proxy[name] = {};
        for (task in stencil[name])
            proxy[name][task] = (function (name, task) {
                return function () {

                    var args = slice.call(arguments),
                        cb   = typeof args[args.length - 1] === 'function' ? args.pop() : null;

                    send(name, task, args, cb);
                };
            })(name, task);
    }
};

// ============================================================================
// Requests
// ============================================================================

/**
 * Submits request.
 * 
 * @param  {String}   url     Request route, conditionally with parameters 
 * @param  {Object}   body    Request body (optional)
 * @param  {String}   method  Request method  
 * @param  {Object}   headers Map of request headers (optional)
 * @param  {Function} cb      Passed response text, in JSON format if applicable
 */
function request (url, body, method, headers, cb) {

    if (typeof body === 'string') {
        cb      = headers;
        headers = method;
        method  = body;
    }

    if (typeof headers === 'function') {
        cb      = headers;
        headers = null;
    }

    var http = new XMLHttpRequest();

    http.open(method, url, true);

    http.onload = function () {
        if (http.readyState === 4 && ( http.status === 200 || http.status === 201 )) {
            var res = http.responseText;
            if (res) {
                if (typeof res === 'object')
                    return cb(res);

                try {
                    res = parseJSON(http.responseText);
                } catch (e) {}
            }
            cb(res);
        } else if (floor(http.status / 4) === 1) {
            throw new Error('Request failed with ' + http.status);
        }
    };

    http.onerror = function () {
        throw new Error('request failed with ' + http.status);
    };

    if (headers)
        for (var key in headers)
            http.setRequestHeader(key, headers[key]);

    if (method === 'POST' || method === 'PUT') {

        // attach header data
        http.setRequestHeader('Content-Type', 'application/json');

        // enforce json format
        if (typeof body === 'object')
            body = serialize(body);
    }

    // submit
    http.send(body);
};

/**
 * Submits GET request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   headers  Map of request headers (optional)
 * @param  {Function} cb       Passed response text, in JSON format if applicable
 */
function submitGet (url, headers, cb) {
    request(url, 'GET', headers, cb);
};

/**
 * Submits PUT request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   body     Request body (optional)
 * @param  {Object}   headers  Map of request headers (optional)
 * @param  {Function} cb       Passed response text, in JSON format if applicable
 */
function submitPut (url, body, headers, cb) {
    request(url, body, 'PUT', headers, cb);
};

/**
 * Submits POST request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   body     Request body (optional)
 * @param  {Object}   headers  Map of request headers (optional)
 * @param  {Function} cb       Passed response text, in JSON format if applicable
 */
function submitPost (url, body, headers, cb) {
    request(url, body, 'POST', headers, cb);
};

/**
 * Submits DELETE request.
 * 
 * @param  {String}   url      Request route
 * @param  {Object}   headers  Map of request headers (optional)
 * @param  {Function} cb       Passed response text, in JSON format if applicable
 */
function submitDelete (url, headers, cb) {
    request(url, 'GET', headers, cb);
};

// ============================================================================
// Async module loading
// ============================================================================
// - declare
// - invoke
// - append
// ============================================================================

// ============================================================================
// Cache
// ============================================================================

var registry = {}; // module registry

// ============================================================================
// Definition
// ============================================================================

/**
 * Declares a module.
 * 
 * @param  {String}   identifier   Static path to module      
 * @param  {Array}    dependencies List of required dependecies/files
 * @param  {Function} module       Callback with module dependecies as args
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
 * @param  {Array}    identifiers Static path(s) to modules/files
 * @param  {Function} cb          Callback with invoked modules as args    
 */
function invoke (identifiers, cb) {

    var paths = transformPaths(identifiers);

    eachGroup([
        [ paths.css,  appendCSS  ],
        [ paths.html, appendHTML ],
        [ paths.text, appendHTML ]
    ], function () {
        
        each( paths.js, function (path, done) {

            // if not registered, load from server & recur
            if ( !registry[path] ) {
                appendJS( path, function() {
                    invoke( path, done );
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
                            done( registry[path].module );
                        });
                    } else {
                        var ctx = {};
                        registry[path].module = registry[path].module.call(ctx);
                        if (!registry[path].module)
                            registry[path].module = ctx;
                        registry[path].status = 1;
                        done( registry[path].module );
                    }

                // if a non-function declaration, propagate
                } else {
                    registry[path].status = 1;
                    done( registry[path].module );
                }

            // if already loaded
            } else if ( registry[path].status === 1 ) {
                done( registry[path].module );
            }

        }, function (modules) { 
            cb.apply(null, modules);
        });
    });
};

/**
 * Appends js, css, html, txt to dom.
 * 
 * @param  {Array}    identifiers Static path(s) to assets; ([path, parentElement] entries are allowed)
 * @return {Function} cb          Callback
 */
function append (identifiers, cb) {
    var paths = transformPaths(identifiers);
    eachGroup([
        [ paths.css,  function (e, next) { if (typeof e === 'object') appendCSS(e[0], e[1], next); else appendCSS (e) } ],
        [ paths.html, function (e, next) { if (typeof e === 'object') appendHTML(e[0], e[1], next); else appendHTML(e) } ],
        [ paths.js,   function (e, next) { if (typeof e === 'object') appendJS(e[0], e[1], next); else appendJS(e) } ],
        [ paths.text, function (e, next) { if (typeof e === 'object') appendHTML(e[0], e[1], next); else appendHTML(e) } ]
    ], function () {
        cb();
    });
};

// ============================================================================
// Path filtering & file loading
// ============================================================================

function transformPaths (paths, cb) {

    var paths = paths instanceof Array ? paths : [paths],
        idx   = 0,
        js    = [],
        css   = [],
        html  = [],
        text  = [],
        postfix;
    while (idx < paths.length) {

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

        idx++;
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
function appendCSS(path, parent, cb) {
    cb = arguments[arguments.length - 1];
    if (typeof parent === 'function') {
        cb     = parent;
        parent = document.body;
    }
    if (!path.match(/.css$/)) 
        path += '.css';

    var css = document.createElement('link');
    css.href    = path;
    css.rel     = 'stylesheet';
    css.type    = 'text/css';
    css.onload  = cb;
    css.onerror = function (err) {
        throw new URIError('the stylesheet ' + err.target.src + ' is not accessible');
    };
    parent.appendChild(css);
};

/**
 * Appends HTML to DOM.
 * 
 * @param  {String}          path   Relative path to file
 * @param  {HTMLBodyElement} parent Parent dom element (optional)
 * @param  {Function}        cb     Callback
 */
function appendHTML(path, parent, cb) { 
    cb = arguments[arguments.length - 1];
    if (typeof parent === 'function') {
        cb     = parent;
        parent = document.body;
    }
    if (!path.match(/.html$/)) 
        path += '.html';

    var req = new XMLHttpRequest();
    req.open('GET', path, true);
    req.onload = function() {
        if (req.readyState === 4 && req.status === 200)
            parent.insertAdjacentHTML('beforeend', req.responseText);
        else
            throw new Error('http failed with status: '+ req.status + ', reason: ' + req.statusText);
        cb();
    };
    req.send();
};

/**
 * Appends Javascript to DOM.
 * 
 * @param  {String}          path   Relative path to file
 * @param  {HTMLBodyElement} parent Parent dom element (optional)
 * @param  {Function}        cb     Callback
 */
function appendJS(path, parent, cb) {
    cb = arguments[arguments.length - 1];
    if (typeof parent === 'function') {
        cb     = parent;
        parent = document.body;
    }
    if (!path.match(/.js$/)) 
        path += '.js';

    var script     = document.createElement('script');
    script.type    = 'text\/javascript';
    script.src     = path;
    script.async   = true;
    script.onload  = cb;
    script.onerror = function(err) {
        throw new URIError('the script ' + err.target.src + ' is not accessible');
    };
    parent.appendChild(script);
};

// ============================================================================
// Class definition
// ============================================================================

/**
 * Generates class definition given a collection of prototype
 * contracts.
 * 
 * @param  {Function} constr    
 * @param  {Array}    contracts (can also be single object)
 * @return {Function}          
 */
function define (constr, contracts) {

    if ( !(contracts instanceof Array) )
        contracts = [contracts];

    var meta = new Array(contracts.length);
    for (var i = 0, len = contracts.length; i < len; i++) {
        bind(constr.prototype, contracts[i]);
        meta[i] = keysOf( contracts[i] );
    }

    var init = function () {
        if (constr.prototype._preInit)
            for (var i = 0, len = constr.prototype._preInit.length; i < len; i++)
                constr.prototype._preInit[i].apply(this, arguments);

        constr.apply(this, arguments);

        if (constr.prototype._postInit)
            for (var i = 0, len = constr.prototype._postInit.length; i < len; i++)
                constr.prototype._postInit[i].apply(this, arguments);
            
        var midx = meta.length,
            keys, kidx;
        while (midx--) {
            keys = meta[midx];
            kidx = keys.length;
            while (kidx--)

                if ( typeof this[ keys[kidx] ] === 'string' && this[ keys[kidx] ].indexOf('@require') === 0 )
                    throw new Error('missing contract member: ' + keys[kidx]);
            
        }
    };

    init.prototype = new constr;
    init.prototype.constructor = init;

    return init;
};

/**
 * Binds members to class definition.
 * 
 * @param  {Object} proto
 * @param  {Object} attr 
 * @return {Object}      
 */
function bind (proto, attr) {
    var properties = {},
        methods    = [],
        tkey;
    for (var key in attr) {
        if ( typeof attr[key] === 'string' && attr[key] !== '@require' ) {
            properties[key] = ( function (proparr) {
                return {
                    configurable: true,
                    get: function() {
                        var ctx = this[proparr[0] ];
                        for (var i = 1, len = proparr.length; i < len; i++)
                            ctx = ctx[proparr[i] ];
                        return ctx;
                    },
                    set: function(v) {
                        var ctx = this[ proparr[0] ];
                        for (var i = 1, len = proparr.length - 1; i < len; i++)
                            ctx = ctx[ proparr[i] ];
                        ctx[ proparr[ proparr.length - 1 ] ] = v;
                    },
                }
            })( attr[key].split('.') );
        } else if ( typeof attr[key] === 'object' ) {
            properties[key] = attr[key];
        } else if ( typeof attr[key] === 'function' ) {
            if ( key === 'preInit' || key === 'postInit' ) {
                tkey = '_' + key;
                if ( !proto[tkey] )
                    proto[tkey] = [];
                proto[ tkey ][ proto[tkey].length ] = attr[key];   
            } else {
                methods[ methods.length ] = [ key, attr[key] ];
            }
        }
    }

    defineProperties(proto, properties);

    var key, fun, sup;
    for (var i = 0, len = methods.length; i < len; i++) {
        key = methods[i][0];
        fun = methods[i][1];
        if (proto[key])
            sup = proto[key];
        proto[key]       = fun;
        proto[key].super = sup;
    }
};

// ============================================================================
// Iteration
// ============================================================================

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
    
    get proxy () { return proxy },

    open : open,
    close: close,

    submitGet   : submitGet,
    submitPut   : submitPut,
    submitPost  : submitPost,
    submitDelete: submitDelete,

    declare: declare,
    invoke : invoke,
    append : append,

    define: define
};

})();

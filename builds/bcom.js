// ============================================================================
// comjs
// ============================================================================
// Name      : comjs
// Version   : 0.0.1
// Build date: 26-10-2014
// 
// Copyright (c) 2014, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

var com = {};

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

// ============================================================================
// comjs/lib/browser/def.js
// ============================================================================
// 
// Prototypal inheritance in Javascript.
// 
// @author
//      10/26/14    Stelios Anagnostopoulos     stelios@outlook.com
//      
// Copyright 2014, @author. All rights reserved.
// ============================================================================

'use strict';

com.def = (function () {

// ============================================================================
// Cache
// ============================================================================

var keysOf           = Object.keys,
    defineProperties = Object.defineProperties;

// ============================================================================
// Definition
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

// ========================================================================
// Exports
// ========================================================================

return define;

})();

// ============================================================================
// comjs/lib/browser/rpc.js
// ============================================================================
// 
// Browser RPC client.
// 
// @author
//      10/26/14    Stelios Anagnostopoulos     stelios@outlook.com
//      
// Copyright 2014, @author. All rights reserved.
// ============================================================================

'use strict';

com.rpc = (function rpc () {

// ============================================================================
// Cache
// ============================================================================

// function cache
var slice          = Array.prototype.slice,
    stringify      = JSON.stringify,
    parse          = JSON.parse,
    defineProperty = Object.defineProperty,
    floor          = Math.floor;

var url,
    websocket,         // websocket channel
    proxy,             // service proxy
    callback,          // callback registry as { timestampN: fn }
    connected = false; // connection flag

// ============================================================================
// Channel services
// ============================================================================

/**
 * Connects to websocket channel.
 *
 * @param  {String}   url Connection endpoint 
 * @param  {Boolean}  wss Use secure protocol (optional)
 * @param  {Function} cb  (optional)
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
            if (cb) cb();
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
        var data = parse(e.data),
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
 * Closes channel.
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
        data = stringify([name, task, args, time]);

    // cache callback
    callback[time] = cb;

    // send
    websocket.send(data);
};

// ============================================================================
// Proxy generation
// ============================================================================

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
 * Submits GET request.
 * 
 * @param  {String}   route 
 * @param  {String}   data  JSON data (can be Object -- optional)
 * @param  {Function} cb    Passed [res] 
 */
function get (route, data, cb) {

    if (arguments.length < 3) {
        cb   = data;
        data = '';
    } else {
        if (typeof data !== 'string')
            data = stringify(data);
        data = encodeURIComponent(data);
        route += data; 
    }

    // init http request
    var http = new XMLHttpRequest();
    http.open('GET', route, true);

    // handle response
    http.onload = function () {

        // on success, propagate
        if (http.readyState === 4 && http.status === 200)
            cb(http.responseText);

        // on error, throw exception
        else if (floor(http.status / 4) === 1)
            throw new Error('Request failed with ' + http.status);
        
    };

    // handle connection error
    http.onerror = function () {
        throw new Error('Request failed with ' + http.status);
    };

    // submit
    http.send();
};

/**
 * Submits POST request.
 *   
 * @param  {String}   route  
 * @param  {String}   data  JSON data (can be Object)
 * @param  {Function} cb    Passed [res]
 */
function post (route, data, cb) {
    
    // init http request
    var http = new XMLHttpRequest();
    http.open('POST', route, true);

    // handle response
    http.onreadystatechange = function() {

        // on success, propagate
        if (http.readyState === 4 && http.status === 200)
            return cb(http.responseText);

        // on error, throw exception
        else if (floor(http.status / 4) === 1)
            throw new Error('Request failed with ' + http.status);
    };

    // attach header data
    http.setRequestHeader('Content-Type', 'application/json');

    // enforce json format
    if (typeof data !== 'string')
        data = stringify(data);

    // attach data & submit
    http.send(data);
};

// ============================================================================
// Exports
// ============================================================================

return {
    open : open,
    close: close,

    get proxy () { return proxy },

    get : get,
    post: post,
    
    create: function () { return new rpc }
};

})();


if (typeof window === 'undefined')
    module.exports = com;
else
    window.com = com;

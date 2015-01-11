// ============================================================================
// comjs
// ============================================================================
// Name      : comjs
// Version   : 0.0.7
// Build date: 09-01-2015
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

// ============================================================================
// comjs/lib/bcom/_header.js
// ============================================================================
// 
// Header.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// preallocate
self.bcom = {};

// ============================================================================
// comjs/lib/bcom/lib.class.js
// ============================================================================
// 
// Class inheritance.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['lib.class'] = function () {

// ============================================================================
// Core
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
        meta[i] = Object.keys( contracts[i] );
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

    Object.defineProperties(proto, properties);

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
// Exports
// ============================================================================

this.define = define;

};

// ============================================================================
// comjs/lib/bcom/lib.iter.js
// ============================================================================
// 
// Async iteration.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['lib.iter'] = function () {

// ============================================================================
// Core
// ============================================================================

/**
 * Applies async task to items & propagates to cb when done.
 * 
 * @param  {Function} task  
 * @param  {Array}    items (Can be non-array/single item)
 * @param  {Function} cb    Passed array of res for each item applied to task
 */
function each (items, task, cb) {

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

this.each      = each;
this.eachGroup = eachGroup;

};

// ============================================================================
// comjs/lib/bcom/lib.iter.js
// ============================================================================
// 
// Path utilities.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['lib.path'] = function () {

// ============================================================================
// Core
// ============================================================================

/**
 * Maps list of paths to corresponding extensions.
 * 
 * @param  {Array}    paths
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

this.classify = classify;

};

// ============================================================================
// comjs/lib/bcom/amd.loader.js
// ============================================================================
// 
// Browser implementation of comjs.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['amd.loader'] = function () {

// ============================================================================
// Imports
// ============================================================================

var classify  = bcom.lib.path.classify,
    eachGroup = bcom.lib.iter.eachGroup;

// ============================================================================
// Core
// ============================================================================

/**
 * Appends js, css, html, txt to dom.
 * 
 * @param  {Array}    urls Static path(s) to assets; ([path, parentElement] entries are allowed)
 * @return {Function} cb    Callback
 */
function append (urls, root, cb) {

    var map, key, arr, fun;

    if (!cb) {
        cb        = root;
        root = document.body;
    }

    map = urls.length ? classify(urls) : urls;
        
    if (typeof map === 'string') {
        switch (map) {
            case 'js'  : appendJS  (urls, root, cb); break;
            case 'html': appendHTML(urls, root, cb); break;
            case 'css' : appendCSS (urls, root, cb); break;
            default    : appendHTML(urls, root, cb); break;
        }
        return;
    }

    arr = [];
    
    for (key in map) {
        switch (key) {
            case 'js'  : fun = function (item, next) { appendJS  (item, root, next) }; break;
            case 'html': fun = function (item, next) { appendHTML(item, root, next) }; break;
            case 'css' : fun = function (item, next) { appendCSS (item, root, next) }; break;
            default    : fun = function (item, next) { appendHTML(item, root, next) }; break;
        }
        
        arr[arr.length] = [ map[key], fun ];
    }

    eachGroup(arr, cb);
};

/**
 * Appends CSS to DOM.
 * 
 * @param  {String}          path sPath to file
 * @param  {HTMLBodyElement} root Parent dom element (optional)
 * @param  {Function}        cb   Callback
 */
function appendCSS (url, root, cb) {

    var css;

    if (typeof parent === 'function') {
        cb   = root;
        root = document.body;
    }

    if (!url.match(/.css$/)) 
        url += '.css';

    css = document.createElement('link');
    css.href    = url;
    css.rel     = 'stylesheet';
    css.type    = 'text/css';
    css.onload  = cb;
    css.onerror = function (err) {
        throw new URIError('the stylesheet ' + err.target.src + ' is not accessible');
    };

    root.appendChild(css);
};

/**
 * Appends HTML to DOM.
 * 
 * @param  {String}          url  Path to file
 * @param  {HTMLBodyElement} root Parent dom element (optional)
 * @param  {Function}        cb   Callback
 */
function appendHTML (url, root, cb) { 

    var req;

    if (!cb) {
        cb     = root;
        root = document.body;
    }

    if (!url.match(/.html$/)) 
        url += '.html';

    req = new XMLHttpRequest();

    req.open('GET', url, true);

    req.onload = function () {
        if (req.readyState === 4 && req.status === 200)
            root.insertAdjacentHTML('beforeend', req.responseText);
        else
            throw new Error('request failed with status: '+ req.status + ', reason: ' + req.statusText);
        cb();
    };

    req.send();
};

/**
 * Appends Javascript to DOM.
 * 
 * @param  {String}          url  Path to file
 * @param  {HTMLBodyElement} root Parent dom element (optional)
 * @param  {Function}        cb   Callback
 */
function appendJS (url, root, cb) {

    var script;

    if (!cb) {
        cb     = root;
        root = document.body;
    }

    if (!url.match(/.js$/)) url += '.js';

    script = document.createElement('script');

    script.type    = 'text\/javascript';
    script.src     = url;
    script.async   = true;
    script.onload  = cb;
    script.onerror = function (err) {
        throw new URIError('the script ' + err.target.src + ' is not accessible');
    };

    root.appendChild(script);
};

// ============================================================================
// Exports
// ============================================================================

this.append     = append;
this.appendCSS  = appendCSS;
this.appendHTML = appendHTML;
this.appendJS   = appendJS;

};
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
// ============================================================================
// comjs/lib/bcom/net.channel.js
// ============================================================================
// 
// Websocket channel client.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['net.channel'] = function () {

// ============================================================================
// Cache
// ============================================================================

var websocket,         // websocket channel
    proxy,             // service proxy
    callback,          // callback registry as { timestampN: fn }
    connected = false; // connection flag

// ============================================================================
// Channel connection
// ============================================================================

/**
 * Connects to websocket channel.
 * 
 * @param  {String}   url  (can be map for { url, auth, wss, cb })
 * @param  {Function} auth (optional)
 * @param  {Boolean}  wss  (optional)
 * @param  {Function} cb
 */
function open (url, auth, wss, cb) {
    
    // parse args

    var arg = arguments,
        ty0 = typeof url,
        ty1 = typeof auth;

    if (ty0 === 'function') {
        cb   = url;
        url  = null;
        auth = null;
        wss  = null;
    
    } else if (ty1 === 'object') {
        
        var map = url;
        
        url  = map.url;
        auth = map.auth || null;
        wss  = map.wss  || false;
        cb   = map.cb   || arg[arg.length - 1];
    
    } else if (ty1 === 'function') {

        cb   = auth;
        auth = null;
        wss  = false;

    } else if (ty1 === 'boolean') {
        cb   = wss;
        wss  = auth;
        auth = null;
    }

    if (!url) url = document.URL;

    // setup
    url = (wss ? 'wss://' : 'ws://') + url.match(/\/\/(.*)/)[1];

    if (connected)
        websocket.close();

    callback = {};

    // init
    
    websocket = new WebSocket(url);

    websocket.onopen = function () {

        connected = true;
        
        send('self', 'auth', auth, function (res) {
            proxify(res);
            if (cb) cb();
        });
    };

    websocket.onclose = function () {
        connected = false;
    };

    websocket.onmessage = function (e) {

        if (!e.data.length)
            return;

        // parse data
        var data = JSON.parse(e.data),
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

// ============================================================================
// Service RPC
// ============================================================================

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
        data = JSON.stringify([name, task, args, time]);

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

    var slice = Array.prototype.slice,
        name,
        task;

    // for each module definition
    for (name in stencil) {
        
        if (!proxy[name]) proxy[name] = {};
        
        for (task in stencil[name])
            
            proxy[name][task] = (function (name, task) {
                
                return function () {

                    var args = slice.call(arguments),
                        cb   = typeof args[args.length - 1] === 'function' 
                            ? args.pop() : null;

                    send(name, task, args, cb);
                };

            })(name, task);
    }
};

// ============================================================================
// Exports
// ============================================================================

this.open  = open;
this.close = close;

Object.defineProperty(this, 'proxy', { get: function () { return proxy }});
Object.defineProperty(self, 'proxy', { get: function () { return proxy }});

};

// ============================================================================
// comjs/lib/bcom/net.request.js
// ============================================================================
// 
// Http client requests.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['net.request'] = function () {

// ============================================================================
// Core
// ============================================================================

/**
 * Submits request.
 * 
 * @param  {String}   url     Route, conditionally with parameters 
 * @param  {Object}   body    Body (optional)
 * @param  {String}   method  Http method  
 * @param  {Object}   headers Map of request headers (optional)
 * @param  {Function} ondone  Passed response text, in JSON format if applicable
 * @param  {Function} onerr   Error callback (optional)
 */
function request (url, body, method, headers, ondone, onerr) {

    var http = new XMLHttpRequest();

    http.open(method, url, true);

    http.onload = function () {

        if (http.readyState === 4) {

            if ( http.status === 200 || http.status === 201 ) {
                
                var res = http.responseText;
                
                if (res) {
                    if (typeof res === 'object')
                        return ondone(res);

                    try {
                        res = JSON.parse(http.responseText);
                    } catch (e) {}
                }

                ondone(res);

            } else if ( Math.floor(http.status / 400) === 4 || Math.floor(http.status / 300) === 3 ) {
                
                if (onerr)
                    onerr(new Error('request failed with status: '+ http.status + ', reason: ' + http.statusText));
                else
                    throw new Error('request failed with status: '+ http.status + ', reason: ' + http.statusText);
            }
        }
    };

    http.onerror = function () {
        if (onerr)
            onerr(new Error('request failed with status: '+ http.status + ', reason: ' + http.statusText));
        else
            throw new Error('request failed with status: '+ http.status + ', reason: ' + http.statusText);
    };

    if (headers)
        for (var key in headers)
            http.setRequestHeader(key, headers[key]);

    if (method === 'POST' || method === 'PUT') {

        http.setRequestHeader('Content-Type', 'application/json');

        if (typeof body === 'object')
            body = JSON.stringify(body);
    }

    http.send(body);
};

/**
 * Submits GET request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   headers  Map of request headers (optional)
 * @param  {Function} ondone   Passed response text, in JSON format if applicable
 * @param  {Function} onerr    Error callback (optional)
 */
function submitGet (url, headers, ondone, onerr) {
    if (typeof arguments[1] === 'function') {
        onerr   = ondone;
        ondone  = headers;
        headers = null;
    }

    request(url, null, 'GET', headers, ondone, onerr);
};

/**
 * Submits PUT request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   body     Request body 
 * @param  {Object}   headers  Map of request headers
 * @param  {Function} ondone       Passed response text, in JSON format if applicable
 * @param  {Function} onerr    Error callback (optional)
 */
function submitPut (url, body, headers, ondone, onerr) {
    if (typeof arguments[2] === 'function') {
        onerr   = ondone;
        ondone  = headers;
        headers = null;
    }
    request(url, body, 'PUT', headers, ondone, onerr);
};

/**
 * Submits PATCH request.
 * 
 * @param  {String}   url      Request route
 * @param  {Object}   headers  Map of request headers
 * @param  {Function} ondone       Passed response text, in JSON format if applicable
 * @param  {Function} onerr    Error callback (optional)
 */
function submitPatch (url, headers, ondone, onerr) {
    if (typeof arguments[1] === 'function') {
        onerr   = ondone;
        ondone  = headers;
        headers = null;
    }
    request(url, null, 'PATCH', headers, ondone);
};

/**
 * Submits POST request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   body     Request body
 * @param  {Object}   headers  Map of request headers
 * @param  {Function} ondone       Passed response text, in JSON format if applicable
 * @param  {Function} onerr    Error callback (optional)
 */
function submitPost (url, body, headers, ondone, onerr) {
    if (typeof arguments[2] === 'function') {
        onerr   = ondone;
        ondone  = headers;
        headers = null;
    }
    request(url, body, 'POST', headers, ondone, onerr);
};

/**
 * Submits DELETE request.
 * 
 * @param  {String}   url      Request route
 * @param  {Object}   headers  Map of request headers
 * @param  {Function} ondone       Passed response text, in JSON format if applicable
 * @param  {Function} onerr    Error callback (optional)
 */
function submitDelete (url, headers, ondone, onerr) {
    if (typeof arguments[1] === 'function') {
        onerr   = ondone;
        ondone      = headers;
        headers = null;
    }
    request(url, null, 'DELETE', headers, ondone);
};

// ============================================================================
// Exports
// ============================================================================

this.request = request;
this.get     = submitGet;
this.put     = submitPut;
this.patch   = submitPatch;
this.post    = submitPost;
this.delete  = submitDelete;

};

// ============================================================================
// comjs/lib/bcom/gfx.dom.js
// ============================================================================
// 
// Dom utilities.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['gfx.dom'] = function () {

// ============================================================================
// Cache
// ============================================================================

var loaded = false;

// ============================================================================
// Core
// ============================================================================

function ready (cb) {

    if (loaded)
        return cb();

    window.onload = function () {

        // update state
        loaded = true;

        // propagate
        cb();
    };
};

function element (tag, config) {
    var element = document.createElement(tag);
    if (config.attr) 
        attr(element, config.attr);
    if (config.evt)
        evt(element, config.evt);
    if (config.css)
        css(element, config.css);
    if (config.parent)
        element = config.parent.appendChild(element);
    return element;
};

function attr (element, map) {
    
    var key;

    if (element.length) {
        
        var arr = element,
            idx = arr.length;

        while (idx--)
            for (key in map)
                element[key] = map[key];

        return;
    }

    for (key in map)
        element[key] = map[key];
};

function evt (element, map) {
    attr(element, map);
};

function css (element, map) {

    var key;
    
    if (element.length) {
        
        var arr = element,
            idx = arr.length;

        while (idx--)
            for (key in map)
                element.style[key] = map[key];

        return;
    }

    for (key in map)
        element.style[key] = map[key];
};

function empty (element) {
    while (element.firstChild)
        element.removeChild(element.firstChild);
};

// ============================================================================
// Exports
// ============================================================================

this.ready   = ready;
this.element = element;
this.attr    = attr;
this.evt     = evt;
this.css     = css;
this.empty   = empty;

};
// ============================================================================
// comjs/lib/bcom/gfx.svg.js
// ============================================================================
// 
// Svg utilities.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['gfx.svg'] = function () {

// ============================================================================
// Core
// ============================================================================

function element (tag, config) {
    var element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (config.attr) 
        attr(element, config.attr);
    if (config.evt)
        evt(element, config.evt);
    if (config.css)
        css(element, config.css);
    if (config.parent)
        element = config.parent.appendChild(element);
    return element;
};

function attr (element, map) {
    
    var key;

    if (element.length) {
        
        var arr = element,
            idx = arr.length;

        while (idx--)
            for (key in map)
                element.setAttribute(key, map[key]);

        return;
    }

    for (key in map)
        element.setAttribute(key, map[key]);
};

function evt (element, map) {
    attr(element, map);
};

function css (element, map) {

    var style, key;

    if (typeof map === 'object')
        style = JSON.stringify(map)
            .match(/\{(.*)\}/)[1].replace(',', ';');
    else
        style = map;

    if (element.length) {
        
        var arr = element,
            idx = arr.length,
            key;

        while (idx--)
            for (key in map)
                element.setAttribute('style', style);

        return;
    }

    for (key in map)
        element.setAttribute('style', style);
};

function color (element, r, g, b) {
    element.setAttribute('style', 'fill: rgb(' + r + ',' + g + ',' + b + ')');
};

function position (element, x, y) {
    element.setAttribute('x', x);
    element.setAttribute('y', y);
};

function size (element, width, height) {
    element.setAttribute('width', width);
    element.setAttribute('height', height);
};

function empty (element) {
    while (element.firstChild)
        element.removeChild(element.firstChild);
};

// ============================================================================
// Exports
// ============================================================================

this.element  = element;
this.attr     = attr;
this.evt      = evt;
this.css      = css;
this.empty    = empty;
this.color    = color;
this.position = position;
this.size     = size;
this.empty    = empty;

};

// ============================================================================
// comjs/lib/bcom/_footer.js
// ============================================================================
// 
// Footer.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// declare
var sym,
    arr, 
    ctx, 
    idx, 
    len,
    key;

for (sym in bcom) {
    
    ctx = bcom;
    arr = sym.split('.');
    
    for (idx = 0, len = arr.length; idx < len; idx++) {
        if (!ctx[ arr[idx] ]) ctx[ arr[idx] ] = {};
        ctx = ctx[ arr[idx] ];
    }
    
    if (typeof bcom[sym] === 'function')
        bcom[sym] = new bcom[sym];

    for (key in bcom[sym])
        ctx[key] = bcom[sym][key];
    
    delete bcom[sym];
}

// globalize
self.declare = bcom.amd.registry.declare;
self.invoke  = bcom.amd.registry.invoke;
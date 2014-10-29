// ============================================================================
// comjs
// ============================================================================
// Name      : comjs
// Version   : 0.0.1
// Build date: 28-10-2014
// 
// Copyright (c) 2014, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

var com = {};

// ============================================================================
// comjs/lib/native/def.js
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

com.def = define;

// ============================================================================
// comjs/lib/native/rpc.js
// ============================================================================
// 
// Native RPC client.
// 
// @author
//      10/26/14    Stelios Anagnostopoulos     stelios@outlook.com
//      
// Copyright 2014, @author. All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Definition
// ============================================================================

com.rpc = (function rpc () {

// ============================================================================
// Imports
// ============================================================================

var WebSocket = require('ws'),
    http      = require('http'),
    https     = require('https'),
    url       = require('url');

// ============================================================================
// Cache
// ============================================================================

var reqHttp        = http.request,
    reqHttps       = https.request,
    parseUrl       = url.parse,
    slice          = Array.prototype.slice,
    stringify      = JSON.stringify,
    parse          = JSON.parse,
    defineProperty = Object.defineProperty,
    floor          = Math.floor;

// ============================================================================
// Cache
// ============================================================================

var websocket,         // websocket channel
    proxy,             // service proxy
    callback,          // callback registry as { timestampN: fn }
    connected = false; // connection flag

// ============================================================================
// Channel services
// ============================================================================

/**
 * Connects to websocket channel.
 *
 * @param  {String}   path Connection endpoint 
 * @param  {Boolean}  wss  Use secure protocol (optional)
 * @param  {Function} cb   (optional)
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
    var time = Date.now(),
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
 * @return {Object}          
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
 * @param  {String}   path 
 * @param  {String}   data   JSON data or null
 * @param  {String}   method Http method
 * @param  {Function} cb     Passed response
 */
function request (path, data, method, cb) {
    var request = path.match(/^https/) ? reqHttps : reqHttp,
        urlData = parseUrl(path);
    var req = request({
        hostname: urlData.hostname,
        path    : urlData.path,
        method  : method || 'GET'
    }, function (res) {
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            cb(data);
        });
    });

    if (data)
        req.write(typeof data === 'string' ? data : parse(data) );

    req.on('error', function (err) {
        throw new Error(err);
    });
    req.end();
};

/**
 * Submits GET request.
 * 
 * @param  {String}   path 
 * @param  {String}   data  JSON data (optional; can be Object)
 * @param  {Function} cb    Passed response
 */
function get (path, data, cb) {

    if (arguments.length < 3) {
        cb   = data;
        data = '';
    } else {
        if (typeof data !== 'string')
            data = stringify(data);
        data = encodeURIComponent(data);
        path += data; 
    }

    request(path + data, null, 'GET', cb);
};

/**
 * Submits POST request.
 *   
 * @param  {String}   path  
 * @param  {String}   data  JSON data (can be Object)
 * @param  {Function} cb    Passed [res]
 */
function post (path, data, cb) {
    request(path, data, 'POST', cb);
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
    
    create: function () { new rpc }
};

})();

// ============================================================================
// comjs/lib/native/srv.js
// ============================================================================
// 
// Native Http & WebSocket server.
// 
// @author
//      10/26/14    Stelios Anagnostopoulos     stelios@outlook.com
//      
// Copyright 2014, @author. All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Imports
// ============================================================================

var WebSocketServer = require('ws').Server,
    http            = require('http'),
    fs              = require('fs'),
    path            = require('path');

// ============================================================================
// Cache
// ============================================================================

var createHttpServer = http.createServer,
    serialize        = JSON.stringify,
    parse            = JSON.parse,
    slice            = Array.prototype.slice,
    join             = path.join,
    basename         = path.basename,
    resolve          = path.resolve,
    readdirSync      = fs.readdirSync,
    statSync         = fs.statSync,
    lstatSync        = fs.lstatSync,
    createReadStream = fs.createReadStream;

// ============================================================================
// Definition
// ============================================================================

com.srv = (function srv (config, cb) {

// ========================================================================
// Parse arguments
// ========================================================================

cb = arguments[arguments.length - 1];

if (typeof config !== 'object')
    config = {};

// ========================================================================
// Cache
// ========================================================================

var httpServer      = null,
    webSocketServer = null,
    requests        = {},
    services        = {},
    pubStub         = {},
    pubProxy        = {},
    auth            = function (cb) { arguments[arguments.length - 1]([]) }; 

// ========================================================================
// Requests
// ========================================================================

function registerRequests (registrations) {

    if ( !(registrations instanceof Array) ) 
        registrations = [registrations];

    for (var i = 0, len = registrations.length, entry, mod, key; i < len; i++) {
        
        entry = registrations[i];
        
        if (typeof entry === 'object')
            for (key in entry)
                requests[key] = entry[key];
        else
            walkSync(entry, function (file) {
                registerRequests( require( resolve(file) ) ); 
            });
    }
};

function unregisterRequests (paths) {
    if ( !(paths instanceof Array))
        paths = [paths];
    
    for (var i = 0, len = paths.length; i < len; i++) {
        if (!requests[ paths[i] ])
            continue;
        delete requests[ paths[i] ];
    }
};

// ========================================================================
// Files
// ========================================================================

function registerFiles (registrations) {

    if ( !(registrations instanceof Array) ) 
        registrations = [registrations];
    
    for (var i = 0, ilen = registrations.length, entry, route, files, j, jlen, postfix, ctype, k, klen, path; i < ilen; i++) {
        
        entry = registrations[i];

        if (typeof entry === 'object') {

            for (route in entry) {

                files = entry[route];
                if (typeof files === 'string')
                    files = [ files ];

                for (j = 0, jlen = files.length; j < jlen; j++) {
                    walkSync(files[j], function (file) {
                        postfix = file.match(/.*\.(.*)/),
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

                        if (files[j] === file)
                            path = join( route, basename(file) ).replace(/\\/g, '/');
                        else
                            path = join(route, file).replace(/\\/g, '/');
                        file = resolve(file);

                        requests[path] = (function (ctype) {
                            return function (req, res) {
                                res.writeHead(200, {'Content-Type': ctype });
                                createReadStream(file).pipe(res);
                            };
                        })(ctype);
                    });
                }
            }
        } else {
            walkSync(entry, function (file) {
                registerFiles( require( resolve(file) ) ); 
            });
        }
    }
};

function unregisterFiles (paths) {
    unregisterRequests(paths);
};

// ========================================================================
// Services
// ========================================================================

function registerServices (registrations, noUpdPubPS) {

    var updatePubProxyStub = false;

    if ( !(registrations instanceof Array))
        registrations = [registrations];

    for (var i = 0, len = registrations.length, entry, name; i < len; i++) {

        entry = registrations[i];

        if (typeof entry === 'object')
            for (name in entry) {
                services[name] = entry[name];
                if (!services[name].perms || !services[name].perms.length)
                    updatePubProxyStub = true;
            }
        else
            walkSync(entry, function (file) {
                registerServices( require( resolve(entry) ), true );
            });
    }

    if (!noUpdPubPS && updatePubProxyStub)
        generatePublicProxyStub();
};

function unregisterServices (names) {
    var updatePubProxyStub = false;

    if ( !(names instanceof Array))
        names = [names];
    
    for (var i = 0, len = names.length; i < len; i++) {
        if (!services[ names[i] ])
            continue;
        if (!services[ names[i] ].perms || !services[ names[i] ].perms.length)
            updatePubProxyStub = true;
        delete services[ names[i] ];
    }

    if (updatePubProxyStub)
        generatePublicProxyStub();
};

// ========================================================================
// Internal
// ========================================================================

function generatePublicProxyStub () {
    pubStub  = {};
    pubProxy = {};
    var name, pkey;
    for (name in services) {
        if (!services[name].perms || !services[name].perms.length)  {
            
            pubStub[name] = typeof services[name] === 'function' 
                ? services[name]() : services[name];
            
            pubProxy[name] = {};
            
            for (pkey in pubStub[name])
                if (pkey !== 'name' && pkey !== 'perms')
                    pubProxy[name][pkey] = 1;
        }
    }
};

// ========================================================================
// Setup
// ========================================================================

function open (config, cb) {

    if (config.requests)
        registerRequests(config.requests);
    if (config.files)
        registerFiles(config.files);
    if (config.services)
        registerServices(config.services);

    // ========================================================================
    // Initialization
    // ========================================================================

    // init http server & register requests
    httpServer = createHttpServer(function (req, res) {
        if (requests[req.url])
            requests[req.url](req, res);
    });

    httpServer.listen(config.port || process.env.PORT, function () {
        if (typeof cb === 'function') cb();
    });

    webSocketServer = new WebSocketServer({ server: httpServer });

    webSocketServer.on('connection', function (conn) {

        var stub  = pubStub,
            proxy = pubProxy,
            cache = {};

        conn.on('message', function (msg) {

            // parse data
            var data = parse(msg);
            if (data.length !== 4)
                return conn.send(0);
            
            var name = data[0],
                task = data[1],
                args = data[2],
                time = data[3];

            if (name === 'root') {

                // handle close
                if (task === 'close')
                    return conn.close();

                // handle auth by giving access to applicable services services
                else if (task === 'auth')
                    return auth.apply(cache, args.concat(function (perms) {
                        if (!perms) perms = [];
                        var pidx,
                            pkey;
                        for (var name in services) {
                            pidx = perms.length;
                            while (pidx--)
                                if (services[name].perms && services[name].perms.indexOf(perms[pidx]) >= 0) {
                                    stub[name]  = typeof services[name] === 'function' ? services[name]() : services[name];
                                    proxy[name] = {};
                                    for (pkey in stub[name])
                                        if (pkey !== 'name' && pkey !== 'perms')
                                            proxy[name][pkey] = 1;
                                }
                        }
                        conn.send(serialize([[proxy], time]));
                    }));
            }

            // fetch service task from stub
            if (!stub[name] || !stub[name][task])
                return conn.send(0);

            // make response object
            var res = {
                send: function () {
                    conn.send(serialize([
                        slice.call(arguments),
                        time
                    ]));
                },

                done: function () {
                    conn.send(serialize([
                        slice.call(arguments),
                        time,
                        1
                    ]));
                }
            };

            // delegate to task
            stub[name][task].apply(cache, args.concat(res));
        });
    });
};

function close (cb) {
    webSocketServer.close();
    httpServer.close(function () {
        if (cb) cb();
    });
};

// ========================================================================
// Members
// ========================================================================

return {
    open            : open,
    close           : close,
    registerRequests: registerRequests,
    registerFiles   : registerFiles,
    registerServices: registerServices,

    create: function () { return new srv }
};

})();

/**
 * Walks one or multiple directories, iterating on each file path.
 * 
 * @param  {Number}   dir
 * @param  {Function} iter
 */
function walkSync (dir, iter) {

    if (dir instanceof Array) {
        if (!dir.length)
            return;
        var idx = dir.length;
        while (idx--)
            walkSync(dir[idx], iter);
        return;
    }
    if (!statSync(dir).isDirectory()) 
        return iter(dir);

    var files = readdirSync(dir),
        idx   = files.length,
        file, stat;

    while (idx--) {
        file = join(dir, files[idx]);    
        stat = statSync(file);
        if (stat.isDirectory())
            walkSync(file, iter);
        else
            iter(file);
    }
};


if (typeof window === 'undefined')
    module.exports = com;
else
    window.com = com;

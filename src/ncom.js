// ============================================================================
// ncom.js
// ============================================================================
// 
// Native implementation of RPC-based AMD server-client middleware.
// 
// Copyright (c) 2014, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Imports
// ============================================================================

var WebSocket       = require('ws'),
    WebSocketServer = WebSocket.Server,
    http            = require('http'),
    https           = require('https'),
    fs              = require('fs'),
    path            = require('path'),
    url             = require('url');

// ============================================================================
// Cache
// ============================================================================

var createHttpServer = http.createServer,
    submitHttp       = http.request,
    submitHttps      = https.request,
    serialize        = JSON.stringify,
    parseJSON        = JSON.parse,
    slice            = Array.prototype.slice,
    join             = path.join,
    basename         = path.basename,
    resolve          = path.resolve,
    parseUrl         = url.parse,
    readdirSync      = fs.readdirSync,
    statSync         = fs.statSync,
    createReadStream = fs.createReadStream,
    keysOf           = Object.keys,
    defineProperties = Object.defineProperties;

// ============================================================================
// Native Http & WebSocket server
// ============================================================================
// - init
// - exit
// - registerRequests
// - registerFiles
// - registerServices
// ============================================================================

// Cache
// ============================================================================

var httpServer      = null,
    webSocketServer = null,
    requests        = {},
    services        = {},
    pubStub         = {},
    pubProxy        = {},
    auth            = function (cb) { arguments[arguments.length - 1]([]) }; 

// Requests
// ============================================================================

/**
 * Registers requests.
 * 
 * @param  {Array} registrations Collection of [ { route0: function (req, res) {} } ]
 */
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

/**
 * Unregister requests.
 * 
 * @param  {Array} identifiers (can be String)
 */
function unregisterRequests (identifiers) {
    if ( !(identifiers instanceof Array))
        identifiers = [identifiers];
    
    for (var i = 0, len = identifiers.length; i < len; i++) {
        if (!requests[ identifiers[i] ])
            continue;
        delete requests[ identifiers[i] ];
    }
};

// Files
// ============================================================================

/**
 * Registers files.
 * 
 * @param  {Array} registrations Collection of [ { route0: [filePath0] } ]
 */
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

/**
 * Unregister files.
 * 
 * @param  {Array} identifiers (can be String)
 */
function unregisterFiles (identifiers) {
    unregisterRequests(identifiers);
};

// Services
// ============================================================================

/**
 * Registers files.
 * 
 * @param  {Array} registrations Collection of [ { name0: { perms: ['foo-group'], taskBar: function () { res.done() }} } ]
 */
function registerServices (registrations, noUpdPubPS) {

    var updatePubProxyStub = false;

    if ( !(registrations instanceof Array) ) 
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

/**
 * Unregister services.
 * 
 * @param  {Array} identifiers (can be String)
 */
function unregisterServices (identifiers) {
    var updatePubProxyStub = false;

    if ( !(identifiers instanceof Array))
        identifiers = [identifiers];
    
    for (var i = 0, len = identifiers.length; i < len; i++) {
        if (!services[ identifiers[i] ])
            continue;
        if (!services[ identifiers[i] ].perms || !services[ identifiers[i] ].perms.length)
            updatePubProxyStub = true;
        delete services[ identifiers[i] ];
    }

    if (updatePubProxyStub)
        generatePublicProxyStub();
};

// Internal
// ============================================================================

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

// Setup
// ============================================================================

/**
 * Initializes server.
 * 
 * @param  {Object}   config Map of { port, requests, services, files }
 * @param  {Function} cb
 */
function init (config, cb) {

    if (config.requests)
        registerRequests(config.requests);
    if (config.services)
        registerServices(config.services);
    if (config.files)
        registerFiles(config.files.concat([{ '/': join(__dirname, './bcom.js') }]));

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
            var data = parseJSON(msg);
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

/**
 * Stops server.
 * 
 * @param  {Function} cb
 */
function exit (cb) {
    webSocketServer.close();
    httpServer.close(function () {
        if (cb) cb();
    });
};

// ============================================================================
// RPC client
// ============================================================================
// - open
// - close
// - proxy
// - get
// - put
// - post
// - delete
// ============================================================================

// ============================================================================
// Cache
// ============================================================================

var websocket,         // websocket channel
    proxy,             // map of public and/or authorized proxies to native modules
    callback,          // callback registry as { timestampN: fn }
    connected = false; // connection flag

// ============================================================================
// Channel services
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
    var time = Date.now(),
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

    var urlData = parseUrl(url),
        request = urlData.protocol === 'https:' ? submitHttps : submitHttp;
    var req = request({
        hostname: urlData.hostname,
        url     : urlData.url,
        method  : method,
        headers : headers
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

    if (body)
        req.write(typeof body === 'string' ? body : parseJSON(body) );

    req.on('error', function (err) {
        throw new Error(err);
    });
    req.end();
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


// ========================================================================
// Class definition
// ========================================================================
// - define
// ========================================================================

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

module.exports = {
    init            : init,
    exit            : exit,
    registerRequests: registerRequests,
    registerFiles   : registerFiles,
    registerServices: registerServices,

    get proxy () { return proxy },

    open : open,
    close: close,

    submitGet   : submitGet,
    submitPut   : submitPut,
    submitPost  : submitPost,
    submitDelete: submitDelete,

    define: define
};

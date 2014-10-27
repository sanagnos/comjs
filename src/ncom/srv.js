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

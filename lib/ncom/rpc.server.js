// ============================================================================
// comjs/lib/ncom/rpc.server.js
// ============================================================================
// 
// Server module.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Imports
// ============================================================================

var WebSocket = require('ws'),
    http      = require('http'),
    path      = require('path'),
    router    = require('./rpc.router'),
    runtime   = require('./rpc.runtime');

// ============================================================================
// Cache
// ============================================================================

// state
var httpServer         = null,
    webSocketServer    = null,
    requests           = {},
    services           = {},
    publicStub         = {},
    publicProxyStencil = {},
    auth               = function () { arguments[arguments.length - 1]([]) };

// functions
var WebSocketServer  = WebSocket.Server,
    createHttpServer = http.createServer,
    serialize        = JSON.stringify,
    parseJSON        = JSON.parse,
    slice            = Array.prototype.slice,
    join             = path.join,
    resolve          = path.resolve;

// ============================================================================
// Core
// ============================================================================

/**
 * Initializes server.
 * 
 * @param  {Object}   config Map of { port, requests, services, files }
 * @param  {Function} cb
 */
function start (port, req, rpc, cb) {

    cb = arguments[arguments.length - 1];

    if (typeof port !== 'number')
        port = 80;

    // register
    
    if (req)
        router.register(req);
    if (rpc)
        runtime.register(rpc);

    // init http server
    
    httpServer = createHttpServer(function (req, res) {
        if (router.registry[req.url])
            router.registry[req.url](req, res);
    });

    httpServer.listen(port, function () {
        if (typeof cb === 'function') cb();
    });

    // init websocket
    
    webSocketServer = new WebSocketServer({ server: httpServer });
    
    webSocketServer.on('connection', function (conn) {

        var stub  = runtime.publicStub,
            proxy = runtime.publicProxyStencil,
            cache = {};

        conn.on('message', function (msg) {

            // parse data
            var data = parseJSON(msg);
            if (data.length !== 4)
                return conn.send(0);
            
            var name = data[0],
                task = data[1],
                args = data[2] || [],
                time = data[3];

            // if connection task
            if (name === 'self') {

                // handle close task
                if (task === 'close')
                    conn.close();

                // handle auth task by giving access to applicable services services
                else if (task === 'auth')

                    auth.apply(cache, args.concat(function (permgroups) {

                        if (!permgroups)
                            return conn.send(serialize([[proxy], time]));

                        var ps = runtime.generateProxyStub(permgroups);
                        proxy = ps.proxy;
                        stub  = ps.stub;

                        conn.send( serialize( [ [proxy], time ] ) );
                    }));
                
                return;
            }

            // return if name or task are missing 
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
            stub[name][task].apply( cache, args.concat(res) );
        });
    });
};

/**
 * Stops server.
 * 
 * @param  {Function} cb
 */
function stop (cb) {
    webSocketServer.close();
    httpServer.close(function () {
        if (cb) cb();
    });
};

// ============================================================================
// Exports
// ============================================================================

module.exports = {
    start: start,
    stop : stop,

    set onauth (fn) {
        auth = fn;
    }
};
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

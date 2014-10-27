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

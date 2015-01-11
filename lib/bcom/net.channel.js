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

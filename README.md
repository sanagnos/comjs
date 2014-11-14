comjs
=====

> A vweb take of the Component Object Model architecture, spanning both native & browser environments, and inspired by the original [COM](http://en.wikipedia.org/wiki/Component_Object_Model).

Most infrastructure running on Windows today is based on COM, a C++ interface standard that allows for componetization, reuse, and host-agnostic rpc. The web differs from these fronts only in that instead of componentization (& the implied rigid hierarchies of OOP), the focus is on functional modularization (& the implied flexibility of a functional perspective without the domain-constraints imposed by strict OOP). Simply put, the most imporant difference is that instead of requiring dll presence on the disk, the model requires a valid url endpoint to a module that's loaded asynchronously & is JIT-compiled on the client.

The goal is to consolidate fragmented workflows in client/server systems for the web in a single language and a consistent API surface engineered around laconic & frinctionless development: use the minimum necessary steps & aim for the maximum performance.

The functionality currently scopes five recurring tasks:

- client-server rpc
- async module loading
- request routing
- file serving
- prototype-based class inheritance
- utilities, such as async iterators

The approach is inline with Javascript's laconism & orthogonal take on type-checking.

This is a recent merge of the [define](https://github.com/sanagnos/define) & [web-kernel](https://github.com/sanagnos/web-kernel) repos, and an open-source component of an [experiment](http://www.nesi.io) with an impossible enough goal to have become an obsession.

## Getting started

Run `npm install comjs` to setup.

Best way is to go thru the example.
- Point your terminal to `cb ./comjs/example/native`
- Run `node server` and `chrome localhost` (F12 to see console output).
- Also check out the native client with a parallel node process `node client.js`.

## API

ncom is the native implementation of the middleware & bcom is for the browser.

### Http & Websocket server (ncom only)

```javascript
// ============================================================================
// Http & WebSocket server
// ============================================================================
// - start
// - stop
// - registerRequests
// - registerFiles
// - registerServices
// ============================================================================

/**
 * Initializes server.
 * 
 * @param  {Object}   config Map of { port, requests, services, files }
 * @param  {Function} cb
 */
com.init(config, cb);

/**
 * Stops server.
 * 
 * @param  {Function} cb
 */
com.exit(cb);

/**
 * Registers files.
 * 
 * @param  {Array} registrations Collection of [ { route0: function (req, res) {} } ]
 */
com.registerRequests(registrations);

/**
 * Unregister requests.
 * 
 * @param  {Array} identifiers (can be String)
 */
com.unregisterRequests(identifiers);

/**
 * Registers files.
 * 
 * @param  {Array} registrations Collection of [ { route0: [filePath0] } ]
 */
com.registerFiles(registrations);

/**
 * Unregister files.
 * 
 * @param  {Array} identifiers (can be String)
 */
com.unregisterFiles(identifiers);

/**
 * Registers files.
 * 
 * @param  {Array} registrations Collection of [ { name0: { perms: ['foo-group'], taskBar: function () { res.done() }} } ]
 */
com.registerServices(registrations);

/**
 * Unregister services.
 * 
 * @param  {Array} identifiers (can be String)
 */
com.unregisterServices(names);
```

### Websocket client (ncom & bcom)

```javascript
// ============================================================================
// Websocket client
// ============================================================================
// - open
// - close
// - proxy
// ============================================================================

/**
 * Connects to websocket channel.
 *
 * @param  {Object}   config Connection endpoint as url string or config map of {path, auth, wss}
 * @param  {Function} cb     Callback
 */
com.open(config, cb);

/**
 * Closes websocket channel.
 */
com.close();

/**
 * Map of public and/or authorized proxies to native modules.
 *
 * @type {Object}
 */
com.proxy;

/**
 * Submits GET request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   headers  Map of request headers (optional)
 * @param  {Function} cb       Passed response text, in JSON format if applicable
 */
com.submitGet(url, headers, cb);

/**
 * Submits PUT request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   body     Request body (optional)
 * @param  {Object}   headers  Map of request headers (optional)
 * @param  {Function} cb       Passed response text, in JSON format if applicable
 */
com.submitPut(url, headers, cb);

/**
 * Submits POST request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   body     Request body (optional)
 * @param  {Object}   headers  Map of request headers (optional)
 * @param  {Function} cb       Passed response text, in JSON format if applicable
 */
com.submitPost(url, body, headers, cb);

/**
 * Submits DELETE request.
 * 
 * @param  {String}   url      Request route
 * @param  {Object}   headers  Map of request headers (optional)
 * @param  {Function} cb       Passed response text, in JSON format if applicable
 */
com.submitDelete(url, headers, cb);
```

### Async module loading (bcom only)

```javascript
// ============================================================================
// Async module loading
// ============================================================================
// - declare
// - invoke
// - append
// ============================================================================

/**
 * Declares a module.
 * 
 * @param  {String}   identifier   Static path to module      
 * @param  {Array}    dependencies List of required dependecies/files
 * @param  {Function} module       Callback with module dependecies as args
 */
com.declare(identifier, dependencies, module);

/**
 * Invokes a module.
 * 
 * @param  {Array}    identifiers Static path(s) to modules/files
 * @param  {Function} cb          Callback with invoked modules as args    
 */
com.invoke(identifiers, cb);

/**
 * Appends js, css, html, txt to dom.
 * 
 * @param  {Array}    identifiers Static path(s) to assets; ([path, parentElement] entries are allowed)
 * @return {Function} cb          Callback
 */
com.append(identifiers, cb);
```
### Prototypal class definition (ncom, bcom)

```javascript
// ============================================================================
// Prototypal class definition
// ============================================================================
// - define
// ============================================================================

/**
 * Generates class definition given a collection of prototype
 * contracts.
 * 
 * @param  {Function} constr    
 * @param  {Array}    contracts (can also be single object)
 * @return {Function}          
 */
com.define(constr, contracts);
```

### Async iteration (ncom, bcom)

```javascript
// ============================================================================
// Async iteration
// ============================================================================
// - each
// - eachGroup
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
```

## Bugs
Possibly lurking. I'm actively working with this, so any fixes should make it here quickly.

## License
Feel free to use non-commercially, but drop me a line for anything but for the sake of ~~yin-yang~~ win-win.

## Changelog
* 0.0.1 -- Base functionality
* 0.0.2 -- Dependency injection order bugs
* 0.0.3 -- Refactored to single module scope for faster initialization & access
* 0.0.4 -- Fixed append* scenario with with no parent parameter
* 0.0.5 -- Fixed path inconsistency bug on request registeration
* 0.0.6 -- Exposed async iteration util & updated example's routes
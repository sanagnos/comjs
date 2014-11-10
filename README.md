comjs
=====

> A vweb take of the Component Object Module architecture, spanning both native & browser environments, and inspired by the original [COM](http://en.wikipedia.org/wiki/Component_Object_Model).

The goal is to consolidate fragmented workflows to a consistent API engineered around laconic & frinctionless development: use the minimum necessary steps & aim for the maximum performance.

The scope of the functionality falls under five recurring tasks:

- file serving
- request routing
- async module loading
- client-server rpc
- class/interface inheritance

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

### server (ncom only)

```javascript
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

### rpc (ncom & bcom)

```javascript
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

### amd (bcom only)

```javascript
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
### define (ncom, bcom)

```javascript
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
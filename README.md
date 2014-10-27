comjs
=====

> An implementation of the Component Object Module architecture for native & browser environment, inspired by [COM](http://en.wikipedia.org/wiki/Component_Object_Model) of the desktop-era.

## Getting started

Run `npm instamm comjs` to install.

Best way is to go thru the example.
Run `node ./examples/native/server` and `chrome localhost`.

Also check out the native client with a parallel node process `node ./examples/native/client.js`.

This is a recent merge of the [define](https://github.com/sanagnos/define) & [web-kernel](https://github.com/sanagnos/web-kernel) repos.

## API

ncom is the native implementation of the middleware & bcom is for the browser.

### `com.srv` (ncom)

```javascript
com.srv.open(config, cb)
    // config (Object)
    //   port
    //   requests
    //   files
    //   services
    //
    // cb (Function)

com.srv.close()

com.srv.registerRequests(registrations);
    // registrations (Array)
    //   [ 
    //      { path0: function (req, res) {} },
    //
    //      'request-exports.js'
    //   ]
    //
    //  (note: can be single entry, object or string)

com.srv.unregisterRequests(routes);
    // routes
    //   list of request routes; can also be single string

com.srv.registerFiles(registrations);
    // registrations (Array)
    //   [ 
    //      { 
    //        route0: [ './file.js', './dir/subdir' ], 
    //        route1: './otherFile.js',
    //      },
    //
    //      'file-exports.js'
    //   ]
    //
    //  (note: can be single entry, object or string)

com.srv.unregisterFiles(routes);
    // routes
    //   list of serving routes; can also be single string

com.srv.registerServices(registrations);
    // registrations (Array)
    //   [ 
    //      { name0: { perms: [], method0: function () {} }},
    //
    //      'service-exports.js'
    //   ]
    //
    //  (note: can be single entry, object or string)

com.srv.unregisterServices(names);
    // names (Array)
    //   list of service names; can also be single string
```

### `com.rpc` (ncom, bcom)

```javascript

// opens rpc websocket channel
com.rpc.open(config, cb)
    // config (Object)
    //   path (String)  Connection endpoint
    //   wss  (Boolean) Use secure connection (default = false)
    //   auth (Array)   Auth creds for non-public services (default = [])
    //
    //   (note: config can also be the connection endpoint string)

// closes rpc channel
com.rpc.close()

// map of callable service-side services
com.rpc.proxy
    // (Object)

// get request utility
com.rpc.get(path, data, cb);
    // path (String)   route
    // data (Object)   data    (optional)
    // cb   (Function) callback

// post request utility
com.rpc.post(path, data, cb);
    // path (String)   route
    // data (Object)   data    
    // cb   (Function) callback
```

### `com.amd` (bcom)

```javascript
// declares module
com.amd.declare(identifier, dependencies, module)
    // identifier   (String)   Relative path      
    // dependencies (Array)    List of required files
    // module       (Function) Passed module dependecies

// invokes module (can be js, html, css, txt, etc.)
com.amd.invoke(identifiers, cb)
    // identifiers (Array)    Relative paths (can also be string)
    // cb          (Function) Passed identified module dependencies
```

### `com.def` (ncom, bcom)

```javascript
// generates class from constructor & supplied prototype contracts
com.def.define(constr, contracts)
    // constr    (Function)
    // contracts (Array)
```

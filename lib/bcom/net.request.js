// ============================================================================
// comjs/lib/bcom/net.request.js
// ============================================================================
// 
// Http client requests.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['net.request'] = function () {

// ============================================================================
// Core
// ============================================================================

/**
 * Submits request.
 * 
 * @param  {String}   url     Route, conditionally with parameters 
 * @param  {Object}   body    Body (optional)
 * @param  {String}   method  Http method  
 * @param  {Object}   headers Map of request headers (optional)
 * @param  {Function} ondone  Passed response text, in JSON format if applicable
 * @param  {Function} onerr   Error callback (optional)
 */
function request (url, body, method, headers, ondone, onerr) {

    var http = new XMLHttpRequest();

    http.open(method, url, true);

    http.onload = function () {

        if (http.readyState === 4) {

            if ( http.status === 200 || http.status === 201 ) {
                
                var res = http.responseText;
                
                if (res) {
                    if (typeof res === 'object')
                        return ondone(res);

                    try {
                        res = JSON.parse(http.responseText);
                    } catch (e) {}
                }

                ondone(res);

            } else if ( Math.floor(http.status / 400) === 4 || Math.floor(http.status / 300) === 3 ) {
                
                if (onerr)
                    onerr(new Error('request failed with status: '+ http.status + ', reason: ' + http.statusText));
                else
                    throw new Error('request failed with status: '+ http.status + ', reason: ' + http.statusText);
            }
        }
    };

    http.onerror = function () {
        if (onerr)
            onerr(new Error('request failed with status: '+ http.status + ', reason: ' + http.statusText));
        else
            throw new Error('request failed with status: '+ http.status + ', reason: ' + http.statusText);
    };

    if (headers)
        for (var key in headers)
            http.setRequestHeader(key, headers[key]);

    if (method === 'POST' || method === 'PUT') {

        http.setRequestHeader('Content-Type', 'application/json');

        if (typeof body === 'object')
            body = JSON.stringify(body);
    }

    http.send(body);
};

/**
 * Submits GET request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   headers  Map of request headers (optional)
 * @param  {Function} ondone   Passed response text, in JSON format if applicable
 * @param  {Function} onerr    Error callback (optional)
 */
function submitGet (url, headers, ondone, onerr) {
    if (typeof arguments[1] === 'function') {
        onerr   = ondone;
        ondone  = headers;
        headers = null;
    }

    request(url, null, 'GET', headers, ondone, onerr);
};

/**
 * Submits PUT request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   body     Request body 
 * @param  {Object}   headers  Map of request headers
 * @param  {Function} ondone       Passed response text, in JSON format if applicable
 * @param  {Function} onerr    Error callback (optional)
 */
function submitPut (url, body, headers, ondone, onerr) {
    if (typeof arguments[2] === 'function') {
        onerr   = ondone;
        ondone  = headers;
        headers = null;
    }
    request(url, body, 'PUT', headers, ondone, onerr);
};

/**
 * Submits PATCH request.
 * 
 * @param  {String}   url      Request route
 * @param  {Object}   headers  Map of request headers
 * @param  {Function} ondone       Passed response text, in JSON format if applicable
 * @param  {Function} onerr    Error callback (optional)
 */
function submitPatch (url, headers, ondone, onerr) {
    if (typeof arguments[1] === 'function') {
        onerr   = ondone;
        ondone  = headers;
        headers = null;
    }
    request(url, null, 'PATCH', headers, ondone);
};

/**
 * Submits POST request.
 * 
 * @param  {String}   url      Request route, conditionally with parameters 
 * @param  {Object}   body     Request body
 * @param  {Object}   headers  Map of request headers
 * @param  {Function} ondone       Passed response text, in JSON format if applicable
 * @param  {Function} onerr    Error callback (optional)
 */
function submitPost (url, body, headers, ondone, onerr) {
    if (typeof arguments[2] === 'function') {
        onerr   = ondone;
        ondone  = headers;
        headers = null;
    }
    request(url, body, 'POST', headers, ondone, onerr);
};

/**
 * Submits DELETE request.
 * 
 * @param  {String}   url      Request route
 * @param  {Object}   headers  Map of request headers
 * @param  {Function} ondone       Passed response text, in JSON format if applicable
 * @param  {Function} onerr    Error callback (optional)
 */
function submitDelete (url, headers, ondone, onerr) {
    if (typeof arguments[1] === 'function') {
        onerr   = ondone;
        ondone      = headers;
        headers = null;
    }
    request(url, null, 'DELETE', headers, ondone);
};

// ============================================================================
// Exports
// ============================================================================

this.request = request;
this.get     = submitGet;
this.put     = submitPut;
this.patch   = submitPatch;
this.post    = submitPost;
this.delete  = submitDelete;

};

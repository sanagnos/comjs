// ============================================================================
// comjs/lib/ncom/net.request.js
// ============================================================================
// 
// Http client requests.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// ============================================================================
// Imports
// ============================================================================

var http  = require('http'),
    https = require('https'),
    url   = require('url');

// ============================================================================
// Cache
// ============================================================================

var submitHttp  = http.request,
    submitHttps = https.request,
    parseUrl    = url.parse,
    parseJSON   = JSON.parse;

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

    var urlData = parseUrl(url),
        request = urlData.protocol === 'https:' ? submitHttps : submitHttp;

    var req = request({
        hostname: urlData.hostname,
        path    : urlData.path,
        method  : method,
        headers : headers
    }, function (res) {
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            ondone(data);
        });
    });

    if (body)
        req.write(typeof body === 'string' ? body : parseJSON(body) );

    req.on('error', function (err) {
        if (onerr)
            onerr(new Error(err));
        else
            throw new Error(err);
    });

    req.end();
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

module.exports = {
    request: request,
    get    : submitGet,
    put    : submitPut,
    patch  : submitPatch,
    post   : submitPost,
    delete : submitDelete
};

// ============================================================================
// comjs/lib/bcom/amd.loader.js
// ============================================================================
// 
// Browser implementation of comjs.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['amd.loader'] = function () {

// ============================================================================
// Imports
// ============================================================================

var classify  = bcom.lib.path.classify,
    eachGroup = bcom.lib.iter.eachGroup;

// ============================================================================
// Core
// ============================================================================

/**
 * Appends js, css, html, txt to dom.
 * 
 * @param  {Array}    urls Static path(s) to assets; ([path, parentElement] entries are allowed)
 * @return {Function} cb    Callback
 */
function append (urls, root, cb) {

    var map, key, arr, fun;

    if (!cb) {
        cb        = root;
        root = document.body;
    }

    map = urls.length ? classify(urls) : urls;
        
    if (typeof map === 'string') {
        switch (map) {
            case 'js'  : appendJS  (urls, root, cb); break;
            case 'html': appendHTML(urls, root, cb); break;
            case 'css' : appendCSS (urls, root, cb); break;
            default    : appendHTML(urls, root, cb); break;
        }
        return;
    }

    arr = [];
    
    for (key in map) {
        switch (key) {
            case 'js'  : fun = function (item, next) { appendJS  (item, root, next) }; break;
            case 'html': fun = function (item, next) { appendHTML(item, root, next) }; break;
            case 'css' : fun = function (item, next) { appendCSS (item, root, next) }; break;
            default    : fun = function (item, next) { appendHTML(item, root, next) }; break;
        }
        
        arr[arr.length] = [ map[key], fun ];
    }

    eachGroup(arr, cb);
};

/**
 * Appends CSS to DOM.
 * 
 * @param  {String}          path sPath to file
 * @param  {HTMLBodyElement} root Parent dom element (optional)
 * @param  {Function}        cb   Callback
 */
function appendCSS (url, root, cb) {

    var css;

    if (typeof parent === 'function') {
        cb   = root;
        root = document.body;
    }

    if (!url.match(/.css$/)) 
        url += '.css';

    css = document.createElement('link');
    css.href    = url;
    css.rel     = 'stylesheet';
    css.type    = 'text/css';
    css.onload  = cb;
    css.onerror = function (err) {
        throw new URIError('the stylesheet ' + err.target.src + ' is not accessible');
    };

    root.appendChild(css);
};

/**
 * Appends HTML to DOM.
 * 
 * @param  {String}          url  Path to file
 * @param  {HTMLBodyElement} root Parent dom element (optional)
 * @param  {Function}        cb   Callback
 */
function appendHTML (url, root, cb) { 

    var req;

    if (!cb) {
        cb     = root;
        root = document.body;
    }

    if (!url.match(/.html$/)) 
        url += '.html';

    req = new XMLHttpRequest();

    req.open('GET', url, true);

    req.onload = function () {
        if (req.readyState === 4 && req.status === 200)
            root.insertAdjacentHTML('beforeend', req.responseText);
        else
            throw new Error('request failed with status: '+ req.status + ', reason: ' + req.statusText);
        cb();
    };

    req.send();
};

/**
 * Appends Javascript to DOM.
 * 
 * @param  {String}          url  Path to file
 * @param  {HTMLBodyElement} root Parent dom element (optional)
 * @param  {Function}        cb   Callback
 */
function appendJS (url, root, cb) {

    var script;

    if (!cb) {
        cb     = root;
        root = document.body;
    }

    if (!url.match(/.js$/)) url += '.js';

    script = document.createElement('script');

    script.type    = 'text\/javascript';
    script.src     = url;
    script.async   = true;
    script.onload  = cb;
    script.onerror = function (err) {
        throw new URIError('the script ' + err.target.src + ' is not accessible');
    };

    root.appendChild(script);
};

// ============================================================================
// Exports
// ============================================================================

this.append     = append;
this.appendCSS  = appendCSS;
this.appendHTML = appendHTML;
this.appendJS   = appendJS;

};
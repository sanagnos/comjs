// ============================================================================
// comjs/lib/bcom/gfx.dom.js
// ============================================================================
// 
// Dom utilities.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['gfx.dom'] = function () {

// ============================================================================
// Cache
// ============================================================================

var loaded = false;

// ============================================================================
// Core
// ============================================================================

function ready (cb) {

    if (loaded)
        return cb();

    window.onload = function () {

        // update state
        loaded = true;

        // propagate
        cb();
    };
};

function element (tag, config) {
    var element = document.createElement(tag);
    if (config.attr) 
        attr(element, config.attr);
    if (config.evt)
        evt(element, config.evt);
    if (config.css)
        css(element, config.css);
    if (config.parent)
        element = config.parent.appendChild(element);
    return element;
};

function attr (element, map) {
    
    var key;

    if (element.length) {
        
        var arr = element,
            idx = arr.length;

        while (idx--)
            for (key in map)
                element[key] = map[key];

        return;
    }

    for (key in map)
        element[key] = map[key];
};

function evt (element, map) {
    attr(element, map);
};

function css (element, map) {

    var key;
    
    if (element.length) {
        
        var arr = element,
            idx = arr.length;

        while (idx--)
            for (key in map)
                element.style[key] = map[key];

        return;
    }

    for (key in map)
        element.style[key] = map[key];
};

function empty (element) {
    while (element.firstChild)
        element.removeChild(element.firstChild);
};

// ============================================================================
// Exports
// ============================================================================

this.ready   = ready;
this.element = element;
this.attr    = attr;
this.evt     = evt;
this.css     = css;
this.empty   = empty;

};
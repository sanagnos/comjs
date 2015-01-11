// ============================================================================
// comjs/lib/bcom/gfx.svg.js
// ============================================================================
// 
// Svg utilities.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

bcom['gfx.svg'] = function () {

// ============================================================================
// Core
// ============================================================================

function element (tag, config) {
    var element = document.createElementNS('http://www.w3.org/2000/svg', tag);
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
                element.setAttribute(key, map[key]);

        return;
    }

    for (key in map)
        element.setAttribute(key, map[key]);
};

function evt (element, map) {
    attr(element, map);
};

function css (element, map) {

    var style, key;

    if (typeof map === 'object')
        style = JSON.stringify(map)
            .match(/\{(.*)\}/)[1].replace(',', ';');
    else
        style = map;

    if (element.length) {
        
        var arr = element,
            idx = arr.length,
            key;

        while (idx--)
            for (key in map)
                element.setAttribute('style', style);

        return;
    }

    for (key in map)
        element.setAttribute('style', style);
};

function color (element, r, g, b) {
    element.setAttribute('style', 'fill: rgb(' + r + ',' + g + ',' + b + ')');
};

function position (element, x, y) {
    element.setAttribute('x', x);
    element.setAttribute('y', y);
};

function size (element, width, height) {
    element.setAttribute('width', width);
    element.setAttribute('height', height);
};

function empty (element) {
    while (element.firstChild)
        element.removeChild(element.firstChild);
};

// ============================================================================
// Exports
// ============================================================================

this.element  = element;
this.attr     = attr;
this.evt      = evt;
this.css      = css;
this.empty    = empty;
this.color    = color;
this.position = position;
this.size     = size;
this.empty    = empty;

};

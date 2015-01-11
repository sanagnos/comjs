'use strict';

// ============================================================================
// Imports
// ============================================================================

var ncom = require('../index.js'),
    path = require('path');

// ============================================================================
// Main
// ============================================================================

ncom.init({
    
    idx: '/index.html',

    req: {
        '/foo': function (req, res) { res.end('bar') }
    },
    
    amd: {
        '/': [ 
            'index.html', 
            'logger.js',
            'printer.js',
            'append.html',
            'append.css',
            'append2.css'
        ].map(function (p) { return path.join(__dirname, p) })
    },

    rpc: {
        math: {
        
            groups: null,

            add: function (a, b, res) {
                res.done(a + b);
            }
        }
    }
}, function () {
    console.log('service started');
});

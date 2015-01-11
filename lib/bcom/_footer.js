// ============================================================================
// comjs/lib/bcom/_footer.js
// ============================================================================
// 
// Footer.
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

'use strict';

// declare
var sym,
    arr, 
    ctx, 
    idx, 
    len,
    key;

for (sym in bcom) {
    
    ctx = bcom;
    arr = sym.split('.');
    
    for (idx = 0, len = arr.length; idx < len; idx++) {
        if (!ctx[ arr[idx] ]) ctx[ arr[idx] ] = {};
        ctx = ctx[ arr[idx] ];
    }
    
    if (typeof bcom[sym] === 'function')
        bcom[sym] = new bcom[sym];

    for (key in bcom[sym])
        ctx[key] = bcom[sym][key];
    
    delete bcom[sym];
}

// globalize
self.declare = bcom.amd.registry.declare;
self.invoke  = bcom.amd.registry.invoke;
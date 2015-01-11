// ============================================================================
// comjs
// ============================================================================
// Name      : comjs
// Version   : 0.0.7
// Build date: 09-01-2015
// 
// Copyright (c) 2015, Stelios Anagnostopoulos <stelios@outlook.com>
// All rights reserved.
// ============================================================================

"use strict";self.bcom={},bcom["lib.class"]=function(){function a(a,c){var f,d,g,e;for(c instanceof Array||(c=[c]),f=Array(c.length),d=0,g=c.length;g>d;d++)b(a.prototype,c[d]),f[d]=Object.keys(c[d]);return e=function(){var b,e,g,c,d;if(a.prototype._preInit)for(b=0,e=a.prototype._preInit.length;e>b;b++)a.prototype._preInit[b].apply(this,arguments);if(a.apply(this,arguments),a.prototype._postInit)for(b=0,e=a.prototype._postInit.length;e>b;b++)a.prototype._postInit[b].apply(this,arguments);for(g=f.length;g--;)for(c=f[g],d=c.length;d--;)if("string"==typeof this[c[d]]&&0===this[c[d]].indexOf("@require"))throw Error("missing contract member: "+c[d])},e.prototype=new a,e.prototype.constructor=e,e}function b(b,c){var d,a,h,i,e,j,g={},f=[];for(a in c)"string"==typeof c[a]&&"@require"!==c[a]?g[a]=function(a){return{configurable:!0,get:function(){var b,d,c=this[a[0]];for(b=1,d=a.length;d>b;b++)c=c[a[b]];return c},set:function(e){var b,d,c=this[a[0]];for(b=1,d=a.length-1;d>b;b++)c=c[a[b]];c[a[a.length-1]]=e}}}(c[a].split(".")):"object"==typeof c[a]?g[a]=c[a]:"function"==typeof c[a]&&("preInit"===a||"postInit"===a?(d="_"+a,b[d]||(b[d]=[]),b[d][b[d].length]=c[a]):f[f.length]=[a,c[a]]);for(Object.defineProperties(b,g),e=0,j=f.length;j>e;e++)a=f[e][0],h=f[e][1],b[a]&&(i=b[a]),b[a]=h,b[a]["super"]=i}this.define=a},bcom["lib.iter"]=function(){function a(a,g,f){var c,d,b,e;return a instanceof Array||(a=[a]),c=0,d=a.length,b=[],d?(e=function(){g(a[c++],function(a){b[b.length]=a,c>=d?f(b):e()})},void e()):f([])}function b(b,c){b instanceof Array||(b=[].concat(b)),a(b,function(b,c){a(b[0],b[1],c)},c)}this.each=a,this.eachGroup=b},bcom["lib.path"]=function(){function a(e){var c,a,d,g,f,b;for(a={},c=arguments.length>1?Array.prototype.slice.call(arguments):e instanceof Array?e:[e],d=0,g=c.length;g>d;d++)f=c[d].lastIndexOf("."),b=f>-1?c[d].substr(f+1):"js",a[b]||(a[b]=[]),a[b][a[b].length]=c[d];if(c.length>1)return a;for(b in a)break;return b}this.classify=a},bcom["amd.loader"]=function(){function d(g,d,h){var i,l,k,j;if(h||(h=d,d=document.body),i=g.length?e(g):g,"string"!=typeof i){k=[];for(l in i){switch(l){case"js":j=function(a,b){c(a,d,b)};break;case"html":j=function(b,c){a(b,d,c)};break;case"css":j=function(a,c){b(a,d,c)};break;default:j=function(b,c){a(b,d,c)}}k[k.length]=[i[l],j]}f(k,h)}else switch(i){case"js":c(g,d,h);break;case"html":a(g,d,h);break;case"css":b(g,d,h);break;default:a(g,d,h)}}function b(b,c,d){var a;"function"==typeof parent&&(d=c,c=document.body),b.match(/.css$/)||(b+=".css"),a=document.createElement("link"),a.href=b,a.rel="stylesheet",a.type="text/css",a.onload=d,a.onerror=function(a){throw new URIError("the stylesheet "+a.target.src+" is not accessible")},c.appendChild(a)}function a(b,c,d){var a;d||(d=c,c=document.body),b.match(/.html$/)||(b+=".html"),a=new XMLHttpRequest,a.open("GET",b,!0),a.onload=function(){if(4!==a.readyState||200!==a.status)throw Error("request failed with status: "+a.status+", reason: "+a.statusText);c.insertAdjacentHTML("beforeend",a.responseText),d()},a.send()}function c(b,c,d){var a;d||(d=c,c=document.body),b.match(/.js$/)||(b+=".js"),a=document.createElement("script"),a.type="text/javascript",a.src=b,a.async=!0,a.onload=d,a.onerror=function(a){throw new URIError("the script "+a.target.src+" is not accessible")},c.appendChild(a)}var e=bcom.lib.path.classify,f=bcom.lib.iter.eachGroup;this.append=d,this.appendCSS=b,this.appendHTML=a,this.appendJS=c},bcom["amd.registry"]=function(){function e(d,e,f){arguments.length<3&&(f=e,e=[]),a[d]=f,c[d]=e,"function"==typeof a[d]&&(b[d]=1)}function d(e,k){var g,m,l,f,n,o="js"===h(e);if(!a[e])return j(e,function(){o?d(e,k):k()});if(!b[e])return k(a[e]);if(delete b[e],!c[e])return k(a[e]=new a[e]);for(g=c[e],m=Array(g.length),l=Array(g.length),f=0,n=g.length;n>f;f++)!a[g[f]]||b[g[f]]?l[f]=-1===g[f].indexOf("/")?g[f]:g[f].match(/\/\/(.*)/)[1].replace(/\./g,"/"):m[f]=a[g[f]];return i(l,d,function(){for(var d in l)m[d]=a[l[d]];a[e].apply(a[e]={},m),delete c[e],delete b[e],k(a[e])}),a[e]}function f(d){a[d]&&(delete a[d],c[d]&&delete c[d],b[d]&&delete b[d])}function g(b){return void 0!==a[b]}var h=bcom.lib.path.classify,i=bcom.lib.iter.each,j=bcom.amd.loader.append,a={},c={},b={};this.set=e,this.get=d,this.del=f,this.has=g,this.invoke=d,this.declare=e},bcom["net.channel"]=function(){function e(e,f,h,i){var j,l=arguments,m=typeof e,k=typeof f;"function"===m?(i=e,e=null,f=null,h=null):"object"===k?(j=e,e=j.url,f=j.auth||null,h=j.wss||!1,i=j.cb||l[l.length-1]):"function"===k?(i=f,f=null,h=!1):"boolean"===k&&(i=h,h=f,f=null),e||(e=document.URL),e=(h?"wss://":"ws://")+e.match(/\/\/(.*)/)[1],c&&a.close(),b={},a=new WebSocket(e),a.onopen=function(){c=!0,d("self","auth",f,function(a){g(a),i&&i()})},a.onclose=function(){c=!1},a.onmessage=function(d){if(d.data.length){var a=JSON.parse(d.data),f=a[0],c=a[1],e=a[2];b[c]&&b[c].apply({done:1===e},f),e&&delete b[c]}}}function f(){if(c)if(a.bufferredAmount)var b=setInterval(function(){clearInterval(b),a.close()},100);else a.close()}function d(e,f,g,h){c||connect();var d=performance.now(),i=JSON.stringify([e,f,g,d]);b[d]=h,a.send(i)}function g(c){proxy={};var a,b,e=Array.prototype.slice;for(a in c){proxy[a]||(proxy[a]={});for(b in c[a])proxy[a][b]=function(a,b){return function(){var c=e.call(arguments),f="function"==typeof c[c.length-1]?c.pop():null;d(a,b,c,f)}}(a,b)}}var a,proxy,b,c=!1;this.open=e,this.close=f,Object.defineProperty(this,"proxy",{get:function(){return proxy}}),Object.defineProperty(self,"proxy",{get:function(){return proxy}})},bcom["net.request"]=function(){function a(h,b,d,e,f,c){var g,a=new XMLHttpRequest;if(a.open(d,h,!0),a.onload=function(){if(4===a.readyState)if(200===a.status||201===a.status){var b=a.responseText;if(b){if("object"==typeof b)return f(b);try{b=JSON.parse(a.responseText)}catch(d){}}f(b)}else if(4===Math.floor(a.status/400)||3===Math.floor(a.status/300)){if(!c)throw Error("request failed with status: "+a.status+", reason: "+a.statusText);c(Error("request failed with status: "+a.status+", reason: "+a.statusText))}},a.onerror=function(){if(!c)throw Error("request failed with status: "+a.status+", reason: "+a.statusText);c(Error("request failed with status: "+a.status+", reason: "+a.statusText))},e)for(g in e)a.setRequestHeader(g,e[g]);("POST"===d||"PUT"===d)&&(a.setRequestHeader("Content-Type","application/json"),"object"==typeof b&&(b=JSON.stringify(b))),a.send(b)}function b(e,b,c,d){"function"==typeof arguments[1]&&(d=c,c=b,b=null),a(e,null,"GET",b,c,d)}function c(e,f,b,c,d){"function"==typeof arguments[2]&&(d=c,c=b,b=null),a(e,f,"PUT",b,c,d)}function d(d,b,c,e){"function"==typeof arguments[1]&&(e=c,c=b,b=null),a(d,null,"PATCH",b,c)}function e(e,f,b,c,d){"function"==typeof arguments[2]&&(d=c,c=b,b=null),a(e,f,"POST",b,c,d)}function f(d,b,c,e){"function"==typeof arguments[1]&&(e=c,c=b,b=null),a(d,null,"DELETE",b,c)}this.request=a,this.get=b,this.put=c,this.patch=d,this.post=e,this["delete"]=f},bcom["gfx.dom"]=function(){function e(a){return d?a():void(window.onload=function(){d=!0,a()})}function f(f,d){var e=document.createElement(f);return d.attr&&a(e,d.attr),d.evt&&b(e,d.evt),d.css&&c(e,d.css),d.parent&&(e=d.parent.appendChild(e)),e}function a(b,c){var a,d,e;if(b.length)for(d=b,e=d.length;e--;)for(a in c)b[a]=c[a];else for(a in c)b[a]=c[a]}function b(b,c){a(b,c)}function c(b,c){var a,d,e;if(b.length)for(d=b,e=d.length;e--;)for(a in c)b.style[a]=c[a];else for(a in c)b.style[a]=c[a]}function g(a){for(;a.firstChild;)a.removeChild(a.firstChild)}var d=!1;this.ready=e,this.element=f,this.attr=a,this.evt=b,this.css=c,this.empty=g},bcom["gfx.svg"]=function(){function e(f,d){var e=document.createElementNS("http://www.w3.org/2000/svg",f);return d.attr&&a(e,d.attr),d.evt&&b(e,d.evt),d.css&&c(e,d.css),d.parent&&(e=d.parent.appendChild(e)),e}function a(b,c){var a,d,e;if(b.length)for(d=b,e=d.length;e--;)for(a in c)b.setAttribute(a,c[a]);else for(a in c)b.setAttribute(a,c[a])}function b(b,c){a(b,c)}function c(b,a){var c,d,e,f;if(c="object"==typeof a?JSON.stringify(a).match(/\{(.*)\}/)[1].replace(",",";"):a,b.length)for(e=b,f=e.length;f--;)for(d in a)b.setAttribute("style",c);else for(d in a)b.setAttribute("style",c)}function f(a,b,c,d){a.setAttribute("style","fill: rgb("+b+","+c+","+d+")")}function g(a,b,c){a.setAttribute("x",b),a.setAttribute("y",c)}function h(a,b,c){a.setAttribute("width",b),a.setAttribute("height",c)}function d(a){for(;a.firstChild;)a.removeChild(a.firstChild)}this.element=e,this.attr=a,this.evt=b,this.css=c,this.empty=d,this.color=f,this.position=g,this.size=h,this.empty=d};var a,d,b,c,f,e;for(a in bcom){for(b=bcom,d=a.split("."),c=0,f=d.length;f>c;c++)b[d[c]]||(b[d[c]]={}),b=b[d[c]];"function"==typeof bcom[a]&&(bcom[a]=new bcom[a]);for(e in bcom[a])b[e]=bcom[a][e];delete bcom[a]}self.declare=bcom.amd.registry.declare,self.invoke=bcom.amd.registry.invoke;
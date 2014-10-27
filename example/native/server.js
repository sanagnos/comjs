var com = require('../../builds/ncom');

com.srv.open({
    
    port: 80,

    services: [
        {

            calc: {

                add: function (a, b, res) {
                    res.done(a + b);
                }
            }
        },

        './hisvc.js'
    ],

    requests: [
        {
            '/' : function (req, res) {
                res.writeHead(301, {
                    'location': '/browser/index.html'
                });
                res.end();
            },

            '/foo': function (req, res) {
                res.end('bar');
            }
        },

        './routes.js',
    ],

    files: [
        {
            '/'   : ['../../builds/bcom.js', '../browser'],
            '/lib': [ './math.js' ]
        },

        './file-routes.js'
    ]
}, function () {

    com.rpc.open('http://localhost', function () {

        com.rpc.proxy.calc.add(1, 2, function (res) {
            console.log(res);
        });
    });
});

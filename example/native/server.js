var com = require('../../ncom');

com.start({
    
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
                    'location': '/index.html'
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
            '/'   : [ '../browser' ],
            '/lib': [ './math.js', './this.txt'  ]
        },

        './file-routes.js'
    ]

}, function () {

    com.open('http://localhost', function () {

        com.proxy.calc.add(1, 2, function (res) {
            console.log(res);
        });
    });
});

var com = require('../../builds/ncom');

com.rpc.open('http://localhost', function () {
    com.rpc.proxy.calc.add(1, 2, function (res) {
        console.log(res);

        com.rpc.proxy.hi.say('dogge', function (res) {
            console.log(res);
        });
    });
});

com.rpc.get('http://localhost/test/this.txt', function (data) {
    console.log(data);
});

com.rpc.get('http://localhost/foo', function (data) {
    console.log(data);
});

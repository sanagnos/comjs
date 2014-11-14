var com = require('../../ncom');

com.open('http://localhost', function () {
    com.proxy.calc.add(1, 2, function (res) {
        console.log(res);

        com.proxy.hi.say('dogge', function (res) {
            console.log(res);
        });
    });
});

com.submitGet('http://localhost/foo', function (data) {
    console.log(data);
});

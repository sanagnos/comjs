declare('logger', function () {

    var secret = 5;

    this.log = function (a) {
        console.log( secret += a );
    };
});
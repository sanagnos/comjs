declare('printer', ['logger', 'append2.css'], function (logger) {
    this.print = function (a) {
        logger.log(a);
    };
});
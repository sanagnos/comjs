com.amd.declare('/wat/circle', function () {
    var pi = 3.14;

    return {
        calcArea: function (r) {
            return pi * r * r;
        }
    };
});
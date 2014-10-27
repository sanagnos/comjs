com.amd.declare('/math.js', function () {
    var pi = 3.14;

    return {
        calcCircleArea: function (r) {
            return pi * r * r;
        }
    };
});
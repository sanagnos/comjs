com.declare('/user/hello', function () {
    var msg = 'hi';

    return {
        say: function () {
            return msg;
        }
    };
});
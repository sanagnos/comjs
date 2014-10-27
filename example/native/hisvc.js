module.exports = {
    hi: {
        say: function (name, res) {
            res.done('hi, ' + name);
        }
    }
};
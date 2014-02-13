
var chance = function chance(pct, a, b) {
    return (Math.random() <= pct) ? a : (b ? b : '');
};


var variance = function variance(n, pct) {
    var x = Math.random();
    // half the time less, half the time more
    var nb = (x <= 0.50) ? n - (n * x * (pct || 1)) : n + (n * x * (pct || 1));
    return Math.floor(nb);
};

var random_ip = function random_ip() { 
    var ipnum = Math.floor(Math.random()*Math.pow(2,32));
    return _( [
        Math.floor( ipnum / 16777216 ) % 256,
        Math.floor( ipnum / 65536    ) % 256,
        Math.floor( ipnum / 256      ) % 256,
        Math.floor( ipnum            ) % 256
    ]).join('.');
};

module.exports  = {
    random_ip : random_ip,
    chance : chance,
    variance : variance
};

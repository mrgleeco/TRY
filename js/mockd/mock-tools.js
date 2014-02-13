
var chance = function(pct, a, b) {
    return (Math.random() <= pct) ? a : (b ? b : '');
};


var variance = function(n, pct) {
    var x = Math.random();
    // half the time less, half the time more
    var nb = (x <= 0.50) ? n - (n * x * (pct || 1)) : n + (n * x * (pct || 1));
    return Math.floor(nb);
};

var random_ip = function() {
    var ipnum = Math.floor(Math.random()*Math.pow(2,32));
    return _( [
        Math.floor( ipnum / 16777216 ) % 256,
        Math.floor( ipnum / 65536    ) % 256,
        Math.floor( ipnum / 256      ) % 256,
        Math.floor( ipnum            ) % 256
    ]).join('.');
};

var Colors = [ 
    'black', 'maroon', 'green', 'navy', 'olive',
    'purple', 'teal', 'lime', 'blue', 'silver',
    'gray', 'yellow', 'fuchsia', 'aqua', 'white'
];

var colors = function() { return Colors; };
var random_color = function() { return Colors[ Math.floor( Math.random() * (Colors.length-1)) ]; };

module.exports  = {
    random_color : random_color,
    colors : colors,
    random_ip : random_ip,
    chance : chance,
    variance : variance
};

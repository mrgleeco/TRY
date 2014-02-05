
_ = require('lodash');


/*
 * JS version of algo in use at MaxMind's geo-ip DB
 * works for IPv4 only
 * test:
 * integer_ip = 2921648058
 * answer: 174.36.207.186
 */

var x = function(ipnum) { 
    return _( [   
        Math.floor( ipnum / 16777216 ) % 256,
        Math.floor( ipnum / 65536    ) % 256,
        Math.floor( ipnum / 256      ) % 256,
        Math.floor( ipnum            ) % 256
    ]).join('.');
}

var gen = function() {
    return x( Math.floor(Math.random()*Math.pow(2,32)) );
}


// TEST
console.log( x(2921648058) );

// TEST
for (var i = 0; i < 10; i++ ){
    console.log(gen());
}

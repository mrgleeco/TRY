
/* DEMO: how to compress the timestamps  + values as deltas in a time series for min. storage space
 * thesis: storing absolute resolution in 5 min time buckets should keep it hidden, while revealing the 
 * full series numeric attributes
 *
 * TODO - 
 *  - benchmarks
 *  - is swapping out / in-place replacement faster or better or desired? 
 *  - make millisecond option
 *  - can we use unsigned ints & pack format?
 *
 */

var moment =  require('moment');
var _ = require('underscore');

var step = 300;
var keybase = 'hits:';
var obs = {};
var stat = {};

function main()  { 

    init_series();
    console.log('----INITIAL---- ', obs);

    deflate_series();
    console.log('----DEFLATE---- ', obs);
    inflate_series();
    console.log('----INFLATE---- ', obs);
    console.log(stat);

}

function variance(n, pct) {
    var x = Math.random();
    // half the time less, half the time more
    var nb = (x <= 0.50) ? n - (n * x * (pct || 1)) : n + (n * x * (pct || 1));
    return Math.floor(nb);
}

function init_series() { 

    // build dummy entries; ex. 1 hour of observations every 2 sec.
    var t = moment().unix();

    for (var i=0; i <= 3600; i+=2){ 

        var ct = variance(100, 0.1);    // add some vari

        t -= i;     // Marty sez go back in time

        // figure out our slot math
        var slot = Math.floor(t / step);    // absolute slot #
        var offset = t % step;              // sec. remainder 

        // get our current slot bucket 
        var ob =  obs[keybase + slot] || ( obs[keybase + slot] = [] );

        // push this observation to its slot bucket
        ob.push([offset, ct]);
    }
    stat.json_before = JSON.stringify(obs).length;
}





function deflate_series() { 
    // compaction example

    _.each(obs, function(ob,key) {

        // sort the observations by time order
        var timeSort = function(a,b) { return a[0] - b[0]; };
        ob.sort(timeSort);

        var len  = (ob.length -1);

        // use first sorted  as baseline
        var t_prev = ob[0][0];
        var n_prev = ob[0][1];

        // swap each observation as delta
        for(var i=1; i<=len; i++){ 

            var t_curr = ob[i][0];
            var n_curr = ob[i][1];

            // console.log('before: ', ob[i]);

            ob[i][0] = t_curr - t_prev;
            ob[i][1] = n_curr - n_prev;

            t_prev = t_curr;                    // save this observation for next
            n_prev = n_curr;                    // save this observation for next

            // console.log('after: ', ob[i]);
        }
    });

    stat.json_after = JSON.stringify(obs).length;
    stat.size_delta = 1 - ( stat.json_len_before / stat.json_len_after);
}



function inflate_series() {

    _.each(obs, function(ob,key) {

        // to get full timestamp, we need to parse it out of the key (wonky?)
        var base = key.match(/:(\d+)$/)[1];

        // for swap of each observation as delta
        var t_prev = base * step;       // set timestamp based on bucket
        var n_prev = 0;
        var len = (ob.length -1);

        for(var i=0; i<=len; i++){ 

            ob[i][0] += t_prev;
            ob[i][1] += n_prev;
            ob[i][2] = moment.unix( ob[i][0]).format(); // for debug 

            t_prev = ob[i][0];                    // save this observation for next
            n_prev = ob[i][1];                    // save this observation for next
        }
    });
}



main();



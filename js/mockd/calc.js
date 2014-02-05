
_ = require('lodash');
moment = require('moment');

var memo    = {};  // calculation vars
var sys     = {};   // system attrs
var incr    = {};   // counters

var m = memo;


// XXX add param to define period of number. 
// use day,hour,minute,second --as well as unix timestamps (eg. 300 )
var fill = function(attr,n){
    var e = m[attr] || (m[attr] = {});
    e.day = n;
    if ( ! e.day ) {
         e.day = e.hour = e.sec = 0;
         return;
    }
    e.hour = e.day/24;
    e.min = e.day/1440;
    e.sec = e.day/86400;
};




// date calcs - we use unix seconds and relative dates
m.days          = 3;            // generate N days data
m.days_offset   = 0;           // ending N days ago (-1 = yesterday)
m.t_now         = moment().format('X');
m.t_init        = (m.t_now - (86400 * m.days_offset)) - ( m.days * 86400);
m.t_end         = m.t_now - ( m.days_offset * 86400);
m.date_init     = moment.unix(m.t_init).format('YYYY-MM-DD HH:mm:ss');
m.date_end      = moment.unix(m.t_end).format('YYYY-MM-DD HH:mm:ss');


// application metircs -- for now think Apache
m.pv_bytes      = 1024 * 64;    // bytes per page view
m.asset_ct      = 4;            // avg # assets delivered per page (png,css,js,etc)
m.asset_byte    = 1024 * 2;     // avg bytes of asset

m.req_resp_time = 0.45;         // use 95th percentile for page delivery
m.unique_ip     = 600000;       // uniques: a browser+ip hash

// sine wave distro
m.peak_hour_gmt = 20;           // peak hour
m.peak_variance = 0.45;         // delta of min + max of traffic as sine wave
m.week_variance = 0.1;          // how much a week should move

// populate some system stuff for use later
sys.uptime_days = 12;
sys.ram         = 4 * Math.pow(1024,3); // 4GB RAM
sys.ts_start    = moment().format('X') - (86400 * sys.uptime_days);

// fill out the data for per day/hour/min/sec
// XXX - fix when #s low and per sec is sub fractional

fill('pv',100000);
fill('sessions', m.pv.day / m.unique_ip );  
fill('req', m.pv.day * m.asset_ct );
fill('req_bytes_out', (m.req.day * m.pv_bytes) + ( m.pv.day * m.asset_byte * m.asset_ct));
fill('req_bytes_in', (m.pv.day * m.pv_bytes) + ( m.pv.day * m.asset_byte * m.asset_ct));


// make calculations
//
m.req_bytes_in_avg = m.req_bytes_in.day / m.req.day;
m.req_bytes_out_avg = m.req_bytes_out.day / m.req.day;

// calc # reqs. per hour distribution

m.dist_max = (1 + m.peak_variance) * m.req.hour;
m.dist_min = (1 - m.peak_variance) * m.req.hour;
m.dist_range = m.dist_max - m.dist_min;
m.dist_step = m.peak_variance / 24;


// populate counters for baseline

incr.bytes_in   = m.req_bytes_in_avg * m.pv.day * sys.uptime_days;
incr.bytes_out  = m.req_bytes_out_avg * m.pv.day * sys.uptime_days;


// send distribution based off peak 

var hourly_avg = [];
var step = m.peak_variance / 24;
var range = m.dist_range;
var hr = m.peak_hour_gmt;
m.sum = 0;

// create hourly buckets so daily looks like sine wave.
for (var i = 0; i < 24; i++ ){
    var z = (12-i) * step;
    var val = (i <= 12) ? m.pv.hour + (z * range) : m.pv.hour - (z * range);
    val += Math.random() * m.req.min * 10;    // add some random based on 15 min. sample val
    hourly_avg[hr] = Math.floor(val);
    m.sum+= val;
    //console.log('add hr.' + hr + ' val=' + hourly_avg[hr], ' z=' + z, ' j=' + j);
    hr = (hr == 23) ? 0 : hr + 1;
}


console.log(memo);
/*
console.log(hourly_avg.length);
console.log(hourly_avg);
console.log(memo);
 */


//
// now we can finally run it!
//
var tick = m.t_init;

while(tick < m.t_end ) {
    do_hour(tick);
    tick+= 3600;
}


function do_hour(tick) { 
    // get current hour and hourly volume
    var N  = hourly_avg[ moment.unix(tick).format('H') ];
    var x = Math.random();
    // apply up to +/- 10% variance equally half the time
    N += Math.floor( ( x / 10 ) * N * ( x > 0.5 ? 1 : -1) );

    console.log(  moment.unix(tick).format('YYYY-MM-DD HH:mm:ss') + ' ' +   N );

    // get timestamp for first sec. of the hour
    var curr = {};
    curr.avg = N / 3600;
    curr.t_start = moment( moment.unix(tick).format('YYYY-MM-DD HH:00:00') ).format('X');
    curr.t_end   = moment( moment.unix(tick).format('YYYY-MM-DD HH:59:59') ).format('X');
    curr.t_at    = curr.t_start;

    // curr.dt_start  = moment( moment.unix(tick).format('YYYY-MM-DD HH:00:00') ).format('YYYY-MM-DD HH:mm:ss');
    // curr.dt_end   = moment( moment.unix(tick).format('YYYY-MM-DD HH:59:59') ).format('YYYY-MM-DD HH:mm:ss');
    console.log(curr);

    // now gen pageview per sec.
    while(curr.t_at <= curr.t_end){
        var z = Math.random();
        var ct =  Math.floor( curr.avg + ( z * curr.avg) * ( x > 0.5 ? 1 : -1) );
        while(ct > 0){
            gen_pageview(curr.t_at);
            ct--;
        }
        curr.t_at++;
    }
}

function clf_log(e) { 
    var msg = _([ e.ip, e.ts, e.method, e.uri, e.status,  e.bytes, e.ref, '"'+e.ua+'"' ]).join(' ');
    console.log( msg );
}


function gen_pageview(t) {


    // XXX - figure this out as dedicated module
    var mock = {
        ip: function() { 
            return '127.0.0.1';
        },
        ua: function() { 
            return 'Mozilla';
        },
        ref: function() { 
            return 'http://bing.com';
        },
        bytes: function() { 
            return 1024;
        },
        uri: function() {
            return '/mean/green';
        }
    };



    var clf = { 
        ts:  moment.unix(t).format('YYYY-MM-DD HH:mm:ss'),
        method: 'GET',
        status: 200,
        bytes: mock.bytes(),
        ip: mock.ip(),
        uri: mock.uri(),
        ref: mock.ref(),
        ua: mock.ua()
    };
    clf_log(clf);
    // build asset array
    // same for assets. Change uri, ref, bytes
}





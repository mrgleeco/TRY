
_ = require('lodash');
moment = require('moment');
casual = require('casual');
util = require('util');     // XXX just util.format ? 

var memo    = {};  // calculation vars
var sys     = {};   // system attrs
var incr    = {};   // counters

var meta    = {

    events : 0,
    bytes_in : 0,
    bytes_out : 0
};   // stats about this run

// shortcut
var m = memo;

    var agent_list = require('./app/apache/agent-list.json');
    var country_list = require('./app/apache/country-list.json');
    var method_list = [ 'GET', 'POST', 'HEAD' ];
    var domain_list = require('./app/apache/domain-list.json');
    var referer_list = [];

    _.each(domain_list, function(d) { referer_list.push('http://' + d + '/'); });





// date calcs - we use unix seconds and relative dates

function _init() { 



    m.days          = 3;            // generate N days data
    m.days_offset   = 0;           // ending N days ago (-1 = yesterday)
    m.t_now         = moment().format('X');
    m.t_init        = (m.t_now - (86400 * m.days_offset)) - ( m.days * 86400);
    m.t_end         = m.t_now - ( m.days_offset * 86400);
    m.date_init     = moment.unix(m.t_init).format('YYYY-MM-DD HH:mm:ss');
    m.date_end      = moment.unix(m.t_end).format('YYYY-MM-DD HH:mm:ss');


    // application metircs -- for now think Apache
    m.pageviews     = 100000;
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


    fill('pv', m.pageviews);
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
}


// send distribution based off peak 
function main() { 


    _init();
    // XXX create slope for each day by calling init_hourly again and again
    init_hourly();
    console.log(memo);
    console.log(hourly_avg);
    /*
    console.log( 'GOT domains? ' + domain_list.length );
    console.log( 'GOT agents? ' + agent_list.length );
    console.log(hourly_avg.length);
    console.log(hourly_avg);
    console.log(memo);
     */

    var tick = m.t_init;

    while(tick < m.t_end ) {
        do_hour(tick);
        tick+= 3600;
    }

    meta.actual_pv_day = meta.events / memo.days;


    console.log(meta);

}



var hourly_avg = [];
function init_hourly() { 

    var step = m.peak_variance / 24;
    var range = m.dist_range;
    var hr = m.peak_hour_gmt;
    meta.sum_est  = 0;

    // create hourly buckets so daily looks like sine wave.
    for (var i = 0; i < 24; i++ ){
        var z = (12-i) * step;
        var val = (i <= 12) ? m.pv.hour + (z * range) : m.pv.hour - (z * range);
        val += Math.random() * m.req.min * 10;    // add some random based on 15 min. sample val
        hourly_avg[hr] = Math.floor(val);
        meta.sum_est+= val;
        //console.log('add hr.' + hr + ' val=' + hourly_avg[hr], ' z=' + z, ' j=' + j);
        hr = (hr == 23) ? 0 : hr + 1;
    }
}


function do_hour(tick) { 
    // get current hour and hourly volume
    var N  = hourly_avg[ moment.unix(tick).format('H') ];
    var x = Math.random();
    // apply up to +/- 10% variance equally half the time
    N += Math.floor( ( x / 10 ) * N * ( x > 0.5 ? 1 : -1) );


    // get timestamp for first sec. of the hour
    var curr = {};
    curr.avg = parseFloat(N / 3600);
    curr.t_start = moment( moment.unix(tick).format('YYYY-MM-DD HH:00:00') ).format('X');
    curr.t_end   = moment( moment.unix(tick).format('YYYY-MM-DD HH:59:59') ).format('X');
    curr.t_at    = parseInt(curr.t_start); 
    curr.actual  = 0;
    console.log(  moment.unix(tick).format('YYYY-MM-DD HH:mm:ss') + '  est. hour count=' +   N  + ' avg/sec: ' + curr.avg );

    // curr.dt_start  = moment( moment.unix(tick).format('YYYY-MM-DD HH:00:00') ).format('YYYY-MM-DD HH:mm:ss');
    // curr.dt_end   = moment( moment.unix(tick).format('YYYY-MM-DD HH:59:59') ).format('YYYY-MM-DD HH:mm:ss');

    // now gen pageview per sec.
    var pause = 0;

    while(curr.t_at <= curr.t_end){
        var z = Math.random();
        // var ct =  Math.floor( curr.avg + ( z * curr.avg) * ( x > 0.5 ? 1 : -1) );
        var ct =  curr.avg + ( z * curr.avg) * ( x > 0.5 ? 1 : -1);
        // console.log("\t do ct=" + ct );
        // if ( ct < 1 ) { 
        // avg=10 / sec
        // 

        // 2nd rev
        /*
        var p = curr.avg;
        while(ct > 1){
            gen_pageview(curr.t_at);
            curr.actual++;
            ct--;
        }
        **/
        
        /* FIRST REV */
        if ( curr.avg < 1) { 
            var p = curr.avg;
            while(p < 1) {
                p += curr.avg;
                curr.t_at += p;
            }
            curr.t_at += parseInt(p);
            // console.log("\t adding avg; curr t_at now at " + curr.t_at +  ' revised after p=' + p );

           gen_pageview(curr.t_at);
        }else { 
           // console.log("\t RUNNING - ct=" + ct );
            while(ct > 1){
                gen_pageview(curr.t_at);
                curr.actual++;
                ct--;
            }
            curr.t_at += 1;
        }

        // curr.t_at+= curr.avg;
        // curr.t_at++;
    }
    console.log(curr);
}

function clf_log(e) { 
    var msg = _([ e.ip, e.ts, e.method, e.uri, e.status,  e.bytes, e.ref, '"'+e.ua+'"' ]).join(' ');
    console.log( msg );
}

/*
var muck new Mock('apache', { 
    avg_session_size:  3,
    avg_asset_count: 2,
});
*/


// XXX add param to define period of number. 
// use day,hour,minute,second --as well as unix timestamps (eg. 300 )
// fill out the data for per day/hour/min/sec
// XXX - fix when #s low and per sec is sub fractional
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


function chance(pct, a, b) {
    return (Math.random() <= pct) ? a : (b ? b : '');
}


// 
function variance(n, pct) {
    var x = Math.random();
    // half the time less, half the time more
    var nb = (x <= 0.50) ? n - (n * x * (pct || 1)) : n + (n * x * (pct || 1));
    return Math.floor(nb);
}



function apache_mock_event(t) {
    var ev = {
        date :  moment.unix(t).format(), // format('YYYY-MM-DD HH:mm:ss'),
        ip : casual.ip,
        referer : chance(0.8, _.sample(referer_list), '-'),
        agent : _.sample(agent_list),
        ctry : chance(0.8, 'US', _.sample(country_list)),
        uri : '/' + casual.safe_color_name,
        method : chance(0.9, 'GET', _.sample(method_list)),
        bytes : variance(1024 * 64),
        bytes_in : variance(1024),
        status : chance(0.90, 200, _.sample( [301, 302, 304, 400, 401, 404, 500, 502] ))
    };
    return ev;
}


function apache_log_line(ev) { 
    // "%h %l %u %t \"%r\" %>s %b"
    return util.format('%s - - [%s] ""%s %s" %d %s "%s" "%s"', ev.ip, ev.date, ev.method, ev.uri, ev.status, ev.bytes, ev.referer, ev.agent);

}

function gen_pageview(t) {
    // var ev = JSON.stringify(apache_mock_event(t), null, 4);
    var ev = apache_mock_event(t);
    console.log(apache_log_line(ev));
    console.log(ev);
    meta.events+= 1;
    meta.bytes_out += ev.bytes;
    meta.bytes_in  += ev.bytes_in;
}




main();



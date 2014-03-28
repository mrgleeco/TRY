
_ = require('lodash');
moment = require('moment');
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

    var xx = process.argv[2];
    process.stderr.write('using xx='+ xx + '\n');

    m.days          = 1;            // generate N days data
    m.days_offset   = xx || 0;           // ending N days ago (-1 = yesterday)
    m.t_now         = moment().format('X');
    m.t_init        = (m.t_now - (86400 * m.days_offset)) - ( m.days * 86400);
    m.t_end         = m.t_now - ( m.days_offset * 86400);
    m.date_init     = moment.unix(m.t_init).format('YYYY-MM-DD HH:mm:ss');
    m.date_end      = moment.unix(m.t_end).format('YYYY-MM-DD HH:mm:ss');


    // application metircs -- for now think Apache
    m.pageviews     = 800;
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

var EVENTS = [];

// send distribution based off peak
function main() {


    _init();
    // XXX create slope for each day by calling init_hourly again and again
    init_hourly();
    // console.log(memo);
    // console.log(hourly_avg);
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

    process.stdout.write( JSON.stringify( { data : EVENTS } ));

    process.stderr.write( JSON.stringify(meta));
    // console.log(meta);

    // console.log(meta);

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
    // console.log(  moment.unix(tick).format('YYYY-MM-DD HH:mm:ss') + '  est. hour count=' +   N  + ' avg/sec: ' + curr.avg );

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
    // console.log(curr);
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

function apache_mock_event(t) {
    var ev = {
        'timestamp' :  moment.unix(t).format(), // format('YYYY-MM-DD HH:mm:ss'),
        client_ip : random_ip(),
        referer : chance(0.8, _.sample(referer_list), '-'),
        user_agent : _.sample(agent_list),
        ctry : chance(0.8, 'US', _.sample(country_list)),
        url : '/' + random_color(),
        verb : chance(0.95, 'GET', _.sample(method_list)),
        bytes : variance(1024 * 64),
        // bytes_in : variance(1024),
        response : chance(0.90, 200, _.sample( [301, 302, 304, 400, 401, 404, 500, 502] )),
        version : '1.1',
        ident: '-',
        auth : '-',
        '@source_host' : 'www.jut.io',
    };
    ev.message = apache_log_line(ev);
    return ev;
}

/*
               "bytes" : 0,
               "client_os" : "Windows 7",
               "client_browser" : "Chrome 29",
               "auth" : "-",
               "verb" : "GET",
               "url" : "/js/4b9a88e2.app.js",
               "referer" : "http://jut.io/",
               "clientip" : "24.130.174.243",
               "@timestamp" : "2013-09-18T07:42:26.000Z",
               "version" : "1.1",
               "response" : "200",
               "user_agent" : "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.66 Safari/537.36",
               "url_filename" : "",
               "ident" : "-",
               "message" : "24.130.174.243 - - [Wed, 18 Sep 2013 07:42:26 GMT] \"GET /js/4b9a88e2.app.js HTTP/1.1\" 200 - \"http://jut.io/\" \"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.66 Safari/537.36\"",
               "@version" : 1,
               "@source_host" : "www.jut.io"
*/


function apache_log_line(ev) {
    // "%h %l %u %t \"%r\" %>s %b"
    return util.format('%s - - [%s] ""%s %s" %d %s "%s" "%s"', ev.client_ip, ev['timestamp'], ev.verb , ev.url, ev.response , ev.bytes, ev.referer, ev.user_agent);

}

function gen_pageview(t) {
    // var ev = JSON.stringify(apache_mock_event(t), null, 4);
    var ev = apache_mock_event(t);
    // console.log('LOG^' + apache_log_line(ev));
    // console.log(JSON.stringify(ev) + ',');
    EVENTS.push(ev);
    meta.events+= 1;
    meta.bytes_out += ev.bytes;
    meta.bytes_in  += ev.bytes_in;
}




main();



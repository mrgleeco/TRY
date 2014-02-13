
_ = require('underscore');
moment = require('moment');
mock = require('mock-tools');


// TODO - get rid of casual - only used for IP and URI (color name) -- we can do that w/o it.

var DEFAULT = { 

    days : 0,
    hours : 1,
    pageviews : 5000,       // per day
    unique_ip : 1000,       // per day

    peak_hour_gmt : 20,
    peak_variance : 0.45,
    week_variance : 0.1,

    pv_bytes : 1024 * 10,
    pv_bytes_in : 1024,

    asset_ct : 0,
    asset_byte : 1024,
};

var Status = [301, 302, 304, 400, 401, 404, 500, 502];
var Method = [ 'GET', 'POST', 'HEAD' ];

var Agent =require('./app/apache/agent-list.json');
var Country = require('./app/apache/country-list.json');
var domain_list = require('./app/apache/domain-list.json');
var Referer = [];
_.each(domain_list, function(d) { Referer.push('http://' + d + '/'); });
var Uri = [];
_.each( ['blue', 'red', 'green'], function(str){ Uri.push('/'+str); });


var MockApache = function MockApache(cfg)  { 
    this.cfg = _.extend(cfg, DEFAULT);
    this.memo = {
        t_now : moment().format('X'),
        t_init : (m.t_now - (86400 * m.days_offset)) - ( m.days * 86400),
        t_end : m.t_now - ( m.days_offset * 86400),
        date_init : moment.unix(m.t_init).format('YYYY-MM-DD HH:mm:ss'),
        date_end : moment.unix(m.t_end).format('YYYY-MM-DD HH:mm:ss'),
        req_bytes_in_avg : cfg.pv_bytes / cfg.pageviews,
        req_bytes_out_avg : cfg.pv_bytes_in / cfg.pageviews,
    };
};


var mock_event = function(t) { 
    return {
        timestamp : t,
        date :  moment.unix(t).format(), // format('YYYY-MM-DD HH:mm:ss'),
        ip : mock.random_ip(),
        referer : mock.chance(0.8, _.sample(Referer), '-'),
        agent : mock.chance(0.1, '-', (Agent)),
        ctry : mock.chance(0.8, 'US', _.sample(Country)),
        uri : mock.chance(0.1, '/', Uri ),
        method : mock.chance(0.9, 'GET', _.sample(Method)),
        bytes : mock.variance(this.cfg.pv_bytes),
        bytes_in : mock.variance(this.cfg.pv_bytes_in),
        status : mock.chance(0.90, 200, _.sample(Status))
    };
};

MockApache.prototype = { 
    mock_event : mock_event


};

module.exports = MockApache;

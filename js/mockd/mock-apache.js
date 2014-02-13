
var _ = require('underscore');
var moment = require('moment');
var mock = require('./mock-tools');


//
// XXX - do more cool sessioning stuff based on params.
// XXX - mock event may want to return more than one event;
//
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

var Referer = [];
var domain_list = require('./app/apache/domain-list.json');
_.each(domain_list, function(d) { Referer.push('http://' + d + '/'); });

var Uri = [];
_.each( mock.colors(), function(str){ Uri.push('/'+str); });

var init  = function(cfg) {
    this.cfg = _.extend(cfg || {}, DEFAULT);
};


var event = function(t) {
    return {
        timestamp : t,
        date :  moment.unix(t).format(), // format('YYYY-MM-DD HH:mm:ss'),
        ip : mock.random_ip(),
        referer : mock.chance(0.8, _.sample(Referer), '-'),
        agent : mock.chance(0.1, '-', _.sample(Agent)),
        ctry : mock.chance(0.8, 'US', _.sample(Country)),
        uri : mock.chance(0.2, '/', _.sample(Uri)),
        method : mock.chance(0.95, 'GET', _.sample(Method)),
        bytes : mock.variance(this.cfg.pv_bytes),
        bytes_in : mock.variance(this.cfg.pv_bytes_in),
        status : mock.chance(0.90, 200, _.sample(Status))
    };
};

module.exports = { 
    init : init,
    event : event
};

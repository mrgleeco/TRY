

/*
 *
 * TRY: flatten out a keyspace:
 * why? we want a flat representation -possibly even stringified or serialized for (much) later decomposition.
 *
 *
 */

var _ = require('lodash');

var input = [];

input.push({ 
    t : Date.now()/1000,
    v : 1024, // bytes
    k : 'quota_full',
    tags: {
        host : 'ss101',
        colo : 'sjc'
    }
});

input.push({ 
    t : Date.now()/1000,
    v : 1,
    k : 'root_logins',
    users : [ 'alice', 'bob' ]
});


input.push({ 
    t : Date.now()/1000,
    v : 1,
    k : 'remote_conns',
    tags: {
        host : 'ss101',
        colo : 'sjc'
    },
    users : [ 'alice', 'bob' ]
});

input.push({
    k : 'apache_log',
    v : 1,
    t : Date.now()/1000,
   "bytes" : 16957,
   "version" : 1.1,
   "user_agent" : "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)",
   "ctry" : "US",
   "verb" : "GET",
   "url" : "/yellow",
   "@source_host" : "github..com",
   "referer" : "-"
});

// 
//

var flatten = function(e,ok) { 
    if (! e.t || !e.k.length) return;
    var fail = false;
    ok = ok || { attrs: [] };
    _.map( [ 't', 'v', 'k' ], function(id) { 
        ok[id] = e[id];
        delete e[id];
    });
    _.map(e, function(x,k) { 
        if (_.isArray(x)) { 
            _.map(x, function(y) {
                ok.attrs.push(k+'='+y);
            });
        }else if (_.isObject(x)) { 
            _.map(x, function(y,kx) { 
                ok.attrs.push(k+'.'+kx+'='+y);
            });
        }else if (typeof x === 'string'){ 
            ok.attrs.push(k+'='+x);
        }
    });
    return ok;
};

_.map(input, function(e){ 
    console.log( flatten(e));
});

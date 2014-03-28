


// from https://github.com/mranney/node_redis

var fs = require('fs');
var redis = require('redis');
var Shavaluator = require('redis-evalsha');

var _ = require('underscore');
var client = redis.createClient();
var shredis = new Shavaluator(client);

shredis.add('luaget', "return redis.call('GET', KEYS[1])");
shredis.add('echo', 'return ARGV[1]');

var parse = function(err, res){
    if (res){ 
        console.log('eval result:', res);

    }else{
        console.log('eval fail', err);
    }
};
// load in some lua scripts
var lua_op  = {};
var data = fs.readFileSync('./atoms.lua', { encoding: 'utf-8'} );
_.each( data.split('<<END'), function(str){
    // console.log('SdtRING' +str);
    // var cap = str.match(/function (\w+).*?\n([\S\s*])end/m);
    var cap = str.match(/function (\w+).*?\n([\S\s]+)\bend\b/m);
    // console.log('CAP' ,cap);
    if (! cap ) return;
    lua_op[cap[1]] = cap[2];
    lua_op[cap[1]] = cap[2];
    var k = cap[1], v = cap[2];
    // shredis.add( { k : v } );
});

// shredis.add(lua_op);
// console.log(lua_op);
client.set('xxxx', 'some naughty string val', redis.print);


shredis.exec('echo', [], ['hoot sez owl'],  parse);
shredis.exec('luaget', ['xxxx'], [], parse);
setTimeout(function() {
    client.quit();

}, 1500);

/*
client.rpush('arrayz', 'foo', 'bar', 'baz', redis.print);
shredis.exec('list_pop','arrayz', 1, function(err, res){
    if (res){ 
        console.log('eval result', res);

    }else{
        console.log('eval fail', err);
    }
});



*/

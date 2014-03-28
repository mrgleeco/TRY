

// from https://github.com/mranney/node_redis

var fs = require('fs');
var redis = require('redis');
var _ = require('underscore');
var client = redis.createClient();

// load in some lua scripts
var data = fs.readFileSync('./atoms.lua', { encoding: 'utf-8'} );
var lua_ops = {};
_.each( data.split('<<END'), function(str){
    // console.log('SdtRING' +str);
    // var cap = str.match(/function (\w+).*?\n([\S\s*])end/m);
    var cap = str.match(/function (\w+).*?\n([\S\s]+)\bend\b/m);
    // console.log('CAP' ,cap);
    if (! cap ) return;
    lua_ops[cap[1]] = cap[2];
});

// console.log(data);
console.log(lua_ops);



// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

client.on('error', function (err) {
    console.log('Error ' + err);
});

client.lpush('arrayz', 1024, redis.print);
client.set('string key', 'string val', redis.print);
client.hset('hash key', 'hashtest 1', 'some value', redis.print);
client.hset(['hash key', 'hashtest 2', 'some other value'], redis.print);
client.hkeys('hash key', function (err, replies) {
    console.log(replies.length + ' replies:');
    replies.forEach(function (reply, i) {
        console.log('    ' + i + ': ' + reply);
    });
    // client.quit();
});

client.eval('list_pop', lua_ops.list_pop, 'arrayz', function(err, res){ 
    if (res){ 
        console.log('eval result', res);

    }else{

        console.log('eval fail', err);
    }

});




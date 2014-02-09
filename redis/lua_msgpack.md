from: http://gists.fritzy.io/2013/11/06/store-json-as-msgpack

Redis Lua: Store JSON as MessagePack and Retrieve MessagePack as JSON

JSON is nearly universal in the web world, and Redis Lua scripting supports encoding and decoding it, which can be very useful for having advanced logic based on JSON values without having to fully normalize your database. Redis Lua scripting also has bindings to MessagePack, which is a structurally compatible format that is much, much more condensed. Since we have bindings to both, we can potentially save space, but keep the familiar JSON payload on the client side; why not have the best of both worlds?

    --EVAL 'this script' 1 some-key
    local key = KEYS[1];
    local value = redis.call('GET', key);
    local jvalue = cjson.encode(cmsgpack.unpack(value));
    return jvalue;


    --EVAL 'this script' 1 some-key '{"some": "json"}'
    local key = KEYS[1];
    local value = ARGV[1];
    local mvalue = cmsgpack.pack(cjson.decode(value));
    return redis.call('SET', key, mvalue);

    > EVAL "[the set script]" 1 testkey '{"hello": true}'
    OK

example: 

> GET testkey
"\x81\xa5hello\xc3"

> EVAL "[the get script]" 1 testkey
'{"hello":true}'

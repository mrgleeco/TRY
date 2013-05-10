


-- local conf = require("conf")

local util = require("util")
-- local common = require("common")
-- local web = require("web")
-- local memcached = require("memcached")
-- local cache_table = require("cache_table")
-- local DEBUG = conf.DEBUG or false
--
local ip = require("ip")
local json = require("cjson")

local json_encode   = json.encode
local json_decode   = json.decode


local Example = {};

Example.A = function(string)
    print(string)
end

Example.B = function(x,y)
    x,y = x or 0, y or 0
    local z = ( x > y ) and x or y
    print(( x > y ) and x or y )
    -- print(z)
end


Example.C = function(x)
    local e = {
        ['foo']     = function() print('\tfoo says ' .. x) end,
        ['bar']     = function() print('\tbar says ' .. x) end,
    }
    for k,v in pairs(e) do
        print('got k=' .. k)
        v()
    end
end



local sorted = {} 
for k in pairs(Example) do table.insert(sorted, k) end
table.sort(sorted)
for i,k in ipairs(sorted) do 
    print('--Example.'..k)
    Example[k](1,2,3);
end

--Example.A('hello')
--Example.B(20,21)
--Example.C('cc')

--simple funciton on array
function foo()
    -- ARRAY
    local e = {};
    for index = 1,10 do
        e[index] = index    -- 5
        -- e[index] = index .. 'a' -- 5a
        -- e[index] = { 'foo', 'bar'} -- adds another ["foo","bar"]
        -- e[index] = { ['foo'] = 'bar'} -- adds another {"foo","bar"}
    end
    local j = json_encode(e)
    print(j)
end




function foo1()
    -- HASH
    local e = {
        ['a']  = true,
        ['b']  = false,
        ['c']  = -1,
        ['d']  = 0.9, -- 
        ['e']  = 'deeee',
        ['baz']  = nil, -- this will get omitted
    }
    local j = json_encode(e)
    print(j)
end


function foo0()
    print('hello')
end



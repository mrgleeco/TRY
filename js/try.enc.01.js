
var lzwa = require('lzw-async');
var lzw = require('lzw');


var _  = require('underscore');

var input = [];
var last = 0;
_.map( _.range(100), function(i) {
    var n = Math.floor( Math.random(i) * 1000);
    // input.push([n, n - last]);
    input.push([n - last]);
    last = n;
});

var str = input.join(',');
var enc = new Buffer(input).toString('base64');
// var dec =   new Buffer(out, 'base64').toString('base64',0,out.length);
var dec =   new Buffer(enc,'base64');


var lzw_enc = lzw.compress(str);
var lzw_dec =  new Buffer(enc, 'base64');      // new Buffer(enc).toString('base64');


/*
lzwa.compress({
        input : input.join(','),
        output : function(output) {
                    console.log('output', output);
                },
        dict: '0123456789,.'
});
*/


console.log('str', str.length, str);
console.log('enc', enc.length, enc);
console.log('dec', dec.length, dec);

var buf = new Buffer(enc.length);
for (var i = 0; i < enc.length ; i++) {
  buf[i] = enc.charCodeAt(i);
}

console.log(buf);



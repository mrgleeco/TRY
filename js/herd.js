var events = require('events');
var net = require('net');
var fs = require('fs');

var makeServer = function(path, hdl) { 
    // XXX path needs to NOT EXIST at this point
    if ( fs.existsSync(path) ) {
        fs.unlinkSync(path);
    }

    hdl = (hdl || {});
    hdl._noop_ = function() { return 'unsupported command' };

    var server = net.createServer(function(c) { //'connection' listener
      console.log('server connected');
      c.on('end', function() {
        console.log('server disconnected');
      });
      c.on('data', function(data) {

        var cmd = data.toString().match(/^(\w+)/)[0];

        c.write( cmd && hdl[cmd] ? hdl[cmd]() :  hdl._noop_() );
        c.write('\r\n');

        console.log(cmd, '\tgot some data', data.toString());
      });

      // c.pipe(c);
    });
    server.listen(path, function() { //'listening' listener
      console.log('server bound at', path);
    });
    return server;

}
function Herd(opt) {
    opt = (opt || {});

    this.install = function (k, cb) {
        this.removeAllListeners(k);
        this.on(k, cb);
    }
    this.on('moo', function(e) { console.log('says cow'); } );
    this.on('status', function() { console.log('status=OK', arguments); } );
    this.on('info', function(e) { console.log('info...'); } );
    this.on('shutdown', function(e) { console.log('want to die'); } );
    this.on('stats', function(e) { 
        console.log( { 
            mem : process.memoryUsage(),
            cwd : process.cwd(),
        })
     });
    this.hdl = { 
        info : function() { return JSON.stringify( [ 1,2,3 ] ); },
        status : function() { return 'OK' },
        health : function() { return 'green' },
        stats : function() { return JSON.stringify({ mem : process.memoryUsage() }) }
    };

    this.server = makeServer(opt.file || './my.sock', this.hdl);

}
Herd.prototype = new events.EventEmitter();
module.exports = Herd;


/*
var sys = require('sys'),
    events = require('events');

function Herd() {
    if(false === (this instanceof Herd)) {
        return new Herd();
    }
    events.EventEmitter.call(this);
}

Herd.prototype.mo(
sys.inherits(Herd, events.EventEmitter);

module.exports = Herd;
*/



/*
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Herd = function Herd() { }
util.inherits(Herd, EventEmitter);

Herd.prototype.on = function('status', function() { 

    var e = { 
        mem : process.memoryUsage(),
        mask: process.umask(),
        uptime: process.uptime(),
        //argv: process.argv,
        //env: process.env,
        cwd: process.cwd(),
        title: process.title,
        pid: process.pid,
        time: Date.now()
    };

    console.log(e);
});


module.exports = Herd;
*/

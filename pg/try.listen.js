var pg = require ('pg');

var pgConString = "postgres://localhost:5432/demoz";

pg.connect(pgConString, function(err, client) {

    if(err) {
      console.log(err);
    }

    client.on('notification', function(msg) {
        console.log(msg);
    });

    console.log('no error; startup listening...');
    // var query = client.query("LISTEN owl_trigger");
    //
    var query = client.query("LISTEN owl",function(err,msg) {
        if (err) { 
            console.log('got error', err);
            return;
        }
        console.log('yo msg?', msg);
    
    });
});

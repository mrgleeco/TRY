
_ = require('lodash');
fs = require('fs');


/*
 * Browser User agent file load in.
 * using a TSV file; only want the string 
 */


var UA = [];

var init = function(file) { 
    
    if (! fs.existsSync(file)){
          throw new Error('failed --no such file: ' + file);
    }
    var data = fs.readFileSync(file, 'utf8');
    if (! data) {
          throw new Error('failed without data');
    }
    _.each(data.split("\n"), function(line) { 
        var arr = line.split("\t");
        // UA.push( line.split("\t")[1] );
        // arr elems:  rank, ua_string, OS, Browser, total_ip_addrs 
        if (arr.length > 2){ 
            UA.push( arr[1] );
        }
        /* */
    });
    // console.log('got ua? ', UA);
};

init('user_agents.tsv');

var gen = function() {
    return UA[ Math.floor(Math.random()*(UA.length - 1)) ];
}


// TEST
for (var i = 0; i < 5; i++ ){
    console.log(gen());
}

function randAgent() { 

};



module.exports = randAgent;

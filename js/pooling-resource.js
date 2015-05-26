var _ = require('underscore');
var Promise = require('bluebird');
var Backbone = require('backbone');
var EventEmitter = require('events').EventEmitter;
var uuid = require('uuid');
var util = require('util');
var fse = Promise.promisifyAll(require('fs-extra'));
var dataObjParser = require('dataobject-parser');

var Logger = require('./logger');
var logger = Logger.get('pool-resource');

// XXX decide which naming works best and standardize
var POOL_ENUM =  {
    FREE: 'FREE',
    UNLOCK: 'FREE',
    LOCK: 'INUSE',
    INUSE: 'INUSE',
    ERROR: 'ERROR'
};

var POOL_EVENTS = {
    add: 'add',
    purge: 'purge',
    change: 'change',
};

// item is a *very* basic model -- we want to allow whatever
// callers of the pool may want.  What we DO want is to
// keep meta -- metadata about the state of the item
var Item = Backbone.Model.extend({
    idAttribute: '_ID',
    initialize: function(attr, opts) {
        this.META = _.extend({
            recycle_ct: 0,
            status: POOL_ENUM.FREE,
            ctime: Date.now(),
            etime: Date.now(),
        }, opts.meta);
    }
});

// a verbose development trace debugger
var D = function() { };

function traceDebug(on) {
    D = on ?
        function() { logger.info.apply(null, arguments); }:
        function() { };
}


function ResourcePool (opt, collection) {
    EventEmitter.call(this);

    var self = this;
    opt = opt || {};

    // dev utility
    traceDebug(opt.traceDebug);

    this.resourcePool = new Backbone.Collection();
    // XXX - multiple instances / writers sanity
    this.ID = uuid.v4().substring(0,8);

    this.enum = POOL_ENUM;
    this.event_type = POOL_EVENTS;
    this.conf = {
        file: opt.file,
        max_age: opt.max_age || 0,
        poll_interval: opt.poll_interval || 0,
        min_spare: opt.min_spare || 0,
        save_delay: opt.save_delay || 50,
    };

    // prime collection by a.) argument or b.) by file
    if (!collection && this.conf.file && !opt.ignore_file) {
        try {
            fse.ensureFileSync(self.conf.file);
            collection = fse.readJSONSync(self.conf.file, {throws: false});
        }
        catch (err) {
            logger.warn(this.conf.file, 'error loading', err);
        }
    }

    if (collection) {
        // XXX any additional checks here?
        _(collection).each(function(item) {
            self.resourcePool.add( new Item(_.omit(item, 'meta'), { meta: item.META }));
        });
    }

    if (this.conf.file) {
        this.resourcePool.on('change add remove reset', this.saveChanges, this);
    }

    if (this.conf.poll_interval && this.conf.max_age) {
        self._check = setTimeout(function() { self.reap(); }, self.conf.poll_interval);
    }

    logger.info(this.ID, 'initializd pool:', {
        items: this.resourcePool.length,
        conf: this.conf
    });

    return this;
}

util.inherits(ResourcePool, EventEmitter);


ResourcePool.prototype.saveChanges = function () {
    if (!this.conf) {
        // XXX called in death scenario before the timer has died.
        return;
    }
    var self = this;
    if (self._writing) {
        self._pending = true;
        return;
    }
    self._writing = true;

    // start with a delay to reduce write storm
    Promise.delay(10)
    .then(function() {
        logger.info('saveChanges STARTS; copying map to disk');
        return fse.writeJsonAsync(self.conf.file, self.showAll());
    })
    .then(function() {
        D(self.ID, 'saved changes to', self.conf.file);
    })
    .catch(function(err) {
        logger.warn('failed to save changes to', self.conf.file, err.message);
    })
    .finally(function() {
       delete self._writing;
        if (self._pending) {
            delete self._pending;
            self.saveChanges();
        }
    });
};

ResourcePool.prototype.showAll = function () {
    var self = this;
    return self.resourcePool.map(function(item) {
        return self.findItem({ _ID: item.get('_ID') });
    });
};

// XXX for testing, but bigger issue if more than one instance uses the file MO
ResourcePool.prototype.done = function () {
    if (this._check ) {
        clearInterval(this._check);
    }
    var self = this;
    _.map(_(this.event_type).values, function(ev) {
        D('done is removing all listeners ev:', ev);
        self.removeAllListeners(ev);
    });
};

// reap FREE items older than our defined stale time
ResourcePool.prototype.reap = function () {
    var self = this;
    if (!self.conf && !self.conf.max_age) {
        // XXX sincere way to detect we may be lingering out of scope?
        return;
    }
    var stale_time = Date.now() - self.conf.max_age;
    var staleItems = self.resourcePool.filter(function(item) {
        if (item.META.status === self.enum.ERROR) {
            // XXX - this might get obnoxious
            // logger.warn('reap detected error', item.attributes);
        }
        return item.META.status === self.enum.FREE && stale_time > item.META.etime;
    });

    D('reap check', {
        size: self.currentSize(),
        min_spare: self.conf.min_spare,
        stale: staleItems.length
    });

    var found_ct = staleItems.length;
    if (found_ct > self.conf.min_spare) {
        var max = found_ct - self.conf.min_spare;
        logger.info('removing stale items; ', {
            found_ct: found_ct, min_spare: self.conf.min_spare, remains: found_ct - max
        });

        // remove all at once for file writer's sake
        var removed = self.resourcePool.remove(staleItems.splice(0, max));
        _(removed).each(function(item) {
            self.emit('purge', self.itemProps(item));
        });
    }
    self._check = setTimeout(function() { self.reap(); }, self.conf.poll_interval);
};

// XXX name disconnect?
ResourcePool.prototype.blockItem = function (e, info) {
    return this._recycleItem(e, info, POOL_ENUM.ERROR);
};


ResourcePool.prototype.lockItem = function (e, info) {
    return this._recycleItem(e, info, POOL_ENUM.LOCK);
};

ResourcePool.prototype.unlockItem = function (e, info) {
    return this._recycleItem(e, info, POOL_ENUM.UNLOCK);
};

ResourcePool.prototype.currentSize = function () {
    return this.resourcePool.length;
};

ResourcePool.prototype.filterItems = function (filter, opts) {
    return this.findItem(filter, _.extend({ wantArray: true }, opts));
};


ResourcePool.prototype.findFreeItem = function (filter, opts) {
    return this.findItem(_.extend({}, filter, {META: { status: POOL_ENUM.FREE }}), opts);
};

// our std. return unit
ResourcePool.prototype.itemProps = function (model) {
        return model && model instanceof Item ?
            _.extend({}, _.clone(model.attributes), { META: _.clone(model.META) }) :
            undefined;
};

/* XXX
ResourcePool.prototype.findByMeta = function (filter, opt) {
};
*/

ResourcePool.prototype.findItem = function (filter, opt) {
    var self = this;
    filter = (filter || {});
    // disallow without filter on attributes
    if (! filter || _.isEmpty(filter)) {
        return;
    }
    else if (_.size(filter) === 1 && filter.META) {
        return;
    }
    opt = (opt || {});

    var flatFilter = dataObjParser.untranspose(filter);

    // XXX non-trivial amount of work. We tolerate slow here b/c
    // we want to support nested filters across std. attributes *and* META
    var found = this.resourcePool.chain()
        .filter(function(m) {
            return _.isMatch(dataObjParser.untranspose(self.itemProps(m)), flatFilter);
        })
        .value();

    if (!found.length) {
        return;
    }
    else if (opt.wantArray) {
        return _.map(found, function(m) {
            return opt.wantModel ? m : self.itemProps(m);
        });
    }
    else {
        // XXX LRU check?
        var item = found[0];
        D( 'findItem found ct=' + found.length + ' ', JSON.stringify({filter: filter, opt: opt}));
        D('FOUND>>', JSON.stringify(self.itemProps(item)));
        return opt.wantModel ? item : self.itemProps(item);
    }
};


ResourcePool.prototype.addItem = function (item, isFree) {
    D('addItem START; filer', JSON.stringify(item));
    if (item._ID) {
        var found = this.findItem(item);
        if (found._ID === item._ID) {
            logger.warn('found existing item; cannot add duplicate of ', item, 'found:', found);
            return;
        }
    }
    var meta = {
        status: isFree ? this.enum.FREE : this.enum.LOCK
    };
    var newItem = this.resourcePool.add(
        new Item(_.extend({ _ID: uuid.v4() }, item), { meta: meta })
    );
    D('ADD>>', newItem.id, item, meta);
    var res = this.findItem( { _ID: newItem.get('_ID') });
    this.emit(this.event_type.add, res);
    return res;
};


ResourcePool.prototype.purgeItem = function (item) {
    var found = this.findItem(item, { wantModel: true });
    if (!found) {
        logger.warn('failed to find item to purge', item);
        return;
    }
    var res = this.itemProps(this.resourcePool.remove(found));
    this.emit( this.event_type.purge, res);
    return res;
};


ResourcePool.prototype._recycleItem = function (item, new_props, status) {
    // D('RECYCLE...', status, item, new_props);

    var found = this.findItem(item, {wantModel: true});
    if (!found) {
        logger.warn('unable to recycle item', item);
        return;
    }
    found.set(new_props);
    found.META.status = status;
    found.META.etime = Date.now();
    found.META.recycle_ct += 1;
    var res = this.findItem({ _ID: found.get('_ID') });
    // XXX since meta is outside attributes, force the save
    this.resourcePool.trigger('change');
    this.emit(this.event_type.change, res);
    return res;
};

module.exports = ResourcePool;

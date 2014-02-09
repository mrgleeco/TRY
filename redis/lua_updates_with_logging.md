from: http://gists.fritzy.io/2013/11/11/redis-update-and-notify

Redis Lua: Updating a Key and Publishing a Logged Notification

One of the cool things about Redis Lua scripting is the ability to publish notifications of your changes atomically with those changes made. There’s actually a new Redis feature that can do this for you if configured: keyspace notifications. But maybe you want to send out a single notification from a script that does several things, and this keeps a log of notifications.

    --2 key changelog update millisecond-epoch
    local key, changelog = unpack(KEYS);
    local update, epoch = unpack(ARGV);
     
    local result = redis.call('SET', key, update);
     
    local notice = cjson.encode({key = key, value = update, time = epoch});
     
    redis.call('ZADD', changelog, epoch, notice);
    redis.call('ZREMRANGEBYSCORE', changelog, '-inf', epoch - 86400000);
     
    redis.call('PUBLISH', changelog, notice);
     
    return result;

You could also use an iterator id so that clients can make sure they’ve received every notification.

P.S. I’ve been busy today, but I’d like these to be happening every work day, regardless of whether I go to work or not, so here’s a late-day entry.

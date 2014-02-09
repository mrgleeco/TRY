Redis Lua: Storing and Checking Hashed Passwords

See the update at the bottom: this approach isn’t secure (but I still think it’s interesting).

Storing passwords in plain text is bad. Time and time again, databases get hacked and passwords get leaked. Hashing a password creates a consistent string from a password that you can store, but isn’t the password, and isn’t easily reversed. Reversing a hash is difficult, and typically done with brute force if the hashing algorthim is fairly secure.

People end up creating giant lookup tables called “rainbow tables” of every possible string combination up to a certain number of characters in order to quickly reverse hashes. The best defense against this is to hash something larger than a typical password because it takes exponential time to create a rainbow table for each additional character. We do this with dynamic and static salts. Salts are used to add length to the password string before hashing. A static salt is global across the application, and a dynamic salt is unique for each user.

Awhile back ago, @antirez accepted a pull request for redis.sha1hex() in Redis’s EVAL scripts. This gives us a great way to store and check hashed passwords.

    --EVAL "this script" 1 key userid password
    local key = KEYS[1];
    local userid, pass = unpack(ARGV);
     
    local hash = redis.sha1hex('SOME-STATIC-SALT'..string.sub(pass, 1, 2)..userid..string.sub(pass, 3));
     
    --no error, does hash match?
    return {false, (redis.call('GET', key) == hash)}

and then: 

    --EVAL "this script" 1 key userid password
    local key = KEYS[1];
    local userid, pass = unpack(ARGV);
    if (#pass < 8) then
        --bytes, actually
        return {"Password must be at least 8 characters."}
    end
     
    local hash = redis.sha1hex('SOME-STATIC-SALT'..string.sub(pass, 1, 2)..userid..string.sub(pass, 3));
    redis.call('SET', key, hash);
     
    --no error
    return {false};
    view rawsetpassword.lua hosted with ❤ by GitHub
    > EVAL "setpassword script" 1 testpass bob "hi"
    "Password must be at least 8 characters."

    > EVAL "setpassword script" 1 testpass bob "hi there"
    (nil)

    > EVAL "checkpassword script" 1 testpass bob "hi there"
    1) (nil)
    2) (integer) 1

    > EVAL "checkpassword script" 1 testpass bob "wrong password"
    1) (nil)
    2) (nil)


There are a few things to note here.

The schema for creating your pre-hashed string isn’t important except that you need to be consistent.
We could use anything as the dynamic salt, like the user’s phone number, but you’d have to get the user’s password and re-generate the hash everytime this information is changed.
I’m using an error-first return pattern for these scripts. The first argument is falsey if there is no error, and a string if there is an error. This is a common JavaScript pattern, and useful in Redis Lua scripts.
The password length check is actually counting bytes.
Update:

Again, Pierre Chapuis @pchapuis has some good feedback. He references http://codahale.com/how-to-safely-store-a-password/ which argues against using typical hashing algorithms for hashing. Since someone who has your redis db also has your Lua scripts, the salts are rather available to the cracker, even the dynamic ones.

We can easily argue that bcrypt/scrypt is the better way to go. Unfortunately, it’s not available in Redis, but that’s not a terribly valid reason to discount it.

This approach is much better than nothing, but perhaps outdated.

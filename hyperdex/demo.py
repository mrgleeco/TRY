import hyperclient

c = ('127.0.0.1', 1982)

c.add_space('''
    space phonebook
    key username
    attributes first, last, int phone
    subspace first, last, phone
    create 8 partitions
    tolerate 2 failures
    ''')

c.put('phonebook', 'jsmith1', {'first': 'John', 'last': 'Smith', 'phone': 6075551024})
c.put('phonebook', 'jd', {'first': 'John', 'last': 'Doe', 'phone': 6075557878})

# search 
[x for x in c.search('phonebook', {'last': 'Smith'})]

# delete rec
c.delete('phonebook', 'jd')

# update rec
c.put('phonebook', 'jsmith1', {'phone': 6075552048})

# range queries
[x for x in c.search('phonebook', {'last': 'Smith', 'phone': (6070000000, 6080000000)})]
[x for x in c.search('phonebook', {'first': ('Jack', 'Joseph')})]

# delete space
c.rm_space('phonebook')


 ### NEXT EXAMPLE
import hyperclient
c = ('127.0.0.1', 1982)
c.add_space('''
    space profiles
     key username
     attributes
        string first,
        string last,
        int profile_views,
        list(string) pending_requests,
        set(string) hobbies,
        map(string, string) unread_messages,
        map(string, int) upvotes
     subspace first, last
     subspace profile_views
     ''')
c.put('profiles', 'jsmith1', {'first': 'John', 'last': 'Smith'})
c.get('profiles', 'jsmith1')
 
# HyperDex knows nothing about encodings, so it is up to the application to encode or decode data appropriately
# data is byte string, you must encode yourself; eg.
c.put('profiles', 'jsmith1', {'first': u'Jóhn'.encode('utf8')})

# This encodes the string to raw bytes using UTF-8. When fetching his profile it is necessary to decode the UTF-8:
c.get('profiles', 'jsmith1')['first']


# HyperDex supports a full range of basic operations including 
#   atomic_add(), 
#   atomic_sub(), 
#   atomic_mul(), 
#   atomic_div(), 
#   atomic_mod(), 
#   atomic_and(), 
#   atomic_or(), 
#   atomic_xor().

# List operations

c.list_rpush('profiles', 'jsmith1', {'pending_requests': 'bjones1'})

# Sets 
# set_add()
# set_remove()
# set_union()
# set_intersect()
hobbies = set(['hockey', 'basket weaving', 'hacking', 'air guitar rocking'])
c.set_union('profiles', 'jsmith1', {'hobbies': hobbies})
c.set_add('profiles', 'jsmith1', {'hobbies': 'gaming'})
c.get('profiles', 'jsmith1')['hobbies']

c.set_intersect('profiles', 'jsmith1',{'hobbies': set(['hacking', 'programming'])})  // True
c.get('profiles', 'jsmith1')['hobbies']     


# Maps / dictionaries
c.map_add('profiles', 'jsmith1',{'unread_messages' : {'bjones1' : 'Hi John'}})
c.map_add('profiles', 'jsmith1',{'unread_messages' : {'timmy' : 'Lunch?'}})
c.get('profiles', 'jsmith1')['unread_messages']
# returns: {'timmy': 'Lunch?', 'bjones1': 'Hi John'}

# HyperDex enables map contents to be modified in-place within the map. For example, if Brian sent another message to John, we could separate the messages with “|” and just append the new message:

c.map_string_append('profiles', 'jsmith1',{'unread_messages' : {'bjones1' : ' | Want to hang out?'}})
c.get('profiles', 'jsmith1')['unread_messages']
# returns: {'timmy': 'Lunch?', 'bjones1': 'Hi John | Want to hang out?'}

# Maps with integers can be acted on
url1 = "http://url1.com"
url2 = "http://url2.com"
c.map_add('profiles', 'jsmith1',{'upvotes' : {url1 : 1, url2: 1}})
c.map_atomic_add('profiles', 'jsmith1', {'upvotes' : {url1: 1}})
c.map_atomic_add('profiles', 'jsmith1', {'upvotes' : {url1: 1}})
c.map_atomic_add('profiles', 'jsmith1', {'upvotes' : {url1: -1, url2: -1}})  # decrement
c.get('profiles', 'jsmith1')['upvotes']


############
# next demo
###########

import hyperclient
c = hyperclient.Client('127.0.0.1', 1982)
c.add_space('''
    space friendlists
    key username
    attributes
       string first,
       string last,
       set(string) friends
    ''')

c.put('friendlists', 'jsmith1', {'first': 'John', 'last': 'Smith'})
c.put('friendlists', 'jd', {'first': 'John', 'last': 'Doe'})
c.put('friendlists', 'bjones1', {'first': 'Brian', 'last': 'Jones'})

# Async 
d1 = c.async_set_add('friendlists', 'jsmith1', {'friends': 'bjones1'})
d2 = c.async_set_add('friendlists', 'bjones1', {'friends': 'jsmith1'})
d3 = c.async_set_add('friendlists', 'jsmith1', {'friends': 'jd'})
d4 = c.async_set_add('friendlists', 'jd', {'friends': 'jsmith1'})
d4.wait()


 # Atomic read-modify-write (CAS)
c.get('friendlists', 'jsmith1')
{'first': 'John', 'last': 'Smith', 'friends': set(['bjones1', 'jd', ''])}

c.get('friendlists', 'jsmith1')
{'first': 'John', 'last': 'Smith', 'friends': set(['bjones1', 'jd', 'jj'])}
c.cond_put('friendlists', 'jsmith1',
    {'first': 'John', 'last': 'Smith'},
    {'first': 'Jon'})
c.get('friendlists', 'jsmith1')
#  {'first': 'Jon', 'last': 'Smith', 'friends': set(['bjones1', 'jd', 'jj'])}






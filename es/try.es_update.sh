#!/bin/bash

# from: http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/docs-update.html

# The update API allows to update a document based on a script provided. The operation gets the document (collocated with the shard) from the index, runs the script (with optional script language and parameters), and index back the result (also allows to delete, or ignore the operation). It uses versioning to make sure no updates have happened during the "get" and "reindex".

# Note, this operation still means full reindex of the document, it just removes some network roundtrips and reduces chances of version conflicts between the get and the index. The _source field need to be enabled for this feature to work.

# For example, lets index a simple doc:

curl -XPUT 'localhost:9200/test/type1/1' -d '{
    "counter" : 1,
    "tags" : ["red"]
}'

echo ''


# Now, we can execute a script that would increment the counter:

curl -XPOST 'localhost:9200/test/type1/1/_update' -d '{
    "script" : "ctx._source.counter += count",
    "params" : {
        "count" : 4
    }
}'


echo ''

# We can also add a tag to the list of tags (note, if the tag exists, it will still add it, since its a list):

curl -XPOST 'localhost:9200/test/type1/1/_update' -d '{
    "script" : "ctx._source.tags += tag",
    "params" : {
        "tag" : "blue"
    }
}'

echo ''

# We can also add a new field to the document:

curl -XPOST 'localhost:9200/test/type1/1/_update' -d '{
    "script" : "ctx._source.text = \"some text\""
}'

echo ''


# We can also remove a field from the document:

curl -XPOST 'localhost:9200/test/type1/1/_update' -d '{
    "script" : "ctx._source.remove(\"text\")"
}'

echo ''

# And, we can delete the doc if the tags contain blue, or ignore (noop):

curl -XPOST 'localhost:9200/test/type1/1/_update' -d '{
    "script" : "ctx._source.tags.contains(tag) ? ctx.op = \"delete\" : ctx.op = \"none\"",
    "params" : {
        "tag" : "blue"
    }
}'

echo ''

# The update API also support passing a partial document, which will be merged into the existing document (simple recursive merge, inner merging of objects, replacing core "keys/values" and arrays). For example:

curl -XPOST 'localhost:9200/test/type1/1/_update' -d '{
    "doc" : {
        "name" : "new_name"
    }
}'

echo ''


# If both doc and script is specified, then doc is ignored. Best is to put your field pairs of the partial document in the script itself.
#There is also support for upsert. If the document does not already exists, the content of the upsert element will be used to index the fresh doc:

curl -XPOST 'localhost:9200/test/type1/1/_update' -d '{
    "script" : "ctx._source.counter += count",
    "params" : {
        "count" : 4
    },
    "upsert" : {
        "counter" : 1
    }
}'

echo ''


# Last it also supports doc_as_upsert. So that the provided document will be inserted if the document does not already exist. This will reduce the amount of data that needs to be sent to elasticsearch.

curl -XPOST 'localhost:9200/test/type1/1/_update' -d '{
    "doc" : {
        "name" : "new_name"
    },
    "doc_as_upsert" : true
}'


echo ''


# NB: if we delete the document and try creating it later, it merely bumps the version number
curl -XDELETE 'localhost:9200/test/type1/1'


echo ''



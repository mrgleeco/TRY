#!/bin/bash

# You need to download the Dockerfile and build a new image:

# docker build -t opentsdb .

sudo docker ps

id=$(sudo docker run -d gleeco/opentsdb)
port=$(sudo docker port $id 4242)
echo "started opentsdb in container $id, listening on $port"

# Now you can wait for OpenTSDB to be fully started (this can take a while)

for i in $(seq 1 30); do
  curl -sfI 127.0.0.1:$port > /dev/null 2>&1
  if [ "$?" == "0" ]; then
    echo "opentsdb running and listening on port $port"
    break
  fi
  echo -n "."
  sleep 1
done




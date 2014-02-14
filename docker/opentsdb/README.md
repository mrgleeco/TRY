# Dockerfile for OpenTSDB

This Dockerfile is generated, that is why it looks so ugly. The main reason was that I did not want to have any external
dependencies. Instead of using ADD I decided to go for writing files using this technique

    echo <base64decoded> | base64 -d > /tmp/<md5> && mv /tmp/<md5> <dst>

and just inline everything in the Dockerfile.

OpenTSDB is started with the `--auto-metric` flag so you do not need to create metrics before you write to them.

## Test OpenTSDB 2.0

By removing the comment in line:

    # RUN cd /opt/opentsdb && git checkout origin/next

you can already test OpenTSDB 2.0

## Testing

You need to download the Dockerfile and build a new image:

    docker build -t opentsdb .
    id=$(docker run -d opentsdb)
    port=$(docker port $id 4242)
    echo "started opentsdb in container $id, listening on $port"

Now you can wait for OpenTSDB to be fully started (this can take a while)

    for i in $(seq 1 30); do
      curl -sfI 127.0.0.1:$port > /dev/null 2>&1
      if [ "$?" == "0" ]; then
        echo "opentsdb running and listening on port $port"
        break
      fi
      echo -n "."
      sleep 1
    done

The OpenTSDB frontend is now available on the displayed port.

With OpenTSDB running you can start to feed your first metrics:

    while true; do
      line="put load.loadavg1m $(date +%s) $(cat /proc/loadavg  | cut -d ' ' -f 1) host=$(hostname)"
      echo $line
      echo $line | nc 127.0.0.1 $port
      sleep 1
    done

and with that loop running you can have a look at your metrics:

     http://127.0.0.1:$port/q?png&m=avg:load.loadavg1m&start=10m-ago



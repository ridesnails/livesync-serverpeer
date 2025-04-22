#!/bin/bash
appId=livesync-serverpeer-test
docker build -t $appId .
docker run -it --rm  --env-file .env -t $appId
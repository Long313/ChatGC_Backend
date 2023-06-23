#!/bin/bash

sudo docker-compose up -d

sleep 5

sudo docker exec chatgc-mongodb bash /scripts/rs-init.sh
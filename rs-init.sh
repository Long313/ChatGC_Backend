#!/bin/bash

mongosh <<EOF
var config = {
    "_id": "dbrs",
    "version": 1,
    "members": [
        {
            "_id": 1,
            "host": "chatgc-mongodb:27017",
            "priority": 1
        }
    ]
};
rs.initiate(config, { force: true });
rs.status();

use admin
db.createUser(
  {
    user: "admin",
    pwd: "password",
    roles: [ { role: "root", db: "admin" } ]
  }
);
EOF
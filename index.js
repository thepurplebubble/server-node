import "dotenv/config";
import Express, { request } from "express";
import { createClient } from "redis";
import { scheduleJob } from "node-schedule";

const express = new Express();
const redis = createClient({
  url: process.env["REDIS_URL"]
});

redis.on("error", err => console.error("Redis Client Error", err));
await redis.connect();

// server list sync
// every hour
scheduleJob("0 * * * *", () => {
  const serversSetKey = "servers";
  redis.sMembers(serversSetKey, (serverStrings) => {
    let servers = serverStrings.map(JSON.parse);
    servers.forEach((server) => {
      axios.post(`http://${server.ip}:${server.port}/sync/servers`, {
        servers: redis.sMembers("serversSetKey").map(JSON.parse)
      })
      .then((servers) => {
        syncServers(servers.data);
      });
    });
  });
});

// message sync
// every minute
scheduleJob("* * * * *", () => {
  const serversSetKey = "servers";
  redis.sMembers(serversSetKey, (serverStrings) => {
    let servers = serverStrings.map(JSON.parse);
    servers.forEach((server) => {
      axios.post(`http://${server.ip}:${server.port}/sync/hashes`, {
        hashes: redis.keys("hash:*").map((hash) => hash.substring(5))
      })
      .then((hashes) => {
        axios.post(`http://${server.ip}:${server.port}/fetch`, {
          hashes: hashes.data.hashes
        })
        .then((messages) => {
          messages.forEach((message) => {
            storeMessage(message.data);
          });
        });
      });
    });
  });
});

// TODO: more error handling and HTTP response codes
// TODO: separate server into multiple files
// TODO: typescript
express.post("/fetch", (req, res) => {
  if (req.body.recipient) {
    res.json({
      messages: searchByRecipient(req.body.recipient)
    });

  } else if (req.body.hashes) {
    messages = [];
    req.body.hashes.forEach((hash) => {
      messages.add(searchByHash(hash));
    });
    res.json({
      messages: messages
    });

  } else {
    res.status(400).send("400 Bad Request");
  }
});

express.post("/send", (req, res) => {
  storeMessage(req.body);
  res.send("200 OK");
});

express.post("/sync/servers", (req, res) => {
  res.json(syncServers(req.body.servers));
});

express.post("/sync/hashes", (req, res) => {
  res.json(syncHashes(req.body.hashes));
});

express.listen(process.env["PORT"], () => {
  console.log(`Purple Bubble Server is now listening on port ${process.env["PORT"]}`);
});

function syncServers(servers) {
  const serversSetKey = "servers";
  const response = [];
  redis.sMembers(serversSetKey, (myServerStrings) => {
    let myServers = myServerStrings.map(JSON.parse);
    myServers.forEach((server) => {
      if (!servers.includes(server)) {
        response.push(server);
      }
    });
    servers.forEach((server) => {
      if (!myServers.includes(server)) {
        redis.sAdd(serversSetKey, server);
      }
    });
  });
  return { servers: response };
}

function syncHashes(hashes) {
  const response = [];
  redis.keys("hash:*", (myHashes) => {
    myHashes.forEach((hash) => {
      if (!hashes.includes(hash)) {
        response.push(hash.substring(5));
      }
    });
  });
  return { hashes: response };
}

function storeMessage(message) {
  const recipient = message.recipient;
  const hashKey = `hash:${message.hash}`;
  const messageStr = JSON.stringify(message);
  const recipientSetKey = `recipient:${recipient}`;
  const expiryTime = 7 * 24 * 60 * 60;

  redis.set(hashKey, messageStr);
  redis.sAdd(recipientSetKey, hashKey);
  redis.expire(hashKey, expiryTime);
  // TODO: remove items from the recipient set as they're expired. This expiry logic does not work and the set will infinitely grow.
  redis.expire(recipientSetKey, expiryTime);
}

function searchByRecipient(recipient) {
  const recipientSetKey = `recipient:${recipient}`;

  redis.sMembers(recipientSetKey, (hashKeys) => {
    const messages = [];
    hashKeys.forEach((hashKey) => {
      redis.get(hashKey, (messageStr) => {
        if (messageStr) messages.push(JSON.parse(messageStr));
      });
    });

    return messages;
  });
}

function searchByHash(hash) {
  const hashKey = `hash:${hash}`;

  redis.get(`hash:${hashKey}`, (messageStr) => {
    if (messageStr) return JSON.parse(messageStr);
    else return null;
  });
}
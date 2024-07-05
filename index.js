import "dotenv/config";
import Express, { request } from "express";
import { createClient } from "redis";

const express = new Express();
const redis = createClient({
  url: process.env["REDIS_URL"]
});

redis.on("error", err => console.error("Redis Client Error", err));
await redis.connect();

// TODO: more error handling and HTTP response codes
// TODO: separate server into multiple files
express.post("/fetch", (req, res) => {
  if (req.body.recipient) {
    res.send({
      messages: searchByRecipient(req.body.recipient)
    });

  } else if (req.body.hashes) {
    messages = [];
    req.body.hashes.forEach((hash) => {
      messages.add(searchByHash(hash));
    });
    res.send({
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
  res.send(syncServers(req.body.servers));
});

express.post("/sync/messages", (req, res) => {
  // TODO: Saved messages sync
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
}

function storeMessage(message) {
  const recipient = message.recipient;
  const hashKey = message.hash;
  const messageStr = JSON.stringify(message);
  const recipientSetKey = `recipient:${recipient}`;
  const expiryTime = 7 * 24 * 60 * 60;

  redis.set(hashKey, messageStr);
  redis.sAdd(recipientSetKey, hashKey);
  redis.expire(hashKey, expiryTime);
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

function searchByHash(hashKey) {
  redis.get(hashKey, (messageStr) => {
    if (messageStr) return JSON.parse(messageStr);
    else return null;
  });
}
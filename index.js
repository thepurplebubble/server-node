import "dotenv/config";
import Express, { request } from "express";
import { createClient } from "redis";

const express = new Express();
const redis = createClient({
  url: process.env["REDIS_URL"]
});

redis.on("error", err => console.error("Redis Client Error", err));
await redis.connect();

express.post("/fetch", (req, res) => {

});

express.post("/send", (req, res) => {
  
});

express.post("/sync/servers", (req, res) => {
  
});

express.post("/sync/messages", (req, res) => {
  
});

express.listen(process.env["PORT"], () => {
  console.log(`Purple Bubble Server is now listening on port ${process.env["PORT"]}`);
});

function storeMessage(message) {
  const recipient = message.recipient;
  const hashKey = message.hash;
  const messageStr = JSON.stringify(message);
  const recipientSetKey = `recipient:${recipient}`;
  const expiryTime = 7 * 24 * 60 * 60;

  redis.set(hashKey, messageStr);
  redis.sadd(recipientSetKey, hashKey);
  redis.expire(hashKey, expiryTime);
  redis.expire(recipientSetKey, expiryTime);
}

function searchByRecipient(recipient) {
  const recipientSetKey = `recipient:${recipient}`;

  redis.smembers(recipientSetKey, (hashKeys) => {
    const results = [];
    hashKeys.forEach((hashKey) => {
      redis.get(hashKey, (messageStr) => {
        if (messageStr) results.push(JSON.parse(messageStr));
      });
    });

    return results;
  });
}

function searchByHash(hashKey) {
  redis.get(hashKey, (messageStr) => {
    if (messageStr) return JSON.parse(messageStr);
    else return null;
  });
}
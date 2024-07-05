import "dotenv/config";
import Express, { request } from "express";
import { createClient } from "redis";

import { scheduleJobs } from "./jobs.js";
import {
  syncServers,
  syncHashes,
  storeMessage,
  searchByRecipient,
  searchByHash,
} from "./util.js";

const express = new Express();

export const redis = createClient({
  url: process.env["REDIS_URL"],
});

redis.on("error", (err) => console.error("Redis Client Error", err));
await redis.connect();

scheduleJobs();

// TODO: more error handling and HTTP response codes
// TODO: separate server into multiple files
// TODO: typescript
express.post("/fetch", (req, res) => {
  if (req.body.recipient) {
    res.json({
      messages: searchByRecipient(req.body.recipient),
    });
  } else if (req.body.hashes) {
    messages = [];
    req.body.hashes.forEach((hash) => {
      messages.add(searchByHash(hash));
    });
    res.json({
      messages: messages,
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
  console.log(
    `Purple Bubble Server is now listening on port ${process.env["PORT"]}`
  );
});

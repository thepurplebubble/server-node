import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { createClient } from "redis";

import { scheduleJobs } from "./jobs.js";
import {
  syncServers,
  syncHashes,
  storeMessage,
  searchByRecipient,
  searchByHash,
} from "./util.js";


const app = express();
app.use(bodyParser.json());

// Ensure environment variables are set, otherwise throw an error
if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is required");
}
if (!process.env.PORT) {
  throw new Error("PORT environment variable is required");
}

export const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (err) => console.error("Redis Client Error", err));
await redis.connect();

scheduleJobs();

// TODO: more error handling and HTTP response codes

app.post("/fetch", (req, res) => {
  if (req.body.recipient) {
    res.json({
      messages: searchByRecipient(req.body.recipient),
    });
  } else if (req.body.hashes) {
    const messages = [];
    req.body.hashes.forEach((hash: string) => {
      messages.push(searchByHash(hash));
    });
    res.json({
      messages: messages,
    });
  } else {
    res.status(400).send("400 Bad Request");
  }
});

app.post("/send", (req, res) => {
  storeMessage(req.body);
  res.send("200 OK");
});

app.post("/sync/servers", (req, res) => {
  res.json(syncServers(req.body.servers));
});

app.post("/sync/hashes", (req, res) => {
  res.json(syncHashes(req.body.hashes));
});

app.listen(process.env.PORT, () => {
  console.log(
    `Purple Bubble Server is now listening on port ${process.env.PORT}`
  );
});

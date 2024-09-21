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

app.post("/fetch", async (req, res) => {
  try {
    if (req.body.recipient) {
      console.log("Fetching messages for recipient", req.body.recipient);
      const messages = await searchByRecipient(req.body.recipient);
      res.json({ messages });
    } else if (req.body.hashes) {
      console.log("Fetching messages by hashes", req.body.hashes);
      const messages = await Promise.all(req.body.hashes.map(searchByHash));
      res.json({ messages });
    } else {
      res.status(400).send("400 Bad Request");
    }
  } catch (error) {
    console.error("Error in /fetch endpoint:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching messages" });
  }
});

app.post("/send", (req, res) => {
  console.log("Storing message", req.body);
  storeMessage(req.body);
  res.status(200).send("ok");
});

app.post("/sync/servers", (req, res) => {
  res.json(syncServers(req.body.servers));
});

app.post("/sync/hashes", (req, res) => {
  res.json(syncHashes(req.body.hashes));
});

app.listen(process.env.PORT, () => {
  console.log(
    `Purple Bubble Server is now listening on port ${process.env.PORT}`,
  );
});

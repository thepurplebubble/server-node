import express from "express";
import bodyParser from "body-parser";
import { createClient } from "redis";
import "./config";
import * as dotenv from "dotenv";
dotenv.config();

import { scheduleJobs } from "./jobs";
import {
  syncServers,
  syncHashes,
  storeMessage,
  searchByRecipient,
  searchByHash,
} from "./util.js";

const app = express();
app.use(bodyParser.json());

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
      res.status(400).send("Bad Request");
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

import "dotenv/config";
import Express, { request } from "express";
import { createClient } from "redis";

const express = new Express();
const redis = createClient({
  url: process.env["REDIS_URL"]
});

redis.on("error", err => console.error("Redis Client Error", err));
await redis.connect();

express.listen(process.env["PORT"], () => {
  console.log(`Purple Bubble Server is now listening on port ${process.env["PORT"]}`);
});
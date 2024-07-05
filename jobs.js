import { scheduleJob } from "node-schedule";
import axios from "axios";

import { redis } from "./index.js";
import { syncServers, storeMessage } from "./util.js";

export function scheduleJobs() {
  // server list sync
  // every hour
  scheduleJob("0 * * * *", () => {
    const serversSetKey = "servers";
    redis.sMembers(serversSetKey, (serverStrings) => {
      let servers = serverStrings.map(JSON.parse);
      servers.forEach((server) => {
        axios
          .post(`http://${server.ip}:${server.port}/sync/servers`, {
            servers: redis.sMembers("serversSetKey").map(JSON.parse),
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
        axios
          .post(`http://${server.ip}:${server.port}/sync/hashes`, {
            hashes: redis.keys("hash:*").map((hash) => hash.substring(5)),
          })
          .then((hashes) => {
            axios
              .post(`http://${server.ip}:${server.port}/fetch`, {
                hashes: hashes.data.hashes,
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
}

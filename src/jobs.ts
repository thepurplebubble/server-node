import { scheduleJob } from "node-schedule";
import axios from "axios";
import { redis } from "./index.js";
import { syncServers, storeMessage } from "./util.js";
import { Server, Message } from "./types.js";

export function scheduleJobs() {
  // Synchornize servers every hour
  scheduleJob("0 * * * *", async () => {
    const serversSetKey = "servers";
    try {
      const serverStrings = await redis.sMembers(serversSetKey);
      const servers: Server[] = serverStrings.map((str) => JSON.parse(str));

      for (const server of servers) {
        const allServerStrings = await redis.sMembers(serversSetKey);
        const allServers: Server[] = allServerStrings.map((str) =>
          JSON.parse(str),
        );

        const response = await axios.post<Server[]>(
          `http://${server.ip}:${server.port}/sync/servers`,
          { servers: allServers },
        );

        await syncServers(response.data);
      }
    } catch (error) {
      console.error("Error in server sync job:", error);
    }
  });

  // Syncs messages every minute with all servers in the servers set.
  scheduleJob("* * * * *", async () => {
    const serversSetKey = "servers";
    try {
      const serverStrings = await redis.sMembers(serversSetKey);
      const servers: Server[] = serverStrings.map((str) => JSON.parse(str));

      for (const server of servers) {
        const hashKeys = await redis.keys("hash:*");
        const hashes = hashKeys.map((hash) => hash.substring(5));

        const hashesResponse = await axios.post<{ hashes: string[] }>(
          `http://${server.ip}:${server.port}/sync/hashes`,
          { hashes },
        );

        const messagesResponse = await axios.post<Message[]>(
          `http://${server.ip}:${server.port}/fetch`,
          { hashes: hashesResponse.data.hashes },
        );

        for (const message of messagesResponse.data) {
          storeMessage(message);
        }
      }
    } catch (error) {
      console.error("Error in message sync job:", error);
    }
  });
}
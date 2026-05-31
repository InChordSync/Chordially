import { createServer } from "node:http";

import { createApp } from "./app.js";
import { env } from "./env.js";

const server = createServer(createApp());

server.listen(env.PORT, () => {
  console.log(`[stellar-service] listening on http://localhost:${env.PORT}`);
});

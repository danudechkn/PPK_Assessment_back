import * as dotenv from "dotenv";
dotenv.config();

import app from "./app";
// require("./services/logCleanup");
const parsedPort = Number(process.env.PORTAPP);
const PORT = !isNaN(parsedPort) && parsedPort > 0 ? parsedPort : 3002;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Server accessible at http://<YOUR_LOCAL_IP>:${PORT}`);
});

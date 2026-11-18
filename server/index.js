const path = require("path");
const fs = require("fs");

let express;
try {
  express = require("express");
} catch (e) {
  // Graceful fallback for minimal environments without express installed
}

if (express) {
  const app = express();
  const PORT = process.env.PORT || 4000;

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "../client")));

  // API Routes
  app.use("/api/telemetry", require("./routes/telemetry"));
  app.use("/api/machines", require("./routes/machines"));

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ONLINE",
      system: "MachinaPredict Telemetry & ML Engine",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    });
  });

  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`[MachinaPredict] Server listening at http://localhost:${PORT}`);
    });
  }

  module.exports = app;
} else {
  // Built-in HTTP server fallback
  const http = require("http");
  const PORT = process.env.PORT || 4000;

  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.url === "/api/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ONLINE", system: "MachinaPredict", version: "1.0.0" }));
    } else if (req.url === "/api/machines") {
      const db = require("./db");
      db.getMachines().then((machines) => {
        res.writeHead(200);
        res.end(JSON.stringify({ machines }));
      });
    } else {
      res.writeHead(200);
      res.end(JSON.stringify({ message: "MachinaPredict API running" }));
    }
  });

  if (require.main === module) {
    server.listen(PORT, () => {
      console.log(`[MachinaPredict] Native HTTP server listening at http://localhost:${PORT}`);
    });
  }

  module.exports = server;
}

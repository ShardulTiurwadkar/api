const http = require("node:http");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  connectionTimeoutMillis: 3000,
});

const server = http.createServer(async (req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    return res.end("ok");
  }

  if (req.url === "/api" || req.url.startsWith("/api/")) {
    try {
      const result = await pool.query("select current_database() as database, now() as time");
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", ...result.rows[0] }));
    } catch (error) {
      res.writeHead(503, { "content-type": "application/json" });
      return res.end(JSON.stringify({ status: "database-unavailable" }));
    }
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not-found" }));
});

server.listen(3000, "0.0.0.0", () => {
  console.log("API listening on port 3000");
});

process.on("SIGTERM", async () => {
  await pool.end();
  server.close(() => process.exit(0));
});

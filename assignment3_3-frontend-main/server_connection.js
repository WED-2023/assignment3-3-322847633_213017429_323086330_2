// // const path = require("path");
// // const express = require("express");
// // const https = require("https");
// // const fs = require("fs");

// // const app = express();

// // const httpsOptions = {
// //   key: fs.readFileSync(path.join(__dirname, "privkey.pem")),
// //   cert: fs.readFileSync(path.join(__dirname, "fullchain.pem"))
// // };

// // // הגדר תיקיית פרונט
// // app.use(express.static(path.join(__dirname, "dist")));

// // // נווט לכל שאר הנתיבים ל־index.html (SPA)
// // app.get("*", (req, res) => {
// //   res.sendFile(path.join(__dirname, "dist", "index.html"));
// // });

// // // קבע פורט
// // const port = normalizePort(process.env.PORT || '443');
// // app.set('port', port);

// // // צור את השרת
// // const server = https.createServer(httpsOptions, app);

// // server.listen(port);
// // server.on('error', onError);
// // server.on('listening', onListening);

// // // הפונקציות
// // function normalizePort(val) {
// //   const port = parseInt(val, 10);
// //   if (isNaN(port)) return val;
// //   if (port >= 0) return port;
// //   return false;
// // }

// // function onError(error) {
// //   if (error.syscall !== 'listen') throw error;

// //   const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
// //   switch (error.code) {
// //     case 'EACCES':
// //       console.error(bind + ' requires elevated privileges');
// //       process.exit(1);
// //       break;
// //     case 'EADDRINUSE':
// //       console.error(bind + ' is already in use');
// //       process.exit(1);
// //       break;
// //     default:
// //       throw error;
// //   }
// // }

// // //server.address("https://aseel-bin.cs.bgu.ac.il")
// // function onListening() {
// //   const addr = server.address();
// //   const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
// //   console.log(`✅ Server is listening on ${bind}`);
// // }


// const path = require("path");
// const express = require("express");
// const https = require("https");
// const fs = require("fs");
// const { createProxyMiddleware } = require("http-proxy-middleware"); // ✅ UNCOMMENT

// const app = express();

// /** TLS certs (make sure these paths are correct & readable by the node user) */
// const httpsOptions = {
//   key:  fs.readFileSync(path.join(__dirname, "privkey.pem")),
//   cert: fs.readFileSync(path.join(__dirname, "fullchain.pem")),
// };

// /** Serve the built frontend */
// app.use(express.static(path.join(__dirname, "dist")));

// /** Proxy API -> backend on localhost:3000 */
// app.use(
//   "/api",
//   createProxyMiddleware({
//     target: "http://127.0.0.1:3000",
//     changeOrigin: true,
//     xfwd: true,
//   })
// );

// /** SPA fallback */
// app.get("*", (_req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });

// /** Listen on 443 (needs sudo or setcap) */
// const port = normalizePort(process.env.PORT || "443");
// app.set("port", port);
// const server = https.createServer(httpsOptions, app);
// server.listen(port);
// server.on("error", onError);
// server.on("listening", onListening);

// function normalizePort(val){ const p = parseInt(val,10); return isNaN(p)?val:(p>=0?p:false); }
// function onError(error){
//   if (error.syscall !== "listen") throw error;
//   const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
//   if (error.code === "EACCES")  { console.error(bind + " requires elevated privileges"); process.exit(1); }
//   if (error.code === "EADDRINUSE") { console.error(bind + " is already in use"); process.exit(1); }
//   throw error;
// }
// function onListening(){ const addr = server.address(); const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port; console.log(`✅ Server is listening on ${bind}`); }

const path = require("path");
const express = require("express");
const https = require("https");
const fs = require("fs");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// TLS certs placed next to this file
const httpsOptions = {
  key:  fs.readFileSync(path.join(__dirname, "privkey.pem")),
  cert: fs.readFileSync(path.join(__dirname, "fullchain.pem")),
};

// Serve the built frontend
app.use(express.static(path.join(__dirname, "dist")));

// Proxy API -> backend on localhost:3000
// app.use(
//   "/api",
//   createProxyMiddleware({
//     target: "http://127.0.0.1:3000",
//     changeOrigin: true,
//     xfwd: true,
//   })
// );
// Proxy API -> backend on localhost:3000
app.use(
  "/api",
  createProxyMiddleware({
    target: "http://127.0.0.1:3000",
    changeOrigin: true,
    xfwd: true,
    pathRewrite: { "^/api": "" },  // ✅ /api/recipes/random -> /recipes/random
  })
);


// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const port = normalizePort(process.env.PORT || "443");
const server = https.createServer(httpsOptions, app);
server.listen(port, onListening);
server.on("error", onError);

function normalizePort(val){ const p = parseInt(val,10); return isNaN(p)?val:(p>=0?p:false); }
function onError(error){
  if (error.syscall !== "listen") throw error;
  if (error.code === "EACCES")  { console.error("Port 443 requires elevated privileges"); process.exit(1); }
  if (error.code === "EADDRINUSE") { console.error("Port 443 is already in use"); process.exit(1); }
  throw error;
}
function onListening(){ const addr = server.address(); console.log(`✅ HTTPS listening on port ${addr.port}`); }

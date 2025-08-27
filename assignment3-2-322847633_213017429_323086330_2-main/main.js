// // main.js (backend API only, NO /api prefix)
// require("dotenv").config();
// const express = require("express");
// const logger = require("morgan");
// const session = require("express-session");
// const DButils = require("./routes/utils/DButils");

// const user = require("./routes/user");
// const recipes = require("./recipes");
// const auth = require("./routes/auth");

// const app = express();
// app.set("trust proxy", 1);

// app.use(logger("dev"));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// const IS_PROD = process.env.NODE_ENV === "production";
// app.use(session({
//   name: "sid",
//   secret: process.env.SESSION_SECRET || "dev-secret",
//   resave: false,
//   saveUninitialized: false,
//   cookie: { httpOnly: true, sameSite: "lax", secure: IS_PROD, maxAge: 24*60*60*1000 },
// }));

// // optional: attach req.user_id
// app.use(async (req, _res, next) => {
//   try {
//     if (req.session?.user_id) {
//       const users = await DButils.execQuery("SELECT user_id FROM users");
//       if (users.find(u => u.user_id === req.session.user_id)) req.user_id = req.session.user_id;
//     }
//     next();
//   } catch (e) { next(e); }
// });

// // ❗ Routes at ROOT (no /api)
// app.get("/alive", (_req, res) => res.send("I'm alive"));
// app.get("/__cookie-test", (req, res) => {
//   res.cookie("x", "1", { httpOnly: true, sameSite: "lax", secure: IS_PROD });
//   res.json({ ok: true });
// });
// app.use("/users", user);
// app.use("/recipes", recipes);
// app.use("/", auth);

// app.use((err, _req, res, _next) => {
//   console.error(err);
//   res.status(err.status || 500).json({ success: false, message: err.message });
// });

// const port = process.env.PORT || 3000;
// app.listen(port, () => console.log(`Server listen on port ${port}`));

// main.js (backend API only, no /api prefix)
require("dotenv").config();

const express = require("express");
const logger = require("morgan");
const session = require("express-session");
const DButils = require("./routes/utils/DButils");

// Routers
const user = require("./routes/user");
const recipes = require("./routes/recipes");  // ✅ fixed path
const auth = require("./routes/auth");

const app = express();
app.set("trust proxy", 1); // behind HTTPS proxy

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const IS_PROD = process.env.NODE_ENV === "production";

app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PROD,              // true in prod (HTTPS), false locally
      maxAge: 24 * 60 * 60 * 1000,  // 1 day
    },
  })
);

// Optional: attach req.user_id if session exists
app.use(async (req, _res, next) => {
  try {
    if (req.session?.user_id) {
      const users = await DButils.execQuery("SELECT user_id FROM users");
      if (users.find(u => u.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
      }
    }
    next();
  } catch (e) {
    next(e);
  }
});

// Routes at ROOT (no /api)
app.get("/alive", (_req, res) => res.send("I'm alive"));
app.get("/__cookie-test", (req, res) => {
  res.cookie("x", "1", { httpOnly: true, sameSite: "lax", secure: IS_PROD });
  res.json({ ok: true });
});

app.use("/users", user);
app.use("/recipes", recipes);
app.use("/", auth);          // e.g., POST /login, POST /logout, etc.

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listen on port ${port}`));

var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.post("/Register", async (req, res, next) => {
  try {
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
    };

    // Check if username exists
    const users = await DButils.execQuery("SELECT username FROM users");
    if (users.find((x) => x.username === user_details.username))
      throw { status: 409, message: "Username taken" };

    // Hash the password
    const hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );

    // Insert new user (omit user_id so MySQL auto-generates it)
    await DButils.execQuery(
      `INSERT INTO users (username, firstname, lastname, country, password, email) VALUES (
        '${user_details.username}', '${user_details.firstname}', '${user_details.lastname}',
        '${user_details.country}', '${hash_password}', '${user_details.email}'
      )`
    );

    res.status(201).send({ message: "User created", success: true });
  } catch (error) {
    next(error);
  }
});



/////////////check register
router.get("/check-username/:username", async (req, res, next) => {
  try {
    const users = await DButils.execQuery("SELECT username FROM users");
    const found = users.find(u => u.username === req.params.username);
    if (found) res.send({ exists: true });
    else res.send({ exists: false });
  } catch (err) {
    next(err);
  }
});




// router.post("/Login", async (req, res, next) => {
//   try {
//     // check that username exists
//     const users = await DButils.execQuery("SELECT username FROM users");
//     if (!users.find((x) => x.username === req.body.username))
//       throw { status: 401, message: "Username or Password incorrect" };

//     // check that the password is correct
//     const user = (
//       await DButils.execQuery(
//         `SELECT * FROM users WHERE username = '${req.body.username}'`
//       )
//     )[0];

//     if (!bcrypt.compareSync(req.body.password, user.password)) {
//       throw { status: 401, message: "Username or Password incorrect" };
//     }

//     // Set cookie
//     req.session.user_id = user.user_id;
//     console.log("session user_id login: " + req.session.user_id);

//     // return cookie
//     res.status(200).send({ message: "login succeeded " , success: true });
//   } catch (error) {
//     next(error);
//   }
// });


// routes/auth.js (example)
router.post("/Login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const rows = await DButils.execQuery(
      `SELECT user_id, username, password FROM users WHERE username='${username}' LIMIT 1`
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // 👇 THIS sets the session and causes Set-Cookie in the response
    req.session.user_id = rows[0].user_id;
    req.session.username = rows[0].username;

    res.json({ message: "login succeeded", success: true });
  } catch (err) {
    next(err);
  }
});

// quick check route to see current user from session
router.get("/user/me", (req, res) => {
  if (!req.session?.user_id) return res.status(401).json({ message: "Not logged in" });
  res.json({ user_id: req.session.user_id, username: req.session.username });
});


router.post("/Logout", function (req, res) {
  console.log("session user_id Logout: " + req.session.user_id);
  req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
  res.send({ success: true, message: "logout succeeded" });
});

module.exports = router;
const express = require("express");
const mysql = require("mysql");
require("dotenv").config();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const util = require("util");
const cookieSession = require("cookie-session");
var bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

app.use(
  cookieSession({
    name: "server-session",
    maxAge: 60 * 60 * 60 * 1000,
    keys: ["server"],
  })
);

app.use(passport.session());
app.use(passport.initialize());

const con = mysql.createConnection({
  host: process.env.host,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  user: process.env.USER,
  charset: "utf8mb4",
  port: 3306,
});
con.connect((err) => {
  if (err) {
    console.log(err);
  }
});

const query = util.promisify(con.query).bind(con);

let check = false;

passport.use(
  "login",
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const row = await query(
          "SELECT user_id FROM user_master WHERE user_id=?",
          [profile.id]
        );
        if (row.length == 0) {
          const sql =
            "INSERT INTO user_master(user_id,name,email,image,password) VALUES(?,?,?,?,?)";
          await query(sql, [
            profile.id,
            profile.displayName,
            profile.emails[0].value,
            profile.photos[0].value,
            "",
          ]);
          check = true;
          done(null, profile.id);
        } else {
          check = false;
          done(null, profile.id);
        }
      } catch (error) {
        done(error.message, null);
      }
    }
  )
);

passport.serializeUser((id, done) => done(null, id));
passport.deserializeUser(async (id, done) => {
  const user = await query(
    "SELECT user_id,name,email,image FROM user_master WHERE user_id=?",
    [id]
  );
  // console.log(user[0]);
  done(null, user[0]);
});

app.use('/',(req,res) => {
  res.send('hello world')
})

app.get(
  "/auth/google",
  passport.authenticate("login", {
    scope: ["profile", "email", "openid"],
    accessType: "online",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("login", { failureRedirect: "/error" }),
  (req, res) => res.redirect(check ? "http://localhost:3000/signup":"http://localhost:3000/caloriecounter")
);

app.get("/logout", (req, res) => {
  req.logout();
  req.session = null;
  res.sendStatus(200);
});

app.get("/checkcookie", (req, res) => {
  try {
    if (req.session === null) {
      res.json({message:"nocookie"}).status(200);
    }
    else{
      res.json({message:"cookie"}).status(200);
    }
  } catch (err) {
    res.sendStatus(500);
    console.log(err);
  }
});

app.get("/getprofile", async (req, res) => {
  try {
    const sql = await query(
      "SELECT name,email,image,weight,height,goal_weight,bmi,maintainance_cal,gender,age,password from user_master WHERE user_id = ?",
      [req.user.user_id]
    );
    res.send(sql).status(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

app.put("/updateprofile", async (req, res) => {
  try {
    const {
      name,
      currentwt,
      currentht,
      goalwt,
      bmi,
      maintainance_cal,
      gender,
      age,
    } = req.body;
    const sql = await query(
      "UPDATE user_master SET name=?,weight=?,height=?,goal_weight=?,bmi=?,maintainance_cal = ?,gender = ? ,age = ? WHERE user_id = ?",
      [
        name,
        currentwt,
        currentht,
        goalwt,
        bmi,
        maintainance_cal,
        gender,
        age,
        req.user.user_id,
      ]
    );
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
  }
});

app.get("/getbodydata", async (req, res) => {
  try {
    let sql = await query(
      "SELECT weight,maintainance_cal FROM user_master WHERE user_id = ?",
      [req.user.user_id]
    );
    res.send(sql).status(200);
  } catch (err) {
    console.log(err);
    res.send(500);
  }
});

app.get('/getimage',async (req,res) => {
  try{
    let sql = await query("SELECT image FROM user_master WHERE user_id = ?",[req.user.user_id])
    res.send(sql).status(200);
  }
  catch(err) {
    console.log(err);
    res.send(500);
  }
})

app.post('/addbreakfast',async(req,res) => {
  try{
    const {meal,meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber} = req.body;
    let sql = await query("INSERT INTO food_master(id,meal,meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber) VALUES (?,?,?,?,?,?,?,?,?)",[req.user.user_id,meal,meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber])
    res.sendStatus(200);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.post('/addlunch',async(req,res) => {
  try{
    const {meal,meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber} = req.body;
    let sql = await query("INSERT INTO food_master(id,meal,meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber) VALUES (?,?,?,?,?,?,?,?,?)",[req.user.user_id,meal,meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber])
    res.sendStatus(200);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.post('/addDinner',async(req,res) => {
  try{
    const {meal,meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber} = req.body;
    let sql = await query("INSERT INTO food_master(id,meal,meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber) VALUES (?,?,?,?,?,?,?,?,?)",[req.user.user_id,meal,meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber])
    res.sendStatus(200);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.get('/getbreakfast', async(req,res) => {
  try{
    let sql = await query("SELECT meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber FROM food_master WHERE meal = 'breakfast' AND date_of_eaten = curdate() AND id = ?",[req.user.user_id])
    res.send(sql).status(200);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.get('/getlunch',async(req,res) => {
  try{
    let sql = await query("SELECT meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber FROM food_master WHERE meal = 'lunch' AND date_of_eaten = curdate() AND id = ?",[req.user.user_id])
    res.send(sql).status(200);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.get('/getdinner',async(req,res) => {
  try{
    let sql = await query("SELECT meal_name,meal_servings,meal_protien,meal_calories,meal_carbohydrates,meal_fats,meal_fiber FROM food_master WHERE meal = 'dinner' AND date_of_eaten = curdate() AND id = ?",[req.user.user_id])
    res.send(sql).status(200);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.post('/trackworkout',async(req,res) => {
  try{
    const {name,calories,duration} = req.body;
    let sql = await query("INSERT INTO workout_master(id,workout_name,workout_calories,workout_duration) VALUES (?,?,?,?)",[req.user.user_id,name,calories,duration])
    res.sendStatus(200);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.get('/getworkout',async(req,res) => {
  try{
    let sql = await query('SELECT workout_name,workout_calories,workout_duration FROM workout_master WHERE id = ? AND done_date = curdate()',[req.user.user_id]);
    res.send(sql).status(200);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.put('/updatepassword',async(req,res) => {
  try{
    const {oldPassword,newPassword} = req.body;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(newPassword, salt);
    const password = await query("SELECT password FROM user_master WHERE user_id = ?;", [
      req.user.user_id,
    ]);
    if (
      bcrypt.compareSync(oldPassword, password[0].password) === true ||
      password[0].password === ""
    ) {
      const sql2 = "UPDATE user_master SET password = ? WHERE user_id = ?;";
      await query(sql2, [hash, req.user.user_id]);
      // done(null,req.user.id);
      res.sendStatus(200);
    } else {
      return res.status(401).send("Incorrect Old password");
    }
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.post('/validate',async(req,res) => {
  try{
    const {email,pass} = req.body;
    let sql = await query("SELECT user_id,email,password FROM user_master WHERE email = ?",[email])
    if(sql.length > 0){
      if(bcrypt.compareSync(pass,sql[0].password) === true && email === sql[0].email){
        req.session.passport={user:sql[0].user_id}
        res.json({message:"allowed"}).status(200);
      }
      else{
        res.json({message:"not allowed"}).status(200);
      }
    }
    else{
      res.sendStatus(203)
    }
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.get('/getsignup', async(req,res) => {
  try{
    let sql = await query('SELECT name,email FROM user_master WHERE user_id',[req.user.user_id])
    res.send(sql).status(200);
  }
  catch(err) {
    console.log(err);
    res.sendStatus(500);
  }
})

app.listen(process.env.PORT, () => {
  console.log(`🚀 server running at ${process.env.PORT}`);
});

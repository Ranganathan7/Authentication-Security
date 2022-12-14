//jshint esversion:6
require("dotenv").config();
const express = require("express");
const body_parser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passport_local_mongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate"); //to use findOrCreate in setting up google strategy

const port = 3000;
const app = express();

app.set("view engine", "ejs");
app.use(body_parser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//setting up our session
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

//setting up passport
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passport_local_mongoose); //adding this plugin to hash and salt our passwords
userSchema.plugin(findOrCreate);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());  //creates a cookie with our User information in it
// passport.serializeUser(User.serializeUser()); //stuffs the cookie
// passport.deserializeUser(User.deserializeUser()); //breaks the cookie
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    //using mongoose-findorcreate package
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/" }),
  function(req, res) {
    // Successful authentication, redirect to secrets page
    res.redirect("/secrets");
});

app.get("/", function(req, res) {
  res.render("home", {});
});

app.get("/login", function(req, res) {
  res.render("login", {
    errMsg: "",
    username: "",
    password: ""
  });
});

app.get("/register", function(req, res) {
  res.render("register", {});
});

app.get("/secrets", function(req, res){
  //checking the cookie
  if(req.isAuthenticated()){
    User.find({secret: {$ne: null}}, function(err, foundUsers){
      if(err) console.log(err);
      else{
        res.render("secrets", {users_with_secrets: foundUsers});
      }
    });
  }else{
    res.redirect("/");
  }

});

app.get("/logout", function(req, res){
  //using passport functionality to destroy the cookie
  req.logout(function(err){
    if(err) console.log(err);
    else res.redirect("/");
  });
});

app.get("/submit", function(req, res){
  if(req.isAuthenticated()){
    res.render("submit", {});
  }else{
    res.redirect("/");
  }
});

app.post("/submit", function(req, res){
  const secret = req.body.secret;
  User.findById(req.user.id, function(err, foundUser){
    if(err) console.log(err);
    else{
      foundUser.secret = secret;
      foundUser.save(function(err){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  //using passport functionality to login our user
  req.login(user, function(err){
    if(err){
      console.log(err);
      res.render("login", {
        errMsg: "Email or Password Incorrect!",
        username: req.body.username,
        password: req.body.password
      });
    }
    else{
      //creating the cookie
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/register", function(req, res) {
  //using passport_local_mongoose functionalities
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      //creating the cookie
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});


app.listen(port, function() {
  console.log("Server started on port " + port);
});

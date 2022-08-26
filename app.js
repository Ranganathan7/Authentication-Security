//jshint esversion:6
require("dotenv").config();
const express = require("express");
const body_parser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");


const port = 3000;
const app = express();
const saltRounds = 10;

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

app.set('view engine', 'ejs');
app.use(body_parser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// const secret = process.env.SECRET;
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

const User = mongoose.model("user", userSchema);

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

app.post("/login", function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({
    email: username
  }, function(err, user) {
    if (err) res.send(err);
    else if (user) {
      bcrypt.compare(password, user.password, function(error, result) {
        if (result === true) res.render("secrets", {});
        else res.render("login", {
          errMsg: "Email or Password Incorrect!",
          username: username,
          password: password
        });
      });
    } else {
      res.render("login", {
        errMsg: "Email or Password Incorrect!",
        username: username,
        password: password
      });
    }
  });
});

app.post("/register", function(req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const user = new User({
      email: req.body.username,
      password: hash
    });
    user.save(function(err) {
      if (err) res.send(err);
      else res.render("secrets", {});
    });
  });

});


app.listen(port, function() {
  console.log("Server started on port " + port);
});

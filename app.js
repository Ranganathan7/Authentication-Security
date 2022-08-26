//jshint esversion:6
require("dotenv").config();
const express = require("express");
const body_parser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");


const port = 3000;
const app = express();

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

const secret = process.env.SECRET;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

const User = mongoose.model("user", userSchema);

app.get("/", function(req, res){
  res.render("home", {});
});

app.get("/login", function(req, res){
  res.render("login", {errMsg: "", username: "", password: ""});
});

app.get("/register", function(req, res){
  res.render("register", {});
});

app.post("/login", function(req, res){
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({email: username}, function(err, user){
    if(err) res.send(err);
    else if(user){
      if(user.password === password) res.render("secrets", {});
      else res.render("login", {errMsg: "Email or Password Incorrect!", username: username, password: password});
    }
    else{
      res.render("login", {errMsg: "Email or Password Incorrect!", username: username, password: password});
    }
  });
});

app.post("/register", function(req, res){
  const user = new User({
    email: req.body.username,
    password: req.body.password
  });
  user.save(function(err){
    if(err) res.send(err);
    else res.render("secrets", {});
  });
});


app.listen(port, function(){
  console.log("Server started on port "+ port);
});
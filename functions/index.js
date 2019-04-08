const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
admin.initializeApp();
const location = express();
var bodyParser = require("body-parser");
location.use(bodyParser());
location.use(bodyParser.urlencoded({ extended: true }));
location.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
location.post("/", (req, res) => {
  console.log(req.body);
  let data = { lat: req.body.coords.latitude, lng: req.body.coords.longitude };
  admin
    .database()
    .ref()
    .child("/users/drivers/" + req.body.user + "/position/")
    .set(data);
  res.end("fin");
});
exports.location = functions.https.onRequest(location);

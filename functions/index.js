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

exports.operator_notification = functions.database.ref("quotes/{uid}").onCreate(snapshot => {
  admin
    .database()
    .ref()
    .child("Notification_Data/")
    .once("value", snap => {
      var message = {
        data: {
          title: "Nuevo Pedido",
          body: "Alguien ocupa un precio",
        },
        token: snap.exportVal().token,
      };
      return admin
        .messaging()
        .send(message)
        .then(response => {
          // Response is a message ID string.
          console.log("Successfully sent message:", response);
          return 0;
        })
        .catch(error => {
          console.log("Error sending message:", error);
          return 0;
        });
    });
});

exports.download_url_generator = functions.storage.object().onFinalize(object => {
  const contentType = object.contentType;
  if (!contentType.startsWith("image/")) {
    return console.log("This is not an image.");
  }
  const bucket = admin.storage().bucket();
  const file = bucket.file(object.name);
  let data = object.name.split("/");
  const filename = data.pop();
  const user = data.pop();
  const options = {
    action: "read",
    expires: "03-17-2025",
  };
  // Get a signed URL for the file
  return file.getSignedUrl(options).then(results => {
    const url = results[0];
    let update;
    if (filename === "lateralcar") {
      update = { lateralcar: url };
    } else if (filename === "profile") {
      update = { profile: url };
    } else {
      update = { profilecar: url };
    }
    admin
      .firestore()
      .collection("drivers")
      .doc(user)
      .update(update);
    return true;
  });
});

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const fetch = require("node-fetch");
admin.initializeApp();
const location = express();
var bodyParser = require("body-parser");

const API_KEY = "AIzaSyApNgtxFBp0SXSHljP_xku6peNCzjTFWM4";
const REFERENCE_RADIUS = 100;

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
    .child("/locations/" + req.body.user + "/position/")
    .set(data);
  res.end("fin");
});

exports.location = functions.https.onRequest(location);

exports.custom_marker_reference = functions.database.ref("quotes/{uid}").onCreate((snapshot, context) => {
  let data = snapshot.exportVal();
  if (data.destination.name == "Marcador") {
    let query =
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=" +
      API_KEY +
      "&location=" +
      data.destination.lat +
      "," +
      data.destination.lng +
      "&radius=" + REFERENCE_RADIUS;

    fetch(query)
      .then(response => response.json())
      .then(responseJson => {
        let foundPlace = false;

        for (let place of responseJson.results) {
          if (place.name != "Tegucigalpa") {
            console.log("Se encontró un lugar cercano:", place.name);
            foundPlace = true;
            console.log("UID", context.params.uid);

            let detailsQuery =
              "https://maps.googleapis.com/maps/api/place/details/json?key=" +
              API_KEY +
              "&placeid=" +
              place.place_id;

            fetch(detailsQuery)
              .then(detailsResponse => detailsResponse.json())
              .then(detailsResponseJson => {
                var updates = {};
                updates["/quotes/" + context.params.uid + "/destination/name"] =
                  "Cerca de " + place.name;
                updates["/quotes/" + context.params.uid + "/destination/address"] =
                  detailsResponseJson.result.formatted_address;

                admin
                  .database()
                  .ref()
                  .update(updates);
              })
              .catch(e => {
                console.error(e);
                return false;
              });

            break;
          }
        }

        if (!foundPlace) {
          console.log("Lugar cercano no encontrado.");
          var updates = {};
          updates["/quotes/" + context.params.uid + "/destination/name"] = "Ubicación Exacta";
          updates["/quotes/" + context.params.uid + "/destination/address"] =
            "Lat: " + data.destination.lat + " | Lon: " + data.destination.lng;
          admin
            .database()
            .ref()
            .update(updates);
        }
      })
      .catch(e => {
        console.error(e);
        return false;
      });
  }

  return true;
});

exports.operator_notification = functions.database
  .ref("quotes/{uid}")
  .onCreate((snapshot, context) => {
    let data = snapshot.exportVal();
    let query =
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=" +
      API_KEY +
      "&location=" +
      data.origin.lat +
      "," +
      data.origin.lng +
      "&radius=" + REFERENCE_RADIUS;

    fetch(query)
      .then(response => response.json())
      .then(responseJson => {
        let foundPlace = false;

        for (let place of responseJson.results) {
          if (place.name != "Tegucigalpa") {
            console.log("Se encontró un lugar cercano:", place.name);
            foundPlace = true;
            console.log("UID", context.params.uid);

            let detailsQuery =
              "https://maps.googleapis.com/maps/api/place/details/json?key=" +
              API_KEY +
              "&placeid=" +
              place.place_id;

            fetch(detailsQuery)
              .then(detailsResponse => detailsResponse.json())
              .then(detailsResponseJson => {
                var updates = {};
                updates["/quotes/" + context.params.uid + "/origin/name"] =
                  "Cerca de " + place.name;
                updates["/quotes/" + context.params.uid + "/origin/address"] =
                  detailsResponseJson.result.formatted_address;

                admin
                  .database()
                  .ref()
                  .update(updates);
              })
              .catch(e => {
                console.error(e);
                return false;
              });

            break;
          }
        }

        if (!foundPlace) {
          console.log("Lugar cercano no encontrado.");
          var updates = {};
          updates["/quotes/" + context.params.uid + "/origin/name"] = "Ubicación Exacta";
          updates["/quotes/" + context.params.uid + "/origin/address"] =
            "Lat: " + data.origin.lat + " | Lon: " + data.origin.lng;
          admin
            .database()
            .ref()
            .update(updates);
        }
      })
      .catch(e => {
        console.error(e);
        return false;
      });

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
            return false;
          })
          .catch(error => {
            console.log("Error sending message:", error);
            return false;
          });
      });

    return true;
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

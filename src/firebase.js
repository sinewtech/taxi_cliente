import firebase from "firebase";
import "@firebase/firestore";
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyBkCxRqmYLXkznasnf-MRTROWVJcORIGcw",
    authDomain: "taxiapp-sinewave.firebaseapp.com",
    databaseURL: "https://taxiapp-sinewave.firebaseio.com",
    projectId: "taxiapp-sinewave",
    storageBucket: "taxiapp-sinewave.appspot.com",
    messagingSenderId: "503391985374",
  });
}

export default firebase;

import React, { Component } from "react";
import { Alert } from "react-native";
import firebase from "../firebase";

import Waiting from "./Waiting";

class UserValidator extends Component {
  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        if (user.emailVerified === true) {
          firebase
            .firestore()
            .collection("clients")
            .doc(user.uid)
            .get()
            .then(snap => {
              if (snap.exists) {
                this.props.navigation.navigate("App");
              } else {
                Alert.alert(
                  "Usuario no encontrado",
                  "No hemos encontrado este usuario en el sistema. Por favor intenta de nuevo.",
                  [
                    {
                      text: "Ok",
                    },
                  ]
                );
                firebase.auth().signOut();
                this.props.navigation.navigate("Auth");
              }
            });
        } else {
          firebase.auth().currentUser.sendEmailVerification();
          this.props.navigation.navigate("App");
        }
      } else {
        this.props.navigation.navigate("Auth");
      }
    });
  }

  render() {
    return <Waiting />;
  }
}

export default UserValidator;

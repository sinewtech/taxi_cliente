import React, { Component } from "react";
import firebase from "firebase";

import Waiting from "./Waiting";

class UserValidator extends Component {
  componentDidMount() {
    console.log("estoy validando");
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        firebase
          .firestore()
          .collection("clients")
          .doc(user.uid)
          .get()
          .then(snap => {
            if (snap.exists) {
              console.log("Usuario encontrado, pasando a Home.");
              this.props.navigation.navigate("App");
            } else {
              firebase.auth().signOut();
              this.props.navigation.navigate("Auth");
            }
          });
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

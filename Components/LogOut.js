import React, { Component } from "react";
import { View, ActivityIndicator, Dimensions } from "react-native";
import firebase from "firebase";
class LogOut extends Component {
  componentDidMount = () => {
    firebase
      .auth()
      .signOut()
      .catch(error => {
        console.log(error);
      });
  };
  render() {
    return (
      <View
        style={{
          backgroundColor: "#FF9800",
          justifyContent: "center",
          alignItems: "center",
          height: Dimensions.get("window").height,
          width: Dimensions.get("window").width,
        }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }
}

export default LogOut;

import React, { Component } from "react";
import { View, Text } from "react-native";
import { Input, Button } from "react-native-elements";
import firebase from "../firebase";
class Feedback extends Component {
  constructor(props) {
    super(props);
    this.state = { user: {} };
  }
  componentDidMount = () => {
    if (firebase.auth().currentUser) {
      this.setState({ user: firebase.auth().currentUser });
    }
  };
  render() {
    return (
      <View style={{ flex: 1 }}>
        <Input placeholder="Error" shake multiline leftIcon={{ name: "bug-report" }} />
        <Text>{this.state.user.uid}</Text>
      </View>
    );
  }
}

export default Feedback;

import React, { Component } from "react";
import { StyleSheet, Dimensions, Alert } from "react-native";
import firebase from "firebase";
class SignUp extends Component {
  constructor() {
    super();
    this.state = {
      username: "",
      password: "",
    };
  }
  handleRegister() {
    let callback = () => this.handleSignIn();
    firebase
      .auth()
      .createUserWithEmailAndPassword(this.state.username, this.state.password)
      .then(callback)
      .catch(error => {
        console.error(error);
        Alert.alert(error);
      });
  }
  render() {
    return (
      <View style={styles.SignUpView}>
        <View style={styles.credentialsView}>
          <Input
            placeholder="Usuario"
            leftIcon={<Icon name="person" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={text => this.setState({ username: text })}
          />
          <Input
            placeholder="Contraseña"
            leftIcon={<Icon name="vpn-key" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoComplete="password"
            secureTextEntry={true}
            onChangeText={text => this.setState({ password: text })}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Registrate" onPress={this.handleRegister} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  SignUpView: {
    backgroundColor: "#FF9800",
    justifyContent: "center",
    alignItems: "center",
    height: Dimensions.get("window").height,
  },
  credentialsView: {
    width: Dimensions.get("window").width * 0.8,
  },

  Input: {
    backgroundColor: "white",
    borderRadius: 5,
    marginBottom: 15,
    padding: 5,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },
});
export default SignUp;

import React, { Component } from "react";
import { StyleSheet, Dimensions, Alert, View } from "react-native";
import { Input, Button, Icon } from "react-native-elements";
import firebase from "firebase";
class SignUp extends Component {
  constructor() {
    super();
    this.state = {
      email: "",
      password: "",
      nombre: "",
    };
  }
  handleRegister = () => {
    firebase
      .auth()
      .createUserWithEmailAndPassword(this.state.email, this.state.password)
      .then(async data => {
        await firebase
          .firestore()
          .collection("clients")
          .doc(data.user.uid)
          .set({ email: this.state.email, name: this.state.nombre });
      })
      .catch(error => {
        console.error(error);
        Alert.alert(error);
      });
  };
  render() {
    return (
      <View style={styles.SignUpView}>
        <View style={styles.credentialsView}>
          <Input
            placeholder="Email"
            leftIcon={<Icon name="mail" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={text => this.setState({ email: text })}
          />
          <Input
            placeholder="Nombre"
            leftIcon={<Icon name="person" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="none"
            onChangeText={text => this.setState({ nombre: text })}
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

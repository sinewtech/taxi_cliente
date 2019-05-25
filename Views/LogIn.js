import React, { Component } from "react";
import {
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  View,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { Input, Button, Icon } from "react-native-elements";
import firebase from "firebase";

class LogIn extends Component {
  constructor() {
    super();
    this.state = {
      mail: "",
      password: "",
    };
  }
  handleSignIn = () => {
    let CanContinue = true;
    for (key in this.state) {
      if (this.state[key].length === 0) {
        CanContinue = false;
        break;
      }
    }
    if (!CanContinue) {
      Alert.alert("Error", "Por favor Ingrese sus datos");
      return;
    } else {
      if (!/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/.test(this.state.mail)) {
        Alert.alert("Correo", "Por favor use un formato de correo valido");
        return;
      }
      if (!/^[A-Za-z0-9]{6,}$/.test(this.state.password)) {
        Alert.alert("Contraseña", "Recuerde que la contraseña debe ser mayor a 6 caracteres.");
        return;
      }
      firebase
        .auth()
        .signInWithEmailAndPassword(this.state.mail, this.state.password)
        .catch(error => {
          console.error(error);
        });
    }
  };
  render() {
    return (
      <KeyboardAvoidingView behavior={"padding"} style={styles.SignUpView}>
        <View style={styles.credentialsView}>
          <Input
            placeholder="Usuario"
            leftIcon={<Icon name="person" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={text => this.setState({ mail: text })}
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
          <Button title="Iniciar Sesión" onPress={this.handleSignIn} />
        </View>
        <TouchableOpacity
          onPress={() => {
            this.props.navigation.navigate("SignUp");
          }}
          style={{ marginTop: 5 }}>
          <Text style={{ color: "white", textDecorationLine: "underline" }}>Registrarse</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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

export default LogIn;

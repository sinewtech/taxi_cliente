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
import firebase from "../firebase";
import Waiting from "../Components/Waiting";

class LogIn extends Component {
  constructor() {
    super();
    this.state = {
      mail: "",
      password: "",
      registrando: false,
    };
  }

  clear = async () => {
    this.setState({ registrando: false, mail: "", password: "" });
  };

  handleSignIn = async () => {
    await this.setState({ registrando: true });
    /*let CanContinue = true;
    for (key in this.state) {
      if (this.state[key].length === 0) {
        CanContinue = false;
        break;
      }
    }*/

    if (this.state.mail === "" || this.state.password === "") {
      Alert.alert("Error", "Por favor llene todos los campos.");
      await this.clear();
      return;
    } else {
      if (!/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/.test(this.state.mail)) {
        Alert.alert("Correo", "Por favor use un formato de correo valido");
        await this.clear();
        return;
      }
      if (!/^[A-Za-z0-9]{6,}$/.test(this.state.password)) {
        Alert.alert("Contraseña", "Recuerde que la contraseña debe ser mayor a 6 caracteres.");
        await this.clear();
        return;
      }

      firebase
        .auth()
        .signInWithEmailAndPassword(this.state.mail, this.state.password)
        .then(userdata => {
          if (user) {
            firebase
              .firestore()
              .collection("clients")
              .doc(userdata.user.uid)
              .get()
              .then(snap => {
                if (!snap.exists) {
                  Alert.alert("Error", "No tiene cuenta en esta applicacion");
                  firebase.auth().signOut();
                }
              });
          }
        })
        .catch(error => {
          switch (error.code) {
            case "auth/wrong-password": {
              Alert.alert("Error", "Su Contraseña es incorrecta");
              break;
            }
            case "auth/user-disabled": {
              Alert.alert("Error", "Esta cuenta ha sido deshabilitada");
              break;
            }
            case "auth/user-not-found": {
              Alert.alert("Error", "No hemos encontrado una cuenta con este correo");
              break;
            }
          }

          this.clear();
        });
    }
  };
  render() {
    if (this.state.registrando) {
      return <Waiting />;
    }

    return (
      <KeyboardAvoidingView behavior={"padding"} style={styles.SignUpView}>
        <View style={styles.credentialsView}>
          <View style={styles.headerView}>
            <Text style={styles.title}>Bienvenido a Taxi App</Text>
            <Text style={styles.subtitle}>Por favor inicia sesión</Text>
          </View>
          <Input
            placeholder="Correo Electronico"
            leftIcon={<Icon name="mail" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={this.state.mail}
            onChangeText={text => this.setState({ mail: text })}
          />
          <Input
            placeholder="Contraseña"
            leftIcon={<Icon name="vpn-key" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoComplete="password"
            secureTextEntry={true}
            value={this.state.password}
            onChangeText={text => this.setState({ password: text })}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            buttonStyle={styles.registerButton}
            title="Crear una Cuenta"
            onPress={() => {
              this.props.navigation.navigate("SignUp");
            }}
          />
          <Button buttonStyle={styles.button} title="Iniciar Sesión" onPress={this.handleSignIn} />
        </View>
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
    backgroundColor: "white",
    borderRadius: 10,
    width: Dimensions.get("window").width * 0.9,
    elevation: 2,
    marginBottom: 15,
  },

  Input: {
    borderRadius: 5,
    marginBottom: 15,
    padding: 5,
  },

  headerView: {
    marginBottom: 10,
    marginTop: 10,
  },

  title: {
    //color: "white",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    //color: "white",
    fontSize: 20,
    textAlign: "center",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: Dimensions.get("window").width * 0.9,
    height: 45,
  },

  button: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    elevation: 3,
  },

  registerButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    borderRadius: 10,
    elevation: 3,
  },
});

export default LogIn;

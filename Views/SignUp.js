import React, { Component } from "react";
import { StyleSheet, Dimensions, Alert, View } from "react-native";
import { Input, Button, Icon } from "react-native-elements";
import firebase from "firebase";
class SignUp extends Component {
  constructor() {
    super();
    this.state = {
      mail: "davidm@sinewave.tech",
      password: "das",
      phone: "+504 8981-4814",
      name: "David Mendoza",
    };
  }
  handleRegister = () => {
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
        Alert.alert("Correo", "Por favor use un formato de correo valido.");
        return;
      }
      if (!/^[A-Za-z0-9]{6,}$/.test(this.state.password)) {
        Alert.alert("Contraseña", "Por favor que la contraseña sea mayor a 6 caracteres.");
        return;
      }
      if (!/^\+504\ \d{4}-\d{4}$/.test(this.state.phone)) {
        Alert.alert("Numero de telefono", "Por favor use el formato indicado.");
        return;
      }
      firebase
        .auth()
        .createUserWithEmailAndPassword(this.state.mail, this.state.password)
        .then(async data => {
          await firebase
            .firestore()
            .collection("clients")
            .doc(data.user.uid)
            .set({ mail: this.state.mail, name: this.state.name });
        })
        .catch(error => {
          console.error(error);
          Alert.alert(error);
        });
    }
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
            onChangeText={text => this.setState({ mail: text })}
          />
          <Input
            placeholder="Nombre"
            leftIcon={<Icon name="person" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="none"
            onChangeText={text => this.setState({ name: text })}
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
          <Input
            placeholder="Numero de telefono +504 xxxx-xxxx"
            leftIcon={<Icon name="phone" size={24} color="black" style={styles.Icon} />}
            keyboardType="phone-pad"
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="none"
            onChangeText={text => this.setState({ phone: text })}
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

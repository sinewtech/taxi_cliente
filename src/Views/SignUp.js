import React, { Component } from "react";
import {
  BackHandler,
  StyleSheet,
  Dimensions,
  Alert,
  View,
  KeyboardAvoidingView,
  Text,
} from "react-native";
import { Input, Button, Icon } from "react-native-elements";
import Waiting from "../Components/Waiting";
import firebase from "../firebase";
import { TextInputMask } from "react-native-masked-text";

class SignUp extends Component {
  constructor() {
    super();
    this.state = {
      mail: "",
      password: "",
      phone: "",
      firstName: "",
      lastName: "",
      registrando: false,
    };

    this.backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      console.log("Pressed Back");
      this.props.navigation.navigate("LogIn");
      return true;
    });
  }

  handleRegister = async () => {
    await this.setState({ registrando: true });
    if (this.state.registrando) {
      let CanContinue = true;
      for (key in this.state) {
        if (this.state[key].length === 0) {
          CanContinue = false;
          break;
        }
      }
      if (!CanContinue) {
        Alert.alert("Error", "Por favor llene todos los campos para continuar.");
        this.setState({ registrando: false });
        return;
      } else {
        if (!/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/.test(this.state.mail)) {
          Alert.alert("Correo", "Por favor use un formato de correo valido.");
          this.setState({ registrando: false });
          return;
        }
        if (!/^[A-Za-z0-9]{6,}$/.test(this.state.password)) {
          Alert.alert("Contraseña", "Por favor que la contraseña sea mayor a 6 caracteres.");
          this.setState({ registrando: false });
          return;
        }
        if (!/^\+504\ \d{4}-\d{4}$/.test(this.state.phone)) {
          Alert.alert("Numero de telefono", "Por favor use el formato indicado.");
          this.setState({ registrando: false });
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
              .set({
                mail: this.state.mail,
                firstName: this.state.firstName,
                lastName: this.state.lastName,
                phone: this.state.phone,
              });
          })
          .catch(error => {
            switch (error.code) {
              case "auth/email-already-in-use": {
                Alert.alert("Error", "Ya existe una cuenta con el correo proporcionado.");
                break;
              }
            }
            this.setState({ registrando: false });
          });
      }
    }
  };
  render() {
    const phoneIcon = <Icon name="phone" size={24} color="black" style={styles.Icon} />;
    if (this.state.registrando) {
      return <Waiting />;
    }

    return (
      <KeyboardAvoidingView style={styles.SignUpView} behavior="padding">
        <View style={styles.credentialsView}>
          <View style={styles.headerView}>
            <Text style={styles.title}>Crear una Cuenta</Text>
            <Text style={styles.subtitle}>Por favor ingresa tus datos</Text>
          </View>
          <Input
            placeholder="Nombre"
            leftIcon={<Icon name="person" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="words"
            onChangeText={text => this.setState({ firstName: text })}
          />
          <Input
            placeholder="Apellido"
            leftIcon={<Icon name="contacts" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="words"
            onChangeText={text => this.setState({ lastName: text })}
          />
          <Input
            placeholder="Correo Electrónico"
            leftIcon={<Icon name="mail" size={24} color="black" style={styles.Icon} />}
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
          <TextInputMask
            type={"custom"}
            customTextInput={Input}
            customTextInputProps={{
              inputContainerStyle: styles.Input,
              placeholder: "Número de Teléfono",
              leftIcon: phoneIcon,
              keyboardType: "phone-pad",
              leftIconContainerStyle: { marginRight: 15 },
            }}
            options={{
              mask: "+504 9999-9999",
            }}
            value={this.state.phone}
            onChangeText={text => {
              this.setState({
                phone: text,
              });
            }}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Crear Cuenta" onPress={this.handleRegister} />
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

  headerView: {
    marginBottom: 10,
  },

  title: {
    color: "white",
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
  },
});
export default SignUp;

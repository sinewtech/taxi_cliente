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
      let fieldsAreValid = true;
      for (key in this.state) {
        if (this.state[key].length === 0) {
          fieldsAreValid = false;
          break;
        }
      }
      if (!fieldsAreValid) {
        Alert.alert("Campos vacíos", "Por favor llena todos los campos para continuar.");
        this.setState({ registrando: false });
        return;
      } else {
        if (!/^((?!\.)[\w-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/.test(this.state.mail)) {
          Alert.alert("Correo inválido", "Por favor usa un formato de correo válido.");
          this.setState({ registrando: false });
          return;
        }
        if (!/^[A-Za-z0-9]{6,}$/.test(this.state.password)) {
          Alert.alert("Contraseña inválida", "La contraseña debe tener al menos 6 caracteres.");
          this.setState({ registrando: false });
          return;
        }
        if (!/^\+504\ \d{4}-\d{4}$/.test(this.state.phone)) {
          Alert.alert("Numero de teléfono inválido", "Por favor usa el formato de teléfono indicado.");
          this.setState({ registrando: false });
          return;
        }

        firebase
          .auth()
          .createUserWithEmailAndPassword(this.state.mail, this.state.password)
          .then(async data => {
            console.log("New User data", data);

            await firebase
              .firestore()
              .collection("clients")
              .doc(data.user.uid)
              .set({
                mail: this.state.mail,
                firstName: this.state.firstName,
                lastName: this.state.lastName,
                phone: this.state.phone,
              }).catch(e => console.error(e));
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
      <KeyboardAvoidingView style={styles.signUpView} behavior="padding">
        <View style={styles.credentialsView}>
          <View style={styles.headerView}>
            <Text style={styles.title}>Crear una Cuenta</Text>
            <Text style={styles.subtitle}>Por favor ingresa tus datos</Text>
          </View>
          <Input
            placeholder="Nombre"
            value={this.state.firstName}
            leftIcon={<Icon name="person" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="words"
            onChangeText={text => this.setState({ firstName: text })}
          />
          <Input
            placeholder="Apellido"
            value={this.state.lastName}
            leftIcon={<Icon name="contacts" size={24} color="black" style={styles.Icon} />}
            inputContainerStyle={styles.Input}
            leftIconContainerStyle={{ marginRight: 15 }}
            autoCapitalize="words"
            onChangeText={text => this.setState({ lastName: text })}
          />
          <Input
            placeholder="Correo Electrónico"
            value={this.state.mail}
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
            value={this.state.password}
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
          <Button title="Crear Cuenta" onPress={this.handleRegister} buttonStyle={styles.button}/>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  signUpView: {
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

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },

  button: {
    width: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    elevation: 3,
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
});
export default SignUp;

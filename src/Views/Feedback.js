import React, { Component } from "react";
import { View, Text, BackHandler, Alert } from "react-native";
import { Input, Button } from "react-native-elements";
import firebase from "../firebase";
class Feedback extends Component {
  constructor(props) {
    super(props);
    this.state = { user: {}, description: "" };
  }
  componentDidMount = () => {
    this.backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      this.props.navigation.goBack();
      return true;
    });
    if (firebase.auth().currentUser) {
      this.setState({ user: firebase.auth().currentUser });
    }
  };
  sendError = () => {
    let fieldsAreValid = true;
    for (key in this.state) {
      if (this.state[key].length === 0) {
        fieldsAreValid = false;
        break;
      }
    }
    if (fieldsAreValid) {
      let data = {
        user: this.state.user.uid,
        errorDateTime: new Date().toString(),
        errorDescription: this.state.description,
      };
      firebase
        .firestore()
        .collection("errorReports")
        .add(data)
        .then(() => {
          Alert.alert(
            "Éxito",
            "Tu error ha sido reportado con exito",
            [
              {
                text: "OK",
                onPress: () => {
                  this.setState({ description: "" });
                  this.props.navigation.goBack();
                },
              },
            ],
            { cancelable: false }
          );
        });
    } else {
      Alert.alert(
        "Campos vacíos",
        "Por favor llena todos los campos para continuar.",
        [{ text: "OK" }],
        {
          cancelable: false,
        }
      );
    }
  };
  render() {
    return (
      <View
        style={{
          flex: 1,
        }}>
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18 }}>Reportar Error</Text>
          <Input
            label="Describa el error"
            placeholder="No me lograban cargar las imagenes de mi taxi"
            underlineColorAndroid="transparent"
            multiline
            containerStyle={{ height: "50%" }}
            value={this.state.description}
            onChangeText={text => {
              this.setState({ description: text });
            }}
            leftIcon={{ name: "bug-report" }}
          />
          <Button
            title="Enviar Reporte"
            containerStyle={{ width: "100%", position: "relative", bottom: 0 }}
            onPress={this.sendError}
          />
        </View>
      </View>
    );
  }
}

export default Feedback;

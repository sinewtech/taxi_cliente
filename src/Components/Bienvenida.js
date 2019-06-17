import React from "react";
import { Text, View, StyleSheet, Alert } from "react-native";
import LugarFrecuente from "./LugarFrecuente";

export default class Bienvenida extends React.Component {
  render() {
    return (
      <View style={styles.welcomeView}>
        <View style={styles.welcomeTextView} flex={this.props.selectingOrigin ? 1 : 2}>
          {this.props.selectingOrigin ? null : (
            <Text style={styles.welcomeText}>
              {this.props.userName ? "¡Hola " + this.props.userName + "!" : "¡Hola!"}
            </Text>
          )}
          <Text style={this.props.selectingOrigin ? styles.welcomeText : styles.subtitleText}>
            {this.props.selectingOrigin ? "¿De dónde partiremos?" : "¿A dónde vamos hoy?"}
          </Text>
        </View>
        <View style={styles.lugaresFrecuentes}>
          <LugarFrecuente
            icon="add"
            name="Nuevo Lugar Frecuente"
            onPress={() => {
              Alert.alert("Lugares Frecuentes", "Esta función pronto estará implementada.");
            }}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  welcomeView: {
    justifyContent: "center",
    //flex:2,
    height: "100%",
    paddingTop: 10,
    justifyContent: "space-around",
  },

  welcomeTextView: {
    padding: 10,
  },

  welcomeText: {
    color: "black",
    textAlign: "center",
    fontSize: 25,
    fontWeight: "bold",
    marginTop: "auto",
    marginBottom: "auto",
  },

  subtitleText: {
    color: "black",
    textAlign: "center",
    fontSize: 20,
    marginTop: "auto",
    marginBottom: "auto",
  },

  lugaresFrecuentes: {
    //backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    flex: 4,
  },
});

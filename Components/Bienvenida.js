import React from "react";
import { Text, View, StyleSheet } from "react-native";
import LugarFrecuente from "./LugarFrecuente";
export default class Bienvenida extends React.Component {
  render() {
    return (
      <View style={styles.welcomeView}>
        <View style={styles.welcomeTextView}>
          <Text style={styles.welcomeText}>{this.props.selectingOrigin ? "¿De dónde partiremos?" : "¿A dónde vamos hoy?"}</Text>
        </View>
        <View style={styles.lugaresFrecuentes}>
          <LugarFrecuente icon="add" name="Nuevo Lugar Frecuente" />
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
    padding: 5,
    flex: 1,
  },

  welcomeText: {
    color: "black",
    textAlign: "center",
    fontSize: 25,
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

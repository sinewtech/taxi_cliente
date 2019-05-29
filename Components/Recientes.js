import React from "react";
import { Text, View, StyleSheet } from "react-native";

export default class Recientes extends React.Component {
  render() {
    return (
      <View style={[styles.recientesView, styles.fullCenter]}>
        <Text>Comienza a escribir para ver lugares</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  recientesView: {
    color: "gray",
  },

  fullCenter: {
    margin: "auto",
    justifyContent: "center",
    alignItems: "center",
  },
});

import React from "react";
import { Text, View, StyleSheet } from "react-native";

export default class Recientes extends React.Component {
  render() {
    return (
      <View
        style={{
          margin: "auto",
          justifyContent: "center",
          alignItems: "center",
          color: "gray",
          height: "100%",
          width: "100%",
        }}>
        <Text>Comienza a escribir para ver sugerencias</Text>
      </View>
    );
  }
}

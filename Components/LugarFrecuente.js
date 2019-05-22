import React, { Component } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Icon, Button } from "react-native-elements";
import Ripple from "react-native-material-ripple";

class LugarFrecuente extends Component {
  render() {
    return (
      <View style={styles.frecuenteView}>
        <Ripple style={styles.frecuenteRipple}>
          <Icon name={this.props.icon} style={styles.frecuenteIcon} size={45} color={"#FF9800"} />
          <Text style={styles.frecuenteText}>{this.props.name}</Text>
        </Ripple>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  lugaresFrecuentes: {
    //backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    flex: 4,
  },

  frecuenteView: {
    height: 100,
    width: 100,
    borderRadius: 500,
    overflow: "hidden",
  },

  frecuenteRipple: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  frecuenteText: {
    textAlign: "center",
  },

  frecuenteIcon: {
    color: "red",
  },
});
export default LugarFrecuente;

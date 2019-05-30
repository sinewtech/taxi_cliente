import React, { Component } from "react";
import { Text, View, StyleSheet, TouchableNativeFeedback, TouchableOpacity } from "react-native";
import { Icon, Button } from "react-native-elements";
import Ripple from "react-native-material-ripple";

class LugarFrecuente extends Component {
  render() {
    if (Platform.OS === "ios")
      return (
        <TouchableHightlight
          onPress={this.props.onPress}>
          <View style={styles.frecuenteView}>
            <Icon
              name={this.props.icon}
              style={styles.frecuenteIcon}
              size={45}
              color={"#FF9800"}
            />
            <Text style={styles.frecuenteText}>{this.props.name}</Text>
          </View>
        </TouchableHightlight>
      );
    else
      return (
        <TouchableNativeFeedback
          onPress={this.props.onPress}
          background={TouchableNativeFeedback.SelectableBackground()}>
          <View style={styles.frecuenteView}>
            <Icon name={this.props.icon} style={styles.frecuenteIcon} size={45} color={"#FF9800"} />
            <Text style={styles.frecuenteText}>{this.props.name}</Text>
          </View>
        </TouchableNativeFeedback>
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
    lignItems: "center",
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

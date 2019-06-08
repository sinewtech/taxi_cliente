import React, { Component } from "react";
import { TouchableHighlight, Text } from "react-native";

class BottomButton extends Component {
  render() {
    return (
      <TouchableHighlight
        style={{
          backgroundColor: this.props.backgroundColor ? this.props.backgroundColor : "#1E88E5",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
        onPress={this.props.onPress}>
        <Text
          style={{
            color: this.props.textColor ? this.props.textColor : "#FFFFFF",
            fontSize: 16,
          }}>
          {this.props.title}
        </Text>
      </TouchableHighlight>
    );
  }
}

export default BottomButton;

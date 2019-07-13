import React, { Component } from "react";
import { StyleSheet, View, Text } from "react-native";
import { AirbnbRating } from "react-native-elements";

class Rating extends Component {
  render() {
    return (
      <View style={styles.categoryView}>
        <Text style={styles.reviewLabel}>{this.props.title}</Text>
        <View style={styles.reviewView}>
          <AirbnbRating
            style={styles.review}
            count={5}
            onFinishRating={rating => this.props.handleRate(rating, this.props.name)}
            showRating={false}
            reviews={["Muy Mala", "Mala", "Regular", "Buena", "Excelente"]}
            size={20}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  categoryView: {
    //flexDirection: "row",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    //padding: 20,
    borderColor: "lightgray",
    borderWidth: 1,
    borderRadius: 10,
    width: "75%",
    marginBottom: 10,
    //elevation: 10
  },

  reviewLabel: {
    //backgroundColor: "red",
    flex: 3,
    fontSize: 20,
    textAlign: "center",
    width: "100%",
    //borderColor: "lightgray",
    //borderBottomWidth: 1,
    paddingTop: 3,
    paddingBottom: 3,
  },

  reviewView: {
    //backgroundColor: "blue",
    flex: 5,
  },
});

export default Rating;

import { StyleSheet, Dimensions, Animated, Easing } from "react-native";

export const styles = StyleSheet.create({
  whiteBack: {
    backgroundColor: "white",
  },

  noElevation: {
    elevation: 0
  },

  fullCenter: {
    margin: "auto",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
    //alignItems: 'center',
    //justifyContent: 'center',
  },

  searchContainer: {
    position: "absolute",
    flex: 1,
    flexDirection: "row",
    width: "100%",
    height: "10%",
    overflow: "hidden",
    zIndex: 10
  },

  resultView: {
    elevation: 2,
    flex: 1,
    backgroundColor: "white",
    position: "absolute",
    margin: 0,
    shadowOffset: {
      width: 10,
      height: 10,
    },
    shadowOpacity: 1,
    overflow: "hidden",
  },

  searchBar: {
    flex: 1,
    borderRadius: 10,
    marginTop: 10,
    marginRight: 10,
    marginLeft: 10,
    backgroundColor: "#ffffff",
    height: "75%",
    elevation: 2,
    overflow: "hidden"
  },

  searchInput: {
    flex: 1,
    borderBottomColor: "rgba(255, 255, 255, 0)",
  },

  rutaIcon: {
    flex: 1,
    padding: 5,
  },

  iconView: {
    flex: 1,
    backgroundColor: "#ffc107",
    borderRadius: 15,
    borderColor: "#cceeff",
    borderWidth: 0,
    shadowOffset: {
      width: 10,
      height: 10,
    },
    shadowOpacity: 1,
    marginTop: 10,
    marginRight: 15,
    overflow: "hidden",
  },

  searchBackIcon: {
    marginRight: 10,
    marginLeft: -10,
  },

  manual: {
    backgroundColor: "white",
    padding: 10,
    fontSize: 16,
    borderWidth: 0.3,
    borderColor: "#EEEEEE",
    //margin:5,
    //borderRadius: 10,
    //paddingTop:10,
    height: 80,
    borderBottomWidth: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  manualTitle: {
    flex: 1,
    fontSize: 18,
  },

  manualSubtitle: {
    flex: 1,
    fontSize: 14,
    color: "#616161",
  },

  locationButton: {
    elevation: 3,
  },

  locationButtonView: {
    position: "absolute",
    bottom: "35%",
    right: "2%",
    zIndex: 0
  }
});

export let resultViewAnimation = new Animated.Value(0);

/*export let animatedStyles = {
  resultView: {
    width: new Animated.Value(Dimensions.get("window").width * 0.92),
    height: new Animated.Value(Dimensions.get("window").height * 0.32),
    marginLeft: new Animated.Value(Dimensions.get("window").width * 0.04),
    marginRight: new Animated.Value(Dimensions.get("window").width * 0.04),
    borderTopLeftRadius: new Animated.Value(10),
    borderTopRightRadius: new Animated.Value(10),
  },
};*/

export let animatedStyles = {
  resultView: {
    width: resultViewAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["92%", "100%"],
    }),
    height: resultViewAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["32%", "90%"],
    }),
    marginLeft: resultViewAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["4%", "0%"],
    }),
    marginRight: resultViewAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["4%", "0%"],
    }),
    borderRadius: resultViewAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 0],
    }),
    bottom: resultViewAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["2%", "0%"],
    }),
  },
};

export let searchInactiveAnimation = Animated.timing(resultViewAnimation, {
  toValue: 0,
  duration: 300,
  easing: Easing.bezier(0.77, 0, 0.175, 1),
});

export let searchActiveAnimation = Animated.timing(resultViewAnimation, {
  toValue: 1,
  duration: 300,
  easing: Easing.bezier(0.77, 0, 0.175, 1),
});

/*export let searchInactiveAnimation = Animated.parallel([
  Animated.timing(animatedStyles.resultView.width, {
    toValue: Dimensions.get("window").width * 0.92,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
  Animated.timing(animatedStyles.resultView.height, {
    toValue: Dimensions.get("window").height * 0.32,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
  Animated.timing(animatedStyles.resultView.marginLeft, {
    toValue: Dimensions.get("window").width * 0.04,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
  Animated.timing(animatedStyles.resultView.marginRight, {
    toValue: Dimensions.get("window").width * 0.04,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
  Animated.timing(animatedStyles.resultView.borderTopLeftRadius, {
    toValue: 10,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
  Animated.timing(animatedStyles.resultView.borderTopRightRadius, {
    toValue: 10,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
]);

export let searchActiveAnimation = Animated.parallel([
  Animated.timing(animatedStyles.resultView.width, {
    toValue: Dimensions.get("window").width,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
  Animated.timing(animatedStyles.resultView.height, {
    toValue: Dimensions.get("window").height * 0.50,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
  Animated.timing(animatedStyles.resultView.marginLeft, {
    toValue: 0,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
  Animated.timing(animatedStyles.resultView.marginRight, {
    toValue: 0,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
  Animated.timing(animatedStyles.resultView.borderTopLeftRadius, {
    toValue: 0,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
  Animated.timing(animatedStyles.resultView.borderTopRightRadius, {
    toValue: 0,
    duration: 250,
    easing: Easing.bezier(0.77, 0, 0.175, 1),
  }),
]);
*/

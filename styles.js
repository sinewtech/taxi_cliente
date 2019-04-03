import { StyleSheet, Dimensions, Animated, Easing } from "react-native";

export const styles = StyleSheet.create({
  whiteBack: {
    backgroundColor: "white",
  },

  fullCenter: {
    margin: "auto",
    justifyContent: "center",
    alignItems: "center",
  },

  welcomeView: {
    justifyContent: "center",
    //flex:2,
    height: "100%",
    paddingTop: 10,
  },

  welcomeTextView: {
    padding: 0,
    height: "100%",
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
    flex: 3,
  },

  frecuenteView: {
    flex: 1,
    height: "100%",
    marginTop: 25,
    marginBottom: "auto",
  },

  frecuenteText: {
    //backgroundColor: "green",
    textAlign: "center",
  },

  nuevoFrecuenteView: {
    flex: 1,
    padding: 15,
    paddingLeft: 30,
    paddingRight: 30,
  },

  nuevoFrecuenteButton: {
    //margin
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
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 12,
    height: "12%",
    overflow: "hidden",
  },

  resultView: {
    flex: 1,
    backgroundColor: "white",
    position: "absolute",
    margin: 0,
    //paddingTop:10,
    bottom: 0,
    //height: '32%',
    //width: "92%",
    //marginLeft: '4%',
    //marginRight: '4%',
    shadowOffset: {
      width: 10,
      height: 10,
    },
    shadowOpacity: 1,
    //borderTopLeftRadius: 10,
    //borderTopRightRadius: 10,
    overflow: "hidden",
  },

  resultViewShown: {
    transform: [
      {
        translateY: -(Dimensions.get("window").height * 0.56),
      },
    ],
    height: "88%",
    width: "100%",
    marginLeft: 0,
    marginRight: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

  searchBar: {
    flex: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 35,
    marginRight: 10,
    marginLeft: 15,
    backgroundColor: "#ffffff",
    height: 40,
    borderWidth: 0,
    borderColor: "#cceeff",
    padding: 5,
    paddingLeft: 10,
    shadowOffset: {
      width: 10,
      height: 10,
    },
    shadowOpacity: 1,
  },

  searchInput: {
    flex: 6,
    fontSize: 18,
    marginLeft: 10,
  },

  searchBackIcon: {
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
    marginTop: 35,
    marginRight: 15,
    overflow: "hidden",
  },

  icon: {
    padding: 5,
  },

  suggest: {
    backgroundColor: "white",
    padding: 10,
    borderWidth: 0.3,
    borderColor: "#EEEEEE",
    //margin:5,
    //borderRadius: 10,
    //paddingTop:10,
    height: 80,
    justifyContent: "center",
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

  suggestTitle: {
    flex: 1,
    fontSize: 16,
  },

  suggestSubtitle: {
    flex: 1,
    fontSize: 12,
    color: "#616161",
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

  routeView: {
    paddingTop: 5,
    paddingBottom: 5,
    flex: 4,
  },

  routeText: {
    color: "#212121",
    textAlign: "center",
  },

  buttonRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
    marginBottom: 15,
  },

  buyButton: {
    width: "100%",
  },

  buyView: {
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
    padding: 15,
  },

  messageView: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    padding: 15,
  },

  buyConfirm: {},

  displayTitle: {
    flex: 2,
    fontSize: 24,
    color: "black",
    textAlign: "center",
  },

  disclaimer: {
    flex: 1,
    color: "gray",
  },

  fineprintView: {
    flex: 1,
    marginTop: 5,
  },

  fineprintText: {
    color: "lightgray",
    fontSize: 9,
    textAlign: "center",
  },
});

export let animatedStyles = {
  resultView: {
    width: new Animated.Value(Dimensions.get("window").width * 0.92),
    height: new Animated.Value(Dimensions.get("window").height * 0.32),
    marginLeft: new Animated.Value(Dimensions.get("window").width * 0.04),
    marginRight: new Animated.Value(Dimensions.get("window").width * 0.04),
    borderTopLeftRadius: new Animated.Value(10),
    borderTopRightRadius: new Animated.Value(10),
  },
};

export let searchInactiveAnimation = Animated.parallel([
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
    toValue: Dimensions.get("window").height * 0.88,
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

import React, { Component } from "react";
import Home from "./Views/Home";
import { createDrawerNavigator, createAppContainer } from "react-navigation";
class App extends Component {
  render() {
    return <MyApp />;
  }
}

const MyDrawerNavigator = createDrawerNavigator({
  Home: {
    screen: Home,
  },
});

const MyApp = createAppContainer(MyDrawerNavigator);
export default App;

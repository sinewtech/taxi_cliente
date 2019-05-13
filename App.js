import React, { Component } from "react";
import Home from "./Views/Home";
import LogIn from "./Views/LogIn";
import SignUp from "./Views/SignUp";
import Waiting from "./Components/Waiting";
import {
  createDrawerNavigator,
  createAppContainer,
  createStackNavigator,
  createSwitchNavigator,
} from "react-navigation";

class App extends Component {
  render() {
    return <MyApp />;
  }
}

const AppStack = createDrawerNavigator({
  Home: {
    screen: Home,
  },
});

const AuthStack = createStackNavigator({
  LogIn: {
    screen: LogIn,
    navigationOptions: {
      header: null,
    },
  },
  SignUp: {
    screen: SignUp,
    navigationOptions: {
      header: null,
    },
  },
  initialRouteName: "SignUp",
});

const MyApp = createAppContainer(
  createSwitchNavigator(
    {
      AuthLoading: Waiting,
      App: AppStack,
      Auth: AuthStack,
    },
    {
      initialRouteName: "AuthLoading",
    }
  )
);
export default App;

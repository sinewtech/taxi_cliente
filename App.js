import React, { Component } from "react";
import Home from "./Views/Home";
import LogIn from "./Views/LogIn";
import SignUp from "./Views/SignUp";
import UserValidator from "./Components/UserValidator";
import {
  createDrawerNavigator,
  createAppContainer,
  createStackNavigator,
  createSwitchNavigator,
} from "react-navigation";
import LogOut from "./Components/LogOut";

// Ignorar los warnings de firebase

import { YellowBox } from "react-native";
import _ from "lodash";

YellowBox.ignoreWarnings(["Setting a timer"]);
const _console = _.clone(console);
console.warn = message => {
  if (message.indexOf("Setting a timer") <= -1) {
    _console.warn(message);
  }
};

// Termina ignorar los warnings de firebase

class App extends Component {
  render() {
    return <Application />;
  }
}

const AppStack = createDrawerNavigator({
  Home: {
    screen: Home,
  },
  UserValidator: {
    screen: LogOut,
    navigationOptions: ({ navigation }) => ({
      title: "LogOut",
    }),
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

const Application = createAppContainer(
  createSwitchNavigator(
    {
      AuthLoading: UserValidator,
      App: AppStack,
      Auth: AuthStack,
    },
    {
      initialRouteName: "AuthLoading",
    }
  )
);

export default App;

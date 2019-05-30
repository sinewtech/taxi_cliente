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

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MapView, StatusBar } from 'expo';

export default class App extends React.Component {
  constructor(props){
    super(props)
    this.state={streng:""}
  }
  render() {

    fetch('https://facebook.github.io/react-native/movies.json')
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState({streng:JSON.stringify(responseJson.movies)});
      })
      .catch((error) => {
        console.error(error);
      });

    return (
      <View style={{flex:1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 14.0481,
          longitude: -87.1741,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        ><MapView.Marker coordinate={{
          latitude: 14.0481,
          longitude: -87.1741,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        pinColor="blue"
        title="unitek"
        description="untik"/></MapView>
        <View>
          <Text>{this.state.streng}</Text>
        </View >
        </View>

    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

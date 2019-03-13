import React from 'react';
import { StyleSheet, Text, View, StatusBar, TextInput, Alert, Button } from 'react-native';
import { MapView } from 'expo';

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = { streng: "", busqueda: "" }
  }

  render() {
    fetch('https://facebook.github.io/react-native/movies.json')
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState({ streng: JSON.stringify(responseJson.movies) });
      })
      .catch((error) => {
        console.error(error);
      });

    return (
      <View style={styles.container}>
        <MapView
          style={{ flex: 1 }}
          showsCompass={false}
          initialRegion={{
            latitude: 14.0481,
            longitude: -87.1741,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}/>
        <View style={{position:"absolute", flex: 1, width:"100%"}}>
          < TextInput style={styles.searchBar} placeholder={"Buscar un lugar"}
            onChangeText={(busqueda) => this.setState({ busqueda })} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    //alignItems: 'center',
    //justifyContent: 'center',
  },

  searchBar: {
    fontSize: 18,
    borderRadius: 10,
    marginTop: 35,
    marginRight: 15,
    marginLeft: 15,
    backgroundColor: "#ffffff",
    height: 40,
    borderWidth: 1,
    borderColor: "#cceeff",
    paddingLeft: 10,
  },
});

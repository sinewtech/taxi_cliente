import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { MapView, Constants, Location, Permissions } from 'expo';

const API_KEY = "AIzaSyApNgtxFBp0SXSHljP_xku6peNCzjTFWM4";
const decodePolyline = require('decode-google-map-polyline');

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      searchResults: {},
      markers: [],
      lugares: [],

      origin: {lat: 14.0481, lng: -87.1741},
      destination: {lat: 14.0481, lng: -87.1741},
      polyline: [],
      directions: [],

      location: null,
      errorMessage: null,

      busqueda: ""
    };

    this.searchPlaces = (query) => {
      //https://maps.googleapis.com/maps/api/place/findplacefromtext/output?parameters
      //fetch('https://maps.googleapis.com/maps/api/place/findplacefromtext/json?key=' + API_KEY + '&fields=geometry,name,formatted_address&input=' + query + '&inputtype=textquery')
      fetch('https://maps.googleapis.com/maps/api/place/textsearch/json?key=' + API_KEY + '&query=' + query + '&region=hn')
        .then((response) => response.json())
        .then((responseJson) => {
          if (responseJson.status == "OK") {
            //console.log("JSON de lugares encontrados:\n" + JSON.stringify(responseJson));  

            var markers = [];
            var lugares = [];
            var cont = 0;

            //responseJson.candidates.map((candidate) => {
            responseJson.results.map((candidate) => {
              //console.log("candidate " + candidate.name);
              //console.log("latitude " + candidate.geometry.location.lat);
              //console.log("longitude " + candidate.geometry.location.lng);
              cont++;
               markers.push(
                <MapView.Marker
                  key={cont}
                  coordinate={{
                    latitude: candidate.geometry.location.lat,
                    longitude: candidate.geometry.location.lng
                  }}
                  title={candidate.name}
                  description={candidate.formatted_address}
                  pincolor="red"
                  onPress={async () => {
                    await this.setState({destination: {
                      lat: candidate.geometry.location.lat,
                      lng: candidate.geometry.location.lng,
                    }});
                    await this.getPoly(); 
                  }}
                />
               );

               lugares.push(
                {nombre: candidate.name,
                  direccion: candidate.formatted_address,
                  coordenadas: {
                    lat: candidate.geometry.location.lat,
                    lng: candidate.geometry.location.lng
                  }
                }
               );
            })

            this.setState({markers: markers});
            this.setState({lugares: lugares});
          }else{
            console.log("Status failed");
          }
          
          
        })
        .catch((error) => {
          console.error(error);
        });
    };

    this.searchPlaces("popeyes");
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }

    let location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
  };

  async getPoly(){
    await fetch('https://maps.googleapis.com/maps/api/directions/json?key=' + API_KEY + '&origin=' + this.state.origin.lat + ',' + this.state.origin.lng + '&destination=' + this.state.destination.lat + ',' + this.state.destination.lng)
      .then((response) => response.json())
      .then((responseJson) => {
        //console.log(JSON.stringify(responseJson));
        if (responseJson.status == "OK") {
          // console.log(responseJson.routes[0].overview_polyline);
          polyline = decodePolyline(responseJson.routes[0].overview_polyline.points);
          //console.log(polyline);
          this.setState({polyline});
        } else {
          console.log("Status failed");
        }
      })
    }

            
  componentDidMount(){
    this.locationInterval = setInterval(() => {
      this._getLocationAsync();

      if (this.state.location) {
        this.setState({ origin: { lat: this.state.location.coords.latitude, lng: this.state.location.coords.longitude } });
      }

    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.locationInterval);
  }

  render() {
    //console.log("Loaded Markers: " + this.state.markers.toString());
  
    //console.log(this.state.polyline)

    const renderLocation = () => {
      if (this.state.location) {
        return (
          <MapView.Circle
            center={{ latitude: this.state.location.coords.latitude, longitude: this.state.location.coords.longitude }}
            radius={this.state.location.coords.accuracy}
            strokeColor={"rgba(3,169,244,.5)"}
            fillColor={"rgba(3,169,244,.2)"}
          />
        );
      }else{
        return(
          <MapView.Circle
            center={{ latitude: 0, longitude: 0 }}
            radius={0}
            strokeColor={"#00000000"}
            fillColor={"blue"}
          />
        );
      }
    }

    var coords = [];

    this.state.polyline.map((point) => {
      coords.push(
        { latitude: point.lat, longitude: point.lng }
      )
    });

    let text = 'Waiting..';
    if (this.state.errorMessage) {
      text = this.state.errorMessage;
    } else if (this.state.location) {
      text = JSON.stringify(this.state.location);
    }

    console.log(text);

    return (
      <View style={{flex:1 }}>
      <MapView
          style={{ flex: 1 }}
          showsCompass={false}
            initialRegion={{
          latitude: 14.0481,
          longitude: -87.1741,	          
          latitudeDelta: 0.01,	         
          longitudeDelta: 0.01,
        }}>
        
          {
            this.state.markers.map(marker => marker)
          }
          {
            renderLocation()
          }
          <MapView.Polyline
            strokeWidth={4}
            strokeColor="#03A9F4"
            coordinates={coords}
          />
        </MapView>
        <View style={{ position: "absolute", flex: 1, width: "100%" }}>
          <TextInput
            style={styles.searchBar}
            placeholder={"Buscar un lugar"}
            onChangeText = {(busqueda) => this.setState({busqueda})}/>
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
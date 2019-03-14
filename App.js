import React from 'react';
import { StyleSheet, TextInput, View, Animated } from 'react-native';
import { MapView, Constants, Location, Permissions } from 'expo';
import { Icon } from 'react-native-elements'

const API_KEY = "AIzaSyApNgtxFBp0SXSHljP_xku6peNCzjTFWM4";
const decodePolyline = require('decode-google-map-polyline');

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      searchResults: {},
      markers: [],
      lugares: [],

      origin: { lat: 14.0481, lng: -87.1741 },
      destination: { lat: 14.0481, lng: -87.1741 },
      polyline: [],
      directions: [],

      location: null,
      errorMessage: null,

      busqueda: "",

      mapRegion: {
        latitude: 14.0723,
        longitude: -87.1921,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
      }
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
            responseJson.results.map( (candidate) => {
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
                    await this.setState({
                      destination: {
                        lat: candidate.geometry.location.lat,
                        lng: candidate.geometry.location.lng,
                      }
                    });
                    await this.getPoly();
                  }}
                />
              );

              lugares.push(
                {
                  id: cont,
                  nombre: candidate.name,
                  direccion: candidate.formatted_address,
                  coordenadas: {
                    lat: candidate.geometry.location.lat,
                    lng: candidate.geometry.location.lng
                  }
                }
              );
            })

            let mapRegion = {
              latitude: 14.0723,
              longitude: -87.1921,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1
            };

            if (this.state.lugares.length > 0) {
              len = this.state.lugares.length;

              let avLat = 0;
              let avLng = 0;

              this.state.lugares.map((lugar) => {
                avLat += lugar.coordenadas.lat;
                avLng += lugar.coordenadas.lng;
              });

              avLat /= len;
              avLng /= len;

              mapRegion = {
                latitude: avLat,
                longitude: avLng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02
              };

            } else if (this.state.location) {
              loc = this.state.location;

              mapRegion = {
                latitude: loc.lat,
                longitude: loc.lng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02
              };
            }

            //console.log(this.state.mapRegion);
            this.setState({markers, lugares, mapRegion: mapRegion});
            //this._map.animateToCoordinate(mapRegion, 1);

          }else{
            console.log("Status failed");
          }


        })
        .catch((error) => {
          console.error(error);
        });
    };
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

  async getPoly() {
    await fetch('https://maps.googleapis.com/maps/api/directions/json?key=' + API_KEY + '&origin=' + this.state.origin.lat + ',' + this.state.origin.lng + '&destination=' + this.state.destination.lat + ',' + this.state.destination.lng)
      .then((response) => response.json())
      .then((responseJson) => {
        //console.log(JSON.stringify(responseJson));
        if (responseJson.status == "OK") {
          // console.log(responseJson.routes[0].overview_polyline);
          polyline = decodePolyline(responseJson.routes[0].overview_polyline.points);
          //console.log(polyline);
          this.setState({ polyline });
        } else {
          console.log("Status failed");
        }
      })
  }

            
  componentDidMount(){
    //this.locationInterval = setInterval(() => {
      this._getLocationAsync();

      if (this.state.location) {
        this.setState({ origin: { lat: this.state.location.coords.latitude, lng: this.state.location.coords.longitude } });
      }

    //}, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.locationInterval);
  }

  onChangeDestiny(busqueda) {
    this.setState({ busqueda });
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
      } else {
        return (
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

    console.log(this.state.mapRegion);

    let sugerencias = [];

    this.state.lugares.map(suge => {
      console.log(suge.id);
      console.log(suge.direccion);
      sugerencias.push(
      <View key={suge.id + 100} style={styles.suggest}>
        <Text style={styles.suggestTitle} key={suge.id}>{suge.nombre}</Text>
        <Text style={styles.suggestSubtitle} key={suge.id}>{suge.direccion}</Text>
      </View>
      );
    });
    
    console.log(sugerencias);

    return (
      <View style={{flex:1 }}>
      <MapView.Animated
          ref={component => this._map = component}
          style={{ flex: 1 }}
          showsCompass={false}
          initialRegion={{
            latitude: 14.0723,
            longitude: -87.1921,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1
          }}
          region={this.state.mapRegion}
          >
          
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
        </MapView.Animated>
        <View style={{ position: "absolute", flex: 1, width: "100%" }}>
          <TextInput
            onSubmitEditing={() => {
              this.setState({ polyline: [] });
              this.searchPlaces(this.state.busqueda);
            }}
            elevation={3}
            style={styles.searchBar}
            placeholder={"Buscar un lugar"}
            onChangeText={busqueda => this.onChangeDestiny(busqueda)} />
          <View
            style={styles.iconView}
            elevation={3}
            sm={2}
          >
            <Icon
            iconStyle={styles.icon}
            name="search"
            size={30}
            color = "white"
            underlayColor="transparent"
            onPress={() => {
              this.setState({ polyline: [] });
              this.searchPlaces(this.state.busqueda);
            }} />
          </View>
          

        </View>
        <ScrollView style = {styles.resultView}>
          {sugerencias.map(suge => suge)}
        </ScrollView>
        {/*<View style = {{backgroundColor: "#7CFC00", flex: 1, position: "absolute", marginTop: 50}}>
        </View>*/}
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
  searchContainer: {
    position: "absolute",
    flex: 1,
    flexDirection: "row",
    width: "100%",
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultView:{
    flex:1,
    width:"100%",
    backgroundColor:"red",
    position:"absolute",
    margin:0,
    paddingTop:10,
    bottom: 0,
    height: '50%'
  },
  searchBar: {
    flex: 8,
    fontSize: 18,
    borderRadius: 10,
    marginTop: 35,
    marginRight: 10,
    marginLeft: 15,
    backgroundColor: "#ffffff",
    height: 40,
    borderWidth: 0,
    borderColor: "#cceeff",
    paddingLeft: 10,
    shadowOffset: { width: 10, height: 10, },
    shadowOpacity: 1,
  },
  iconView: {
    flex: 1,
    backgroundColor: "#ffc107",
    borderRadius: 15,
    borderColor: "#cceeff",
    borderWidth: 0,
    shadowOffset: { width: 10, height: 10, },
    shadowOpacity: 1,
    marginTop: 35,
    marginRight: 15,
    padding: 5,
  },
  icon: {
    
  },
  suggest: {
    backgroundColor: "white",
    padding: 5,
    fontSize: 16,
    borderWidth: 0.3,
    borderColor: '#EEEEEE',
    margin:0,
    paddingTop:10,
    height: 70
  },

  suggestTitle: {
    flex: 1,
    fontSize: 16,
  },

  suggestSubtitle: {
    flex: 1,
    fontSize: 12,
    color: '#616161'
  }

});
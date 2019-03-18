import React from 'react';
import { StyleSheet, Button, Text, TextInput, View, Animated, Easing, ScrollView, Dimensions, TouchableHighlight, Keyboard, BackHandler } from 'react-native';
import { MapView, Constants, Location, Permissions, AnimatedRegion } from 'expo';
import { Icon } from 'react-native-elements'
import Ripple from 'react-native-material-ripple';

const API_KEY = "AIzaSyApNgtxFBp0SXSHljP_xku6peNCzjTFWM4";
const INITIAL_REGION = {
  latitude: 14.0723,
  longitude: -87.1921,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1
};
const decodePolyline = require('decode-google-map-polyline');

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      searchResults: {},
      markers: [],
      lugares: [],
      lugaresAuto: [],
      lugarActual: {},

      origin: { lat: 14.0481, lng: -87.1741 },
      destination: { name: "Tegucigalpa", lat: 14.0481, lng: -87.1741 },
      polyline: [],
      directions: [],

      location: null,
      errorMessage: null,

      busqueda: "",
      active: false,
      buying: false,
    };

    this.searchPlaces = (query) => {
      this.deactivate();
      //Llamar al api
      fetch('https://maps.googleapis.com/maps/api/place/textsearch/json?key=' + API_KEY + '&query=' + query + '&location=14.0723,-87.1921&radius=30000')
        .then((response) => response.json())
        .then((responseJson) => {
          if (responseJson.status == "OK") {
            //Inicializar resultados de búsqueda
            var markers = [];
            var lugares = [];
            var cont = 0;

            responseJson.results.map( (candidate) => {
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
                        name: candidate.name,
                        lat: candidate.geometry.location.lat,
                        lng: candidate.geometry.location.lng,
                      },
                      buying: true,
                    });
                    await this.getPoly();
                  }}
                />
              );

              lugares.push(
                {
                  id: candidate.place_id,
                  nombre: candidate.name,
                  direccion: candidate.formatted_address,
                  coordenadas: {
                    lat: candidate.geometry.location.lat,
                    lng: candidate.geometry.location.lng
                  }
                }
              );
            })

            this.setState({markers, lugares, polyline: []});

          }else{
            console.log("Status failed");
          }

        })
        .catch((error) => {
          console.error(error);
        });
    };

    this.autocompleteSearch = (query) => {
      this.setState({
        polyline: [],
        active: true,
        busqueda: query,
        lugares: [],
        buying: false,
      });

      fetch('https://maps.googleapis.com/maps/api/place/autocomplete/json?key=' + API_KEY + '&input=' + query + '&components=country:hn&location=14.0723,-87.1921&radius=30000')
        .then((response) => response.json())
        .then((responseJson) => {
          if (responseJson.status == "OK") {
            this.setState({lugaresAuto: responseJson.predictions});
          } else {
            console.log("Status failed");
          }

        })
        .catch((error) => {
          console.error(error);
        });
    };

    this.placeDetails = (query) => {
      fetch('https://maps.googleapis.com/maps/api/place/details/json?key=' + API_KEY + '&placeid=' + query)
        .then((response) => response.json())
        .then((responseJson) => {
          if (responseJson.status == "OK") {
            var markers = [];

            markers.push(
              <MapView.Marker
                key={query}
                coordinate={{
                  latitude: responseJson.result.geometry.location.lat,
                  longitude: responseJson.result.geometry.location.lng
                }}
                title={responseJson.result.name}
                description={responseJson.result.formatted_address}
                pincolor="red"
                onPress={async () => {
                  await this.setState({
                    destination: {
                      name: responseJson.result.name,
                      lat: responseJson.result.geometry.location.lat,
                      lng: responseJson.result.geometry.location.lng,
                    },
                    buying: true,
                  });
                  await this.getPoly();
                }}
              />
            );

            //console.log(responseJson.result.geometry);
            let coords = {
              latitude: responseJson.result.geometry.location.lat,
              longitude: responseJson.result.geometry.location.lng,
              // latitudeDelta: responseJson.result.geometry.viewport.southwest.lat,
              // longitudeDelta: responseJson.result.geometry.viewport.southwest.lng
              latitudeDelta: 0.02,
              longitudeDelta: 0.02
            };

            this.map.animateToRegion(coords, 500);

            this.setState({
              lugarActual: responseJson.result,
              markers,
              active: false
            });
            //this._map.animateToCoordinate({ latitude: responseJson.result.geometry.location.lat, longitude: responseJson.result.geometry.location.lng}, 1);
          } else {
            console.log("Status failed");
          }

        })
        .catch((error) => {
          console.error(error);
        });
    };
  }

  componentDidMount(){
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      this.deactivate(); // works best when the goBack is async
      return true;
    });
  }

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

            
  // componentDidMount(){
  //   this.locationInterval = setInterval(() => {
  //     this._getLocationAsync();

  //     if (this.state.location) {
  //       this.setState({ origin: { lat: this.state.location.coords.latitude, lng: this.state.location.coords.longitude } });
  //     }

  //   }, 5000);
  // }

  componentWillUnmount() {
    clearInterval(this.locationInterval);
  }

  onChangeDestiny(busqueda) {
    this.setState({ busqueda });
  }

  deactivate(){
    this.setState({ active: false, buying: false });
    Keyboard.dismiss();
  }

  activate(){
    this.setState({
      active: true,
      buying: false
    });
  }

  resultViewContent(){
    const manualHeader = (
    <Ripple
      style={styles.manual}
      onPress={() => {
        this.setState({buying: true, active: false, markers: [], polyline: [], destination: {name: this.state.busqueda}});
        Keyboard.dismiss();
      }}
    >
      <View flex={5}>
          <Text style={styles.manualSubtitle}>Ir a esta dirección</Text>
          <Text style={styles.manualTitle}>{this.state.busqueda}</Text>
      </View>
      <View flex={1}>
          <Icon
            name="directions"
            size={40}
            color="#212121"
          />
      </View>
    </Ripple>
    );

    if (this.state.buying) {
      return(
        <View style={styles.buyView}>
          <View flex={4} style={styles.buyConfirm}>
            <Text style={styles.displayTitle}>Confirmar destino</Text>
            <View style={styles.routeView}>
              <Text style={styles.routeText}>{"Mi ubicación"}</Text>
              <Icon
                style={styles.searchBackIcon}
                name="arrow-downward"
                type="material"
                color="gray"
                size={20}
                onPress={
                  () => {
                    this.setState({active: false});
                    Keyboard.dismiss();
                  }
                }
              />
              <Text style={styles.routeText}>{this.state.destination.name}</Text>
            </View>
          </View>
          <Text style={styles.disclaimer}>No se te cobrará nada hasta que aceptes el precio.</Text>
          <View style={styles.fineprintView}>
            <Text style={styles.fineprintText}>Al presionar "Pedir Precio" aceptas nuestros Términos de Servicio.</Text>
          </View>
          <View style={styles.buttonRow}>
            <Button
              style={styles.buyButton}
              title="Cancelar"
              color="#f44336"
              onPress={() => this.setState({buying: false})}
            />
            <Button
              style={styles.buyButton}
              title="Pedir Precio"
              color="#4CAF50"
              onPress={() => console.log("pedido")}
            />
          </View>
        </View>
      );
    }else if (this.state.busqueda == "") {
      return(
        <View style={styles.welcomeView}>
          <View style={styles.welcomeTextView}>
            <Text style={styles.welcomeText}>¿A dónde vamos hoy?</Text>
          </View>
          <View style={styles.lugaresFrecuentes}>
            <View style={styles.frecuenteView}>
              <Icon
                name="directions"
                size={50}
                color="#212121"
              />
              <Text style={styles.frecuenteText}>Test</Text>
            </View>
            <View style={styles.frecuenteView}>
              <Icon
                name="directions"
                size={50}
                color="#212121"
              />
              <Text style={styles.frecuenteText}>Test</Text>
            </View>
            <View style={styles.frecuenteView}>
              <Icon
                name="directions"
                size={50}
                color="#212121"
              />
              <Text style={styles.frecuenteText}>Test</Text>
            </View>
          </View>
          <View style={styles.nuevoFrecuenteView}>
            <Button
              title="Añadir nuevo lugar frecuente"
              style={styles.nuevoFrecuenteButton}
              onPress={() => console.log("nuevo frecuente pressed")}
            />
          </View>
        </View>
      );
    }else{
      if (this.state.lugares.length > 0) {
        let lugares = [];
        
        this.state.lugares.map(suge => {
          lugares.push(
            <Ripple
              key={suge.id}
              onPress={() => {
                this.setState({ polyline: [], buying: true, active: false, destination:{ name: suge.nombre }});
                this.placeDetails(suge.id);
              }}
            >
              <View
                style={styles.suggest}
              >
                <Text style={styles.suggestTitle}>{suge.nombre}</Text>
                <Text style={styles.suggestSubtitle}>{suge.direccion}</Text>
              </View>
            </Ripple>
          );
        });

        return (
          <View>
            {this.state.active ? manualHeader : null}
            <ScrollView>
              {lugares.map(suge => suge)}
            </ScrollView>
          </View>
        );
      }else{
        let sugerencias = [];

        this.state.lugaresAuto.map(suge => {
          sugerencias.push(
            <Ripple
              key={suge.place_id}
              onPress={async () => {
                this.setState({
                  polyline: [],
                  active: false,
                  buying: true,
                  destination: { name: suge.structured_formatting.main_text },
                });
                this.placeDetails(suge.place_id);
              }}
            >
              <View
                style={styles.suggest}
              >
                <Text style={styles.suggestTitle}>{suge.structured_formatting.main_text}</Text>
                <Text style={styles.suggestSubtitle}>{suge.structured_formatting.secondary_text}</Text>
              </View>
            </Ripple>
          );
        });

        return (
          <View>
            {this.state.active ? manualHeader : null}
            <ScrollView>
              {sugerencias.map(suge => suge)}
            </ScrollView>
          </View>
        );
      }
    }
  }

  handleBackPress = () => {
    this.setState({
      polyline: [],
      active: false,
      busqueda: ""
    });

    return true;
  }

  handleLongPress(location) {
      let markers = [];
      //console.log(location);

      markers.push(
        <MapView.Marker
          key={location.timeStamp}
          coordinate={{
            latitude: location.nativeEvent.coordinate.latitude,
            longitude: location.nativeEvent.coordinate.longitude
          }}
          title={"Ir a esta dirección"}
          description={"Marcador manual"}
          pincolor="red"
          onPress={async () => {
            await this.setState({
              destination: {
                name: "Marcador",
                lat: location.nativeEvent.coordinate.latitude,
                lng: location.nativeEvent.coordinate.longitude
              },
              buying: true,
            });
            await this.getPoly();
          }}
        />
      );

      this.setState({ markers });
  }

  drawPolyline(){
    var coords = [];

    this.state.polyline.map((point) => {
      coords.push({
        latitude: point.lat,
        longitude: point.lng
      })
    });

    return coords;
  }

  render() {
    let text = 'Waiting..';
    if (this.state.errorMessage) {
      text = this.state.errorMessage;
    } else if (this.state.location) {
      text = JSON.stringify(this.state.location);
    }

    if (this.state.active) {
      searchActiveAnimation.start();
    } else {
      searchInactiveAnimation.start();
    }
    return (
      <View style={{flex: 1}}>
        <MapView
            onLongPress={this.handleLongPress.bind(this)}
            showsUserLocation={true}
            followsUserLocation={true}
            ref={component => this.map = component}
            style={{ flex: 1 }}
            showsCompass={false}
            initialRegion={INITIAL_REGION}
        >
          {this.state.markers.map(marker => marker)}
          <MapView.Polyline
            strokeWidth={4}
            strokeColor="#03A9F4"
            coordinates={this.drawPolyline()}
          />
        </MapView>
        <View
        style={this.state.active ? [styles.searchContainer, styles.whiteBack] : styles.searchContainer}
        elevation={this.state.active ? 2 : 0}
        >
          <View
            elevation={3}
            style={styles.searchBar}
          >
            {this.state.active ?
            <Icon
              style={styles.searchBackIcon}
              name="arrow-back"
              type="material"
              color="#212121"
              size={20}
              onPress={this.deactivate.bind(this)}
            />
            :
            <Icon
              style={styles.searchBackIcon}
              name="menu"
              type="material"
              color="#212121"
              size={20}
              onPress={() => {console.log("Menu pressed")}}
            />
            }
            <TextInput
              style={styles.searchInput}
              onSubmitEditing={() => {this.searchPlaces(this.state.busqueda)}}
              placeholder={"Buscar lugares"}
              onFocus={this.activate.bind(this)}
              onChangeText={(busqueda) => {
                this.autocompleteSearch(busqueda);
              }}
            />
          </View>
          
          <View
            style={styles.iconView}
            elevation={3}
            underlayColor="#ffc107"
          >
            <Ripple
              onPress={() => {
                this.searchPlaces(this.state.busqueda);
              }}
            >
              <Icon
                iconStyle={styles.icon}
                name="search"
                size={30}
                color="white"
              />
            </Ripple>
          </View>
        </View>

        <Animated.View
          elevation={1}
          style={
            [styles.resultView, animatedStyles.resultView]
          }          
        >
          {this.resultViewContent()}
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  whiteBack: {
    backgroundColor: "white"
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
    flex: 1
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
    flex: 3
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
    paddingBottom: 12,
    height: '12%',
    overflow: 'hidden',
  },

  resultView:{
    flex:1,
    backgroundColor: "white",
    position:"absolute",
    margin:0,
    //paddingTop:10,
    bottom: 0,
    //height: '32%',
    //width: "92%",    
    //marginLeft: '4%',
    //marginRight: '4%',
    shadowOffset: { width: 10, height: 10, },
    shadowOpacity: 1,
    //borderTopLeftRadius: 10,
    //borderTopRightRadius: 10,
    overflow: 'hidden'
  },

  resultViewShown: {
    transform: [
      { translateY: -(Dimensions.get('window').height * 0.56) }
    ],
    height: '88%',
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
    shadowOffset: { width: 10, height: 10, },
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
    shadowOffset: { width: 10, height: 10, },
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
    borderWidth: .3,
    borderColor: '#EEEEEE',
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
    borderWidth: .3,
    borderColor: '#EEEEEE',
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
    color: '#616161'
  },

  manualTitle: {
    flex: 1,
    fontSize: 18,
  },

  manualSubtitle: {
    flex: 1,
    fontSize: 14,
    color: '#616161'
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

  buttonRow:{
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },

  buyButton: {
    width: "100%",
    borderRadius: 0,
  },

  buyView: {
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
    padding: 15,
  },

  buyConfirm: {

  },

  displayTitle: {
    flex: 2,
    fontSize: 24,
    color: "black",
  },

  disclaimer: {
    flex: 1,
    color: "gray",
  },

  fineprintView: {
    flex: 1,
    marginTop: 5,
  },

  fineprintText :{
    color: "lightgray",
    fontSize: 9,
    textAlign: "center",
  }
});

let animatedStyles = {
  resultView: {
    width: new Animated.Value(Dimensions.get('window').width * .92),
    height: new Animated.Value(Dimensions.get('window').height * .32),
    marginLeft: new Animated.Value(Dimensions.get('window').width * .04),
    marginRight: new Animated.Value(Dimensions.get('window').width * .04),
    borderTopLeftRadius: new Animated.Value(10),
    borderTopRightRadius: new Animated.Value(10),
  },
}

let searchInactiveAnimation = Animated.parallel([
  Animated.timing(
    animatedStyles.resultView.width, {
      toValue: Dimensions.get('window').width * .92,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  ),
  Animated.timing(
    animatedStyles.resultView.height, {
      toValue: Dimensions.get('window').height * .32,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  ),
  Animated.timing(
    animatedStyles.resultView.marginLeft, {
      toValue: Dimensions.get('window').width * .04,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  ),
  Animated.timing(
    animatedStyles.resultView.marginRight, {
      toValue: Dimensions.get('window').width * .04,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  ),
  Animated.timing(
    animatedStyles.resultView.borderTopLeftRadius, {
      toValue: 10,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  ),
  Animated.timing(
    animatedStyles.resultView.borderTopRightRadius, {
      toValue: 10,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  )]);

let searchActiveAnimation = Animated.parallel([
  Animated.timing(
    animatedStyles.resultView.width, {
      toValue: Dimensions.get('window').width,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  ),
  Animated.timing(
    animatedStyles.resultView.height, {
      toValue: Dimensions.get('window').height * .88,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  ),
  Animated.timing(
    animatedStyles.resultView.marginLeft, {
      toValue: 0,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  ),
  Animated.timing(
    animatedStyles.resultView.marginRight, {
      toValue: 0,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  ),
  Animated.timing(
    animatedStyles.resultView.borderTopLeftRadius, {
      toValue: 0,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  ),
  Animated.timing(
    animatedStyles.resultView.borderTopRightRadius, {
      toValue: 0,
      duration: 250,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
    }
  )]);
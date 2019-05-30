import React from "react";
import firebase from "@firebase/app";
import "@firebase/firestore";

import {
  Alert,
  Dimensions,
  Text,
  TextInput,
  View,
  Animated,
  ScrollView,
  Keyboard,
  BackHandler,
  ActivityIndicator,
  Platform,
} from "react-native";

import { MapView, Constants, Location, Permissions, Notifications } from "expo";
import { Button, Icon } from "react-native-elements";
import Ripple from "react-native-material-ripple";
import Waiting from "../Components/Waiting";
import Bienvenida from "../Components/Bienvenida.js";
import Recientes from "../Components/Recientes.js";
import Cotizar, {
  CotizarExito,
  CotizarConfirmar,
  CotizarError,
  CotizarAceptar,
} from "../Components/Cotizar.js";

let masterStyles = require("../styles.js");
let styles = masterStyles.styles;
let animatedStyles = masterStyles.animatedStyles;

const QUOTE_STATUS_PENDING = 0;
const QUOTE_STATUS_SUCCESS = 1;
const QUOTE_STATUS_ERROR = 2;

const FLOW_STATUS_NONE = 0;
const FLOW_STATUS_WAITING = 1;
const FLOW_STATUS_SUCCESS = 2;
const FLOW_STATUS_QUOTING = 3;
const FLOW_STATUS_CONFIRMING = 4;
const FLOW_STATUS_CONFIRMED = 5;
const FLOW_STATUS_ERROR = 6;

const API_KEY = "AIzaSyApNgtxFBp0SXSHljP_xku6peNCzjTFWM4";

const INITIAL_REGION = {
  latitude: 14.0723,
  longitude: -87.1921,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};
firebase.initializeApp({
  apiKey: "AIzaSyBkCxRqmYLXkznasnf-MRTROWVJcORIGcw",
  authDomain: "taxiapp-sinewave.firebaseapp.com",
  databaseURL: "https://taxiapp-sinewave.firebaseio.com",
  projectId: "taxiapp-sinewave",
  storageBucket: "taxiapp-sinewave.appspot.com",
  messagingSenderId: "503391985374",
});
const db = firebase.firestore();

async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }
  if (Platform.OS === "android") {
    Expo.Notifications.createChannelAndroidAsync("Cotizacion", {
      name: "cotizacion",
      sound: true,
      vibrate: [0, 250, 250, 250],
      priority: "max",
    });
  }
  let token = "_";

  try {
    token = await Notifications.getExpoPushTokenAsync();
  } catch (e) {
    console.error(e);
  }

  return token;
}

const decodePolyline = require("decode-google-map-polyline");

export default class Home extends React.Component {
  constructor(props) {
    super(props);
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
      usingGps: true,

      location: null,
      errorMessage: null,
      busqueda: "",
      active: false,
      flowStatus: FLOW_STATUS_NONE,
      selectingLocation: "destination",
      quote: {
        mensaje: "Cotización",
        precio: 0.0,
      },
      userUID: "0",
      user: "waiting",
    };

    let save = user => {
      this.setState({ user });

      if (user) {
        this.setState({ userUID: user.uid });
      }
    };

    let register = () => this.registerPush();

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        save(user);
        register();
      } else {
        save(null);
      }
    });
  }
  wait = () => {
    this.setState({ flowStatus: FLOW_STATUS_WAITING });
  };

  searchPlaces = query => {
    this.deactivate();
    //Llamar al api
    fetch(
      "https://maps.googleapis.com/maps/api/place/textsearch/json?key=" +
        API_KEY +
        "&query=" +
        query +
        "&location=14.0723,-87.1921&radius=30000"
    )
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.status == "OK") {
          //Inicializar resultados de búsqueda
          var markers = [];
          var lugares = [];
          var cont = 0;

          responseJson.results.map(candidate => {
            cont++;
            candidate.persist();
            markers.push(
              <MapView.Marker
                key={cont}
                coordinate={{
                  latitude: candidate.geometry.location.lat,
                  longitude: candidate.geometry.location.lng,
                }}
                title={candidate.name}
                description={candidate.formatted_address}
                pincolor="red"
                onPress={async () => {
                  if (this.state.flowStatus === FLOW_STATUS_NONE) {
                    let location = await Location.getProviderStatusAsync();

                    if (location.gpsAvailable && this.state.usingGps) {
                      let gpslocation = await Location.getCurrentPositionAsync();
                      console.log("Current Location", gpslocation);

                      await this.setState({
                        origin: {
                          lat: gpslocation.coords.latitude,
                          lng: gpslocation.coords.longitude,
                        },

                        destination: {
                          name: "Marcador",
                          lat: candidate.nativeEvent.coordinate.latitude,
                          lng: candidate.nativeEvent.coordinate.longitude,
                        },
                        flowStatus: FLOW_STATUS_QUOTING,
                      });

                      await this.getPoly();
                    } else {
                      Alert.alert(
                        "Servicios GPS",
                        "Por favor active los servicios de GPS para continuar."
                      );
                    }
                  } else {
                    Alert.alert("Error", "Solo puedes pedir una carrera a la vez.");
                  }
                }}
              />
            );

            lugares.push({
              id: candidate.place_id,
              nombre: candidate.name,
              direccion: candidate.formatted_address,
              coordenadas: {
                lat: candidate.geometry.location.lat,
                lng: candidate.geometry.location.lng,
              },
            });
          });

          this.setState({ markers, lugares, polyline: [] });
        } else {
          console.log("Status failed");
        }
      })
      .catch(error => {
        console.error(error);
      });
  };

  componentDidMount = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);

    if (status !== "granted") {
      Alert.alert("Servicios GPS", "Por favor deje que el app pueda trabajar con el gps");
    }
  };

  autocompleteSearch = query => {
    this.setState({
      polyline: [],
      active: true,
      busqueda: query,
      lugares: [],
      flowStatus: FLOW_STATUS_NONE,
    });

    fetch(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json?key=" +
        API_KEY +
        "&input=" +
        query +
        "&components=country:hn&location=14.0723,-87.1921&radius=30000"
    )
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.status == "OK") {
          this.setState({ lugaresAuto: responseJson.predictions });
        } else {
          console.log("Status failed");
        }
      })
      .catch(error => {
        console.error(error);
      });
  };

  placeDetails = query => {
    this.wait();

    fetch(
      "https://maps.googleapis.com/maps/api/place/details/json?key=" + API_KEY + "&placeid=" + query
    )
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.status == "OK") {
          var markers = this.state.markers;

          if (this.state.selectingLocation != "origin") {
            markers = [];
          }

          markers.push(
            <MapView.Marker
              key={query}
              coordinate={{
                latitude: responseJson.result.geometry.location.lat,
                longitude: responseJson.result.geometry.location.lng,
              }}
              title={responseJson.result.name}
              description={responseJson.result.formatted_address}
              pincolor={this.state.selectingLocation == "origin" ? "blue" : "red"}
              onPress={async () => {
                if (this.state.flowStatus === FLOW_STATUS_NONE) {
                  let location = await Location.getProviderStatusAsync();

                  if (location.gpsAvailable) {
                    await this.setState({
                      flowStatus: FLOW_STATUS_QUOTING,
                    });

                    if (this.state.selectingLocation == "origin") {
                      await this.setState({
                        origin: {
                          name: responseJson.result.name,
                          lat: responseJson.result.geometry.location.lat,
                          lng: responseJson.result.geometry.location.lng,
                        },
                      });
                    } else {
                      await this.setState({
                        destination: {
                          name: responseJson.result.name,
                          lat: responseJson.result.geometry.location.lat,
                          lng: responseJson.result.geometry.location.lng,
                        },
                      });
                    }

                    await this.getPoly();
                  } else {
                    Alert.alert("Servicios GPS", "Por favor active los servicios GPS");
                  }
                }
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
            longitudeDelta: 0.02,
          };

          this.map.animateToRegion(coords, 500);

          this.setState({
            lugarActual: responseJson.result,
            markers,
            active: false,
            flowStatus: FLOW_STATUS_QUOTING,
          });

          if (this.state.selectingLocation == "origin") {
            this.setState({
              origin: {
                name: responseJson.result.name,
                address: responseJson.result.formatted_address,
                lat: responseJson.result.geometry.location.lat,
                lng: responseJson.result.geometry.location.lng,
                placeId: query,
              },
            });
          } else {
            this.setState({
              destination: {
                name: responseJson.result.name,
                address: responseJson.result.formatted_address,
                lat: responseJson.result.geometry.location.lat,
                lng: responseJson.result.geometry.location.lng,
                placeId: query,
              },
            });
          }
          //this._map.animateToCoordinate({ latitude: responseJson.result.geometry.location.lat, longitude: responseJson.result.geometry.location.lng}, 1);
        } else {
          console.log("Status failed");
        }
      })
      .catch(error => {
        console.error(error);
      });
  };

  registerPush = () => {
    registerForPushNotificationsAsync()
      .then(pushToken => {
        console.log(pushToken);
        if (pushToken) {
          db.collection("clients")
            .doc(this.state.userUID)
            .get()
            .then(DocumentSnapshot => {
              let pushTokens = [];
              if (DocumentSnapshot.data()["pushDevices"]) {
                console.log("PushDevices encontrado para usuario.");
                let deviceJson = DocumentSnapshot.data()["pushDevices"];
                for (var token in deviceJson) {
                  if (deviceJson[token] === pushToken) {
                    console.log("Pushtoken ya existe para usuario.");
                    return;
                  } else {
                    console.log("Agregando nuevo PushToken", pushToken);
                    pushTokens.push(pushToken);
                  }
                }
              } else {
                pushTokens.push(pushToken);
              }
              console.log("celulares", pushTokens);
              db.collection("clients")
                .doc(this.state.userUID)
                .update({
                  pushDevices: pushTokens,
                });
            })
            .catch(e => {
              console.log(e);
            });
        } else {
          console.error("Pushtoken nulo");
        }
      })
      .catch(e => console.error(e));

    this._notificationSubscription = Notifications.addListener(this._handleNotification);

    this.backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      this.deactivate(); // works best when the goBack is async
      return true;
    });
  };

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== "granted") {
      console.error("No se tiene permiso para el GPS");
    }

    let location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
  };

  _handleNotification = notification => {
    Notifications.dismissAllNotificationsAsync();
    if (notification.data.id == 1) {
      console.log("Quote recibida: ", notification);
      this.setState({
        quote: {
          mensaje: notification.data.mensaje,
          precio: notification.data.precio,
        },
        flowStatus: FLOW_STATUS_CONFIRMING,
      });
    }
  };

  async getPoly() {
    await fetch(
      "https://maps.googleapis.com/maps/api/directions/json?key=" +
        API_KEY +
        "&origin=" +
        this.state.origin.lat +
        "," +
        this.state.origin.lng +
        "&destination=" +
        this.state.destination.lat +
        "," +
        this.state.destination.lng
    )
      .then(response => response.json())
      .then(responseJson => {
        //console.log(JSON.stringify(responseJson));
        if (responseJson.status == "OK") {
          // console.log(responseJson.routes[0].overview_polyline);
          polyline = decodePolyline(responseJson.routes[0].overview_polyline.points);
          //console.log(polyline);
          this.setState({ polyline });
        } else {
          console.log("Status failed");
        }
      });
  }

  onChangeDestiny(busqueda) {
    this.setState({ busqueda });
  }

  deactivate = () => {
    if (this.state.flowStatus == FLOW_STATUS_NONE) {
      this.setState({ active: false, flowStatus: FLOW_STATUS_NONE });
    } else {
      this.cancelOrder();
    }

    Keyboard.dismiss();
  };

  activate() {
    this.setState({
      active: true,
      flowStatus: FLOW_STATUS_NONE,
    });
  }

  clear = () => {
    this.setState({
      active: false,
      flowStatus: FLOW_STATUS_NONE,
      polyline: [],
      markers: [],
      lugares: [],
      busqueda: "",
      selectingLocation: "destination",
      usingGps: true,
    });
  };

  selectOrigin = () => {
    this.setState({
      flowStatus: FLOW_STATUS_NONE,
      selectingLocation: "origin",
      usingGps: false,
    });
  };

  selectDestination = () => {
    this.setState({
      active: false,
      flowStatus: FLOW_STATUS_NONE,
      selectingLocation: "destination",
    });
    Keyboard.dismiss();
  };

  cancelOrder = () => {
    Alert.alert("Cancelando carrera", "¿Estas seguro de que quieres cancelar tu carrera?", [
      { text: "Regresar" },
      {
        text: "Cancelar Carrera",
        onPress: () => {
          this.clear();
          if (this.state.currentOrder) {
            firebase
              .database()
              .ref("/quotes/" + this.state.currentOrder + "/status")
              .set(-1);
          }
        },
        style: "cancel",
      },
    ]);
  };

  quoteSuccess = () => {
    this.setState({ flowStatus: FLOW_STATUS_SUCCESS, usingGps: true });
  };

  quoteError = () => {
    this.setState({ flowStatus: FLOW_STATUS_ERROR, usingGps: true });
  };

  handleQuote = async () => {
    console.log("Preparando para enviar orden...");

    this.wait();
    let data = {};

    if (this.state.usingGps) {
      console.log("Enviando carrera con GPS...");

      let location = await Location.getProviderStatusAsync();

      if (location.gpsAvailable) {
        await this._getLocationAsync();

        data = {
          userUID: this.state.userUID,
          origin: {
            name: "Ubicación del Cliente",
            address: "Obtenida por GPS",
            lat: this.state.location.coords.latitude,
            lng: this.state.location.coords.longitude,
          },
          destination: this.state.destination,
          status: QUOTE_STATUS_PENDING,
          usingGps: this.state.usingGps,
        };

        console.log("Enviando orden", data);
        var key = firebase
          .database()
          .ref()
          .child("quotes")
          .push().key;

        this.setState({ currentOrder: key });

        var updates = {};
        updates["/quotes/" + key] = data;

        firebase
          .database()
          .ref()
          .update(updates, error => (error ? this.quoteError() : this.quoteSuccess()));
      } else {
        Alert.alert("Servicios GPS", "Por favor active los servicios de GPS para continuar.");
        quoteError();
      }
    } else {
      console.log("Enviando carrera con origen manual...");

      data = {
        userUID: this.state.userUID,
        origin: {
          name: this.state.origin.name,
          address: this.state.origin.address
            ? this.state.origin.address
            : "Adquiriendo punto de referencia...",
          lat: this.state.origin.lat,
          lng: this.state.origin.lng,
        },
        destination: this.state.destination,
        status: QUOTE_STATUS_PENDING,
        usingGps: this.state.origin.address ? this.state.usingGps : true,
      };

      console.log("Enviando orden", data);
      var key = firebase
        .database()
        .ref()
        .child("quotes")
        .push().key;

      this.setState({ currentOrder: key });

      var updates = {};
      updates["/quotes/" + key] = data;

      firebase
        .database()
        .ref()
        .update(updates, error => (error ? this.quoteError() : this.quoteSuccess()));
    }
  };

  handleConfirm = () => {
    this.wait();

    if (this.state.currentOrder === undefined) {
      this.setState({ flowStatus: FLOW_STATUS_ERROR });
      return;
    }

    var updates = {};
    updates["/quotes/" + this.state.currentOrder + "/status"] = 2;

    firebase
      .database()
      .ref()
      .update(updates, error =>
        error
          ? this.setState({ flowStatus: FLOW_STATUS_ERROR })
          : this.setState({ flowStatus: FLOW_STATUS_CONFIRMED })
      );
  };

  resultViewContent() {
    const manualHeader = (
      <Ripple
        style={styles.manual}
        onPress={() => {
          this.setState({
            flowStatus: FLOW_STATUS_QUOTING,
            active: false,
            markers: [],
            polyline: [],
            destination: { name: this.state.busqueda },
          });
          Keyboard.dismiss();
        }}>
        <View flex={5}>
          <Text style={styles.manualSubtitle}>Ir a esta dirección</Text>
          <Text style={styles.manualTitle}>{this.state.busqueda}</Text>
        </View>
        <View flex={1}>
          <Icon name="directions" size={40} color="#212121" />
        </View>
      </Ripple>
    );

    if (this.state.flowStatus != FLOW_STATUS_NONE) {
      switch (this.state.flowStatus) {
        case FLOW_STATUS_QUOTING:
          return (
            <Cotizar
              usingGps={this.state.usingGps}
              origin={this.state.origin.name}
              destination={this.state.destination.name}
              selectOrigin={this.selectOrigin}
              selectDestination={this.selectDestination}
              onConfirm={this.handleQuote}
              onCancel={this.cancelOrder}
            />
          );
        case FLOW_STATUS_WAITING:
          return <ActivityIndicator size={50} color="#FF9800" style={styles.fullCenter} />;
        case FLOW_STATUS_SUCCESS:
          return;
          <CotizarExito destination={this.state.destination.name} onCancel={this.cancelOrder} />;
        case FLOW_STATUS_CONFIRMING:
          return (
            <CotizarConfirmar
              onConfirm={this.handleConfirm}
              onCancel={this.cancelOrder}
              price={this.state.quote.precio}
              destination={this.state.destination.name}
            />
          );
        case FLOW_STATUS_ERROR:
          return <CotizarError onConfirm={this.clear} />;
        case FLOW_STATUS_CONFIRMED:
          return <CotizarAceptar onCancel={this.cancelOrder} />;
        default:
          break;
      }
    } else if (this.state.busqueda == "") {
      return this.state.active ? (
        <Recientes />
      ) : (
        <Bienvenida selectingOrigin={this.state.selectingLocation == "origin"} />
      );
    } else {
      if (this.state.lugares.length > 0) {
        let lugares = [];

        this.state.lugares.map(suge => {
          lugares.push(
            <Ripple
              key={suge.id}
              onPress={() => {
                this.setState({
                  polyline: [],
                  flowStatus: FLOW_STATUS_QUOTING,
                  active: false,
                });

                {
                  this.state.selectingLocation == "origin"
                    ? this.setState({ origin: { name: suge.nombre } })
                    : this.setState({ destination: { name: suge.nombre } });
                }

                this.placeDetails(suge.id);
              }}>
              <View style={styles.suggest}>
                <Text style={styles.suggestTitle}>{suge.nombre}</Text>
                <Text style={styles.suggestSubtitle}>{suge.direccion}</Text>
              </View>
            </Ripple>
          );
        });

        return (
          <View>
            {this.state.active ? manualHeader : null}
            <ScrollView keyboardShouldPersistTaps={"handled"}>
              {lugares.map(suge => suge)}
            </ScrollView>
          </View>
        );
      } else {
        let sugerencias = [];

        this.state.lugaresAuto.map(suge => {
          sugerencias.push(
            <Ripple
              key={suge.place_id}
              onPress={async () => {
                this.setState({
                  flowStatus: FLOW_STATUS_WAITING,
                  polyline: [],
                });

                this.placeDetails(suge.place_id);
              }}>
              <View style={styles.suggest}>
                <Text style={styles.suggestTitle}>{suge.structured_formatting.main_text}</Text>
                <Text style={styles.suggestSubtitle}>
                  {suge.structured_formatting.secondary_text}
                </Text>
              </View>
            </Ripple>
          );
        });

        return (
          <View>
            {this.state.active ? manualHeader : null}
            <ScrollView keyboardShouldPersistTaps={"handled"}>
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
      busqueda: "",
    });

    return true;
  };

  handleLongPress = marketlocation => {
    if (this.state.flowStatus !== FLOW_STATUS_NONE) return;

    let markers = [];
    marketlocation.persist();
    markers.push(
      <MapView.Marker
        key={marketlocation.timeStamp}
        coordinate={{
          latitude: marketlocation.nativeEvent.coordinate.latitude,
          longitude: marketlocation.nativeEvent.coordinate.longitude,
        }}
        title={"Ir a esta dirección"}
        description={"Marcador manual"}
        pincolor="red"
        onPress={async () => {
          if (this.state.flowStatus === FLOW_STATUS_NONE) {
            if (this.state.usingGps) {
              let location = await Location.getProviderStatusAsync();

              if (location.gpsAvailable) {
                let gpslocation = await Location.getCurrentPositionAsync({});

                await this.setState({
                  origin: {
                    lat: gpslocation.coords.latitude,
                    lng: gpslocation.coords.longitude,
                  },
                  destination: {
                    name: "Marcador",
                    lat: marketlocation.nativeEvent.coordinate.latitude,
                    lng: marketlocation.nativeEvent.coordinate.longitude,
                  },
                  flowStatus: FLOW_STATUS_QUOTING,
                });

                await this.getPoly();
              } else {
                Alert.alert(
                  "Servicios GPS",
                  "Por favor active los servicios de GPS para continuar."
                );
              }
            } else {
              if (this.state.selectingLocation == "origin") {
                await this.setState({
                  origin: {
                    name: "Marcador",
                    lat: marketlocation.nativeEvent.coordinate.latitude,
                    lng: marketlocation.nativeEvent.coordinate.longitude,
                  },
                  flowStatus: FLOW_STATUS_QUOTING,
                });
              } else {
                await this.setState({
                  destination: {
                    name: "Marcador",
                    lat: marketlocation.nativeEvent.coordinate.latitude,
                    lng: marketlocation.nativeEvent.coordinate.longitude,
                  },
                  flowStatus: FLOW_STATUS_QUOTING,
                });
              }

              await this.getPoly();
            }
          }
        }}
      />
    );

    this.setState({ markers });
  };

  handlePoiClick(location) {
    if (this.state.flowStatus == FLOW_STATUS_NONE) {
      this.placeDetails(location.nativeEvent.placeId);
    }
  }

  drawPolyline() {
    var coords = [];

    this.state.polyline.map(point => {
      coords.push({
        latitude: point.lat,
        longitude: point.lng,
      });
    });

    return coords;
  }

  render() {
    if (this.state.user) {
      if (this.state.user === "waiting") {
        return <Waiting />;
      } else {
        let text = "Waiting..";
        if (this.state.errorMessage) {
          text = this.state.errorMessage;
        } else if (this.state.location) {
          text = JSON.stringify(this.state.location);
        }

        if (this.state.active) {
          masterStyles.searchActiveAnimation.start();
        } else {
          masterStyles.searchInactiveAnimation.start();
        }
        return (
          <View style={{ flex: 1 }}>
            <MapView
              onLongPress={this.handleLongPress}
              onPoiClick={this.handlePoiClick.bind(this)}
              showsUserLocation={true}
              followsUserLocation={true}
              ref={component => (this.map = component)}
              style={{ flex: 1 }}
              showsCompass={false}
              initialRegion={INITIAL_REGION}
              mapPadding={{
                top: Dimensions.get("window").height * 0.11,
                right: 0,
                bottom: Dimensions.get("window").height * 0.33,
                left: 0,
              }}>
              {this.state.markers.map(marker => marker)}
              <MapView.Polyline
                strokeWidth={4}
                strokeColor="#03A9F4"
                coordinates={this.drawPolyline()}
              />
            </MapView>
            <View
              style={
                this.state.active
                  ? [styles.searchContainer, styles.whiteBack]
                  : styles.searchContainer
              }
              elevation={this.state.active ? 2 : 0}>
              <View elevation={3} style={styles.searchBar}>
                {this.state.active || this.state.flowStatus != FLOW_STATUS_NONE ? (
                  <Icon
                    style={styles.searchBackIcon}
                    name="arrow-back"
                    type="material"
                    color="#212121"
                    size={20}
                    onPress={this.deactivate}
                  />
                ) : (
                  <Icon
                    style={styles.searchBackIcon}
                    name="menu"
                    type="material"
                    color="#212121"
                    size={20}
                    onPress={() => {
                      this.props.navigation.openDrawer();
                      console.log("Menu pressed");
                    }}
                  />
                )}
                <TextInput
                  editable={this.state.flowStatus === FLOW_STATUS_NONE}
                  style={styles.searchInput}
                  onSubmitEditing={() => {
                    this.searchPlaces(this.state.busqueda);
                  }}
                  placeholder={
                    this.state.flowStatus === FLOW_STATUS_NONE
                      ? "Buscar lugares"
                      : "Esperando respuesta..."
                  }
                  onFocus={this.activate.bind(this)}
                  onChangeText={busqueda => {
                    this.autocompleteSearch(busqueda);
                  }}
                  returnKeyType="search"
                />
              </View>

              <View style={styles.iconView} elevation={3} underlayColor="#ffc107">
                <Ripple
                  onPress={
                    this.state.flowStatus === FLOW_STATUS_NONE
                      ? () => this.searchPlaces(this.state.busqueda)
                      : () => Alert.alert("Error", "Solo puedes pedir un taxi a la vez.")
                  }>
                  <Icon iconStyle={styles.icon} name="search" size={30} color="white" />
                </Ripple>
              </View>
            </View>

            <Animated.View elevation={1} style={[styles.resultView, animatedStyles.resultView]}>
              {this.resultViewContent()}
            </Animated.View>
          </View>
        );
      }
    }
  }
}

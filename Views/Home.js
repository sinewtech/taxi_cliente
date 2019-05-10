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
} from "react-native";
import { MapView, Permissions, Notifications } from "expo";
import { Button, Icon } from "react-native-elements";
import Ripple from "react-native-material-ripple";

import { SignIn, Waiting } from "../Components/Auth.js";

let masterStyles = require("../styles.js");
let styles = masterStyles.styles;
let animatedStyles = masterStyles.animatedStyles;

const QUOTE_STATUS_PENDING = 0;
const QUOTE_STATUS_SUCCESS = 1;
const QUOTE_STATUS_ERROR = 2;

const FLOW_STATUS_NONE = 0;
const FLOW_STATUS_WAITING = 1;
const FLOW_STATUS_SUCCESS = 2;
const FLOW_STATUS_CONFIRMING = 3;
const FLOW_STATUS_CONFIRMED = 4;
const FLOW_STATUS_ERROR = 5;

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

  // only ask if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  if (existingStatus !== "granted") {
    // Android remote notification permissions are granted during the app
    // install, so this will only ask on iOS
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Get the token that uniquely identifies this device
  //console.log("Asking for push token...");
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

      location: null,
      errorMessage: null,

      busqueda: "",
      active: false,
      buying: false,
      flowStatus: FLOW_STATUS_NONE,
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
        // User is signed in.
        /*var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
        var providerData = user.providerData;*/
        console.log("aqui toy :v");
        save(user);
        register();
      } else {
        save(null);
      }
    });

    this.searchPlaces = query => {
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

    this.autocompleteSearch = query => {
      this.setState({
        polyline: [],
        active: true,
        busqueda: query,
        lugares: [],
        buying: false,
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

    this.placeDetails = query => {
      fetch(
        "https://maps.googleapis.com/maps/api/place/details/json?key=" +
          API_KEY +
          "&placeid=" +
          query
      )
        .then(response => response.json())
        .then(responseJson => {
          if (responseJson.status == "OK") {
            var markers = [];

            markers.push(
              <MapView.Marker
                key={query}
                coordinate={{
                  latitude: responseJson.result.geometry.location.lat,
                  longitude: responseJson.result.geometry.location.lng,
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
              longitudeDelta: 0.02,
            };

            this.map.animateToRegion(coords, 500);

            this.setState({
              lugarActual: responseJson.result,
              markers,
              active: false,
              destination: {
                name: responseJson.result.name,
                address: responseJson.result.formatted_address,
                lat: responseJson.result.geometry.location.lat,
                lng: responseJson.result.geometry.location.lng,
              },
              buying: true,
              flowStatus: FLOW_STATUS_NONE,
            });
            //this._map.animateToCoordinate({ latitude: responseJson.result.geometry.location.lat, longitude: responseJson.result.geometry.location.lng}, 1);
          } else {
            console.log("Status failed");
          }
        })
        .catch(error => {
          console.error(error);
        });
    };

    this.registerPush = this.registerPush.bind(this);
    this.handleQuote = this.handleQuote.bind(this);
    this.handleConfirm = this.handleConfirm.bind(this);
  }
  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== "granted") {
      this.setState({
        errorMessage: "Permission to access location was denied",
      });
    }

    let location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
  };
  registerPush() {
    registerForPushNotificationsAsync()
      .then(pushToken => {
        console.log(pushToken);
        if (pushToken) {
          console.log("entre :V");
          db.collection("clients")
            .doc(this.state.userUID)
            .get()
            .then(DocumentSnapshot => {
              let pushTokens = [];
              if (DocumentSnapshot.exists) {
                let deviceJson = DocumentSnapshot.data()["pushDevices"];
                for (var token in deviceJson) {
                  if (deviceJson[token] === pushToken) {
                    console.log("Pushtoken ya existe para usuario.");
                    return;
                  } else {
                    pushTokens.push(deviceJson[token]);
                  }
                }
              } else {
                pushTokens.push(pushToken);
              }
              db.collection("clients")
                .doc(this.state.userUID)
                .set({
                  email: this.state.user.email,
                  username: "test",
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

    this._notificationSubscription = Notifications.addListener(this._handleNotification.bind(this));

    this.backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      this.deactivate(); // works best when the goBack is async
      return true;
    });

    this._getLocationAsync = this._getLocationAsync.bind(this);
  }

  _handleNotification(notification) {
    console.log("Quote recibida: ", notification);
    this.setState({
      quote: {
        mensaje: notification.data.mensaje,
        precio: notification.data.precio,
      },
      flowStatus: FLOW_STATUS_CONFIRMING,
    });
  }

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
  componentWillUnmount() {
    clearInterval(this.locationInterval);
  }

  onChangeDestiny(busqueda) {
    this.setState({ busqueda });
  }

  deactivate() {
    this.setState({ active: false, buying: false });
    Keyboard.dismiss();
  }

  activate() {
    this.setState({
      active: true,
      buying: false,
    });
  }

  async handleQuote() {
    let quoteSuccess = () => {
      this.setState({ flowStatus: FLOW_STATUS_SUCCESS });
    };

    let quoteError = () => {
      this.setState({ flowStatus: FLOW_STATUS_ERROR });
    };

    this.setState({ flowStatus: FLOW_STATUS_WAITING });

    await this._getLocationAsync();

    let data = {
      userUID: this.state.userUID,
      origin: {
        address: "Ubicación del Cliente",
        lat: this.state.location.coords.latitude,
        lng: this.state.location.coords.longitude,
      },
      destination: this.state.destination,
      status: QUOTE_STATUS_PENDING,
    };

    console.log("Enviando orden", data);

    var key = firebase
      .database()
      .ref()
      .child("quotes")
      .push().key;
    var updates = {};
    updates["/quotes/" + key] = data;

    firebase
      .database()
      .ref()
      .update(updates, error => (error ? quoteError() : quoteSuccess()));
  }

  handleConfirm() {
    this.setState({ flowStatus: FLOW_STATUS_CONFIRMED });
  }

  resultViewContent() {
    const manualHeader = (
      <Ripple
        style={styles.manual}
        onPress={() => {
          this.setState({
            buying: true,
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
        case FLOW_STATUS_WAITING:
          return (
            <View className="fullCenter">
              <ActivityIndicator size="large" color="#FF9800" />
            </View>
          );
        case FLOW_STATUS_SUCCESS:
          return (
            <View style={styles.messageView}>
              <View flex={2}>
                <Icon name="check-circle" size={70} color="#4CAF50" />
              </View>
              <Text flex={1}>Cotizando taxi a</Text>
              <Text style={styles.displayTitle} flex={1}>
                {this.state.destination.name}
              </Text>
              <Text style={styles.disclaimer} flex={1}>
                Recibirás en breve una notificación con el precio.
              </Text>
            </View>
          );
        case FLOW_STATUS_CONFIRMING:
          return (
            <View style={styles.messageView}>
              <View flex={2}>
                <Icon name="local-taxi" size={70} color="#FF9800" />
              </View>
              <Text flex={1}>Precio a {this.state.destination.name}</Text>
              <Text style={styles.displayTitle} flex={1}>
                L. {this.state.quote.precio}
              </Text>
              <View style={styles.buttonRow} flex={1}>
                <Button
                  style={styles.buyButton}
                  title="Cancelar"
                  color="#f44336"
                  onPress={() => this.setState({ buying: false })}
                />
                <Button
                  style={styles.buyButton}
                  title="Pedir Taxi"
                  color="#4CAF50"
                  onPress={this.handleConfirm}
                />
              </View>
            </View>
          );
        case FLOW_STATUS_ERROR:
          return (
            <View style={styles.messageView}>
              <View flex={2}>
                <Icon name="error" size={70} color="#f44336" />
              </View>
              <Text style={styles.displayTitle} flex={1}>
                Ocurrió un Error
              </Text>
              <Button
                title="Regresar"
                onPress={() => this.setState({ buying: false, flowStatus: FLOW_STATUS_NONE })}
              />
            </View>
          );
        case FLOW_STATUS_CONFIRMED:
          return (
            <View style={styles.messageView}>
              <View flex={2}>
                <Icon name="check-circle" size={70} color="#4CAF50" />
              </View>
              <Text flex={1}>¡Éxito!</Text>
              <Text style={styles.displayTitle} flex={1}>
                Tu Génesis ya va en camino.
              </Text>
              <Text style={styles.disclaimer} flex={1}>
                ¡Gracias por tu preferencia!
              </Text>
            </View>
          );
        default:
          break;
      }
    } else if (this.state.buying) {
      return (
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
              />
              <Text style={styles.routeText}>{this.state.destination.name}</Text>
            </View>
          </View>
          <Text style={styles.disclaimer}>No se te cobrará nada hasta que aceptes el precio.</Text>
          <View style={styles.fineprintView}>
            <Text style={styles.fineprintText}>
              Al presionar "Pedir Precio" aceptas nuestros Términos de Servicio.
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <Button
              style={styles.buyButton}
              title="Cancelar"
              color="#f44336"
              onPress={() => this.setState({ buying: false })}
            />
            <Button
              style={styles.buyButton}
              title="Pedir Precio"
              color="#4CAF50"
              onPress={this.handleQuote}
            />
          </View>
        </View>
      );
    } else if (this.state.busqueda == "") {
      return (
        <View style={styles.welcomeView}>
          <View style={styles.welcomeTextView}>
            <Text style={styles.welcomeText}>¿A dónde vamos hoy?</Text>
          </View>
          <View style={styles.lugaresFrecuentes}>
            <View style={styles.frecuenteView}>
              <Ripple>
                <Icon name="home" size={50} color="#FFB300" />
                <Text style={styles.frecuenteText}>Casa</Text>
              </Ripple>
            </View>
            <View style={styles.frecuenteView}>
              <Ripple>
                <Icon name="work" size={50} color="#FFB300" />
                <Text style={styles.frecuenteText}>Trabajo</Text>
              </Ripple>
            </View>
            <View style={styles.frecuenteView}>
              <Ripple>
                <Icon name="book" size={50} color="#FFB300" />
                <Text style={styles.frecuenteText}>Colegio</Text>
              </Ripple>
            </View>
          </View>
          <View style={styles.nuevoFrecuenteView}>
            <Button
              title="Añadir nuevo lugar frecuente"
              //style={styles.nuevoFrecuenteButton}
              onPress={() => console.log("nuevo frecuente pressed")}
            />
          </View>
        </View>
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
                  buying: true,
                  active: false,
                  destination: { name: suge.nombre },
                });
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
            <ScrollView>{lugares.map(suge => suge)}</ScrollView>
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
            <ScrollView>{sugerencias.map(suge => suge)}</ScrollView>
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

  handleLongPress(location) {
    let markers = [];
    //console.log(location);

    markers.push(
      <MapView.Marker
        key={location.timeStamp}
        coordinate={{
          latitude: location.nativeEvent.coordinate.latitude,
          longitude: location.nativeEvent.coordinate.longitude,
        }}
        title={"Ir a esta dirección"}
        description={"Marcador manual"}
        pincolor="red"
        onPress={async () => {
          await this.setState({
            destination: {
              name: "Marcador",
              lat: location.nativeEvent.coordinate.latitude,
              lng: location.nativeEvent.coordinate.longitude,
            },
            buying: true,
          });
          await this.getPoly();
        }}
      />
    );

    this.setState({ markers });
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
              onLongPress={this.handleLongPress.bind(this)}
              showsUserLocation={true}
              followsUserLocation={true}
              ref={component => (this.map = component)}
              style={{ flex: 1 }}
              showsCompass={false}
              initialRegion={INITIAL_REGION}
              mapPadding={{
                top: Dimensions.get("window").height * 0.15,
                right: 0,
                bottom: Dimensions.get("window").height * 0.35,
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
                {this.state.active ? (
                  <Icon
                    style={styles.searchBackIcon}
                    name="arrow-back"
                    type="material"
                    color="#212121"
                    size={20}
                    onPress={this.deactivate.bind(this)}
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
    } else {
      return <SignIn />;
    }
  }
}

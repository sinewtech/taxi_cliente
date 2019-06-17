import React from "react";
import firebase from "../firebase";

import {
  Alert,
  Dimensions,
  Text,
  View,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  BackHandler,
  ActivityIndicator,
  Platform,
} from "react-native";

import { Notifications } from "expo";
import * as Permissions from "expo-permissions";
import * as Location from "expo-location";
import MapView from "react-native-maps";
import { Icon, Input } from "react-native-elements";
import Waiting from "../Components/Waiting";
import Bienvenida from "../Components/Bienvenida.js";
import Recientes from "../Components/Recientes.js";
import {
  FlowCotizar,
  FlowExito,
  FlowConfirmar,
  FlowError,
  FlowAceptar,
  FlowAbordando,
  FlowViajando,
  FlowTerminado,
} from "../Components/Flow.js";
import { TouchableNativeFeedback } from "react-native-gesture-handler";

let masterStyles = require("../../styles.js");
let styles = masterStyles.styles;
let animatedStyles = masterStyles.animatedStyles;

const FIRESTORE = firebase.firestore();

const COLOR_AMBER = "#FFC107";
const COLOR_ORANGE = "#FF9800";
const COLOR_GREEN = "#4CAF50";
const COLOR_LIGHTGREEN = "#8BC34A";
const COLOR_BLUE = "#2196F3";
const COLOR_LIGHTBLUE = "#03A9F4";
const COLOR_RED = "#f44336";

const QUOTE_STATUS_PENDING = 0;
const QUOTE_STATUS_SUCCESS = 1;
const QUOTE_STATUS_ERROR = -1;

const FLOW_STATUS_NONE = 0;
const FLOW_STATUS_WAITING = 1;
const FLOW_STATUS_SUCCESS = 2;
const FLOW_STATUS_QUOTING = 3;
const FLOW_STATUS_CONFIRMING = 4;
const FLOW_STATUS_CONFIRMED = 5;
const FLOW_STATUS_BOARDING = 6;
const FLOW_STATUS_TRAVELLING = 7;
const FLOW_STATUS_ARRIVED = 8;
const FLOW_STATUS_ERROR = -1;

const API_KEY = "AIzaSyApNgtxFBp0SXSHljP_xku6peNCzjTFWM4";

const REFERENCE_RADIUS = 100;
const SEARCH_RADIUS = 20000;

const INITIAL_REGION = {
  latitude: 14.0723,
  longitude: -87.1921,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const rad = x => {
  return (x * Math.PI) / 180;
};

const getDistance = (p1, p2) => {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat - p1.lat);
  var dLong = rad(p2.lng - p1.lng);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

const isInSearchRange = (lat, lng) => {
  let dist = getDistance(
    {
      lat,
      lng,
    },
    {
      lat: INITIAL_REGION.latitude,
      lng: INITIAL_REGION.longitude,
    }
  );

  console.log("dist", dist);
  return dist <= SEARCH_RADIUS;
};

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
    Notifications.createChannelAndroidAsync("cotizacion", {
      name: "Cotizacion",
      priority: "max",
      vibrate: [0, 250, 250, 250],
      sound: true,
    });

    Notifications.createChannelAndroidAsync("ads", {
      name: "Ads",
      priority: "max",
      vibrate: [0, 250, 250, 250],
      sound: true,
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
      userData: {},
    };

    let register = () => this.registerPush();

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.saveUser(user);
        register();
      } else {
        this.saveUser(null);
      }
    });
  }

  saveUser = async user => {
    await this.setState({ user });

    if (user) {
      await this.setState({ userUID: user.uid });

      var docRef = FIRESTORE.collection("clients").doc(this.state.userUID);

      docRef
        .get()
        .then(doc => {
          if (doc.exists) {
            this.setState({ userData: doc.data() });
          } else {
            // doc.data() will be undefined in this case
            console.log("No se encontraron los datos del usuario.");
          }
        })
        .catch(error => {
          console.error("Error recuperando los datos del usuario:", error);
        });
    }
  };

  wait = () => {
    this.setState({ flowStatus: FLOW_STATUS_WAITING });
  };

  getPlaceReference = async (lat, lng) => {
    let query =
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=" +
      API_KEY +
      "&location=" +
      lat +
      "," +
      lng +
      "&radius=" +
      REFERENCE_RADIUS;

    return fetch(query)
      .then(response => response.json())
      .then(responseJson => {
        for (let place of responseJson.results) {
          if (place.name != "Tegucigalpa") {
            console.log("Se encontró un lugar cercano:", place.name);
            return "Cerca de " + place.name;
          }
        }

        return "Ubicación Exacta";
      })
      .catch(e => {
        console.error(e);
        return "Ocurrió un error";
      });
  };

  searchPlaces = query => {
    this.deactivate();
    //Llamar al api
    fetch(
      "https://maps.googleapis.com/maps/api/place/textsearch/json?key=" +
        API_KEY +
        "&query=" +
        query +
        "&location=14.0723,-87.1921&radius=20000"
    )
      .then(response => response.json())
      .then(async responseJson => {
        if (responseJson.status == "OK") {
          //Inicializar resultados de búsqueda
          var markers = [];
          var lugares = [];
          var cont = 0;

          //console.log("Text search results:", responseJson);

          responseJson.results.map(candidate => {
            cont++;

            if (!isInSearchRange(candidate.geometry.location.lat, candidate.geometry.location.lng))
              return;

            markers.push(
              <MapView.Marker
                key={cont}
                coordinate={{
                  latitude: candidate.geometry.location.lat,
                  longitude: candidate.geometry.location.lng,
                }}
                title={candidate.name}
                description={candidate.formatted_address}
                pinColor={this.state.selectingLocation === "origin" ? COLOR_BLUE : COLOR_RED}
                onPress={async () => {
                  this.placeDetails(candidate.place_id);
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
              icono: candidate.icon,
            });
          });

          await this.setState({ markers, lugares, polyline: [] });
          this.map.fitToElements(true);
        } else {
          console.log("No se pudo encontrar el lugar", query);
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
        "&components=country:hn&location=14.0723,-87.1921&radius=20000&strictbounds"
    )
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.status == "OK") {
          this.setState({ lugaresAuto: responseJson.predictions });
        } else {
          console.log("No se pudo autocompletar", query);
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
      .then(async responseJson => {
        if (responseJson.status === "OK") {
          await this.setMarkerLocations(
            responseJson.result.geometry.location.lat,
            responseJson.result.geometry.location.lng
          );

          this.setState({
            lugarActual: responseJson.result,
            active: false,
            flowStatus: FLOW_STATUS_QUOTING,
          });

          let placeDetails = {
            name: responseJson.result.name,
            address: responseJson.result.formatted_address,
            lat: responseJson.result.geometry.location.lat,
            lng: responseJson.result.geometry.location.lng,
            placeId: query,
          };

          if (this.state.selectingLocation === "origin") {
            this.setState({
              origin: placeDetails,
            });
          } else {
            this.setState({
              destination: placeDetails,
            });
          }
        } else {
          console.log("No se pudo conseguir detalles del lugar", query, responseJson);
        }
      })
      .catch(error => {
        console.error(error);
      });
  };

  registerPush = () => {
    registerForPushNotificationsAsync()
      .then(pushToken => {
        if (pushToken) {
          firebase
            .firestore()
            .collection("clients")
            .doc(this.state.userUID)
            .get()
            .then(DocumentSnapshot => {
              let pushTokens = [];
              if (DocumentSnapshot.data()["pushDevices"]) {
                console.log("PushDevices encontrado para usuario.");
                let deviceJson = DocumentSnapshot.data()["pushDevices"];
                for (var token in deviceJson) {
                  if (deviceJson[token] === pushToken) {
                    console.log("PushToken ya existe para usuario.");
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
              firebase
                .firestore()
                .collection("clients")
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
    // Notifications.dismissAllNotificationsAsync();
    switch (notification.data.id) {
      case 1: {
        console.log("Quote recibida: ", notification);
        this.setState({
          quote: {
            mensaje: notification.data.mensaje,
            precio: notification.data.precio,
          },
          flowStatus: FLOW_STATUS_CONFIRMING,
        });

        break;
      }
      case 2: {
        this.setState({ flowStatus: FLOW_STATUS_BOARDING });
      }
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
          console.log(
            "Polyline fallida con origen",
            this.state.origin,
            " y destino",
            this.state.destination
          );
        }
      });
  }

  onChangeDestiny(busqueda) {
    this.setState({ busqueda });
  }

  deactivate = () => {
    if (this.state.flowStatus === FLOW_STATUS_NONE) {
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
      busqueda: "",
      lugares: [],
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
        origin: this.state.origin,
        destination: this.state.destination,
        status: QUOTE_STATUS_PENDING,
        usingGps: false,
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
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.SelectableBackground()}
        onPress={() => {
          this.setState({
            flowStatus: FLOW_STATUS_QUOTING,
            active: false,
            markers: [],
            polyline: [],
          });

          if (this.state.selectingLocation === "origin") {
            this.setState({ origin: { name: this.state.busqueda } });
          } else {
            this.setState({ destination: { name: this.state.busqueda } });
          }
          Keyboard.dismiss();
        }}>
        <View style={styles.manual}>
          <View flex={5}>
            <Text style={styles.manualSubtitle}>Ir a esta dirección</Text>
            <Text style={styles.manualTitle}>{this.state.busqueda}</Text>
          </View>
          <View flex={1}>
            <Icon name="directions" size={25} color={COLOR_GREEN} reverse raised />
          </View>
        </View>
      </TouchableNativeFeedback>
    );

    if (this.state.flowStatus != FLOW_STATUS_NONE) {
      switch (this.state.flowStatus) {
        case FLOW_STATUS_QUOTING:
          return (
            <FlowCotizar
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
          return (
            <FlowExito destination={this.state.destination.name} onCancel={this.cancelOrder} />
          );
        case FLOW_STATUS_CONFIRMING:
          return (
            <FlowConfirmar
              onConfirm={this.handleConfirm}
              onCancel={this.cancelOrder}
              price={this.state.quote.precio}
              destination={this.state.destination.name}
            />
          );
        case FLOW_STATUS_ERROR:
          return <FlowError onConfirm={this.clear} />;
        case FLOW_STATUS_CONFIRMED:
          return <FlowAceptar onCancel={this.cancelOrder} />;
        case FLOW_STATUS_BOARDING:
          console.log("estado", this.state);
          return <FlowAbordando order={this.state.currentOrder} />;
        case FLOW_STATUS_TRAVELLING:
          return <FlowViajando panic={this.cancelOrder} />;
        case FLOW_STATUS_ARRIVED:
          return <FlowTerminado dismiss={this.setState({ flowStatus: FLOW_STATUS_NONE })} />;
        default:
          break;
      }
    } else if (this.state.busqueda === "") {
      return this.state.active ? (
        <Recientes />
      ) : (
        <Bienvenida
          userName={this.state.userData.firstName}
          selectingOrigin={this.state.selectingLocation == "origin"}
        />
      );
    } else {
      if (this.state.lugares.length > 0) {
        let lugares = [];

        this.state.lugares.map(candidate => {
          lugares.push(
            <TouchableNativeFeedback
              background={TouchableNativeFeedback.SelectableBackground()}
              key={candidate.id}
              onPress={async () => {
                await this.wait();
                await this.clear();
                await this.deactivate();
                await this.placeDetails(candidate.id);
              }}>
              <View>
                <View style={styles.suggest}>
                  <Text style={styles.suggestTitle}>{candidate.nombre}</Text>
                  <Text style={styles.suggestSubtitle}>{candidate.direccion}</Text>
                </View>
              </View>
            </TouchableNativeFeedback>
          );
        });

        return (
          <KeyboardAvoidingView behavior="padding">
            {this.state.active ? manualHeader : null}
            <ScrollView keyboardShouldPersistTaps={"handled"}>
              {lugares.map(candidate => candidate)}
            </ScrollView>
          </KeyboardAvoidingView>
        );
      } else {
        let sugerencias = [];

        this.state.lugaresAuto.map(candidate => {
          sugerencias.push(
            <TouchableNativeFeedback
              background={TouchableNativeFeedback.SelectableBackground()}
              key={candidate.place_id}
              onPress={async () => {
                await this.wait();
                await this.clear();
                await this.deactivate();
                await this.placeDetails(candidate.place_id);
              }}>
              <View>
                <View style={styles.suggest}>
                  <Text style={styles.suggestTitle}>
                    {candidate.structured_formatting.main_text}
                  </Text>
                  <Text style={styles.suggestSubtitle}>
                    {candidate.structured_formatting.secondary_text}
                  </Text>
                </View>
              </View>
            </TouchableNativeFeedback>
          );
        });

        return (
          <View>
            {this.state.active ? manualHeader : null}
            <ScrollView keyboardShouldPersistTaps={"handled"}>
              {sugerencias.map(candidate => candidate)}
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

  getUserLocation = async () => {
    let location = await Location.getProviderStatusAsync();

    if (location.gpsAvailable) {
      let gpslocation = await Location.getCurrentPositionAsync({});

      await this.setState({
        origin: {
          lat: gpslocation.coords.latitude,
          lng: gpslocation.coords.longitude,
        },
      });
    } else {
      Alert.alert("Servicios GPS", "Por favor active los servicios de GPS para continuar.");
    }
  };

  setCoordinates = async (lat, lng) => {
    await this.getPlaceReference(lat, lng).then(async placeName => {
      if (this.state.usingGps) await this.getUserLocation();

      if (this.state.selectingLocation === "origin") {
        await this.setState({
          origin: {
            name: placeName,
            lat,
            lng,
          },
          flowStatus: FLOW_STATUS_QUOTING,
        });
      } else {
        await this.setState({
          destination: {
            name: placeName,
            lat,
            lng,
          },
          flowStatus: FLOW_STATUS_QUOTING,
        });
      }

      await this.getPoly();
    });
  };

  setMarkerLocations = async (lat, lng) => {
    await this.setCoordinates(lat, lng);
    let markers = [];

    markers.push(
      <MapView.Marker
        key={"origin"}
        coordinate={{
          latitude: this.state.origin.lat,
          longitude: this.state.origin.lng,
        }}
        title={"Origen"}
        description={"Te recogeremos en esta dirección"}
        pinColor={COLOR_BLUE}
        //draggable={true}
        /*onDragStart={async () => {
          await this.setState({ usingGps: false, selectingLocation: "origin" });
          this.wait();
        }}
        onDragEnd={(lat, lng) => this.setMarkerLocations(lat, lng)}*/
      />
    );

    markers.push(
      <MapView.Marker
        key={"destination"}
        coordinate={{
          latitude: this.state.destination.lat,
          longitude: this.state.destination.lng,
        }}
        title={"Destino"}
        description={"Vamos a esta dirección"}
        pinColor={COLOR_RED}
        //onPress={setMarkerLocations}
        //draggable={true}
        /*onDragStart={async () => {
          await this.setState({ usingGps: false, selectingLocation: "destination" });
          this.wait();
        }}
        onDragEnd={(lat, lng) => this.setMarkerLocations(lat, lng)}*/
      />
    );

    await this.setState({ markers });
    this.map.fitToElements(true);
    //}
  };

  handleLongPress = async markerLocation => {
    if (this.state.flowStatus !== FLOW_STATUS_NONE && this.state.flowStatus !== FLOW_STATUS_QUOTING)
      return;

    if (
      !isInSearchRange(
        markerLocation.nativeEvent.coordinate.latitude,
        markerLocation.nativeEvent.coordinate.longitude
      )
    ) {
      Alert.alert(
        "No podemos ir a ese lugar",
        "Lo sentimos, el lugar que seleccionaste está fuera de nuestra área de servicio."
      );
      return;
    }

    markerLocation.persist();
    this.wait();

    this.setMarkerLocations(
      markerLocation.nativeEvent.coordinate.latitude,
      markerLocation.nativeEvent.coordinate.longitude
    );
  };

  handlePoiClick = location => {
    if (
      !isInSearchRange(
        location.nativeEvent.coordinate.latitude,
        location.nativeEvent.coordinate.longitude
      )
    ) {
      Alert.alert(
        "No podemos ir a ese lugar",
        "Lo sentimos, el lugar que seleccionaste está fuera de nuestra área de servicio."
      );
      return;
    }

    if (
      this.state.flowStatus === FLOW_STATUS_NONE ||
      this.state.flowStatus === FLOW_STATUS_QUOTING
    ) {
      this.placeDetails(location.nativeEvent.placeId);
    }
  };

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
              ref={component => (this.map = component)}
              style={{ flex: 1 }}
              showsCompass={false}
              initialRegion={INITIAL_REGION}
              mapPadding={{
                top: Dimensions.get("window").height * 0.09,
                right: Dimensions.get("window").width * 0.02,
                bottom: Dimensions.get("window").height * 0.33,
                left: Dimensions.get("window").width * 0.02,
              }}>
              {this.state.markers.map(marker => marker)}
              <MapView.Polyline
                strokeWidth={4}
                strokeColor={COLOR_LIGHTBLUE}
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
              <Input
                editable={this.state.flowStatus === FLOW_STATUS_NONE}
                containerStyle={
                  this.state.active ? [styles.searchBar, styles.noElevation] : styles.searchBar
                }
                inputContainerStyle={styles.searchInput}
                underlineColorAndroid="transparent"
                onSubmitEditing={() => {
                  this.searchPlaces(this.state.busqueda);
                }}
                placeholder={
                  this.state.flowStatus === FLOW_STATUS_NONE
                    ? "Buscar lugares"
                    : this.state.destination.name
                    ? "A " + this.state.destination.name
                    : "Cafés cerca de Metrópolis"
                }
                onFocus={this.activate.bind(this)}
                onChangeText={busqueda => {
                  this.autocompleteSearch(busqueda);
                }}
                returnKeyType="search"
                leftIcon={
                  this.state.active || this.state.flowStatus !== FLOW_STATUS_NONE ? (
                    <Icon
                      iconStyle={styles.searchBackIcon}
                      name="arrow-back"
                      color="#212121"
                      size={22}
                      onPress={this.deactivate}
                    />
                  ) : (
                    <Icon
                      iconStyle={styles.searchBackIcon}
                      name="menu"
                      type="material"
                      color="#212121"
                      size={22}
                      onPress={() => {
                        this.props.navigation.openDrawer();
                        console.log("Menu pressed");
                      }}
                    />
                  )
                }
                rightIcon={
                  <Icon
                    iconStyle={styles.icon}
                    name="search"
                    size={25}
                    color={COLOR_ORANGE}
                    onPress={() => {
                      if (this.state.flowStatus === FLOW_STATUS_NONE) {
                        if (this.state.active) {
                          this.searchPlaces(this.state.busqueda);
                          this.deactivate();
                        } else {
                          this.activate();
                        }
                      } else {
                        Alert.alert("Error", "Solo puedes pedir un taxi a la vez.");
                      }
                    }}
                  />
                }
              />
            </View>

            <Animated.View style={[styles.resultView, animatedStyles.resultView]}>
              {this.resultViewContent()}
            </Animated.View>
          </View>
        );
      }
    }
  }
}

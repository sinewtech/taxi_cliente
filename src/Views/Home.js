import React from "react";
import firebase from "../firebase.js";

import * as Constants from "../Constants.js";

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
  FlowNoEncontrado,
} from "../Components/Flow.js";
import { TouchableNativeFeedback } from "react-native-gesture-handler";

let masterStyles = require("../../styles.js");
let styles = masterStyles.styles;
let animatedStyles = masterStyles.animatedStyles;

/*
registerForPushNotificationsAsync

Retorna un ExponentPushToken, un identificador único para cada dispositivo.
Con este identificador se le pueden enviar Push Notifications al dispositivo via
el servidor push de Expo.
*/
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

    //Inicializar el estado
    this.state = {
      active: false,
      flowStatus: Constants.FLOW_STATUS_NONE,

      userUid: "0",
      user: "waiting",
      userData: {},

      searchQuery: "",
      searchResults: {},

      markers: [],
      places: [],
      placesAuto: [],
      currentPlace: {},

      usingGps: true,
      location: null,

      selectingLocation: Constants.LOCATION_DESTINATION,
      origin: { lat: 14.0481, lng: -87.1741 },
      destination: { name: "Tegucigalpa", lat: 14.0481, lng: -87.1741 },
      directions: [],
      polyline: [],

      quote: {
        mensaje: "Cotización",
        precio: 0.0,
      },
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

  componentDidMount = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);

    if (status !== "granted") {
      Alert.alert(
        "Servicios GPS",
        "Para que el app funcione correctamente, debe permitir el uso del gps."
      );
    }
  };

  //saveUser: Guarda al usuario actual en el estado y recupera sus datos de Firestore.
  saveUser = async user => {
    await this.setState({ user });

    if (user) {
      await this.setState({ userUid: user.uid });

      var docRef = Constants.FIRESTORE.collection("clients").doc(this.state.userUid);

      docRef
        .get()
        .then(doc => {
          if (doc.exists) {
            this.setState({ userData: doc.data() });
          } else {
            // doc.data() va a ser indefinido en este caso
            console.log("No se encontraron los datos del usuario.");
          }
        })
        .catch(error => {
          console.error("Error recuperando los datos del usuario:", error);
        });
    }
  };

  goToUserLocation = async ask => {
    if (this.map) {
      if (ask) await this._getLocationAsync();
      this.map.animateToRegion({
        latitude: this.state.location.coords.latitude,
        longitude: this.state.location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  wait = () => {
    this.setState({ flowStatus: Constants.FLOW_STATUS_WAITING });
  };

  getPlaceReference = async (lat, lng) => {
    let query =
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=" +
      Constants.MAPS_API_KEY +
      "&location=" +
      lat +
      "," +
      lng +
      "&radius=" +
      Constants.REFERENCE_RADIUS;

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
        Constants.MAPS_API_KEY +
        "&query=" +
        query +
        "&location=14.0723,-87.1921&radius=" +
        Constants.SEARCH_RADIUS
    )
      .then(response => response.json())
      .then(async responseJson => {
        if (responseJson.status == "OK") {
          //Inicializar resultados de búsqueda
          var markers = [];
          var places = [];
          var cont = 0;

          //console.log("Text search results:", responseJson);

          responseJson.results.map(candidate => {
            cont++;

            if (
              !Constants.pointIsInSearchRange(
                candidate.geometry.location.lat,
                candidate.geometry.location.lng
              )
            )
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
                pinColor={
                  this.state.selectingLocation === Constants.LOCATION_ORIGIN
                    ? Constants.COLOR_BLUE
                    : Constants.COLOR_RED
                }
                onPress={async () => {
                  this.placeDetails(candidate.place_id);
                }}
              />
            );

            places.push({
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

          await this.setState({ markers, places, polyline: [] });
          this.map.fitToElements(true);
        } else {
          console.log("No se pudo encontrar el lugar", query);
          this.setState({ flowStatus: Constants.FLOW_STATUS_NO_RESULTS });
        }
      })
      .catch(error => {
        console.error(error);
      });
  };

  autocompleteSearch = query => {
    this.setState({
      polyline: [],
      active: true,
      searchQuery: query,
      places: [],
      flowStatus: Constants.FLOW_STATUS_NONE,
    });

    fetch(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json?key=" +
        Constants.MAPS_API_KEY +
        "&input=" +
        query +
        "&components=country:hn&location=14.0723,-87.1921&radius=20000&strictbounds"
    )
      .then(response => response.json())
      .then(responseJson => {
        if (responseJson.status == "OK") {
          this.setState({ placesAuto: responseJson.predictions });
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
    console.log("Recuperando detalles para", this.state.selectingLocation, query);

    fetch(
      "https://maps.googleapis.com/maps/api/place/details/json?key=" +
        Constants.MAPS_API_KEY +
        "&placeid=" +
        query
    )
      .then(response => response.json())
      .then(async responseJson => {
        if (responseJson.status === "OK") {
          await this.setMarkerLocations(
            responseJson.result.geometry.location.lat,
            responseJson.result.geometry.location.lng
          );

          this.setState({
            currentPlace: responseJson.result,
            active: false,
            flowStatus: Constants.FLOW_STATUS_QUOTING,
          });

          let placeDetails = {
            name: responseJson.result.name,
            address: responseJson.result.formatted_address,
            lat: responseJson.result.geometry.location.lat,
            lng: responseJson.result.geometry.location.lng,
            placeId: query,
          };

          if (this.state.selectingLocation === Constants.LOCATION_ORIGIN) {
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
            .doc(this.state.userUid)
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
                .doc(this.state.userUid)
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
    await this.setState({ location });
  };

  _handleNotification = notification => {
    // Notifications.dismissAllNotificationsAsync();
    switch (notification.data.id) {
      case Constants.NOTIFICATION_QUOTE: {
        console.log("Quote recibida: ", notification);
        this.setState({
          quote: {
            mensaje: notification.data.mensaje,
            precio: notification.data.precio,
          },
          flowStatus: Constants.FLOW_STATUS_CONFIRMING,
        });

        break;
      }
      case Constants.NOTIFICATION_BOARDING: {
        this.setState({ flowStatus: Constants.FLOW_STATUS_BOARDING });
      }
    }
  };

  async getPoly() {
    await fetch(
      "https://maps.googleapis.com/maps/api/directions/json?key=" +
        Constants.MAPS_API_KEY +
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

  onChangeDestiny(searchQuery) {
    this.setState({ searchQuery });
  }

  deactivate = () => {
    if (this.state.flowStatus === Constants.FLOW_STATUS_NONE) {
      this.setState({ active: false, flowStatus: Constants.FLOW_STATUS_NONE });
    } else {
      this.cancelOrder();
    }

    Keyboard.dismiss();
  };

  activate() {
    this.setState({
      active: true,
      flowStatus: Constants.FLOW_STATUS_NONE,
    });
  }

  reset = () => {
    this.setState({
      active: false,
      flowStatus: Constants.FLOW_STATUS_NONE,
      polyline: [],
      markers: [],
      places: [],
      searchQuery: "",
      selectingLocation: Constants.LOCATION_DESTINATION,
      usingGps: true,
    });
  };

  clear = () => {
    this.setState({
      active: false,
      flowStatus: Constants.FLOW_STATUS_NONE,
      polyline: [],
      markers: [],
      places: [],
      searchQuery: "",
    });
  };

  selectOrigin = () => {
    console.log("Seleccionando origen");

    this.setState({
      flowStatus: Constants.FLOW_STATUS_NONE,
      selectingLocation: Constants.LOCATION_ORIGIN,
      usingGps: false,
      searchQuery: "",
      places: [],
    });
  };

  selectDestination = () => {
    this.setState({
      active: false,
      flowStatus: Constants.FLOW_STATUS_NONE,
      selectingLocation: Constants.LOCATION_DESTINATION,
    });
    Keyboard.dismiss();
  };

  cancelOrder = () => {
    Alert.alert("Cancelando carrera", "¿Estas seguro de que quieres cancelar tu carrera?", [
      { text: "Regresar" },
      {
        text: "Cancelar Carrera",
        onPress: () => {
          this.reset();
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
    this.setState({ flowStatus: Constants.FLOW_STATUS_SUCCESS, usingGps: true });
  };

  quoteError = () => {
    this.setState({ flowStatus: Constants.FLOW_STATUS_ERROR, usingGps: true });
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
          userUid: this.state.userUid,
          origin: {
            name: "Ubicación del Cliente",
            address: "Obtenida por GPS",
            lat: this.state.location.coords.latitude,
            lng: this.state.location.coords.longitude,
          },
          destination: this.state.destination,
          status: Constants.QUOTE_STATUS_PENDING,
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
        userUid: this.state.userUid,
        origin: this.state.origin,
        destination: this.state.destination,
        status: Constants.QUOTE_STATUS_PENDING,
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
      this.setState({ flowStatus: Constants.FLOW_STATUS_ERROR });
      return;
    }

    var updates = {};
    updates["/quotes/" + this.state.currentOrder + "/status"] = 2;

    firebase
      .database()
      .ref()
      .update(updates, error =>
        error
          ? this.setState({ flowStatus: Constants.FLOW_STATUS_ERROR })
          : this.setState({ flowStatus: Constants.FLOW_STATUS_CONFIRMED })
      );
  };

  resultViewContent() {
    const manualHeader = (
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.SelectableBackground()}
        onPress={() => {
          this.setState({
            flowStatus: Constants.FLOW_STATUS_QUOTING,
            active: false,
            markers: [],
            polyline: [],
          });

          if (this.state.selectingLocation === Constants.LOCATION_ORIGIN) {
            this.setState({ origin: { name: this.state.searchQuery } });
          } else {
            this.setState({ destination: { name: this.state.searchQuery } });
          }
          Keyboard.dismiss();
        }}>
        <View style={styles.manual}>
          <View flex={5}>
            <Text style={styles.manualSubtitle}>Ir a esta dirección</Text>
            <Text style={styles.manualTitle}>{this.state.searchQuery}</Text>
          </View>
          <View flex={1}>
            <Icon name="directions" size={25} color={Constants.COLOR_GREEN} reverse raised />
          </View>
        </View>
      </TouchableNativeFeedback>
    );

    if (this.state.flowStatus != Constants.FLOW_STATUS_NONE) {
      switch (this.state.flowStatus) {
        case Constants.FLOW_STATUS_QUOTING:
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
        case Constants.FLOW_STATUS_WAITING:
          return <ActivityIndicator size={50} color="#FF9800" style={styles.fullCenter} />;
        case Constants.FLOW_STATUS_SUCCESS:
          return (
            <FlowExito destination={this.state.destination.name} onCancel={this.cancelOrder} />
          );
        case Constants.FLOW_STATUS_CONFIRMING:
          return (
            <FlowConfirmar
              onConfirm={this.handleConfirm}
              onCancel={this.cancelOrder}
              price={this.state.quote.precio}
              destination={this.state.destination.name}
            />
          );
        case Constants.FLOW_STATUS_ERROR:
          return <FlowError onConfirm={this.clear} />;
        case Constants.FLOW_STATUS_CONFIRMED:
          return <FlowAceptar onCancel={this.cancelOrder} />;
        case Constants.FLOW_STATUS_BOARDING:
          console.log("estado", this.state);
          return <FlowAbordando order={this.state.currentOrder} />;
        case Constants.FLOW_STATUS_TRAVELLING:
          return <FlowViajando panic={this.cancelOrder} />;
        case Constants.FLOW_STATUS_ARRIVED:
          return (
            <FlowTerminado dismiss={this.setState({ flowStatus: Constants.FLOW_STATUS_NONE })} />
          );
        case Constants.FLOW_STATUS_NO_RESULTS:
          return (
            <FlowNoEncontrado dismiss={this.setState({ flowStatus: Constants.FLOW_STATUS_NONE })} />
          );
        default:
          break;
      }
    } else if (this.state.searchQuery === "") {
      return this.state.active ? (
        <Recientes />
      ) : (
        <Bienvenida
          userName={this.state.userData.firstName}
          selectingOrigin={this.state.selectingLocation == Constants.LOCATION_ORIGIN}
        />
      );
    } else {
      if (this.state.places.length > 0) {
        let places = [];

        this.state.places.map(candidate => {
          places.push(
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
              {places.map(candidate => candidate)}
            </ScrollView>
          </KeyboardAvoidingView>
        );
      } else {
        let sugerencias = [];

        this.state.placesAuto.map(candidate => {
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
      searchQuery: "",
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

      if (this.state.selectingLocation === Constants.LOCATION_ORIGIN) {
        await this.setState({
          origin: {
            name: placeName,
            lat,
            lng,
          },
          flowStatus: Constants.FLOW_STATUS_QUOTING,
        });
      } else {
        await this.setState({
          destination: {
            name: placeName,
            lat,
            lng,
          },
          flowStatus: Constants.FLOW_STATUS_QUOTING,
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
        key={Constants.LOCATION_ORIGIN}
        coordinate={{
          latitude: this.state.origin.lat,
          longitude: this.state.origin.lng,
        }}
        title={"Origen"}
        description={"Te recogeremos en esta dirección"}
        pinColor={Constants.COLOR_BLUE}
        //draggable={true}
        /*onDragStart={async () => {
          await this.setState({ usingGps: false, selectingLocation: Constants.LOCATION_ORIGIN });
          this.wait();
        }}
        onDragEnd={(lat, lng) => this.setMarkerLocations(lat, lng)}*/
      />
    );

    markers.push(
      <MapView.Marker
        key={Constants.LOCATION_DESTINATION}
        coordinate={{
          latitude: this.state.destination.lat,
          longitude: this.state.destination.lng,
        }}
        title={"Destino"}
        description={"Vamos a esta dirección"}
        pinColor={Constants.COLOR_RED}
        //onPress={setMarkerLocations}
        //draggable={true}
        /*onDragStart={async () => {
          await this.setState({ usingGps: false, selectingLocation: Constants.LOCATION_DESTINATION });
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
    if (
      this.state.flowStatus !== Constants.FLOW_STATUS_NONE &&
      this.state.flowStatus !== Constants.FLOW_STATUS_QUOTING
    )
      return;

    if (
      !Constants.pointIsInSearchRange(
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
      !Constants.pointIsInSearchRange(
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
      this.state.flowStatus === Constants.FLOW_STATUS_NONE ||
      this.state.flowStatus === Constants.FLOW_STATUS_QUOTING
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

        if (this.state.location) {
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
              onMapReady={() => this.goToUserLocation(true)}
              onLongPress={this.handleLongPress}
              onPoiClick={this.handlePoiClick.bind(this)}
              showsUserLocation={true}
              showsMyLocationButton={false}
              ref={component => (this.map = component)}
              style={{ flex: 1 }}
              showsCompass={false}
              initialRegion={Constants.INITIAL_REGION}
              mapPadding={{
                top: Dimensions.get("window").height * 0.09,
                right: Dimensions.get("window").width * 0.02,
                bottom: Dimensions.get("window").height * 0.33,
                left: Dimensions.get("window").width * 0.02,
              }}>
              {this.state.markers.map(marker => marker)}
              <MapView.Polyline
                strokeWidth={4}
                strokeColor={Constants.COLOR_LIGHTBLUE}
                coordinates={this.drawPolyline()}
              />
            </MapView>
            <View style={styles.locationButtonView}>
              <Icon
                name="gps-fixed"
                reverse
                raised
                containerStyle={styles.locationButton}
                color={Constants.COLOR_ORANGE}
                onPress={() => this.goToUserLocation(false)}
              />
            </View>
            <View
              style={
                this.state.active
                  ? [styles.searchContainer, styles.whiteBack]
                  : styles.searchContainer
              }
              elevation={this.state.active ? 2 : 0}>
              <Input
                editable={this.state.flowStatus === Constants.FLOW_STATUS_NONE}
                containerStyle={
                  this.state.active ? [styles.searchBar, styles.noElevation] : styles.searchBar
                }
                inputContainerStyle={styles.searchInput}
                underlineColorAndroid="transparent"
                onSubmitEditing={() => {
                  this.searchPlaces(this.state.searchQuery);
                }}
                placeholder={
                  this.state.flowStatus === Constants.FLOW_STATUS_NONE
                    ? "Buscar places"
                    : this.state.destination.name
                    ? "A " + this.state.destination.name
                    : "Cafés cerca de Metrópolis"
                }
                onFocus={this.activate.bind(this)}
                onChangeText={searchQuery => {
                  this.autocompleteSearch(searchQuery);
                }}
                returnKeyType="search"
                leftIcon={
                  this.state.active || this.state.flowStatus !== Constants.FLOW_STATUS_NONE ? (
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
                    color={Constants.COLOR_ORANGE}
                    onPress={() => {
                      if (this.state.flowStatus === Constants.FLOW_STATUS_NONE) {
                        if (this.state.active) {
                          this.wait();
                          this.searchPlaces(this.state.searchQuery);
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

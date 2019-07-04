import React from "react";
import { Text, View, StyleSheet, TouchableOpacity, Modal, BackHandler } from "react-native";
import { Icon, Divider } from "react-native-elements";
import BottomButton from "./BottomButton";
import ImageViewer from "react-native-image-zoom-viewer";
import firebase from "firebase";
import "@firebase/firestore";
import { Rating, AirbnbRating } from "react-native-ratings";

export class FlowCotizar extends React.Component {
  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <View style={styles.cotizarView}>
          <Text style={styles.displayTitle}>Confirmar ruta</Text>
          <View style={styles.rutaView}>
            <View style={styles.rutaInputs}>
              <TouchableOpacity style={styles.rutaSelect} onPress={this.props.selectOrigin}>
                <Icon
                  style={styles.selectIcon}
                  name="chevron-down"
                  type="font-awesome"
                  color="#FF9800"
                  size={15}
                />
                <Text style={styles.origenText}>
                  {this.props.usingGps ? "Mi ubicación (GPS)" : this.props.origin}
                </Text>
                <Icon style={styles.rutaIcon} name="edit" color="gray" size={12} />
              </TouchableOpacity>
              <Divider style={styles.divider} />
              <TouchableOpacity style={styles.rutaSelect} onPress={this.props.selectDestination}>
                <Icon style={styles.selectIcon} name="place" color="gray" size={15} />
                <Text style={styles.origenText}>{this.props.destination}</Text>
                <Icon style={styles.rutaIcon} name="edit" color="gray" size={12} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.disclaimer}>No se te cobrará nada hasta que aceptes el precio.</Text>
        </View>
        <BottomButton
          onPress={this.props.onConfirm}
          title="Pedir Precio"
          backgroundColor="#4CAF50"
        />
      </View>
    );
  }
}

export class FlowExito extends React.Component {
  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <View flex={2}>
          <Icon name="check-circle" size={70} color="#4CAF50" />
        </View>
        <Text flex={1}>Cotizando taxi a</Text>
        <Text style={styles.displayTitle} flex={1}>
          {this.props.destination}
        </Text>
        <Text style={styles.disclaimer} flex={1}>
          Recibirás en breve una notificación con el precio.
        </Text>
        <BottomButton
          onPress={this.props.onCancel}
          title="Cancelar carrera"
          backgroundColor={"#f44336"}
        />
      </View>
    );
  }
}
export class FlowConfirmar extends React.Component {
  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <View flex={2}>
          <Icon name="local-taxi" size={70} color="#4CAF50" />
        </View>
        <Text flex={1}>Precio a {this.props.destination}</Text>
        <Text style={styles.displayTitle} flex={1}>
          L. {this.props.price.toFixed(2)}
        </Text>
        <View style={styles.buttonRow} flex={1}>
          <BottomButton
            onPress={this.props.onCancel}
            title="Cancelar"
            backgroundColor={"#f44336"}
          />
          <BottomButton
            onPress={this.props.onConfirm}
            title="Pedir Taxi"
            backgroundColor={"#4CAF50"}
          />
        </View>
      </View>
    );
  }
}

export class FlowError extends React.Component {
  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <View flex={2}>
          <Icon name="error" size={70} color="#f44336" />
        </View>
        <Text style={styles.displayTitle} flex={1}>
          Ocurrió un Error
        </Text>
        <BottomButton title="Regresar" onPress={this.props.onConfirm} />
      </View>
    );
  }
}

export class FlowNoEncontrado extends React.Component {
  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <View flex={2}>
          <Icon name="error" size={70} color="#f44336" />
        </View>
        <Text style={styles.displayTitle} flex={1}>
          No se encontraron lugares
        </Text>
        <Text style={styles.disclaimer} flex={1}>
          Puedes intentar usando otro término de búsqueda.
        </Text>
        <BottomButton backgroundColor="#4CAF50" title="Regresar" onPress={this.props.onConfirm} />
      </View>
    );
  }
}

export class FlowAceptar extends React.Component {
  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <View flex={2}>
          <Icon name="check-circle" size={70} color="#4CAF50" />
        </View>
        <Text flex={1}>¡Éxito!</Text>
        <Text style={styles.displayTitle} flex={1}>
          Tu unidad ya va en camino.
        </Text>
        <Text style={styles.disclaimer} flex={1}>
          ¡Gracias por tu preferencia!
        </Text>
        <BottomButton
          onPress={this.props.onCancel}
          title="Cancelar carrera"
          backgroundColor="#f44336"
        />
      </View>
    );
  }
}

export class FlowAbordando extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      images: [],
      visible: false,
    };
  }
  componentDidMount = async () => {
    await firebase
      .database()
      .ref()
      .child("quotes/" + this.props.order + "/")
      .once("value", snap => {
        let data = snap.exportVal();
        console.log("data", data);
        firebase
          .firestore()
          .collection("drivers")
          .doc(data.driver)
          .get()
          .then(snap => {
            let driverdata = snap.data();
            let images = [
              { url: driverdata.profile },
              { url: driverdata.lateralcar },
              { url: driverdata.profilecar },
            ];
            this.setState({ images });
          });
      });
  };

  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <Text style={styles.displayTitle} flex={1}>
          Tu taxi está aquí
        </Text>
        <Text style={styles.disclaimer} flex={1}>
          Info del taxi va acá
        </Text>
        <BottomButton
          onPress={() => {
            this.setState({ visible: true });
          }}
          title="Ver imagenes de mi conductor"
          backgroundColor="#f44336"
        />
        <Modal
          animationType="slide"
          onRequestClose={() => {
            this.setState({ visible: false });
          }}
          visible={this.state.visible}
          transparent={true}>
          <ImageViewer imageUrls={this.state.images} />
        </Modal>
      </View>
    );
  }
}

export class FlowViajando extends React.Component {
  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <View flex={2}>
          <Icon name="check-circle" size={70} color="#4CAF50" />
        </View>
        <Text flex={1}>¡Vamos en camino!</Text>
        <BottomButton onPress={this.props.panic} title="Pánico" backgroundColor="#f44336" />
      </View>
    );
  }
}

export class FlowTerminado extends React.Component {
  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <View flex={2}>
          <Icon name="check-circle" size={70} color="#4CAF50" />
        </View>
        <Text flex={1}>¡Hemos llegado!</Text>
        <Text style={styles.displayTitle} flex={1}>
          Gracias por viajar con nosotros.
        </Text>
        <BottomButton onPress={this.props.dismiss} title="Cerrar" backgroundColor="#4CAF50" />
      </View>
    );
  }
}

export class FlowRating extends React.Component {
  handleRate = async (rate, cual) => {
    await this.setState({ [cual]: rate });
    console.log(this.state);
  };
  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <View flex={2}>
          <Icon name="question-answer" size={70} color="#4CAF50" />
        </View>
        <Text style={styles.displayTitle} flex={1}>
          ¿Que tal ha sido tu experiencia?
        </Text>
        <AirbnbRating
          count={5}
          onFinishRating={rating => this.handleRate(rating, "Limpieza")}
          reviews={["Malo", "Meh", "OK", "Bueno", "Excelente"]}
          size={20}
        />
        <AirbnbRating
          count={5}
          onFinishRating={rating => this.handleRate(rating, "Presentacion")}
          reviews={["Malo", "Meh", "OK", "Bueno", "Excelente"]}
          size={20}
        />
        <AirbnbRating
          count={5}
          onFinishRating={rating => this.handleRate(rating, "Amabilidad")}
          reviews={["Malo", "Meh", "OK", "Bueno", "Excelente"]}
          size={20}
        />
        <AirbnbRating
          count={5}
          onFinishRating={rating => this.handleRate(rating, "Manejo")}
          reviews={["Malo", "Meh", "OK", "Bueno", "Excelente"]}
          size={20}
        />
        <AirbnbRating
          count={5}
          onFinishRating={rating => this.handleRate(rating, "Puntualidad")}
          reviews={["Malo", "Meh", "OK", "Bueno", "Excelente"]}
          size={20}
        />
        <BottomButton onPress={this.props.dismiss} title="Cerrar" backgroundColor="#4CAF50" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainView: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  mainViewPaddingless: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },

  cotizarView: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    flex: 4,
  },

  infoView: {
    flex: 1,
  },

  rutaView: {
    flex: 4,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },

  rutaInputs: {
    flex: 6,
    height: "100%",
    justifyContent: "space-around",
  },

  rutaIconsView: {
    flex: 1,
    justifyContent: "space-around",
    height: "75%",
  },

  rutaSelect: {
    padding: 3,
    paddingLeft: 6,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    shadowOffset: {
      width: 10,
      height: 10,
    },
    shadowOpacity: 1,
    elevation: 1,
    marginBottom: 5,
  },

  divider: {
    height: 1,
    width: "90%",
    alignSelf: "flex-end",
  },

  origenText: {
    marginLeft: 15,
    color: "#212121",
    textAlign: "left",
    flex: 5,
  },

  selectIcon: {
    flex: 1,
  },

  destinoText: {
    color: "#212121",
    textAlign: "center",
    flex: 2,
  },

  rutaIcon: {
    flex: 2,
  },

  buttonRow: {
    flex: 1,
    flexDirection: "row",
  },

  button: {
    backgroundColor: "#4CAF50",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  buttonText: {
    color: "white",
    fontSize: 16,
  },

  buyView: {
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    padding: 15,
  },

  displayTitle: {
    flex: 2,
    fontSize: 24,
    paddingLeft: 5,
    paddingRight: 5,
    color: "black",
    textAlign: "center",
  },

  disclaimer: {
    flex: 1,
    color: "gray",
  },
});

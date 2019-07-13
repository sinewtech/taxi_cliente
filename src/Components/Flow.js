import React from "react";
import { Text, View, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { Icon, Divider, Image, Button } from "react-native-elements";
import BottomButton from "./BottomButton";
import ImageViewer from "react-native-image-zoom-viewer";
import firebase from "firebase";
import "@firebase/firestore";
import Rating from "./Rating";
import * as Constants from "../Constants";
import { TouchableNativeFeedback } from "react-native-gesture-handler";

export class FlowCotizar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { payment: "CASH" };
  }
  componentDidMount = () => {
    this.props.changePayment(this.state.payment);
  };
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
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-evenly",
            }}>
            <Button
              title="Efectivo"
              onPress={async () => {
                await this.setState({ payment: "CASH" });
                this.props.changePayment(this.state.payment);
              }}
              buttonStyle={{
                backgroundColor: this.state.payment === "CASH" ? Constants.COLOR_GREEN : "#616161",
              }}
              icon={<Icon color="white" name="cash-usd" type="material-community" />}
            />
            <Button
              title="Tarjeta"
              onPress={async () => {
                await this.setState({ payment: "POS" });
                this.props.changePayment(this.state.payment);
              }}
              buttonStyle={{
                backgroundColor: this.state.payment === "POS" ? Constants.COLOR_GREEN : "#616161",
              }}
              icon={<Icon color="white" name="credit-card" type="material-community" />}
            />
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
          La unidad llegará en aproximadamente {this.props.duration}.
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
            this.setState({ images, driver: driverdata });
          });
      });
  };

  render() {
    return (
      <View style={styles.mainViewPaddingless}>
        <Text style={styles.displayTitle} flex={1}>
          Tu taxi está aquí
        </Text>
        <Text flex={1}>
          {this.state.driver
            ? this.state.driver.firstName +
              " te espera en un " +
              this.state.driver.description +
              " placa " +
              this.state.driver.plate
            : null}
        </Text>
        <View style={styles.imagesView}>
          {this.state.images.map(image => {
            console.log("imagen", image);
            return (
              <TouchableNativeFeedback
                onPress={() => this.setState({ visible: true })}
                background={TouchableNativeFeedback.SelectableBackground()}
                key={image.url}>
                <Image style={styles.driverImage} source={{ uri: image.url }} />
              </TouchableNativeFeedback>
            );
          })}
        </View>
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
  constructor(props) {
    super(props);
    this.state = {
      Limpieza: 3,
      Amabilidad: 3,
      Manejo: 3,
      Puntualidad: 3,
      Presentacion: 3,
    };
  }
  handleRate = async (rate, cual) => {
    await this.setState({ [cual]: rate });
    console.log(this.state);
  };
  sendRate = () => {
    let fieldsAreValid = true;
    for (key in this.state) {
      if (this.state[key].length === 0) {
        fieldsAreValid = false;
        break;
      }
    }
    if (fieldsAreValid) {
      let finalprom =
        this.state.Limpieza +
        this.state.Presentacion +
        this.state.Amabilidad +
        this.state.Manejo +
        this.state.Puntualidad;
      finalprom = finalprom / 5;

      firebase
        .database()
        .ref()
        .child("quotes/" + this.props.orderUid + "/")
        .once("value", snap => {
          let order = snap.exportVal();
          let finalData = {
            cleaning: this.state.Limpieza,
            presentation: this.state.Presentacion,
            amiability: this.state.Amabilidad,
            driving: this.state.Manejo,
            puntuality: this.state.Puntualidad,
            finalprom: finalprom,
            orderUid: snap.key,
            driverUid: order.driver,
          };
          firebase
            .firestore()
            .collection("ratings")
            .add(finalData)
            .then(data => {
              this.props.dismiss();
            });
        });
    } else {
      Alert.alert("Calificaciones", "Por favor termina de calificar a tu conductor");
    }
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.mainViewPaddingless}>
        <View flex={1}>
          <Icon name="question-answer" size={70} color="#4CAF50" />
        </View>
        <Text style={styles.displayTitle} flex={2}>
          ¿Que tal ha sido tu experiencia?
        </Text>
        <View style={styles.ratingsView}>
          <Rating name="Limpieza" title="Limpieza de la Unidad" handleRate={this.handleRate} />
          <Rating
            name="Presentacion"
            title="Presentacion del Conductor"
            handleRate={this.handleRate}
          />
          <Rating name="Amabilidad" title="Amabilidad del Conductor" handleRate={this.handleRate} />
          <Rating name="Manejo" title="Manejo del Conductor" handleRate={this.handleRate} />
          <Rating
            name="Puntualidad"
            title="Puntualidad del Conductor"
            handleRate={this.handleRate}
          />
        </View>

        {/*

        Aquí que vayan comentarios del cliente.

      */}
        <BottomButton onPress={this.sendRate} title="Evaluar" backgroundColor="#4CAF50" />
      </ScrollView>
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

  ratingsView: {
    flex: 6,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-around",
  },

  imagesView: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignContent: "center",
    flex: 3,
  },

  driverImage: {
    height: 75,
    width: 75,
    resizeMode: "cover",
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

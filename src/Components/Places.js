import React, { Component } from "react";
import {
  Text,
  View,
  KeyboardAvoidingView,
  ScrollView,
  TouchableNativeFeedback,
  Image,
  StyleSheet,
} from "react-native";

class Place extends Component {
  render() {
    return (
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.SelectableBackground()}
        onPress={this.props.onPress}>
        <View>
          <View style={styles.suggest}>
            {this.props.showImage ? (
              <View style={styles.suggestImage}>
                <Image
                  style={{ width: 20, height: 20 }}
                  source={{
                    uri: this.props.imageUrl
                  }}
                />
              </View>
            ) : null}
            <View style={styles.suggestText}>
              <Text style={styles.suggestTitle}>{this.props.title}</Text>
              <Text style={styles.suggestSubtitle}>{this.props.subtitle}</Text>
            </View>
          </View>
        </View>
      </TouchableNativeFeedback>
    );
  }
}

export class ResultPlaces extends Component {
  render() {
    let places = [];

    this.props.places.map(candidate => {
      console.log(candidate);

      places.push(
        <Place
          key={candidate.place_id}
          title={candidate.nombre}
          subtitle={candidate.direccion}
          showImage={false}
          imageUrl={candidate.icono}
          onPress={() => this.props.selectPlace(candidate.id)}
        />
      );
    });

    return (
      <KeyboardAvoidingView behavior="padding">
        {this.props.showManualHeader ? this.props.manualHeader : null}
        <ScrollView keyboardShouldPersistTaps={"handled"}>
          {places.map(candidate => candidate)}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
}

export class AutocompletePlaces extends Component {
  render() {
    console.log("Autocompletando");
    let sugerencias = [];

    this.props.places.map(candidate => {
      //console.log(candidate);

      sugerencias.push(
        <Place
          key={candidate.place_id}
          title={candidate.structured_formatting.main_text}
          subtitle={candidate.structured_formatting.secondary_text}
          showImage={false}
          onPress={() => this.props.selectPlace(candidate.place_id)}
        />
      );
    });

    return (
      <View>
        {this.props.showManualHeader ? this.props.manualHeader : null}
        <ScrollView keyboardShouldPersistTaps={"handled"}>
          {sugerencias.map(candidate => candidate)}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  suggest: {
    backgroundColor: "white",
    //padding: 10,
    borderWidth: 0.3,
    borderColor: "#EEEEEE",
    //margin:5,
    //borderRadius: 10,
    //paddingTop:10,
    height: 80,
    //justifyContent: "center",
    flexDirection: "row",
  },

  suggestImage: {
    //backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },

  suggestText: {
    flex: 5,
    padding: 10,
    justifyContent: "center",
  },

  suggestTitle: {
    flex: 1,
    fontSize: 16,
  },

  suggestSubtitle: {
    flex: 1,
    fontSize: 12,
    color: "#616161",
  },
});

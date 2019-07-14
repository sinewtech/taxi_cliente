import React, {Component} from 'react';
import {Text, View, KeyboardAvoidingView, ScrollView, TouchableNativeFeedback, StyleSheet} from 'react-native';

export class ResultPlaces extends Component {
    render(){
        let places = [];

        this.props.places.map(candidate => {
          places.push(
            <TouchableNativeFeedback
              background={TouchableNativeFeedback.SelectableBackground()}
              key={candidate.id}
              onPress={() => {
                this.props.selectPlace(candidate.id);
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
            {this.props.showManualHeader ? manualHeader : null}
            <ScrollView keyboardShouldPersistTaps={"handled"}>
              {places.map(candidate => candidate)}
            </ScrollView>
          </KeyboardAvoidingView>
        );
    }
};

export class AutocompletePlaces extends Component {
    render(){
        let sugerencias = [];

        this.props.places.map(candidate => {
          sugerencias.push(
            <TouchableNativeFeedback
              background={TouchableNativeFeedback.SelectableBackground()}
              key={candidate.place_id}
              onPress={() => {
                this.props.selectPlace(candidate.id);
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
            {this.props.showManualHeader ? manualHeader : null}
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
    padding: 10,
    borderWidth: 0.3,
    borderColor: "#EEEEEE",
    //margin:5,
    //borderRadius: 10,
    //paddingTop:10,
    height: 80,
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

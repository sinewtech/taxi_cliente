import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { Icon, Button } from "react-native-elements";
import Ripple from "react-native-material-ripple";

export class LugarFrecuente extends React.Component {
    render() {
        return (
            <View style={styles.frecuenteView}>
                <Ripple style={styles.frecuenteRipple}>
                    <Icon name={this.props.icon} style={styles.frecuenteIcon} size={45} color={"#FF9800"}/>
                    <Text style={styles.frecuenteText}>{this.props.name}</Text>
                </Ripple>
            </View>
        );
    }
}

export default class Bienvenida extends React.Component {
    render(){
        return(
            <View style={styles.welcomeView}>
                <View style={styles.welcomeTextView}>
                    <Text style={styles.welcomeText}>¿A dónde vamos hoy?</Text>
                </View>
                <View style={styles.lugaresFrecuentes}>
                    <LugarFrecuente icon="add" name="Nuevo Lugar Frecuente"/>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    welcomeView: {
        justifyContent: "center",
        //flex:2,
        height: "100%",
        paddingTop: 10,
        justifyContent: "space-around",
    },

    welcomeTextView: {
        padding: 5,
        flex: 1,
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
        justifyContent: "space-around",
        flex: 4,
    },

    frecuenteView: {
        height: 100,
        width: 100,
        borderRadius: 500,
        overflow: "hidden"
    },

    frecuenteRipple: {
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center"
    },

    frecuenteText: {
        textAlign: "center",
    },

    frecuenteIcon: {
        color: "red"
    }
});

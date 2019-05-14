import React from "react";
import { Text, View, StyleSheet } from "react-native";

export default class Recientes extends React.Component {
    render(){
        return(
            <View style={styles.recientesView}>
                <Text>
                    Olo
                </Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    recientesView:{
        color: "gray"
    }
})
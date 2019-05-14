import React from 'react';
import { Alert, View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Button, Input, Icon } from 'react-native-elements';
import firebase from 'firebase';

export class SignIn extends React.Component {
    constructor() {
        super();
        this.state = {
            username: "",
            password: ""
        }
        this.handleSignIn = this.handleSignIn.bind(this);
        this.handleRegister = this.handleRegister.bind(this);
    }

    handleSignIn() {
        firebase.auth().signInWithEmailAndPassword(this.state.username, this.state.password)
            .catch((error) => {
                switch (error.code) {
                    case "auth/wrong-password":
                        Alert.alert("Contraseña inválida", "La contraseña está incorrecta, por favor intenta de nuevo.");
                        break;
                    case "auth/too-many-requests":
                        Alert.alert("Demasiados intentos fallidos", "Has superado el número de intentos permitidos, por favor intenta de nuevo más tarde.");
                        break;
                    case "auth/user-not-found":
                        Alert.alert("Usuario no encontrado", "El nombre de usuario no existe, debes hacer una cuenta primero.");
                        break;
                    case "auth/invalid-email":
                        Alert.alert("Usuario inválido", "El usuario es inválido, por favor intenta de nuevo.");
                        break;
                    default:
                        Alert.alert("Error", "Ha ocurrido un error, por favor intenta de nuevo.");
                        console.error(error);
                }
            });
    }

    handleRegister() {
        let callback = () => this.handleSignIn();

        firebase.auth().createUserWithEmailAndPassword(this.state.username, this.state.password)
            .then(callback)
            .catch((error) => {
                console.log("Código de error: ", error.code);

                switch(error.code){
                    case "auth/wrong-password":
                        Alert.alert("Contraseña inválida");
                        break;
                    case "auth/invalid-email":
                        Alert.alert("Usuario inválido");
                        break;
                    default:
                    console.log(error);
                }
            });
    }

    render() {
        return (
            <View style={styles.SignUpView}>
                <View style={styles.credentialsView}>
                    <Input
                        placeholder='Usuario'
                        leftIcon={
                            <Icon
                                name='person'
                                size={24}
                                color='black'
                                style={styles.Icon}
                            />
                        }
                        inputContainerStyle={styles.Input}
                        leftIconContainerStyle={{ marginRight: 15 }}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        onChangeText={(text) => this.setState({ username: text })}
                    />
                    <Input
                        placeholder='Contraseña'
                        leftIcon={
                            <Icon
                                name='vpn-key'
                                size={24}
                                color='black'
                                style={styles.Icon}
                            />
                        }
                        inputContainerStyle={styles.Input}
                        leftIconContainerStyle={{ marginRight: 15 }}
                        autoComplete="password"
                        secureTextEntry={true}
                        onChangeText={(text) => this.setState({ password: text })}
                    />
                </View>
                <View style={styles.buttonRow}>
                    <Button
                        title="Iniciar Sesión"
                        onPress={this.handleSignIn}
                    />
                    <Button
                        title="Registrarse"
                        onPress={this.handleRegister}
                    />
                </View>
            </View>
        );
    }
}

export class Waiting extends React.Component {
    render() {
        return (
            <View style={{
                backgroundColor: "#FF9800",
                justifyContent: "center",
                alignItems: "center",
                height: Dimensions.get('window').height,
                width: Dimensions.get('window').width
            }}>
                <ActivityIndicator size="large" color="white" />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    SignUpView: {
        backgroundColor: "#FF9800",
        justifyContent: "center",
        alignItems: "center",
        height: Dimensions.get('window').height
    },
    credentialsView: {
        width: Dimensions.get('window').width * .8
    },

    Input: {
        backgroundColor: "white",
        borderRadius: 5,
        marginBottom: 15,
        padding: 5,
    },

    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        width: "100%"
    }
});
/*
Constants.js
Contiene constantes que se usan en toda la aplicación.
*/

import firebase from "./firebase.js";

//Firebase
export const FIRESTORE = firebase.firestore();

//Colores
export const COLOR_AMBER = "#FFC107";
export const COLOR_ORANGE = "#FF9800";
export const COLOR_GREEN = "#4CAF50";
export const COLOR_LIGHTGREEN = "#8BC34A";
export const COLOR_BLUE = "#2196F3";
export const COLOR_LIGHTBLUE = "#03A9F4";
export const COLOR_RED = "#f44336";

//Localizaciones
export const LOCATION_ORIGIN = 0;
export const LOCATION_DESTINATION = 1;

//Estados de cotización
export const QUOTE_STATUS_PENDING = 0;
export const QUOTE_STATUS_SUCCESS = 1;
export const QUOTE_STATUS_ERROR = -1;

//Estados de flujo
export const FLOW_STATUS_NONE = 0;
export const FLOW_STATUS_WAITING = 1;
export const FLOW_STATUS_SUCCESS = 2;
export const FLOW_STATUS_QUOTING = 3;
export const FLOW_STATUS_CONFIRMING = 4;
export const FLOW_STATUS_CONFIRMED = 5;
export const FLOW_STATUS_BOARDING = 6;
export const FLOW_STATUS_TRAVELLING = 7;
export const FLOW_STATUS_ARRIVED = 8;
export const FLOW_STATUS_NO_RESULTS = 9;
export const FLOW_STATUS_RATING = 10;
export const FLOW_STATUS_ERROR = -1;

export const NOTIFICATION_QUOTE = 1;
export const NOTIFICATION_BOARDING = 2;
//Mapas
export const MAPS_API_KEY = "AIzaSyApNgtxFBp0SXSHljP_xku6peNCzjTFWM4";

export const REFERENCE_RADIUS = 100;
export const SEARCH_RADIUS = 10000;

export const INITIAL_REGION = {
  latitude: 14.085043,
  longitude: -87.206184,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const rad = x => {
  return (x * Math.PI) / 180;
};

export const getDistanceBetweenCoordinates = (p1, p2) => {
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

export const pointIsInSearchRange = (lat, lng) => {
  let dist = getDistanceBetweenCoordinates(
    {
      lat,
      lng,
    },
    {
      lat: INITIAL_REGION.latitude,
      lng: INITIAL_REGION.longitude,
    }
  );

  return dist <= SEARCH_RADIUS;
};

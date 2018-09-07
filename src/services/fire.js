import firebase from 'firebase';

var config = {
  apiKey: "AIzaSyB6vFldFaxtOUCZwSJJia5Rf-6wuWe-ZDo",
  authDomain: "calcutta-eb6eb.firebaseapp.com",
  databaseURL: "https://calcutta-eb6eb.firebaseio.com",
  projectId: "calcutta-eb6eb",
  storageBucket: "",
  messagingSenderId: "682470596189"
};

// Used to connect to the "test" database
var config_test = {
  apiKey: "AIzaSyC4mDFylNBH9fkLNEqZz4IUcgym4xKtWSs",
  authDomain: "calcutta-test.firebaseapp.com",
  databaseURL: "https://calcutta-test.firebaseio.com",
  projectId: "calcutta-test",
  storageBucket: "",
  messagingSenderId: "387342798330"
};

firebase.initializeApp(config);

const auth = firebase.auth();
const database = firebase.database();

export {
  auth,
  database
};
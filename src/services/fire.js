import firebase from 'firebase';

var config = {
  apiKey: "AIzaSyB6vFldFaxtOUCZwSJJia5Rf-6wuWe-ZDo",
  authDomain: "calcutta-eb6eb.firebaseapp.com",
  databaseURL: "https://calcutta-eb6eb.firebaseio.com",
  projectId: "calcutta-eb6eb",
  storageBucket: "",
  messagingSenderId: "682470596189"
};

var Fire = firebase.initializeApp(config);

export default Fire;
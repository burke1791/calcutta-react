import React, { Component } from 'react';
import logo from './logo.svg';
import './app.css';
import Header from './components/header/header';
import Main from './components/main/main';
import AuthenticationService from '../services/authentication-service';
import DataService from '../services/data-service';
import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT, NOTIF_LEAGUE_SUBMIT, NOTIF_MODAL_TOGGLE } from '../services/notification-service';

let authService = new AuthenticationService();
let ds = new DataService();
let ns = new NotificationService();

class App extends Component {
  
  render() {
    return (
      <div className="App">
        <Header />
        <Main />
      </div>
    );
  }
}

export default App;

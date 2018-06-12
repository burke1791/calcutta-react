import React, { Component } from 'react';
import AuthHeader from '../authHeader/authHeader';
import AuthenticationService from '../../../services/authentication-service';
import DataService from '../../../services/data-service';
import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT, NOTIF_LEAGUE_SUBMIT, NOTIF_MODAL_TOGGLE } from '../../../services/notification-service';

let authService = new AuthenticationService();
let ds = new DataService();
let ns = new NotificationService();

class Header extends Component {
  constructor() {
    super();

    this.state = {
      loading: true,
      authenticatedUser: {},
      authenticatedUsername: ''
    };
  }
  
  componentDidMount() {
    var self = this;

    authService.addAuthListener(self);
  }

  componentWillUnmount() {
    authService.removeAuthListener();
  }

  render() {
    return (
      <header className="App-header">
        <div className='auth-header col-sm-2'>
          <AuthHeader username={this.state.authenticatedUsername}/>
        </div>
        <img src='https://upload.wikimedia.org/wikipedia/commons/7/72/Basketball_Clipart.svg' className="App-logo" alt="logo" />
        <h1 className="App-title">Welcome to March Madness Calcutta</h1>
      </header>
    );
  }
}

export default Header;
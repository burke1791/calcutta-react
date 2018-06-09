import React, { Component } from 'react';
import AuthHeader from '../authHeader/authHeader';
import AuthenticationService from '../../../services/authentication-service';
import DataService from '../../../services/data-service';
import { auth } from '../../../services/fire';
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
    var thisApp = this;

    auth.onAuthStateChanged(function(user) {
      if (user) {
        console.log('user signed in');
        thisApp.setState({authenticatedUser: user});

        ds.getDisplayName(thisApp.state.authenticatedUser.uid).then(function(res) {
          thisApp.setState({authenticatedUsername: res});
        });
        ns.postNotification(NOTIF_SIGNIN, null);
      } else {
        console.log('user is signed out');
        ns.postNotification(NOTIF_SIGNOUT);
        thisApp.setState({
          authenticatedUser: {},
          authenticatedUsername: ''
        })
      }
    });
  }

  componentWillUnmount() {
    auth.onAuthStateChanged();
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
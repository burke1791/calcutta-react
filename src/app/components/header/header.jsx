import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import AuthHeader from '../authHeader/authHeader';
import AuthenticationService from '../../../services/authentication-service';

let authService = new AuthenticationService();

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
        <h1 className="App-title">
          <Link exact='true' to='/'>Welcome to March Madness Calcutta</Link>
        </h1>
      </header>
    );
  }
}

export default Header;
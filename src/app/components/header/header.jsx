import React, { Component } from 'react';
import './header.css';
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
      authenticatedUsername: '',
      authenticatedUid: ''
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
      <div className='jumbotron jumbotron-fluid app-header no-gutters'>
        <div className='container'>
          <nav className='navbar navbar-expand-lg'>
            <div className='mr-auto'>
              <Link className='navbar-brand' exact='true' to='/'>
                <img src='https://upload.wikimedia.org/wikipedia/commons/7/72/Basketball_Clipart.svg' className="App-logo" alt="logo" />
              </Link>
            </div>
            <div className='auth'>
              <AuthHeader username={this.state.authenticatedUsername} uid={this.state.authenticatedUid} /> 
            </div>
          </nav>
        </div>
      </div>
    );
  }
}

export default Header;
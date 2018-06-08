import React, { Component } from 'react';
import './authHeader.css'
import Button from '../button/button';
import LoginModal from '../modal/modal';
import NotificationService, { NOTIF_MODAL_TOGGLE, NOTIF_SIGNIN, NOTIF_SIGNOUT } from '../../services/notification-service';
import AuthenticationService from '../../services/authentication-service';

let ns = new NotificationService();
let authService = new AuthenticationService();

class AuthHeader extends Component {
  
  constructor(props) {
    super(props);

    this.state = {
      authenticated: false
    }

    //Bind functions
    this.onSignInClicked = this.onSignInClicked.bind(this);
    this.onSignIn = this.onSignIn.bind(this);
    this.onSignOut = this.onSignOut.bind(this);
    this.generateAuthBtn = this.generateAuthBtn.bind(this);
  }

  componentWillMount() {
    ns.addObserver(NOTIF_SIGNIN, this, this.onSignIn);
    ns.addObserver(NOTIF_SIGNOUT, this, this.onSignOut);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNIN);
    ns.removeObserver(this, NOTIF_SIGNOUT);
  }

  onSignInClicked() {
    ns.postNotification(NOTIF_MODAL_TOGGLE, null);
  }

  onSignOutClicked() {
    authService.signOutUser();
  }

  onSignIn() {
    this.setState({authenticated: true});
  }

  onSignOut() {
    this.setState({authenticated: false});
  }

  generateAuthBtn = () => {
    if (this.state.authenticated) {
      return (
        <div className='btn-group'>
          <Button btnType='button' btnClass='btn btn-link' onClick={this.onSignOutClicked} btnValue={'Signed in as: ' + this.props.username} />
        </div>
      );
    } else {
      return (
        <div className='btn-group'>
          <Button btnType='button' btnClass='btn btn-primary' onClick={this.onSignInClicked} btnValue={'Sign In'} />
        </div>
      );
    }
  }
  
  render() {

    return (
      <div className='auth-header'>
        <div className='btn-toolbar'>
          {this.generateAuthBtn()}
        </div>
        <LoginModal modalType='login' />
      </div>
    );
  }
}

export default AuthHeader;
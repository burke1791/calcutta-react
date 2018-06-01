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
  
  render() {
    
    var signedInClass = 'btn btn-link';
    var signedOutClass = 'btn btn-primary';

    if (this.state.authenticated) {
      signedInClass = 'btn btn-link';
      signedOutClass = 'btn btn-primary d-none';
    } else {
      signedInClass = 'btn btn-link d-none';
      signedOutClass = 'btn btn-primary';
    }

    return (
      <div className='auth-header'>
        <div className='btn-toolbar'>
          <div className='btn-group'>
            <Button btnType='button' btnClass={signedInClass} onClick={this.onSignOutClicked} btnValue={'Signed in as: ' + this.props.username} />
          </div>
          <div className='btn-group'>
            <Button btnType='button' btnClass={signedOutClass} onClick={this.onSignInClicked} btnValue="Sign In" />
          </div>
        </div>
        <LoginModal modalType='login' />
      </div>
    );
  }
}

export default AuthHeader;
import React, { Component } from 'react';
import './authHeader.css'
import Button from '../button/button';
import GeneralModal from '../modals/generalModal';
import NotificationService, { NOTIF_MODAL_TOGGLE, NOTIF_SIGNIN, NOTIF_SIGNOUT } from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';

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
    ns.postNotification(NOTIF_MODAL_TOGGLE, 'login');
  }

  onSignOutClicked() {
    authService.signOutUser();
  }

  onChangePasswordClicked() {
    // Password change requires recent authentication
    // ns.postNotification(NOTIF_MODAL_TOGGLE, 'newPassword');
  }

  onChangeUsernameClicked() {
    ns.postNotification(NOTIF_MODAL_TOGGLE, 'newUsername');
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
        <div className='nav-item dropdown'>
          <button type='button' className='nav-link dropdown-toggle btn btn-link dropdown-toggle' id='dropdownMenu' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
            {'Signed in as: '  + this.props.username}
          </button>
          <div className='dropdown-menu dropdown-menu-right' aria-labelledby='dropdownMenu'>
            <button className='dropdown-item' type='button' onClick={this.onChangePasswordClicked}>Change Password (not working yet)</button>
            <button className='dropdown-item' type='button' onClick={this.onChangeUsernameClicked}>Change Username</button>
            <div className='dropdown-divider'></div>
            <button className='dropdown-item' type='button' onClick={this.onSignOutClicked}>Sign Out</button>
          </div>
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
        <GeneralModal modalType='login' />
      </div>
    );
  }
}

export default AuthHeader;
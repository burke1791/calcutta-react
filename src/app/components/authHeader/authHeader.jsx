import React, { Component } from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import './authHeader.css'
import Button from '../button/button';
import GeneralModal from '../modals/generalModal';
import NotificationService, { NOTIF_MODAL_TOGGLE, NOTIF_SIGNIN, NOTIF_SIGNOUT, NOTIF_LEAGUE_JOINED } from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let authService = new AuthenticationService();
let ds = new DataService();

class AuthHeader extends Component {
  
  constructor(props) {
    super(props);

    this.state = {
      authenticated: false,
      admin: false
    }

    //Bind functions
    this.onSignInClicked = this.onSignInClicked.bind(this);
    this.onSignIn = this.onSignIn.bind(this);
    this.onSignOut = this.onSignOut.bind(this);
    this.onLeagueJoined = this.onLeagueJoined.bind(this);
    this.onGodModeClicked = this.onGodModeClicked.bind(this);
    this.checkAdmin = this.checkAdmin.bind(this);
    this.generateAuthBtn = this.generateAuthBtn.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_SIGNIN, this, this.onSignIn);
    ns.addObserver(NOTIF_SIGNOUT, this, this.onSignOut);
    ns.addObserver(NOTIF_LEAGUE_JOINED, this, this.onLeagueJoined);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNIN);
    ns.removeObserver(this, NOTIF_SIGNOUT);
    ns.removeObserver(this, NOTIF_LEAGUE_JOINED);
  }

  onSignInClicked() {
    ns.postNotification(NOTIF_MODAL_TOGGLE, 'login');
  }

  onSignOutClicked() {
    authService.signOutUser();
  }

  
  onLeagueJoined(leagueId) {
    // this.props.history.push('/league-home/' + leagueId)
  }
  

  onGodModeClicked() {
    alert('Feature is still in development');

    this.props.history.push('/god-mode/');
    // TEMP
    // ds.addSportToDatabase();
  }

  onChangePasswordClicked() {
    // Password change requires recent authentication
    // ns.postNotification(NOTIF_MODAL_TOGGLE, 'newPassword');

    // TEST
    authService.sendPasswordResetEmail();
  }

  onChangeUsernameClicked() {
    ns.postNotification(NOTIF_MODAL_TOGGLE, 'newUsername');
  }

  onSignIn() {
    this.checkAdmin();
  }

  onSignOut() {
    this.setState({
      authenticated: false,
      admin: false
    });
  }

  checkAdmin() {
    var self = this;
    if (this.props.uid !== '') {
      ds.isAdmin(this.props.uid).then(isAdmin => {
        if (isAdmin) {
          self.setState({
            authenticated: true,
            admin: isAdmin
          });
        } else {
          self.setState({
            authenticated: true,
            admin: false
          });
        }
      });
    }
  }

  generateAuthBtn = () => {
    if (this.state.admin) {
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
            <div className='dropdown-divider'></div>
            <button className='dropdown-item' type='button' onClick={this.onGodModeClicked}>Enter God Mode</button>
          </div>
        </div>
      );
    } else if (this.state.authenticated) {
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

export default withRouter(AuthHeader);
import React, { Component } from 'react';
import './auth.css'
import Button from '../button/button';
import LoginModal from '../modal/modal';
import NotificationService, {NOTIF_MODAL_TOGGLE, NOTIF_SIGNIN, NOTIF_SIGNOUT} from '../../services/notification-service';

let ns = new NotificationService();

class Auth extends Component {
  
  constructor(props) {
    super(props);

    this.state = {
      authenticated: false
    }

    //Bind functions
    this.onBtnClicked = this.onBtnClicked.bind(this);
    this.onSignIn = this.onSignIn.bind(this);
    this.onSignOut = this.onSignOut.bind(this);
  }

  componentWillMount() {
    ns.addObserver(NOTIF_SIGNIN, this, this.onSignIn);
    ns.addObserver(NOTIF_SIGNIN, this, this.onSignOut);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNIN);
    ns.removeObserver(this, NOTIF_SIGNOUT);
  }

  onBtnClicked() {
    ns.postNotification(NOTIF_MODAL_TOGGLE, null);
  }

  onSignIn() {

  }

  onSignOut() {

  }
  
  render() {
    
    if (this.state.authenticated) {

    }

    return (
      <div className='auth-header'>
        <Button btnType='button' btnClass='btn btn-primary' onClick={this.onBtnClicked} btnValue="Sign In" />
        <LoginModal modalType='login' />
      </div>
    );
  }
}

export default Auth;
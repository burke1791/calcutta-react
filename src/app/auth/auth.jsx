import React, { Component } from 'react';
import './auth.css'
import Button from '../button/button';
import LoginModal from '../modal/modal';
import NotificationService, {NOTIF_MODAL_TOGGLE} from '../../services/notification-service';

let ns = new NotificationService();

class Auth extends Component {
  
  constructor(props) {
    super(props);

    //Bind functions
    this.onBtnClicked = this.onBtnClicked.bind(this);
  }

  onBtnClicked() {
    ns.postNotification(NOTIF_MODAL_TOGGLE, null);
  }
  
  render() {
    return (
      <div className='auth-header'>
        <Button onClick={this.onBtnClicked} btnValue="Sign In" />
        <LoginModal modalType='login' />
      </div>
    );
  }
}

export default Auth;
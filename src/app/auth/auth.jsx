import React, { Component } from 'react';
import './auth.css'
import Button from '../button/button';
import LoginModal from '../modal/modal';
import NotificationService, {NOTIF_MODAL_TOGGLE, NOTIF_AUTH_SUBMIT} from '../../services/notification-service';

let ns = new NotificationService();

class Auth extends Component {
  
  constructor(props) {
    super(props);

    //Bind functions
    this.onBtnClicked = this.onBtnClicked.bind(this);
    this.onAuthSuccess = this.onAuthSuccess.bind(this);
  }

  componentWillMount() {
    ns.addObserver(NOTIF_AUTH_SUBMIT, this, )
  }

  componentWillUnmount() {

  }

  onBtnClicked() {
    ns.postNotification(NOTIF_MODAL_TOGGLE, null);
  }

  onAuthSuccess() {

  }
  
  render() {
    return (
      <div className='auth-header'>
        <Button btnType='button' btnClass='btn btn-primary' onClick={this.onBtnClicked} btnValue="Sign In" />
        <LoginModal modalType='login' />
      </div>
    );
  }
}

export default Auth;
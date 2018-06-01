import React, { Component } from 'react';
import Modal from 'react-modal';
import NotificationService, {NOTIF_MODAL_TOGGLE} from '../../services/notification-service';
import LoginForm from '../loginForm/loginForm';

import './modal.css';

let ns = new NotificationService();

const customStyles = {
  content : {
    top : '50%',
    left : '50%',
    right : 'auto',
    bottom : 'auto',
    marginRight : '-50%',
    transform : 'translate(-50%, -50%)'
  }
};

class LoginModal extends Component {
  constructor(props) {
    super(props);

    this.state = {show: false};

    //Bind functions
    this.toggleModal = this.toggleModal.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_MODAL_TOGGLE, this, this.toggleModal);
    Modal.setAppElement('body');
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_MODAL_TOGGLE);
  }

  toggleModal() {
    if (this.state.show) {
      this.setState({show: false});
    } else {
      this.setState({show: true});
    }
  }
  
  render() {
    if (this.props.modalType === 'login') {
      return (
        <div className='modal fade' role='dialog'>
          <div className='modal-dialog modal-dialog-centered' role='document'>
            <div className='modal-content'>
              <Modal isOpen={this.state.show} onRequestClose={this.toggleModal} style={customStyles} >
                <div className='modal-header'>
                  <h4 className='modal-title'>Please Login</h4>
                  <button type='button' className='close' onClick={this.toggleModal}>&times;</button>
                </div>
                <div className='modal-body'>
                  <LoginForm submitHandler={this.toggleModal}/>
                </div>
                <div className='modal-footer'>
                  <button type='button' className='btn btn-danger' onClick={this.toggleModal}>Close</button>
                </div>
              </Modal>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default LoginModal;
import React, { Component } from 'react';
import Modal from 'react-modal';
import NotificationService, {NOTIF_MODAL_TOGGLE, NOTIF_MODAL_TYPE_CHANGE} from '../../../services/notification-service';
import LoginForm from '../loginForm/loginForm';
import LeagueForm from '../leagueForm/leagueForm';
import UpdateProfileForm from '../updateProfileForm/updateProfileForm';
import TimeoutForm from '../timeoutForm/timeoutForm';

import './generalModal.css';

let ns = new NotificationService();

const customStyles = {
  content : {
    top : '50%',
    left : '50%',
    right : 'auto',
    bottom : 'auto',
    marginRight : '-50%',
    transform : 'translate(-50%, -50%)',
    maxWidth : '450px',
    minWidth : '350px'
  }
};

class GeneralModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
      modalType: props.modalType
    };

    //Bind functions
    this.toggleModal = this.toggleModal.bind(this);
    this.getTitle = this.getTitle.bind(this);
    this.newModalType = this.newModalType.bind(this);
    this.generateModalForm = this.generateModalForm.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_MODAL_TOGGLE, this, this.toggleModal);
    ns.addObserver(NOTIF_MODAL_TYPE_CHANGE, this, this.newModalType);
    Modal.setAppElement('body');
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_MODAL_TOGGLE);
  }

  toggleModal(modalTypeInput) {
    if (this.state.show) {
      this.setState({show: false});
    } else {
      this.setState({
        show: true,
        modalType: modalTypeInput
      });
    }
  }

  getTitle = () => {
    if (this.state.modalType === 'login') {
      return 'Please Sign In';
    } else if (this.state.modalType === 'join') {
      return 'Join a League';
    } else if (this.state.modalType === 'create') {
      return 'Create a League';
    } else if (this.state.modalType === 'newUsername') {
      return 'Change Username';
    } else if (this.state.modalType === 'newPassword') {
      return 'Change Password';
    } else if (this.state.modalType === 'timeout-clock-sync') {
      return 'Please wait while your clock synchronizes with the server...';
    }
  }

  newModalType(newType) {
    this.setState({modalType: newType});
  }

  generateModalForm = () => {
    if (this.state.modalType === 'login') {
      return (
        <LoginForm submitHandler={this.toggleModal} />
      );
    } else if (this.state.modalType === 'join') {
      return (
        <LeagueForm submitHandler={this.toggleModal} leagueType={this.state.modalType} />
      );
    } else if (this.state.modalType === 'create') {
      return (
        <LeagueForm submitHandler={this.toggleModal} leagueType={this.state.modalType} />
      );
    } else if (this.state.modalType === 'newUsername') {
      return (
        <UpdateProfileForm submitHandler={this.toggleModal} profUpdateType='username' />
      );
    } else if (this.state.modalType === 'newPassword') {
      return (
        <UpdateProfileForm submitHandler={this.toggleModal} profUpdateType='password-reauthenticate' />
      );
    } else {
      return <TimeoutForm />;
    }
  }
  
  render() {
    if (this.props.modalType === 'login') {
      var timeoutStyle;
      var overlayClose = true;
      if (this.props.modalType.includes('timeout')) {
        timeoutStyle = {
          display: 'none'
        };
        overlayClose = false;
      }
      return (
        <div className='modal fade' role='dialog'>
          <div className='modal-dialog modal-dialog-centered' role='document'>
            <div className='modal-content'>
              <Modal isOpen={this.state.show} onRequestClose={this.toggleModal} shouldCloseOnOverlayClick={overlayClose} style={customStyles} >
                <div className='modal-header'>
                  <h4 className='modal-title'>{this.getTitle()}</h4>
                  <button type='button' className='close' style={timeoutStyle} onClick={this.toggleModal}>&times;</button>
                </div>
                <div className='modal-body'>
                  {this.generateModalForm()}
                </div>
                <div className='modal-footer'>
                  <button type='button' className='btn btn-danger' style={timeoutStyle} onClick={this.toggleModal}>Close</button>
                </div>
              </Modal>
            </div>
          </div>
        </div>
      );
    }
  }
}

export default GeneralModal;
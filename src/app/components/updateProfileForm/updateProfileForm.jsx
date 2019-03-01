import React, { Component } from 'react';
import './updateProfileForm.css';
import Button from '../button/button';

import AuthenticationService from '../../../services/authentication-service';

let authService = new AuthenticationService();

class UpdateProfileForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      updateType: this.props.profUpdateType,
      usernameVal: '',
      emailVal: '',
      pass1Val: '',
      pass2Val: '',
      errorFlag: false,
      errorCode: '',
      errorMessage: ''
    }

    // bind functions
    this.updateProfile = this.updateProfile.bind(this);
    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.onEmailChange = this.onEmailChange.bind(this);
    this.onPass1Change = this.onPass1Change.bind(this);
    this.onPass2Change = this.onPass2Change.bind(this);
  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  updateProfile(event) {
    event.preventDefault();

    var self = this;
    var updateType = this.state.updateType;

    if (updateType === 'username') {
      authService.updateUsername(this.state.usernameVal);
      this.props.submitHandler();
    } else if (updateType === 'password') {
      if (this.state.pass1Val === this.state.pass2Val && this.state.pass1Val >= 6) {
        authService.updatePassword(this.state.pass1Val).then(returnVal => {
          console.log(returnVal);
          // this.props.submitHandler();
        }).catch(error => {
          self.setState({
            errorFlag: true,
            errorCode: error.code,
            errorMessage: error.message
          });
        });
      }
    } else if (updateType === 'password-reauthenticate') {
      var cred = authService.reauthenticateUser(this.state.emailVal, this.state.pass1Val).then(userCredential => {
        self.setState({
          updateType: 'password',
          pass1Val: '',
          errorFlag: false,
          errorCode: '',
          errorMessage: ''
        });
      }).catch(error => {
        self.setState({
          errorFlag: true,
          errorCode: error.code,
          errorMessage: error.message
        });
      });
    }
  }

  onUsernameChange(event) {
    this.setState({usernameVal: event.target.value});
  }

  onEmailChange(event) {
    this.setState({emailVal: event.target.value});
  }

  onPass1Change(event) {
    this.setState({pass1Val: event.target.value});
  }

  onPass2Change(event) {
    this.setState({pass2Val: event.target.value});
  }

  generateErrorMessage = () => {
    if (this.state.errorFlag) {
      if (this.state.errorCode === 'auth/wrong-password') {
        return (
          <div className='sign-in-error'>
            <p className='text-danger'>Password Incorrect Password Incorrect Password Incorrect Password Incorrect Password Incorrect Password Incorrect Password Incorrect</p>
          </div>
        );
      } else if (this.state.errorCode === 'auth/user-not-found') {
        return (
          <div className='sign-in-error'>
            <p className='text-danger'>Email Address Not Found</p>
          </div>
        );
      } else if (this.state.errorCode === 'auth/invalid-email') {
        return (
          <div className='sign-in-error'>
            <p className='text-danger'>Invalid Email</p>
          </div>
        );
      } else if (this.state.errorCode === 'auth/weak-password') {
        return (
          <div className='sign-in-error'>
            <p className='text-danger'>Password Not Strong Enough</p>
          </div>
        );
      } else if (this.state.errorCode === 'auth/requires-recent-login') {
        return (
          <div className='sign-in-error'>
            <p className='text-danger'>Please Reauthenticate Before Attempting To Reset Your Password</p>
          </div>
        );
      }
    } else {
      return null;
    }
  }

  generateFormContents = () => {
    if (this.state.updateType === 'username') {
      return (
        <div className='username-form'>
          <div className='form-group'>
            <label><strong>New Username</strong></label>
            <input type='text' className='form-control' value={this.state.usernameVal} onChange={this.onUsernameChange} placeholder='username' />
          </div>
        </div>
      );
    } else if (this.state.updateType === 'password-reauthenticate') {
      return (
        <div className='reauthenticate-form'>
          <div className='form-group'>
            <label><strong>Email</strong></label>
            <input type='text' className='form-control' value={this.state.emailVal} onChange={this.onEmailChange} placeholder='email' />
          </div>
          <div className='form-group'>
            <label><strong>Password</strong></label>
            <input type='password' className='form-control' value={this.state.pass1Val} onChange={this.onPass1Change} placeholder='passsword' />
          </div>
        </div>
      );
    } else if (this.state.updateType === 'password') {
      var passValidClass;
      var passValidText;
      var passValidIcon;
      if (this.state.pass1Val === this.state.pass2Val && this.state.pass1Val.length >= 6) {
        passValidClass = 'text-success';
        passValidText = 'Passwords Valid';
        passValidIcon = 'fas fa-check';
      } else {
        passValidClass = 'text-danger';
        passValidText = 'Passwords Invalid';
        passValidIcon = 'fas fa-times';
      }
      return (
        <div className='password-form'>
          <div className='form-group'>
            <label><strong>New Password</strong></label>
            <input type='password' className='form-control' value={this.state.pass1Val} onChange={this.onPass1Change} placeholder='password' />
          </div>
          <div className='form-group'>
            <label><strong>Confirm Password</strong></label>
            <input type='password' className='form-control' value={this.state.pass2Val} onChange={this.onPass2Change} placeholder='confirm password' />
          </div>
          <div className='password-validator'>
            <span className={passValidClass}>{passValidText} <i className={passValidIcon}></i></span>
          </div>
        </div>
      );
    }
  }

  render() {
    var btnValue;
    if (this.state.updateType === 'password') {
      btnValue = 'Change Password';
    } else if (this.state.updateType === 'username') {
      btnValue = 'Change Username';
    } else if (this.state.updateType === 'password-reauthenticate') {
      btnValue = 'Confirm Account Credentials';
    }

    return (
      <div className='profile-form'>
        <form>
          {this.generateErrorMessage()}
          {this.generateFormContents()}
          <div className='container'>
            <div className='row'>
              <div className='col-12'>
                <Button btnType='submit' btnClass='btn btn-primary btn-block my-2' onClick={this.updateProfile} btnValue={btnValue} />
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default UpdateProfileForm;
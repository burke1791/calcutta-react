import React, { Component } from 'react';
import './updateProfileForm.css';
import Button from '../button/button';

import AuthenticationService from '../../../services/authentication-service';

let authService = new AuthenticationService();

class UpdateProfileForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      usernameVal: '',
      pass1Val: '',
      pass2Val: ''
    }

    // bind functions
    this.updateProfile = this.updateProfile.bind(this);
    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.onPass1Change = this.onPass1Change.bind(this);
    this.onPass2Change = this.onPass2Change.bind(this);
  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  updateProfile(event) {
    event.preventDefault();

    var updateType = this.props.profUpdateType;

    if (this.props.profUpdateType === 'username') {
      authService.updateUsername(this.state.usernameVal);
    } else if (this.props.profUpdateType === 'password') {
      if (this.state.pass1Val === this.state.pass2Val) {
        authService.updatePassword(this.state.pass1Val);
      }
    }

    // This will need to be moved.  In some cases, the modal will need to display an error message
    this.props.submitHandler();
  }

  onUsernameChange(event) {
    this.setState({usernameVal: event.target.value});
  }

  onPass1Change(event) {
    this.setState({pass1Val: event.target.value});
  }

  onPass2Change(event) {
    this.setState({pass2Val: event.target.value});
  }

  generateFormContents = () => {
    if (this.props.profUpdateType === 'username') {
      return (
        <div className='username-form'>
          <div className='form-group'>
            <label><strong>New Username</strong></label>
            <input type='text' className='form-control' value={this.state.usernameVal} onChange={this.onUsernameChange} placeholder='' />
          </div>
        </div>
      );
    } else if (this.props.profUpdateType === 'password') {
      return (
        <div className='password-form'>
          <div className='form-group'>
            <label><strong>New Password</strong></label>
            <input type='password' className='form-control' value={this.state.pass1Val} onChange={this.onPass1Change} placeholder='' />
          </div>
          <div className='form-group'>
            <label><strong>Confirm Password</strong></label>
            <input type='password' className='form-control' value={this.state.pass2Val} onChange={this.onPass2Change} placeholder='' />
          </div>
        </div>
      );
    }
  }

  render() {

    var btnValue = this.props.profUpdateType === 'password' ? 'Change Password' : 'Change Username';

    return (
      <div className='profile-form'>
        <form>
          {this.generateFormContents()}
          <div className='container'>
            <div className='row'>
              <div className='col-12'>
                <Button btnType='submit' btnClass='btn btn-primary btn-block' onClick={this.updateProfile} btnValue={btnValue} />
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default UpdateProfileForm;
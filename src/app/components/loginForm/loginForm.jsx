import React, {Component} from 'react';
import './loginForm.css';
import NotificationService, {NOTIF_AUTH_SUBMIT} from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';
import * as DISPLAY_TYPE from '../../../services/constants';
import Button from '../button/button';

let ns = new NotificationService();
let authService = new AuthenticationService();

class LoginForm extends Component {
  
  constructor(props) {
    super(props);

    this.state = {
      createUser: false,
      displayType: DISPLAY_TYPE.SIGN_IN,
      signupClassName: 'form-group d-none',
      submitBtnText: 'Log In',
      newAccountLinkText: 'Don\'t have an account? Sign Up Here...',
      forgotPasswordText: 'Forgot Password?',
      usernameVal: '',
      emailVal: '',
      pass1Val: '',
      pass2Val: '',
      errorFlag: false,
      errorCode: '',
      errorMessage: ''
    };

    //Bind functions
    this.displaySignUpForm = this.displaySignUpForm.bind(this);
    this.displaySignInForm = this.displaySignInForm.bind(this);
    this.displayForgotPasswordForm = this.displayForgotPasswordForm.bind(this);
    this.authSubmission = this.authSubmission.bind(this);
    this.generateErrorMessage = this.generateErrorMessage.bind(this);
    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.onEmailChange = this.onEmailChange.bind(this);
    this.onPass1Change = this.onPass1Change.bind(this);
    this.onPass2Change = this.onPass2Change.bind(this);
  }

  componentWillMount() {
    ns.addObserver(NOTIF_AUTH_SUBMIT, this, this.authSubmission);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_AUTH_SUBMIT);
  }

  displaySignUpForm() {
    this.setState({
      displayType: DISPLAY_TYPE.SIGN_UP,
      submitBtnText: 'Create Account',
      newAccountLinkText: 'Already have an account? Log In Here...',
      errorFlag: false,
      errorCode: '',
      errorMessage: ''
    });
  }

  displaySignInForm() {
    this.setState({
      displayType: DISPLAY_TYPE.SIGN_IN,
      submitBtnText: 'Log In',
      newAccountLinkText: 'Don\'t have an account? Sign Up Here...',
      errorFlag: false,
      errorCode: '',
      errorMessage: ''
    });
  }

  displayForgotPasswordForm() {
    this.setState({
      displayType: DISPLAY_TYPE.FORGOT_PASSWORD,
      submitBtnText: 'Send Password Reset Email',
      newAccountLinkText: 'Sign In Here...',
      errorFlag: false,
      errorCode: '',
      errorMessage: ''
    });
  }

  authSubmission(event) {
    // Check for valid inputs
    event.preventDefault();
    var self = this;
    if (this.state.displayType === DISPLAY_TYPE.SIGN_UP) {
      // Utilize a promise later on to identify a successful account creation
      authService.createUser(this.state.emailVal, this.state.pass1Val, this.state.usernameVal).then(() => {
        this.props.submitHandler();
      }).catch(error => {
        self.setState({
          errorFlag: true,
          errorCode: error.code,
          errorMessage: error.message
        });
      });
    } else if (this.state.displayType === DISPLAY_TYPE.SIGN_IN) {
      authService.signInUser(this.state.emailVal, this.state.pass1Val).then(() => {
        // sign in success - dismiss modal
        this.props.submitHandler();
      }).catch((error) => {
        self.setState({
          errorFlag: true,
          errorCode: error.code,
          errorMessage: error.message
        });
      });
    } else if (this.state.displayType === DISPLAY_TYPE.FORGOT_PASSWORD) {
      authService.sendPasswordResetEmail(this.state.emailVal).then(() => {
        alert('Password Reset Email Sent');
      }).catch((error) => {
        self.setState({
          errorFlag: true,
          errorCode: error.code,
          errorMessage: error.message
        });
      });
    }
  }

  generateErrorMessage = () => {
    if (this.state.errorFlag) {
      if (this.state.errorCode === 'auth/wrong-password') {
        return (
          <div className='sign-in-error'>
            <p className='text-danger'>Password Incorrect</p>
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
      } else {
        return (
          <div className='sign-in-error'>
            <p className='text-danger'>Unknown Error - Please Try Again</p>
          </div>
        );
      }
    } else {
      return null;
    }
  }

  generateFormContent = () => {
    if (this.state.displayType === DISPLAY_TYPE.SIGN_IN) {
      return (
        <div className='sign-in-inputs'>
          <div className='form-group'>
            <label><strong>Email Address</strong></label>
            <input type='email' className='form-control' value={this.state.emailVal} onChange={this.onEmailChange} placeholder='Enter email' />
          </div>
          <div className='form-group'>
            <label><strong>Password</strong></label>
            <input type='password' className='form-control' value={this.state.pass1Val} onChange={this.onPass1Change} placeholder='Password' />
          </div>
        </div>
      );
    } else if (this.state.displayType === DISPLAY_TYPE.SIGN_UP) {
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
        <div className='sign-up-inputs'>
          <div className='form-group'>
            <label><strong>Username</strong></label>
            <input type='text' className='form-control' value={this.state.usernameVal} onChange={this.onUsernameChange} placeholder='Username' />
          </div>
          <div className='form-group'>
            <label><strong>Email Address</strong></label>
            <input type='email' className='form-control' value={this.state.emailVal} onChange={this.onEmailChange} placeholder='Enter email' />
          </div>
          <div className='form-group'>
            <label><strong>Password</strong></label>
            <input type='password' className='form-control' value={this.state.pass1Val} onChange={this.onPass1Change} placeholder='Password' />
          </div>
          <div className='form-group'>
            <label><strong>Confirm Password</strong></label>
            <input type='password' className='form-control' value={this.state.pass2Val} onChange={this.onPass2Change} placeholder='Confirm Password' />
          </div>
          <div className='password-validator'>
            <span className={passValidClass}>{passValidText} <i className={passValidIcon}></i></span>
          </div>
        </div>
      );
    } else if (this.state.displayType === DISPLAY_TYPE.FORGOT_PASSWORD) {
      return (
        <div className='forgot-pw-inputs'>
          <div className='form-group'>
            <label><strong>Email Address</strong></label>
            <input type='email' className='form-control' value={this.state.emailVal} onChange={this.onEmailChange} placeholder='Enter email' />
          </div>
        </div>
      );
    }
  }

  generateControlButtons = () => {
    if (this.state.displayType === DISPLAY_TYPE.SIGN_IN) {
      return (
        <div className='control-buttons'>
          <div className='row'>
            <div className='col-12'>
              <Button btnType='button' btnClass='btn btn-link' onClick={this.displaySignUpForm} btnValue={this.state.newAccountLinkText} />
            </div>
          </div>
          <div className='row'>
            <div className='col-12'>
              <Button btnType='button' btnClass='btn btn-link' onClick={this.displayForgotPasswordForm} btnValue={this.state.forgotPasswordText} />
            </div>
          </div>
        </div>
      );
    } else if (this.state.displayType === DISPLAY_TYPE.SIGN_UP) {
      return (
        <div className='control-buttons'>
          <div className='row'>
            <div className='col-12'>
              <Button btnType='button' btnClass='btn btn-link' onClick={this.displaySignInForm} btnValue={this.state.newAccountLinkText} />
            </div>
          </div>
          <div className='row'>
            <div className='col-12'>
              <Button btnType='button' btnClass='btn btn-link' onClick={this.displayForgotPasswordForm} btnValue={this.state.forgotPasswordText} />
            </div>
          </div>
        </div>
      );
    } else if (this.state.displayType === DISPLAY_TYPE.FORGOT_PASSWORD) {
      return (
        <div className='control-buttons'>
          <div className='row'>
            <div className='col-12'>
              <Button btnType='button' btnClass='btn btn-link' onClick={this.displaySignInForm} btnValue={this.state.newAccountLinkText} />
            </div>
          </div>
        </div>
      );
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
  
  render() {
    // TODO: refactor to have the create/login differences returned by a function
    if (this.state.signInRejectedFlag) {
      
    }
    return (
      <div className='login-form'>
        <form>
          {this.generateErrorMessage()}
          {this.generateFormContent()}
          <div className='container'>
            <div className='row'>
              <div className='col-12'>
                <Button btnType='submit' btnClass='btn btn-primary btn-block my-2' onClick={this.authSubmission} btnValue={this.state.submitBtnText} />
              </div>
            </div>
            {this.generateControlButtons()}
          </div>
        </form>
      </div>
    );
  }
}

export default LoginForm;
import React, {Component} from 'react';
import './loginForm.css';
import NotificationService, {NOTIF_AUTH_SUBMIT} from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';
import Button from '../button/button';

let ns = new NotificationService();
let authService = new AuthenticationService();

class LoginForm extends Component {
  
  constructor(props) {
    super(props);

    this.state = {
      createUser: false,
      signupClassName: 'form-group d-none',
      submitBtnText: 'Log In',
      newAccountLinkText: 'Don\'t have an account? Sign Up Here...',
      usernameVal: '',
      emailVal: '',
      pass1Val: '',
      pass2Val: ''
    };

    //Bind functions
    this.authTypeToggle = this.authTypeToggle.bind(this);
    this.authSubmission = this.authSubmission.bind(this);
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
  
  authTypeToggle() {
    if (this.state.createUser) {
      this.setState({
        createUser: false,
        signupClassName: 'form-group d-none',
        submitBtnText: 'Log In',
        newAccountLinkText: 'Don\'t have an account? Sign Up Here...'
      });
    } else {
      this.setState({
        createUser: true,
        signupClassName: 'form-group', 
        submitBtnText: 'Create Account', 
        newAccountLinkText: 'Already have an account? Log In Here...'
      });
    }
  }

  authSubmission(event) {
    // Check for valid inputs
    
    event.preventDefault();

    if (this.state.createUser) {
      // Utilize a promise later on to identify a successful account creation
      var success = authService.createUser(this.state.emailVal, this.state.pass1Val, this.state.usernameVal);
    } else {
      authService.signInUser(this.state.emailVal, this.state.pass1Val);
    }
    
    this.props.submitHandler();
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
    return (
      <div className='login-form'>
        <form>
          <div className={this.state.signupClassName}>
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
          <div className={this.state.signupClassName}>
            <label><strong>Confirm Password</strong></label>
            <input type='password' className='form-control' value={this.state.pass2Val} onChange={this.onPass2Change} placeholder='Confirm Password' />
          </div>
          <div className='container'>
            <div className='row'>
              <div className='col-12'>
                <Button btnType='submit' btnClass='btn btn-primary btn-block' onClick={this.authSubmission} btnValue={this.state.submitBtnText} />
              </div>
            </div>
            <div className='row'>
              <div className='col-12'>
                <Button btnType='button' btnClass='btn btn-link' onClick={this.authTypeToggle} btnValue={this.state.newAccountLinkText} />
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default LoginForm;
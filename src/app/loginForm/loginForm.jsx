import React, {Component} from 'react';
import './loginForm.css';
import Fire from '../../services/fire';
import NotificationService, {NOTIF_AUTH_SUBMIT} from '../../services/notification-service';

let ns = new NotificationService();

class LoginForm extends Component {
  
  constructor(props) {
    super(props);

    this.state = {
      createUser: false,
      signupClassName: 'form-group d-none',
      submitBtnText: 'Log In',
      newAccountLinkText: 'Don\'t have an account? Sign Up Here...'
    };

    //Bind functions
    this.authTypeToggle = this.authTypeToggle.bind(this);
    this.authSubmission = this.authSubmission.bind(this);
  }

  componentWillMount() {
    let usersRef = Fire.database().ref('users');
    let authRef = Fire.auth();

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

  authSubmission() {
    // Check for valid inputs

    if (this.state.createUser) {
      // authRef.createUserWithEmailAndPassword()
    }
    // Wait for return from firebase
  }
  
  render() {
    return (
      <div className='login-form'>
        <form>
          <div className={this.state.signupClassName}>
            <label><strong>Username</strong></label>
            <input type='text' className='form-control' id='usernameInput' placeholder='Username' />
          </div>
          <div className='form-group'>
            <label><strong>Email Address</strong></label>
            <input type='email' className='form-control' id='emailInput' placeholder='Enter email' />
          </div>
          <div className='form-group'>
            <label><strong>Password</strong></label>
            <input type='password' className='form-control' id='passwordInput' placeholder='Password' />
          </div>
          <div className={this.state.signupClassName}>
            <label><strong>Confirm Password</strong></label>
            <input type='password' className='form-control' id='confirmPasswordInput' placeholder='Confirm Password' />
          </div>
          <div className='container'>
            <div className='row'>
              <div className='col-12'>
                <button type='submit' className='btn btn-primary btn-block' onClick={this.authSubmission}>{this.state.submitBtnText}</button>
              </div>
            </div>
            <div className='row'>
              <div className='col-12'>
                <button type='button' className='btn btn-link' onClick={this.authTypeToggle}>{this.state.newAccountLinkText}</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default LoginForm;
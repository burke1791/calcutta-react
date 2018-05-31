import React, {Component} from 'react';
import './loginForm.css';
import Fire from '../../services/fire';
import NotificationService, {NOTIF_AUTH_SUBMIT} from '../../services/notification-service';
import Button from '../button/button';

let ns = new NotificationService();

let usersRef = Fire.database().ref('users');
let authRef = Fire.auth();

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
    this.logUserInDatabase = this.logUserInDatabase.bind(this);
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
    
    if (this.state.createUser) {
      var thisForm = this;

      authRef.createUserWithEmailAndPassword(this.state.emailVal, this.state.pass1Val).then(function(user) {
        var newUser = authRef.createUser;
        thisForm.logUserInDatabase(newUser);
      });
    }
    // Wait for return from firebase

    // Test
    event.preventDefault();
    console.log('Username ' + this.state.usernameVal);
    console.log('Email ' + this.state.emailVal);
    console.log('Pass 1 ' + this.state.pass1Val);
    console.log('Pass 2 ' + this.state.pass2Val);
  }

  logUserInDatabase(user) {
    var uid = user.uid;

    if (user != null) {
      user.providerData.forEach(function(profile) {
        var userData = {
          'provider': profile.providerId,
          'provider-uid': profile.uid,
          'name': profile.displayName,
          'email': profile.email,
          'photo-url': profile.photoURL
        }
        usersRef.child(uid).update(userData);
      })
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
import React, { Component } from 'react';
import logo from './logo.svg';
import './app.css';
import Button from './button/button';
import AuthHeader from './authHeader/authHeader';
import AuthenticationService from '../services/authentication-service';
import DataService from '../services/data-service';

let authService = new AuthenticationService();
let ds = new DataService();

class App extends Component {
  
  constructor() {
    super();

    this.state = {
      loading: true
    };

    //Bind functions
    this.printUserInfo = this.printUserInfo.bind(this);
  }

  // TEST
  printUserInfo() {
    var user = authService.getUser

    var uid = user.uid;
    var name = ds.getDisplayName(uid);

    console.log('uid: ' + uid);
    console.log('name: ' + name);
  }
  
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div className='auth-header col-sm-2'>
            <AuthHeader username={ds.getDisplayName(authService.getUser.uid)}/>
          </div>
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to March Madness Calcutta</h1>
        </header>
        <p className="App-intro">
          To get started, create or join a league
        </p>
        <div className='btn-toolbar justify-content-center'>
          <div className='btn-group m-2'>
            <Button btnType='button' btnClass='btn btn-primary' btnValue="Join" />
          </div>
          <div className='btn-group m-2'>
            <Button btnType='button' btnClass='btn btn-primary' btnValue="Create" />
          </div>
          <div className='btn-group m-2'>
            <Button btnType='button' btnClass='btn btn-secondary' btnValue='Print User Info' onClick={this.printUserInfo} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;

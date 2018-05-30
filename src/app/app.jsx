import React, { Component } from 'react';
import logo from './logo.svg';
import './app.css';

import Button from './button/button';
import Auth from './auth/auth';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div className='auth-header col-sm-2'>
            <Auth />
          </div>
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to March Madness Calcutta</h1>
        </header>
        <p className="App-intro">
          To get started, create or join a league
        </p>
        <div className='btn-toolbar justify-content-center'>
          <div className='btn-group m-2'>
            <Button btnValue="Join" />
          </div>
          <div className='btn-group m-2'>
            <Button btnValue="Create" />
          </div>
        </div>
      </div>
    );
  }
}

export default App;

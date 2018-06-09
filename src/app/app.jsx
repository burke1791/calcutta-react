import React, { Component } from 'react';
import logo from './logo.svg';
import './app.css';
import Button from './components/button/button';
import Header from './components/header/header';
import AuthenticationService from '../services/authentication-service';
import DataService from '../services/data-service';
import { auth } from '../services/fire';
import NotificationService, { NOTIF_SIGNIN, NOTIF_SIGNOUT, NOTIF_LEAGUE_SUBMIT, NOTIF_MODAL_TOGGLE } from '../services/notification-service';
import LeagueTable from './components/leagueTable/leagueTable';

let authService = new AuthenticationService();
let ds = new DataService();
let ns = new NotificationService();

class App extends Component {
  
  constructor() {
    super();

    this.state = {
      loading: true,
      authenticatedUser: {},
      authenticatedUsername: ''
    };

    //Bind functions
    this.printUserInfo = this.printUserInfo.bind(this);
    this.onCreateLeagueBtnClicked = this.onCreateLeagueBtnClicked.bind(this);
    this.onJoinLeagueBtnClicked = this.onJoinLeagueBtnClicked.bind(this);
  }

  componentDidMount() {
    var thisApp = this;

    // TODO: Remove these lifecycle functions and put the Auth listener in the auth service

    auth.onAuthStateChanged(function(user) {
      if (user) {
        console.log('user signed in');
        thisApp.setState({authenticatedUser: user});

        ds.getDisplayName(thisApp.state.authenticatedUser.uid).then(function(res) {
          thisApp.setState({authenticatedUsername: res});
        });
        ns.postNotification(NOTIF_SIGNIN, null);
      } else {
        console.log('user is signed out');
        ns.postNotification(NOTIF_SIGNOUT);
        thisApp.setState({
          authenticatedUser: {},
          authenticatedUsername: ''
        })
      }
    });
  }

  componentWillUnmount() {
    auth.onAuthStateChanged();
  }

  onJoinLeagueBtnClicked() {
    if (auth.currentUser != null) {
      ns.postNotification(NOTIF_MODAL_TOGGLE, 'join');
    } else {
      alert('Please Sign In Before Joining a League');
    }
    
  }

  onCreateLeagueBtnClicked() {
    if (auth.currentUser != null) {
      ns.postNotification(NOTIF_MODAL_TOGGLE, 'create');
    } else {
      alert('Please Sign In Before Creating a League');
    }
    
  }

  // TEST
  printUserInfo() {
    var user = this.state.authenticatedUser;

    var uid = user.uid;
    var name = '';

    var thisForm = this;

    ds.getDisplayName(uid).then(function(res) {
      name = res;
      thisForm.setState({authenticatedUsername: name});
      console.log('name from promise: ' + name);
    });

    console.log('uid: ' + uid);
    console.log('name: ' + name);
  }
  
  render() {
    return (
      <div className="App">
        <Header />
        <p className="App-intro">
          To get started, create or join a league
        </p>
        <div className='btn-toolbar justify-content-center'>
          <div className='btn-group m-2'>
            <Button btnType='button' btnClass='btn btn-primary' btnValue="Join" onClick={this.onJoinLeagueBtnClicked} />
          </div>
          <div className='btn-group m-2'>
            <Button btnType='button' btnClass='btn btn-primary' btnValue="Create" onClick={this.onCreateLeagueBtnClicked}/>
          </div>
        </div>
        <div className='container card my-4'>
          <h3>In Progress Leagues</h3>
          <LeagueTable className='table table-striped' tableSource='in-progress' />
        </div>
        <div className='container card my-4'>
          <h3>Leagues Pending Setup</h3>
          <LeagueTable className='table table-striped' tableSource='pending' />
        </div>
        <div className='container card my-4'>
          <h3>Completed Leagues</h3>
          <LeagueTable className='table table-striped' tableSource='complete' /> 
        </div>
      </div>
    );
  }
}

export default App;

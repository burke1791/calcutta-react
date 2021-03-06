import React, { Component } from 'react';
import './leagues.css';
import Button from '../button/button';
import LeagueTable from '../leagueTable/leagueTable';
import AuthenticationService from '../../../services/authentication-service';
import NotificationService, { NOTIF_MODAL_TOGGLE } from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let authService = new AuthenticationService();
let ns = new NotificationService();
let ds = new DataService();

class Leagues extends Component {
  
  constructor(props) {
    super(props);

    // Bind functions
    this.onJoinLeagueBtnClicked = this.onJoinLeagueBtnClicked.bind(this);
    this.onCreateLeagueBtnClicked = this.onCreateLeagueBtnClicked.bind(this);
    this.onAddSportToDB = this.onAddSportToDB.bind(this);
  }

  componentDidMount() {
    
  }
  
  onJoinLeagueBtnClicked() {
    var user = authService.getUser();
    if (user != null) {
      ns.postNotification(NOTIF_MODAL_TOGGLE, 'join');
    } else {
      alert('Please Sign In Before Joining a League');
    }
    
  }

  onCreateLeagueBtnClicked() {
    var user = authService.getUser();
    if (user != null) {
      ns.postNotification(NOTIF_MODAL_TOGGLE, 'create');
    } else {
      alert('Please Sign In Before Creating a League');
    }
  }

  onAddSportToDB() {
    // ds.addSportToDatabase();
  }

  render() {
    return (
      <div className='leagues'>
        <p className="App-intro">
          To get started, create or join a league
        </p>
        <div className='btn-toolbar justify-content-center'>
          <div className='btn-group m-2'>
            <Button btnType='button' btnClass='btn btn-primary' btnValue="Join" onClick={this.onJoinLeagueBtnClicked} />
          </div>
          <div className='btn-group m-2'>
            <Button btnType='button' btnClass='btn btn-primary' btnValue="Create" onClick={this.onCreateLeagueBtnClicked} />
          </div>
        </div>
        <div className='container card my-4'>
          <h3>In Progress Leagues</h3>
          <LeagueTable className='table table-striped table-hover table-sm' tableSource='in-progress' />
        </div>
        <div className='container card my-4'>
          <h3>Leagues Pending Setup</h3>
          <LeagueTable className='table table-striped table-hover table-sm' tableSource='pending' />
        </div>
        <div className='container card my-4'>
          <h3>Completed Leagues</h3>
          <LeagueTable className='table table-striped table-hover table-sm' tableSource='complete' />
        </div>
      </div>
    );
  }
}

export default Leagues;
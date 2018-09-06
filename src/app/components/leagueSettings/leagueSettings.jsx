import React, { Component } from 'react';
import './leagueSettings.css';
import { Redirect } from 'react-router-dom';
import Button from '../button/button';

import DataService from '../../../services/data-service';
import AuthenticationService from '../../../services/authentication-service';

let ds = new DataService();
let authService = new AuthenticationService();

class LeagueSettings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      owner: '',
      member: true
    }

    //bind functions
    this.getLeagueOwner = this.getLeagueOwner.bind(this);
    this.leaveLeague = this.leaveLeague.bind(this);
    this.resetAuction = this.resetAuction.bind(this);
    this.deleteLeague = this.deleteLeague.bind(this);
    this.generateSettingsPage = this.generateSettingsPage.bind(this);
  }

  componentDidMount() {
    this.getLeagueOwner();
  }

  getLeagueOwner() {
    var self = this;

    ds.getLeagueOwner(this.props.leagueId).then(function(leagueOwner) {
      self.setState({owner: leagueOwner});
    });
  }

  leaveLeague = () => {
    // eventually generate a modal to do a check

    var uid = authService.getUser() != null ? authService.getUser().uid : null;
    var self = this;

    if (uid) {
      ds.leaveLeague(uid, this.props.leagueId).then(function() {
        self.setState({member: false});
      });
    } else {
      alert('could not leave league, please try again');
    }
    
  }

  resetAuction = () => {
    // eventually generate a modal to do a check

    var uid = authService.getUser() != null ? authService.getUser().uid : null;
    var self = this;

    if (uid) {
      ds.resetAuction(this.props.leagueId).then(function() {
        alert('Auction Reset');
      });
    } else {
      alert('Unable to reset auction, please try again');
    }
  }

  deleteLeague = () => {
    // eventually generate a modal to do a check

    var uid = authService.getUser() != null ? authService.getUser().uid : null;
    var self = this;

    if (uid) {
      ds.deleteLeague(this.props.leagueId).then(function() {
        self.setState({member: false});
      });
    } else {
      alert('could not delete league, please try again');
    }
  }

  generateSettingsPage = () => {
    var uid = authService.getUser() != null ? authService.getUser().uid : null;

    if (uid !== null && uid === this.state.owner) {
      return (
        <div className='owner-settings'>
          <h1>You are the league owner</h1>
          <Button btnClass='btn btn-danger my-1' btnType='button' btnValue='Delete League' onClick={this.deleteLeague} />
          <Button btnClass='btn btn-danger my-1' btnType='button' btnValue='Reset Auction' onClick={this.resetAuction} />
        </div>
      );
    } else if (uid !== null) {
      return (
        <div className='member-settings'>
          <Button btnClass='btn btn-danger' btnType='button' btnValue='Leave League' onClick={this.leaveLeague} />
        </div>
      );
    }
  }

  render() {
    if (this.state.member) {
      return (
        <div className='league-settings'>
          {this.generateSettingsPage()}
        </div>
      );
    } else {
      return (
        <Redirect to='/' />
      )
    }
  }
}

export default LeagueSettings;
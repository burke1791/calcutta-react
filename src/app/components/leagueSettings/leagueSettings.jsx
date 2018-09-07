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
      member: true,
      unclaimed: false
    }

    //bind functions
    this.getLeagueOwner = this.getLeagueOwner.bind(this);
    this.fetchSettings = this.fetchSettings.bind(this);
    this.leaveLeague = this.leaveLeague.bind(this);
    this.onUnclaimedChange = this.onUnclaimedChange.bind(this);
    this.resetAuction = this.resetAuction.bind(this);
    this.deleteLeague = this.deleteLeague.bind(this);
    this.saveSettings = this.saveSettings.bind(this);
    this.generateSettingsPage = this.generateSettingsPage.bind(this);
  }

  componentDidMount() {
    this.getLeagueOwner();
    this.fetchSettings();
  }

  getLeagueOwner() {
    var self = this;

    ds.getLeagueOwner(this.props.leagueId).then(function(leagueOwner) {
      self.setState({owner: leagueOwner});
    });
  }

  fetchSettings() {
    var self = this;

    ds.fetchSettings(this.props.leagueId).then(function(settings) {
      self.setState({
        unclaimed: settings['unclaimed']
      });
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

  onUnclaimedChange(event) {
    this.setState({unclaimed: event.target.checked});
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

  saveSettings = () => {
    var uid = authService.getUser() != null ? authService.getUser().uid : null;
    var self = this;

    var newSettings = {
      'unclaimed': this.state.unclaimed
    };

    if (uid) {
      ds.saveSettings(this.props.leagueId, newSettings).then(function() {
        alert('Settings Successfully Saved');
      });
    } else {
      alert('Could not save settings please try again');
    }
  }

  generateSettingsPage = () => {
    var uid = authService.getUser() != null ? authService.getUser().uid : null;

    if (uid !== null && uid === this.state.owner) {
      return (
        <div className='owner-settings'>
          <h2>League Settings</h2>
          <div className='form-check'>
            <input className='form-check-input' type='checkbox' checked={this.state.unclaimed} onChange={this.onUnclaimedChange} />
            <label className='form-check-label'>Allow Unclaimed Teams?</label>
          </div>
          <Button btnClass='btn btn-danger my-1' btnType='button' btnValue='Delete League' onClick={this.deleteLeague} />
          <Button btnClass='btn btn-danger my-1' btnType='button' btnValue='Reset Auction' onClick={this.resetAuction} />
          <hr />
          <Button btnClass='btn btn-primary my-1' btnType='button' btnValue='Save Settings' onClick={this.saveSettings} />
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
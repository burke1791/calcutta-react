import React, { Component } from 'react';
import './leagueSettings.css';
import { Redirect } from 'react-router-dom';
import Button from '../button/button';

import DataService from '../../../services/data-service';
import AuthenticationService from '../../../services/authentication-service';

let ds = new DataService();
let authService = new AuthenticationService();

class LeagueSettings extends Component {

  // TODO: Break this component up into "AuctionSettings", etc.

  constructor(props) {
    super(props);

    this.state = {
      owner: '',
      member: true,
      unclaimed: false,
      minBid: 1,
      minBuyIn: 0,
      maxBuyIn: 0
    }

    //bind functions
    this.getLeagueOwner = this.getLeagueOwner.bind(this);
    this.fetchSettings = this.fetchSettings.bind(this);
    this.onUnclaimedChange = this.onUnclaimedChange.bind(this);
    this.onMinBidChange = this.onMinBidChange.bind(this);
    this.onMinBuyInChange = this.onMinBuyInChange.bind(this);
    this.onMaxBuyInChange = this.onMaxBuyInChange.bind(this);
    this.leaveLeague = this.leaveLeague.bind(this);
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
      if (settings) {
        self.setState({
          unclaimed: settings['unclaimed'],
          minBid: settings['minBid'],
          minBuyIn: settings['minBuyIn'],
          maxBuyIn: settings['maxBuyIn']
        });
      } else {
        self.setState({
          unclaimed: true,
          minBid: 0,
          minBuyIn: 0,
          maxBuyIn: 0
        });
      }
    });
  }

  onMinBidChange(event) {
    event.preventDefault();

    var minBid = event.target.value;

    this.setState({minBid: minBid});
  }

  onMinBuyInChange(event) {
    event.preventDefault();

    var minBuyIn = event.target.value;

    this.setState({minBuyIn: minBuyIn});
  }

  onMaxBuyInChange(event) {
    event.preventDefault();

    var maxBuyIn = event.target.value;

    this.setState({maxBuyIn: maxBuyIn});
  }

  onUnclaimedChange(event) {
    event.preventDefault();

    this.setState({unclaimed: event.target.checked});
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

  saveSettings = () => {
    var uid = authService.getUser() != null ? authService.getUser().uid : null;
    var self = this;

    var newSettings = {
      'unclaimed': this.state.unclaimed,
      'minBid': Number(this.state.minBid),
      'minBuyIn': Number(this.state.minBuyIn),
      'maxBuyIn': Number(this.state.maxBuyIn)
    };

    if (uid) {
      ds.saveSettings(this.props.leagueId, newSettings).then(function() {
        alert('Settings Successfully Saved');
      }, function(error) {
        alert('Error in settings values');
      });
    } else {
      alert('Could not save settings please try again');
    }
  }

  generateSettingsPage = () => {
    var uid = authService.getUser() != null ? authService.getUser().uid : null;

    if (uid !== null && uid === this.state.owner) {
      return (
        <div className='container owner-settings'>
          <div className='row'>
            <div className='col'>
              <h2>League Settings</h2>
            </div>
          </div>
          <div className='row justify-content-center'>
            <div className='col-6'>
              <div className='my-1'>
                <label><strong>Minimum Bid Amount</strong></label>
                <div className='input-group'>
                  <div className='input-group-prepend'>
                    <span className='input-group-text'>$</span>
                  </div>
                  <input type='number' className='form-control' value={this.state.minBid} onChange={this.onMinBidChange} />
                </div>
              </div>
              <div className='my-1'>
                <label><strong>Minimum Buy In</strong></label>
                <div className='input-group'>
                  <div className='input-group-prepend'>
                    <span className='input-group-text'>$</span>
                  </div>
                  <input type='number' className='form-control' value={this.state.minBuyIn} onChange={this.onMinBuyInChange} />
                </div>
              </div>
              <div className='my-1'>
                <label><strong>Maximum Buy In</strong></label>
                <div className='input-group'>
                  <div className='input-group-prepend'>
                    <span className='input-group-text'>$</span>
                  </div>
                  <input type='number' className='form-control' value={this.state.maxBuyIn} onChange={this.onMaxBuyInChange} />
                </div>
              </div>
            </div>
          </div>
          <div className='row justify-content-center'>
            <div className='col input-group my-1'>
              <div className='form-check'>
                <input className='form-check-input' type='checkbox' checked={this.state.unclaimed} onChange={this.onUnclaimedChange} />
                <label className='form-check-label'>Allow Unclaimed Teams?</label>
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='col'>
              <Button btnClass='btn btn-danger my-1' btnType='button' btnValue='Delete League' onClick={this.deleteLeague} />
              <Button btnClass='btn btn-danger my-1' btnType='button' btnValue='Reset Auction' onClick={this.resetAuction} />
            </div>
          </div>  
          <hr />
          <div className='row'>
            <div className='col'>
              <Button btnClass='btn btn-primary my-1' btnType='button' btnValue='Save Settings' onClick={this.saveSettings} />
            </div>
          </div>
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
import React, { Component } from 'react';
import './leagueSettings.css';
import { Redirect } from 'react-router-dom';
import Button from '../button/button';
import PayoutSettingsTable from '../payoutSettingsTable/payoutSettingsTable';

import DataService from '../../../services/data-service';
import AuthenticationService from '../../../services/authentication-service';
import NotificationService, { NOTIF_SAVE_SETTINGS_REQUESTED } from '../../../services/notification-service';

let ds = new DataService();
let authService = new AuthenticationService();
let ns = new NotificationService();

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
      maxBuyIn: 0,
      useTax: 0,
      taxRate: 0,
      sportCode: ''
    }

    //bind functions
    this.getLeagueOwner = this.getLeagueOwner.bind(this);
    this.getLeagueSportCode = this.getLeagueSportCode.bind(this);
    this.fetchSettings = this.fetchSettings.bind(this);
    this.onUnclaimedChange = this.onUnclaimedChange.bind(this);
    this.onMinBidChange = this.onMinBidChange.bind(this);
    this.onMinBuyInChange = this.onMinBuyInChange.bind(this);
    this.onMaxBuyInChange = this.onMaxBuyInChange.bind(this);
    this.onUseTaxChange = this.onUseTaxChange.bind(this);
    this.onTaxRateChange = this.onTaxRateChange.bind(this);
    this.leaveLeague = this.leaveLeague.bind(this);
    this.resetAuction = this.resetAuction.bind(this);
    this.deleteLeague = this.deleteLeague.bind(this);
    this.saveSettings = this.saveSettings.bind(this);
    this.generatePayoutSettings = this.generatePayoutSettings.bind(this);
    this.generateSettingsPage = this.generateSettingsPage.bind(this);
  }

  componentDidMount() {
    this.getLeagueOwner();
    this.fetchSettings();
    this.getLeagueSportCode();
  }

  getLeagueOwner() {
    var self = this;

    ds.getLeagueOwner(this.props.leagueId).then(function(leagueOwner) {
      self.setState({owner: leagueOwner});
    });
  }

  getLeagueSportCode() {
    var self = this;
    ds.getLeagueSportCode(this.props.leagueId).then(sportCode => {
      self.setState({sportCode: sportCode});
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
          maxBuyIn: settings['maxBuyIn'],
          useTax: settings['use-tax'] ? settings['use-tax'] : 0,
          taxRate: settings['tax-rate'] ? settings['tax-rate'] : 0
        });
      } else {
        self.setState({
          unclaimed: true,
          minBid: 0,
          minBuyIn: 0,
          maxBuyIn: 0,
          useTax: 0,
          taxRate: 0
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

  onUseTaxChange(event) {
    this.setState({useTax: event.target.value});
  }

  onTaxRateChange(event) {
    this.setState({taxRate: event.target.value});
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
    ns.postNotification(NOTIF_SAVE_SETTINGS_REQUESTED, null);

    var uid = authService.getUser() != null ? authService.getUser().uid : null;
    var self = this;

    var newSettings = {
      'unclaimed': this.state.unclaimed,
      'minBid': Number(this.state.minBid),
      'minBuyIn': Number(this.state.minBuyIn),
      'maxBuyIn': Number(this.state.maxBuyIn),
      'use-tax': Number(this.state.useTax),
      'tax-rate': Number(this.state.taxRate)
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

  generatePayoutSettings = () => {
    if (this.state.sportCode === '' || this.state.sportCode === 'custom') {
      return (
        <div className='not-supported'>
          <h5>Custom Leagues Do Not Currently Support Automated Payouts</h5>
        </div>
      );
    } else {
      return (
        <PayoutSettingsTable leagueId={this.props.leagueId} sportCode={this.state.sportCode} />
      );
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
                <div className='input-group leagueSetting'>
                  <div className='input-group-prepend leagueSettingPrepend'>
                    <span className='input-group-text'>$</span>
                  </div>
                  <input type='number' className='form-control' value={this.state.minBid} onChange={this.onMinBidChange} />
                </div>
              </div>
              <div className='my-1'>
                <label><strong>Minimum Buy In</strong></label>
                <div className='input-group leagueSetting'>
                  <div className='input-group-prepend leagueSettingPrepend'>
                    <span className='input-group-text'>$</span>
                  </div>
                  <input type='number' className='form-control' value={this.state.minBuyIn} onChange={this.onMinBuyInChange} />
                </div>
              </div>
              <div className='my-1'>
                <label><strong>Maximum Buy In</strong></label>
                <p>(Enter $0 for unlimited)</p>
                <div className='input-group leagueSetting'>
                  <div className='input-group-prepend leagueSettingPrepend'>
                    <span className='input-group-text'>$</span>
                  </div>
                  <input type='number' className='form-control' value={this.state.maxBuyIn} onChange={this.onMaxBuyInChange} />
                </div>
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='col input-group my-1 justify-content-center'>
              <div className='form-check'>
                <input className='form-check-input' type='checkbox' checked={this.state.unclaimed} onChange={this.onUnclaimedChange} />
                <label className='form-check-label'>Allow Unclaimed Teams?</label>
              </div>
            </div>
          </div>
          <div className='row justify-content-center'>
            <div className='col-6 my-1'>
              <label><strong>Use Tax</strong></label>
              <div className='input-group leagueSetting'>
                <div className='input-group-prepend leagueSettingPrepend'>
                  <span className='input-group-text'>$</span>
                </div>
                <input type='number' className='form-control' value={this.state.useTax} onChange={this.onUseTaxChange} />
              </div>
              <label><strong>Tax Rate</strong></label>
              <div className='input-group leagueSetting'>
                <div className='input-group-prepend leagueSettingPrepend'>
                  <span className='input-group-text'>$</span>
                </div>
                <input type='number' className='form-control' value={this.state.taxRate} onChange={this.onTaxRateChange} />
              </div>
            </div>
          </div>
          <div className='payout-settings'>
            {this.generatePayoutSettings()}
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
import React, { Component } from 'react';
import './leagueSettings.css';
import Button from '../button/button';

import DataService from '../../../services/data-service';
import AuthenticationService from '../../../services/authentication-service';

let ds = new DataService();
let authService = new AuthenticationService();

class LeagueSettings extends Component {
  constructor(props) {
    super(props);

    this.state = {
      owner: ''
    }

    //bind functions
    this.getLeagueOwner = this.getLeagueOwner.bind(this);
    this.leaveLeague = this.leaveLeague.bind(this);
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

    
  }

  generateSettingsPage = () => {
    var uid = authService.getUser() != null ? authService.getUser().uid : null;

    if (uid !== null && uid === this.state.owner) {
      return (
        <div className='owner-settings'>
          <h1>You are the league owner</h1>
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
    return (
      <div className='league-settings'>
        {this.generateSettingsPage()}
      </div>
    );
  }
}

export default LeagueSettings;
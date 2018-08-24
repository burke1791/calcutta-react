import React, { Component } from 'react';
import './leagueNav.css';
import { Link } from 'react-router-dom';

import AuthenticationService from '../../../services/authentication-service';
import NotificationService, { NOTIF_SIGNIN } from '../../../services/notification-service';

let authService = new AuthenticationService();
let ns = new NotificationService();

class LeagueNav extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUserId: ''
    }

    //bind functions
    this.getCurrentUserId = this.getCurrentUserId.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_SIGNIN, this, this.getCurrentUserId);

    this.getCurrentUserId();
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNIN);
  }

  getCurrentUserId() {
    var uid = authService.getUser().uid;

    this.setState({
      currentUserId: uid
    });
  }

  render() {
    var leagueRoot = '/league-home/';

    return (
      <div className='league-nav container my-2'>
        <nav className='navbar navbar-expand-lg'>
          <div className='mr-auto'>
            <Link className='to-league-home mx-2' exact='true' to={leagueRoot + this.props.leagueId}>League Home</Link>
            <Link className='to-my-team mx-2' exact='true' to={leagueRoot + this.props.leagueId + '/member/' + this.state.currentUserId}>My Team</Link>
            <Link className='to-auction-room mx-2' exact='true' to={leagueRoot + this.props.leagueId + '/auction'}>Auction Room</Link>
            <Link className='to-auction-room mx-2' exact='true' to={leagueRoot + this.props.leagueId}>League Settings</Link>
          </div>
        </nav>
        <hr />
      </div>
    );
  }
}

export default LeagueNav;
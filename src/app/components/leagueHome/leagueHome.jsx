import React, { Component } from 'react';
import './leagueHome.css';
import { Redirect } from 'react-router-dom';
import MembersTable from '../membersTable/membersTable';
import NotificationService, { NOTIF_SIGNOUT } from '../../../services/notification-service';

let ns = new NotificationService();

class LeagueHome extends Component {

  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: true
    }

    // Bind functions
    this.onSignOut = this.onSignOut.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_SIGNOUT, this, this.onSignOut);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNOUT);
  }

  onSignOut() {
    // Neither of the below work as it
    
    // this.props.history.push('/');
    // this.setState({isAuthenticated: false});
  }

  render() {
    if (this.state.isAuthenticated) {
      return (
        <div className='league-home'>
          <div className='container card'>
            <MembersTable leagueId={this.props.leagueId} className='table table-striped' isAuthenticated={this.state.isAuthenticated} />
          </div>
        </div>
      );
    } else {
      return (
        <Redirect to='/' />
      )
    }
    
  }

}

export default LeagueHome;
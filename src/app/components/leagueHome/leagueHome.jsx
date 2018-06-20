import React, { Component } from 'react';
import './leagueHome.css';
import { Redirect } from 'react-router-dom';
import LeagueHeader from '../leagueHeader/leagueHeader';
import MembersTable from '../membersTable/membersTable';
import NotificationService, { NOTIF_SIGNOUT } from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();

class LeagueHome extends Component {

  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: true,
      leagueName: ''
    }

    // Bind functions
    this.onSignOut = this.onSignOut.bind(this);
    this.getLeagueName = this.getLeagueName.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_SIGNOUT, this, this.onSignOut);
    this.getLeagueName();
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNOUT);
  }

  onSignOut() {
    // Neither of the below work as is
    
    // this.props.history.push('/');
    // this.setState({isAuthenticated: false});
  }

  getLeagueName() {
    var self = this;
    ds.getLeagueName(this.props.match.params.id).then(function(name) {
      self.setState({leagueName: name});
    });
  }

  render() {
    if (this.state.isAuthenticated) {
      return (
        <div className='league-home'>
          <div className='container league-header'>
            <LeagueHeader leagueId={this.props.match.params.id} />
          </div>
          <div className='container card'>
            <MembersTable className='table table-striped table-hover' isAuthenticated={this.state.isAuthenticated} />
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
import React, { Component } from 'react';
import './leagueHome.css';
import MembersTable from '../membersTable/membersTable';

class LeagueHome extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='league-home'>
        <MembersTable leagueId={this.props.leagueId} className='table table-striped' />
      </div>
    );
  }

}

export default LeagueHome;
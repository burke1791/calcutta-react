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
        <div className='container card'>
          <MembersTable leagueId={this.props.leagueId} className='table table-striped' />
        </div>
      </div>
    );
  }

}

export default LeagueHome;
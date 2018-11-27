import React, { Component } from 'react';
import './teamPage.css';

import TeamTable from '../teamTable/teamTable';

import DataService from '../../../services/data-service';

let ds = new DataService();

class TeamPage extends Component {
  constructor(props) {
    super(props);

    this.state = {

    }

    // bind functions
    this.getTeamInfo = this.getTeamInfo.bind(this);
  }

  componentDidMount() {
    this.getTeamInfo();
  }

  componentWillUnmount() {

  }

  getTeamInfo() {
    var self = this;
    ds.getTeamInfo(this.props.match.params.leagueId, this.props.match.params.teamId).then(function(teamInfo) {
      console.log('Team info resolved');
    });
  }

  render() {
    return (
      <div className='test'>
        <h1>TEAM PAGE TEST</h1>
      </div>
    )
  }
}

export default TeamPage;
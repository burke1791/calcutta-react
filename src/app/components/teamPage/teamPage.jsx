import React, { Component } from 'react';
import './teamPage.css';

import TeamTable from '../teamTable/teamTable';

import DataService from '../../../services/data-service';

let ds = new DataService();

class TeamPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      teamInfo: {}
    }

    // bind functions
    this.getTeamInfo = this.getTeamInfo.bind(this);
    this.generateTeamInfo = this.generateTeamInfo.bind(this);
  }

  componentDidMount() {
    this.getTeamInfo();
  }

  componentWillUnmount() {

  }

  getTeamInfo() {
    var self = this;
    ds.getTeamInfo(this.props.match.params.sportId, this.props.match.params.teamId).then(function(teamInfo) {
      self.setState({teamInfo: teamInfo});
    }).catch(function(error) {
      self.setState({teamInfo: false});
    });
  }

  generateTeamInfo = () => {
    if (this.state.teamInfo) {
      return (
        <div className='team-info'>
          <h1>{this.state.teamInfo['name']}</h1>
          <h2>{this.state.teamInfo['conf']}</h2>
          <h3>Overall Record: {this.state.teamInfo['ovr-record']}</h3>
          <h3>Conference Record: {this.state.teamInfo['conf-record']}</h3>
          <h4>Region: {this.state.teamInfo['region']}</h4>
          <h4>Seed: {this.state.teamInfo['seed']}</h4>
          <h4>Schedule</h4>
        </div>
      );
    } else {
      return (
        <div className='team-info'>
          <h1>Team Info Not Available</h1>
        </div>
      );
      
    }
  }

  render() {
    return (
      <div className='team-page'>
        {this.generateTeamInfo()}
      </div>
    );
  }
}

export default TeamPage;
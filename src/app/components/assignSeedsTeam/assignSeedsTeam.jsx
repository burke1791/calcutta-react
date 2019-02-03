import React, { Component } from 'react';
import './assignSeedsTeam.css';

import DataService from '../../../services/data-service';

let ds = new DataService();

class AssignSeedsTeam extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      seed: 0
    }

    // bind functions
    this.getTeamName = this.getTeamName.bind(this);
  }

  componentDidMount() {
    this.getTeamName();
  }

  getTeamName() {
    var self = this;
    ds.getTeamNameFromId(this.props.teamId, this.props.teamInfoNode).then(function(teamName) {
      self.setState({name: teamName});
    });
  }

  render() {
    return (
      <div className='row'>
        <div className='col-2'>
          <label>{this.state.name}</label>
        </div>
        <div className='col-2'>
          <input type='number' />
        </div>
      </div>
    );
  }
}

export default AssignSeedsTeam;
import React, { Component } from 'react';
import './godModeAssignSeeds.css';

import AssignSeedsTeam from '../assignSeedsTeam/assignSeedsTeam';

import DataService from '../../../services/data-service';

let ds = new DataService();

class GodModeAssignSeeds extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTournament: 'n/a',
      tournamentId: '',
      teams: '',
      teamInfoNode: ''
    }

    // bind functions
    this.onTournamentSelected = this.onTournamentSelected.bind(this);
    this.updateTourneyTeams = this.updateTourneyTeams.bind(this);

    this.generateTourneyTeams = this.generateTourneyTeams.bind(this);
  }

  onTournamentSelected(event) {
    var tourneyInfo = event.target.value.split(' ');

    this.setState({
      selectedTournament: event.target.value,
      tournamentId: tourneyInfo[0],
      teamInfoNode: tourneyInfo[1]
    });

    this.updateTourneyTeams(tourneyInfo[0]);
  }

  updateTourneyTeams(tourneyId) {
    if (tourneyId !== 'n/a') {
      var self = this;
      ds.getTourneyTeamsFromTourneyId(tourneyId).then(function(teams) {
        self.setState({teams: teams});
      });
    }
  }

  generateTourneyTeams = () => {
    if (this.state.teams) {
      const list = this.state.teams.map((team, i) => {
        return (
          <AssignSeedsTeam teamId={team} teamInfoNode={this.state.teamInfoNode} key={i} />
        );
      });

      return (list);
    } else {
      console.log(this.state.teams);
      return null;
    }
    
  }

  render() {
    return (
      <div className='container assign-seeds'>
        <h1>Assign Seeds</h1>
        <div className='tournaments-dropdown'>
          <div className='form-group'>
            <div className='row'>
              <div className='col-2'>
                <label><strong>Tournament:</strong></label>
              </div>
              <div className='col'>
                <select className='custom-select' value={this.state.selectedTournament} onChange={this.onTournamentSelected}>
                  <option value='n/a'>Please select a tournament...</option>
                  <option value='mens-btt-2019 cbb-mens-team-info'>2019 Men's Big Ten Tournament</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {this.generateTourneyTeams()}
      </div>
    );
  }
}

export default GodModeAssignSeeds;
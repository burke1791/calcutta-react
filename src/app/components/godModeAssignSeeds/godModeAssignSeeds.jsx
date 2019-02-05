import React, { Component } from 'react';
import './godModeAssignSeeds.css';

import AssignSeedsTeam from '../assignSeedsTeam/assignSeedsTeam';

import DataService from '../../../services/data-service';
import NotificationService, { NOTIF_ASSIGN_SEEDS } from '../../../services/notification-service';

let ds = new DataService();
let ns = new NotificationService();

class GodModeAssignSeeds extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTournament: 'n/a',
      tournamentId: '',
      teams: '',
      teamInfoNode: '',
      seedsNode: '',
      year: '',
      seeds: {}
    }

    // bind functions
    this.onTournamentSelected = this.onTournamentSelected.bind(this);
    this.updateTourneyTeams = this.updateTourneyTeams.bind(this);
    this.handleSeedChange = this.handleSeedChange.bind(this);
    this.assignSeeds = this.assignSeeds.bind(this);

    this.generateTourneyTeams = this.generateTourneyTeams.bind(this);
  }

  onTournamentSelected(event) {
    var tourneyInfo = event.target.value.split(' ');
    var year = tourneyInfo[0].match(/[0-9]{4}/g);

    this.setState({
      selectedTournament: event.target.value,
      tournamentId: tourneyInfo[0],
      teamInfoNode: tourneyInfo[1],
      seedsNode: tourneyInfo[2],
      year: year
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

  handleSeedChange(teamId, seed) {
    var seeds = this.state.seeds;
    seeds[teamId] = seed;
    this.setState({seeds: seeds});
  }

  assignSeeds(event) {
    event.preventDefault();

    // Post notification for child components to set the seed values in firebase
    ns.postNotification(NOTIF_ASSIGN_SEEDS, null);
  }

  generateTourneyTeams = () => {
    if (this.state.teams) {
      const list = this.state.teams.map((team, i) => {
        return (
          <div className='form-group' key={i}>
            <AssignSeedsTeam teamId={team} seed={this.state.seeds[team] || 0} onSeedChange={this.handleSeedChange} teamInfoNode={this.state.teamInfoNode} sportId={this.state.seedsNode} year={this.state.year} key={i} />
          </div>
        );
      });

      return (list);
    } else {
      return null;
    }
    
  }

  render() {
    var btnClass = this.state.selectedTournament === 'n/a' ? 'btn btn-danger' : 'btn btn-primary';

    return (
      <div className='container assign-seeds'>
        <h1>Assign Seeds</h1>
        <div className='tournaments-dropdown'>
          <div className='form-group'>
            <div className='row'>
              <div className='col-2'>
                <label><strong>Tournament:</strong></label>
              </div>
              <div className='col-4'>
                <select className='custom-select' value={this.state.selectedTournament} onChange={this.onTournamentSelected}>
                  <option value='n/a'>Please select a tournament...</option>
                  <option value='mens-btt-2019 cbb-mens-team-info btt-seeds'>2019 Men's Big Ten Tournament</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <form>
          {this.generateTourneyTeams()}
          <button type='submit' className={btnClass + ' my-2'} onClick={this.assignSeeds}>Assign Seeds</button>
        </form>
      </div>
    );
  }
}

export default GodModeAssignSeeds;
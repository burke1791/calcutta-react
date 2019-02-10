import React, { Component } from 'react';
import './godModeAssignSeeds.css';

import TournamentDropdown from '../tournamentDropdown/tournamentDropdown';
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
      year: '',
      seeds: {}
    }

    // bind functions
    this.updateTourneyTeams = this.updateTourneyTeams.bind(this);
    this.handleTournamentSelection = this.handleTournamentSelection.bind(this);
    this.handleSeedChange = this.handleSeedChange.bind(this);
    this.assignSeeds = this.assignSeeds.bind(this);
    this.generateTourneyTeams = this.generateTourneyTeams.bind(this);
  }

  updateTourneyTeams(tourneyId, year) {
    if (tourneyId !== '' && year !== '') {
      var self = this;
      ds.getTourneyTeamsFromTourneyIdAndYear(tourneyId, year).then(function(teams) {
        self.setState({teams: teams});
      });
    }
  }

  handleTournamentSelection(selection, teamInfoNode) {
    // parse the year and tournamentId
    if (selection === 'n/a') {
      var tournamentId = '';
      var year = ''
    } else {
      var tournamentId = selection.match(/[a-z]{1,}/g);
      var year = selection.match(/[0-9]{4}/g);
    }
    
    this.setState({
      selectedTournament: selection,
      tournamentId: tournamentId[0],
      teamInfoNode: teamInfoNode,
      year: year[0],
      teams: ''
    });

    this.updateTourneyTeams(tournamentId[0], year[0]);
  }

  handleSeedChange(teamId, seed) {
    var seeds = this.state.seeds;
    seeds[teamId] = seed;
    this.setState({seeds: seeds});
  }

  assignSeeds(event) {
    // need to move the seed update to this component
    event.preventDefault();

    // Post notification for child components to set the seed values in firebase
    ns.postNotification(NOTIF_ASSIGN_SEEDS, null);
  }

  generateTourneyTeams = () => {
    if (this.state.teams) {
      const list = this.state.teams.map((team, i) => {
        return (
          <div className='form-group' key={i}>
            <AssignSeedsTeam teamId={team} seed={this.state.seeds[team] || 0} onSeedChange={this.handleSeedChange} teamInfoNode={this.state.teamInfoNode} tournamentId={this.state.tournamentId} year={this.state.year} key={i} />
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
        <TournamentDropdown selectedTournament={this.state.selectedTournament} onTournamentSelected={this.handleTournamentSelection} />
        <form>
          {this.generateTourneyTeams()}
          <button type='submit' className={btnClass + ' my-2'} onClick={this.assignSeeds}>Assign Seeds</button>
        </form>
      </div>
    );
  }
}

export default GodModeAssignSeeds;
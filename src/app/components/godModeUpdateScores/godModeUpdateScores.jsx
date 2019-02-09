import React, { Component } from 'react';
import './godModeUpdateScores.css';

import TournamentDropdown from '../tournamentDropdown/tournamentDropdown';
import UpdateScoresTable from '../updateScoresTable/updateScoresTable';

class GodModeUpdateScores extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTournament: 'n/a',
      tournamentId: '',
      teamInfoNode: '',
      year: '',
      games: ''
    }

    // bind functions
    this.handleTournamentSelection = this.handleTournamentSelection.bind(this);
  }

  handleTournamentSelection(selection, teamInfoNode) {
    // parse the year and tournamentId
    var tournamentId = selection.match(/[a-z]{1,}/g);
    var year = selection.match(/[0-9]{4}/g);

    this.setState({
      selectedTournament: selection,
      tournamentId: tournamentId[0],
      teamInfoNode: teamInfoNode,
      year: year[0],
      games: ''
    });
  }

  render() {
    return(
      <div className='container update-scores'>
        <h1>Update Scores</h1>
        <TournamentDropdown selectedTournament={this.state.selectedTournament} onTournamentSelected={this.handleTournamentSelection} />
        <hr />
        <UpdateScoresTable tableClass={'table table-striped table-sm'} tournamentId={this.state.tournamentId} year={this.state.year} />
      </div>
    );
  }
}

export default GodModeUpdateScores;
import React, { Component } from 'react';
import './godModeUpdateScores.css';

import TournamentDropdown from '../tournamentDropdown/tournamentDropdown';

class GodModeUpdateScores extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTournament: 'n/a',
      tournamentId: '',
      teamInfoNode: '',
      seedsNode: '',
      year: ''
    }

    // bind functions
    this.handleSelection = this.handleSelection.bind(this);
  }

  handleSelection(selection, tournamentId, teamInfoNode, seedsNode, year) {
    this.setState({
      selectedTournament: selection,
      tournamentId: tournamentId,
      teamInfoNode: teamInfoNode,
      seedsNode: seedsNode,
      year: year
    });
  }

  render() {

    // likely need to make TournamentDropdown a controlled component
    return(
      <div className='container update-scores'>
        <h1>Update Scores</h1>
        <TournamentDropdown selectedTournament={this.state.selectedTournament} onTournamentSelected={this.handleSelection} />
      </div>
    );
  }
}

export default GodModeUpdateScores;
import React, { Component } from 'react';
import './godModeUpdateScores.css';

import TournamentDropdown from '../tournamentDropdown/tournamentDropdown';

class GodModeUpdateScores extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTournament: 'n/a'
    }
  }

  render() {

    // likely need to make TournamentDropdown a controlled component
    return(
      <div className='container update-scores'>
        <h1>Update Scores</h1>
        <TournamentDropdown />
      </div>
    );
  }
}

export default GodModeUpdateScores;
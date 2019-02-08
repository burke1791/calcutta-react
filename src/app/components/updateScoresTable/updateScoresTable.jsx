import React, { Component } from 'react';
import './updateScoresTable.css';

import UpdateScoresRow from '../updateScoresRow/updateScoresRow';

import DataService from '../../../services/data-service';

let ds = new DataService();

class UpdateScoresTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      games: []
    }

    // bind functions
    this.getTournamentGames = this.getTournamentGames.bind(this);
    this.gamesList = this.gamesList.bind(this);
  }

  // use function for new props
  componeneDidUpdate(prevProps) {
    console.log(prevProps.tournamentId);
    console.log(this.props.tournamentId);
    if (this.props.tournamentId !== prevProps.tournamentId) {
      this.getTournamentGames();
    }
  }

  getTournamentGames() {
    ds.getTournamentGamesByTournamentId(this.props.tournamentId, this.props.year).then(function(games) {

    });
  }

  gamesList = () => {

  }

  render() {
    return (
      <div className='row update-scores-table'>
        <table className={this.props.tableClass}>
          <thead>
            <tr className='d-flex'>
              <th className='col-2'>Game #</th>
              <th className='col-6'>Scores</th>
              <th className='col-2'>Num OT</th>
            </tr>
          </thead>
          <tbody>
            {this.gamesList()}
          </tbody>
        </table>
      </div>
    );
  }
}

export default UpdateScoresTable;
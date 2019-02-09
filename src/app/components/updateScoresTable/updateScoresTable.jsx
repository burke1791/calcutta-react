import React, { Component } from 'react';
import './updateScoresTable.css';

import UpdateScoresRow from '../updateScoresRow/updateScoresRow';

import DataService from '../../../services/data-service';

let ds = new DataService();

class UpdateScoresTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gameKeys: [],
      games: {},
      teams: {}
    }

    // bind functions
    this.getTournamentGames = this.getTournamentGames.bind(this);
    this.gamesList = this.gamesList.bind(this);
    this.onScoreChange = this.onScoreChange.bind(this);
    this.onNumOTChange = this.onNumOTChange.bind(this);
  }

  // not sure this function is the one I'm looking for
  componentDidUpdate(prevProps) {
    if (this.props.tournamentId !== prevProps.tournamentId) {
      this.getTournamentGames();
    }
  }

  getTournamentGames() {
    var self = this;
    ds.getTournamentGamesByTournamentId(this.props.tournamentId, this.props.year).then(function(games) {
      var gameKeys = [];

      for (var game in games) {
        gameKeys.push(game);
      }
      
      self.setState({
        gameKeys: gameKeys,
        games: games,
      });
      
    });
  }

  onScoreChange(gameNum, teamNum, newScore) {
    if (gameNum < 10) {
      var gameId = 'G0' + gameNum;
    } else {
      var gameId = 'G' + gameNum;
    }


  }

  onNumOTChange() {

  }

  gamesList = () => {
    if (this.state.games) {
      const list = Object.keys(this.state.games).map((key, i) => {
        var gameNum = Number(key.match(/[0-9]{1,}/g));
        var firstTeam = this.state.games[key].team1.name ==='' ? 'TBD' : this.state.games[key].team1.name;
        var secondTeam = this.state.games[key].team2.name === '' ? 'TBD' : this.state.games[key].team2.name;

        var firstTeamScore = this.state.games[key].score.team1;
        var secondTeamScore = this.state.games[key].score.team2;
        var numOT = this.state.games[key].score['num-ot'];

        /*
        return (
          <UpdateScoresRow gameNum={gameNum} firstTeam={firstTeam} secondTeam={secondTeam} firstTeamScore={firstTeamScore} secondTeamScore={secondTeamScore} onScoreChange={this.onScoreChange} numOT={numOT} onNumOTChange={this.onNumOTChange} key={i} />
        );
        */

        return (
          <UpdateScoresRow gameId={key} game={this.state.games[key]} key={key} />
        );
      });
  
      return (list);
    } else {
      return null;
    }
  }

  render() {
    return (
      <div className='row update-scores-table'>
        <table className={this.props.tableClass}>
          <thead>
            <tr className='d-flex'>
              <th className='col-1'>Game #</th>
              <th className='col-8'>Scores</th>
              <th className='col-2'>Num OT</th>
              <th className='col-1'></th>
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
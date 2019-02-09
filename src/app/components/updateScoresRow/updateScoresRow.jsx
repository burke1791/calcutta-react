import React, { Component } from 'react';
import './updateScoresRow.css';

import DataService from '../../../services/data-service';
import NotificationService from '../../../services/notification-service';

let ds = new DataService();
let ns = new NotificationService();

class UpdateScoresRow extends Component {
  constructor(props) {
    super(props);

    this.state = {
      valuesChanged: false,
      updateRequested: false,
      updateSucceeded: false,
      firstTeamScore: this.props.game.score.team1,
      secondTeamScore: this.props.game.score.team1,
      numOT: this.props.game.score['num-ot']
    }

    // bind functions
    this.onFirstTeamScoreChange = this.onFirstTeamScoreChange.bind(this);
    this.onSecondTeamScoreChange = this.onSecondTeamScoreChange.bind(this);
    this.onNumOTChange = this.onNumOTChange.bind(this);
    this.updateScores = this.updateScores.bind(this);
    this.massUpdateRequested = this.massUpdateRequested.bind(this);
  }

  componentDidMount() {
    // add notification listener for mass update request
  }

  componentWillUnmount() {
    // remove notification listener
  }

  onFirstTeamScoreChange(event) {
    var newScore = event.target.value;

    this.setState({
      firstTeamScore: newScore
    });
  }

  onSecondTeamScoreChange(event) {
    var newScore = event.target.value;

    this.setState({
      secondTeamScore: newScore
    });
  }

  onNumOTChange(event) {
    var newOT = event.target.value;

    this.setState({
      numOT: newOT
    });
  }

  generateNewScoreObj = () => {
    let firstTeamScoreChanged = this.state.firstTeamScore == this.props.game.score.team1 ? false : true;
    let secondTeamScoreChanged = this.state.secondTeamScore == this.props.game.score.team2 ? false : true;
    let numOTChanged = this.state.numOT == this.props.game.score['num-ot'] ? false : true;

    let newScoreObj = {"score": {}};

    if (!firstTeamScoreChanged && !secondTeamScoreChanged && !numOTChanged) {
      return null;
    } else {
      if (firstTeamScoreChanged) {
        newScoreObj.score.team1 = this.state.firstTeamScore;
      }
      if (secondTeamScoreChanged) {
        newScoreObj.score.team2 = this.state.secondTeamScore;
      }
      if (numOTChanged) {
        newScoreObj.score['num-ot'] = this.state.numOT;
      }
      return newScoreObj;
    }
  }

  updateScores(event) {
    event.preventDefault();
    this.setState({
      updateRequested: true,
      updateSucceeded: false
    });

    var self = this;

    var newScoreObj = this.generateNewScoreObj();

    if (newScoreObj !== null) {
      ds.updateScoresByTournamentIdAndYear(this.props.tournamentId, this.props.year, this.props.gameId, newScoreObj).then(function() {
        self.setState({
          updateRequested: true,
          updateSucceeded: true
        });
      });
    }
    
  }

  massUpdateRequested() {

  }

  render() {
    // props: gameId, game

    var gameNum = Number(this.props.gameId.match(/[0-9]{1,}/g));
    var firstTeam = this.props.game.team1.name === '' ? 'TBD' : this.props.game.team1.name;
    var secondTeam = this.props.game.team2.name === '' ? 'TBD' : this.props.game.team2.name;
    var firstTeamScore = this.props.game.score.team1;
    var secondTeamScore = this.props.game.score.team2;
    var numOT = this.props.game.score['num-ot'];

    var btnClass = 'btn btn-outline-dark';

    if (this.state.updateRequested && this.state.updateSucceeded) {
      btnClass = 'btn btn-success';
    } else if (this.state.updateRequested && !this.state.updateSucceeded) {
      btnClass = 'btn btn-warning';
    }

    return (
      <tr className='d-flex tr-hover'>
        <td className='col-1'>{gameNum}</td>
        <td className='col-4'>
          <div className='input-group'>
            <div className='input-group-prepend'>
              <span className='input-group-text'>{firstTeam}</span>
            </div>
            <input type='number' className='form-control' value={this.state.firstTeamScore} onChange={this.onFirstTeamScoreChange} />
          </div>
        </td>
        <td className='col-4'>
          <div className='input-group'>
            <div className='input-group-prepend'>
              <span className='input-group-text'>{secondTeam}</span>
            </div>
            <input type='number' className='form-control' value={this.state.secondTeamScore} onChange={this.onSecondTeamScoreChange} />
          </div>
        </td>
        <td className='col-2'>
          <div className='input-group'>
            <input type='number' className='form-control' value={this.state.numOT} onChange={this.onNumOTChange} />
          </div>
        </td>
        <td className='col-1'>
          <button type='button' className={btnClass} onClick={this.updateScores}>
            <i className="far fa-check-circle"></i>
          </button>
        </td>
      </tr>
    );
  }
}

export default UpdateScoresRow;
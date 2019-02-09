import React, { Component } from 'react';
import './updateScoresRow.css';

class UpdateScoresRow extends Component {
  constructor(props) {
    super(props);

    // bind functions
  }

  onFirstTeamScoreChange() {

  }

  onSecondTeamScoreChange() {

  }

  onNumOTChange() {
    
  }

  render() {
    // props: gameId, game

    var gameNum = Number(this.props.gameId.match(/[0-9]{1,}/g));
    var firstTeam = this.props.game.team1.name === '' ? 'TBD' : this.props.game.team1.name;
    var secondTeam = this.props.game.team2.name === '' ? 'TBD' : this.props.game.team2.name;
    var firstTeamScore = this.props.game.score.team1;
    var secondTeamScore = this.props.game.score.team2;
    var numOT = this.props.game.score['num-ot'];

    return (
      <tr className='d-flex tr-hover'>
        <td className='col-1'>{gameNum}</td>
        <td className='col-4'>
          <div className='input-group'>
            <div className='input-group-prepend'>
              <span className='input-group-text'>{firstTeam}</span>
            </div>
            <input type='number' className='form-control' value={firstTeamScore} onChange={this.onFirstTeamScoreChange} />
          </div>
        </td>
        <td className='col-4'>
          <div className='input-group'>
            <div className='input-group-prepend'>
              <span className='input-group-text'>{secondTeam}</span>
            </div>
            <input type='number' className='form-control' value={secondTeamScore} onChange={this.onSecondTeamScoreChange} />
          </div>
        </td>
        <td className='col-2'>
          <div className='input-group'>
            <input type='number' className='form-control' value={numOT} onChange={this.onNumOTChange} />
          </div>
        </td>
        <td className='col-1'>
          <button className='btn btn-default'>
            <span className='glyphicon glyphicon-ok' aria-hidden='true'></span>
          </button>
        </td>
      </tr>
    );

    /*
    return (
      <tr className='d-flex tr-hover'>
        <td className='col-2'>{this.props.gameNum}</td>
        <td className='col-2'>{this.props.firstTeam}</td>
        <td className='col-1'>
          <input type='number' value={this.props.firstTeamScore} onChange={this.onFirstTeamScoreChange} />
        </td>
        <td className='col-2'>{this.props.secondTeam}</td>
        <td className='col-1'>
          <input type='number' value={this.props.secondTeamScore} onChange={this.onSecondTeamScoreChange} />
        </td>
        <td className='col-2'>
          <input type='number' value={this.props.numOT} onChange={this.onNumOTChange} />
        </td>
      </tr>
    );
    */
  }
}

export default UpdateScoresRow;
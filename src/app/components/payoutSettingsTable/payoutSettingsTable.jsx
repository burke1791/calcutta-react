import React, { Component } from 'react';
import './payoutSettingsTable.css';

import DataService from '../../../services/data-service';

let ds = new DataService();

class PayoutSettingsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      totalShareValue: 0,
      payoutSettings: {},
      tournamentStructure: {}
    }

    // bind functions
    this.countNumGamesInRound = this.countNumGamesInRound.bind(this);
    this.generateTableRows = this.generateTableRows.bind(this);
    this.generateTable = this.generateTable.bind(this);
  }

  componentDidMount() {
    var self = this;
    var tournamentId = this.props.sportCode.match(/[a-z]{2,}/g)[0];
    var year = this.props.sportCode.match(/[0-9]{4}/g)[0];

    ds.getTournamentStructure(tournamentId, year).then(tournamentStructure => {
      self.setState({tournamentStructure: tournamentStructure});
    });

    ds.fetchPayoutSettings(this.props.leagueId).then(payoutSettings => {
      self.setState({
        payoutSettings: payoutSettings,
        tournamentId: tournamentId,
        year: year
      });
    });
  }

  countNumGamesInRound = (roundNum) => {
    var count = 0;
    if (this.state.tournamentStructure) {
      for (var gameId in this.state.tournamentStructure) {
        if (gameId.includes('R' + roundNum)) {
          count++;
        }
      }
    }
    return count;
  }

  generateTableRows = () => {
    if (Object.keys(this.state.payoutSettings)) {
      const list = Object.keys(this.state.payoutSettings).map((key, ind) => {
        console.log('key: ' + key);
        var roundNum = key.match(/[0-9]+/g);
        console.log('roundNum: ' + roundNum);
        var gameCount = this.countNumGamesInRound(roundNum);

        return (
          <tr key={ind}>
            <td>{roundNum}</td>
            <td>{gameCount}</td>
            <td>**Placeholder for input**</td>
            <td>**Placeholder for calculation**</td>
          </tr>
        );
      });
      return (list);
    } else {
      return null;
    }
  }

  generateTable = () => {
    if (this.state.tournamentId === 'btt') {
      return (
        <table className='table table-striped table-sm'>
          <thead>
            <tr>
              <th>Round</th>
              <th># Games</th>
              <th>Share</th>
              <th>Total Share</th>
            </tr>
          </thead>
          <tbody>
            {this.generateTableRows()}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td></td>
              <td></td>
              <td>{this.state.totalShareValue}</td>
            </tr>
          </tfoot>
        </table>
      );
    }
  }

  render() {
    return (
      <div className='payout-settings-table'>
        {this.generateTable()}
      </div>
    );
  }
}

export default PayoutSettingsTable;
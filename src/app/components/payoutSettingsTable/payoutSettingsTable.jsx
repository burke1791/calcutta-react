import React, { Component } from 'react';
import './payoutSettingsTable.css';
import PayoutSettingsRow from '../payoutSettingsRow/payoutSettingsRow';

import DataService from '../../../services/data-service';

let ds = new DataService();

class PayoutSettingsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      payoutSettings: {},
      tournamentStructure: {},
      payoutTotals: {}
    }

    // bind functions
    this.countNumGamesInRound = this.countNumGamesInRound.bind(this);
    this.onPayoutChange = this.onPayoutChange.bind(this);
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
      let payoutTotals = {};

      for (var payoutKey in payoutSettings) {
        let roundNum = payoutKey.match(/[0-9]+/g);
        var totalShare;
        if (roundNum) {
          totalShare = self.countNumGamesInRound(roundNum) * payoutSettings[payoutKey];
          payoutTotals[payoutKey] = totalShare
        } else {
          payoutTotals[payoutKey] = payoutSettings[payoutKey];
        }
      }
      
      self.setState({
        payoutSettings: payoutSettings,
        payoutTotals: payoutTotals,
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

  onPayoutChange(payoutKey, newValue, gameCount) {
    if (payoutKey === 'loss' || payoutKey === 'upset') {
      this.setState(prevState => ({
        payoutSettings: {
          ...prevState.payoutSettings,
          [payoutKey]: Number(newValue)
        },
        payoutTotals: {
          ...prevState.payoutTotals,
          [payoutKey]: Number(newValue)
        }
      }));
    } else {
      this.setState(prevState => ({
        payoutSettings: {
          ...prevState.payoutSettings,
          [payoutKey]: Number(newValue)
        },
        payoutTotals: {
          ...prevState.payoutTotals,
          [payoutKey]: Number(newValue) * Number(gameCount)
        }
      }));
    }
    
  }

  generateTableRows = () => {
    if (Object.keys(this.state.payoutSettings)) {
      const list = Object.keys(this.state.payoutSettings).map((key, ind) => {
        var roundNum = key.match(/[0-9]+/g);
        var payoutCategory;
        var gameCount;
        if (key === 'loss') {
          payoutCategory = 'Biggest Loss';
          gameCount = 'n/a';
        } else if (key === 'upset') {
          payoutCategory = 'Largest Upset';
          gameCount = 'n/a';
        } else if (roundNum) {
          payoutCategory = 'Round ' + roundNum;
          gameCount = this.countNumGamesInRound(roundNum);
        }

        return (
          <PayoutSettingsRow key={ind} payoutKey={key} payoutCategory={payoutCategory} gameCount={gameCount} onPayoutChange={this.onPayoutChange} payoutValue={this.state.payoutSettings[key]} />
        );
      });
      return (list);
    } else {
      return null;
    }
  }

  generateTable = () => {
    var totalShareValue = 0;

    for (var payoutKey in this.state.payoutTotals) {
      totalShareValue += Number(this.state.payoutTotals[payoutKey]);
    }

    var payoutValidationClass = '';

    if (totalShareValue !== 1) {
      payoutValidationClass = 'table-danger';
    }
    
    if (this.state.tournamentId === 'btt') {
      return (
        <table className='table table-striped table-sm'>
          <thead>
            <tr>
              <th>Category</th>
              <th># Games</th>
              <th>Share</th>
              <th>Total Share</th>
            </tr>
          </thead>
          <tbody>
            {this.generateTableRows()}
          </tbody>
          <tfoot>
            <tr className={payoutValidationClass}>
              <td>Total</td>
              <td></td>
              <td></td>
              <td>{totalShareValue}</td>
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
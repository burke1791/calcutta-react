import React, { Component } from 'react';
import './payoutSettingsTable.css';
import PayoutSettingsRow from '../payoutSettingsRow/payoutSettingsRow';

import DataService from '../../../services/data-service';
import NotificationService, { NOTIF_SAVE_SETTINGS_REQUESTED } from '../../../services/notification-service';

let ds = new DataService();
let ns = new NotificationService();

class PayoutSettingsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      payoutSettings: {},
      tournamentStructure: {},
      payoutTotals: {},
      totalShareValue: 0,
      tournamentId: ''
    }

    // bind functions
    this.savePayoutSettings = this.savePayoutSettings.bind(this);
    this.countNumGamesInRound = this.countNumGamesInRound.bind(this);
    this.onPayoutChange = this.onPayoutChange.bind(this);
    this.calculateTotalShare = this.calculateTotalShare.bind(this);
    this.generateTableRows = this.generateTableRows.bind(this);
    this.generateTable = this.generateTable.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_SAVE_SETTINGS_REQUESTED, this, this.savePayoutSettings);

    var self = this;
    var tournamentId = this.props.sportCode.match(/[a-z]{2,}/g)[0];
    var year = this.props.sportCode.match(/[0-9]{4}/g)[0];

    ds.getTournamentStructure(tournamentId, year).then(tournamentStructure => {
      self.setState({tournamentStructure: tournamentStructure});
    });

    ds.fetchPayoutSettings(this.props.leagueId).then(payoutSettings => {
      let payoutTotals = {};
      var totalShareValue = 0;

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

      // SEND TO calculateTotalShare
      for (payoutKey in payoutTotals) {
        totalShareValue += Number(payoutTotals[payoutKey]);
      }
      
      self.setState({
        payoutSettings: payoutSettings,
        payoutTotals: payoutTotals,
        tournamentId: tournamentId,
        year: year,
        totalShareValue: totalShareValue
      });
    });
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SAVE_SETTINGS_REQUESTED);
  }

  savePayoutSettings() {
    if (this.state.totalShareValue === 1) {
      ds.savePayoutSettings(this.props.leagueId, this.state.payoutSettings);
    }
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
    var totalShareValue = 0;

    // SEND TO calculateTotalShare
    /*
    for (var key in this.state.payoutTotals) {
      if (key === payoutKey && (payoutKey === 'loss' || payoutKey === 'upset')) {
        totalShareValue += Number(newValue);
      } else if (key === payoutKey) {
        totalShareValue += Number(newValue) * Number(gameCount);
      } else {
        totalShareValue += Number(this.state.payoutTotals[key]);
      }
    }
    */

    totalShareValue = this.calculateTotalShare(payoutKey, newValue, gameCount);

    if (payoutKey === 'loss' || payoutKey === 'upset') {
      this.setState(prevState => ({
        payoutSettings: {
          ...prevState.payoutSettings,
          [payoutKey]: Number(newValue)
        },
        payoutTotals: {
          ...prevState.payoutTotals,
          [payoutKey]: Number(newValue)
        },
        totalShareValue: totalShareValue
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
        },
        totalShareValue: totalShareValue
      }));
    }
    
  }

  calculateTotalShare = (payoutKey, newValue, gameCount) => {
    var totalShareValue;
    if (this.state.tournamentId === 'btt') {
      for (var key in this.state.payoutTotals) {
        if (key === payoutKey && (payoutKey === 'loss' || payoutKey === 'upset')) {
          totalShareValue += Number(newValue);
        } else if (key === payoutKey) {
          totalShareValue += Number(newValue) * Number(gameCount);
        } else {
          totalShareValue += Number(this.state.payoutTotals[key]);
        }
      }
    }

    return totalShareValue;
  }

  generateTableRows = () => {
    if (Object.keys(this.state.payoutSettings)) {
      const list = Object.keys(this.state.payoutSettings).map((key, ind) => {
        var basicPayoutCode = key.match(/[A-Z]{1}/g);
        console.log('payout code: ');
        console.log(basicPayoutCode);
        
        var roundNum = key.match(/[0-9]+/g);
        var payoutCategory;
        var gameCount;
        if (key === 'loss') {
          payoutCategory = 'Biggest Loss';
          gameCount = 'n/a';
        } else if (key === 'upset') {
          payoutCategory = 'Largest Upset';
          gameCount = 'n/a';
        } else if (basicPayoutCode[0] === 'R') {
          if (roundNum) {
            payoutCategory = 'Round ' + roundNum;
            gameCount = this.countNumGamesInRound(roundNum);
          }
        } else if (basicPayoutCode[0] === 'W') {
          if (Number(roundNum) === 1) {
            payoutCategory = roundNum + ' win';
            gameCount = this.countNumGamesInRound(roundNum);
          } else if (roundNum) {
            payoutCategory = roundNum + ' wins';
            gameCount = this.countNumGamesInRound(roundNum);
          }
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
    var payoutValidationClass = '';

    if (this.state.totalShareValue !== 1) {
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
              <td>{this.state.totalShareValue}</td>
            </tr>
          </tfoot>
        </table>
      );
    } else if (this.state.tournamentId === 'mm') {
      return (
        <table className='table table-striped table-sm'>
          <thead>
            <tr>
              <th>Category</th>
              <th># Teams</th>
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
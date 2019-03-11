import React, { Component } from 'react';
import './auctionRules.css';

import DataService from '../../../services/data-service';

let ds = new DataService();

class AuctionRules extends Component {
  constructor(props) {
    super(props);

    this.state = {
      useTax: 0,
      taxRate: 0,
      unclaimed: false
    }

    // bind functions
    this.fetchSettings = this.fetchSettings.bind(this);
    this.generateRulesDisplay = this.generateRulesDisplay.bind(this);
  }

  componentDidMount() {
    this.fetchSettings();
  }

  fetchSettings() {
    var self = this;

    var useTax = this.state.useTax;
    var taxRate = this.state.taxRate;
    var unclaimed = this.state.unclaimed
    
    ds.fetchSettings(this.props.leagueId).then(settingsObj => {
      if (settingsObj['use-tax'] !== undefined) {
        useTax = settingsObj['use-tax'];
      }

      if (settingsObj['tax-rate'] !== undefined) {
        taxRate = settingsObj['tax-rate'];
      }

      if (settingsObj.unclaimed !== undefined) {
        unclaimed = settingsObj.unclaimed;
      }

      self.setState({
        useTax: useTax,
        taxRate: taxRate,
        unclaimed: unclaimed
      });
    });
  }

  generateRulesDisplay = () => {
    var useTaxString;
    var taxRateString;
    var unclaimedString;

    if (this.state.useTax > 0) {
      useTaxString = 'Tax Free Amount: $' + Number(this.state.useTax);
      taxRateString = 'Tax Rate: ' + Number(this.state.taxRate * 100) + '%';
    } else {
      useTaxString = 'No Tax In Effect';
    }

    if (this.state.unclaimed) {
      unclaimedString = 'Teams May Be Unclaimed';
    } else {
      unclaimedString = 'All Teams Must Be Purchased';
    }

    return (
      <div className='rules-list'>
        <div className='tax-rules'>
          <p>{useTaxString}</p>
          <p>{taxRateString}</p>
        </div>
        <div className='unclaimed-rules'>
          <p>{unclaimedString}</p>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className='auction-rules'>
        {this.generateRulesDisplay()}
      </div>
    );
  }
}

export default AuctionRules;
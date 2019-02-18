import React, { Component } from 'react';
import './payoutSettingsRow.css';

class PayoutSettingsRow extends Component {
  constructor(props) {
    super(props);

    // bind functions
    this.onPayoutChange = this.onPayoutChange.bind(this);
  }

  onPayoutChange(event) {
    var newValue = Number(event.target.value);
    if (newValue < 0) {
      newValue = 0;
    } else if (newValue > 1) {
      newValue = 1;
    }
    this.props.onPayoutChange(this.props.payoutKey, newValue, this.props.gameCount);
  }

  render() {
    var totalShare = 0;

    if (this.props.payoutKey === 'loss' || this.props.payoutKey === 'upset') {
      totalShare = this.props.payoutValue;
    } else {
      totalShare = Number(this.props.payoutValue) * Number(this.props.gameCount);
    }

    return (
        <tr>
          <td>{this.props.payoutCategory}</td>
          <td>{this.props.gameCount}</td>
          <td>
            <input type='number' step='0.01' className='form-control' value={this.props.payoutValue} onChange={this.onPayoutChange} />
          </td>
          <td>{totalShare}</td>
        </tr>
    );
  }
}

export default PayoutSettingsRow;
import React, { Component } from 'react';
import './bidRow.css';

class BidRow extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <tr key={this.props.id}>
        <td>{this.props.num}</td>
        <td>{this.props.time}</td>
        <td>{this.props.bidder}</td>
        <td>{'$ ' + this.props.amount}</td>
      </tr>
    );
  }
}

export default BidRow;
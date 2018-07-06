import React, { Component } from 'react';
import './bidRow.css';

class BidRow extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <tr className='d-flex tr-hover' key={this.props.id}>
        <td className='col col-md-1'>{this.props.num}</td>
        <td className='col col-md-2'>{this.props.time}</td>
        <td className='col col-md-2'>{this.props.bidder}</td>
        <td className='col col-md-2'>{this.props.amount}</td>
      </tr>
    );
  }
}

export default BidRow;
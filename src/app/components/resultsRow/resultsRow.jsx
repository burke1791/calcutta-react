import React, { Component } from 'react';
import './resultsRow.css';

class ResultsRow extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.colored) {
      var rowClass = 'd-flex colored';
    } else if (this.props.unclaimed) {
      var rowClass = 'd-flex unclaimed';
    } else {
      var rowClass = 'd-flex';
    }

    if (this.props.resultType === 'team') {
      return (
        <tr className={rowClass} key={this.props.id}>
          <td className='col col-md-1'>{this.props.num}</td>
          <td className='col col-md-4'>{this.props.name}</td>
          <td className='col col-md-4'>{this.props.winner}</td>
          <td className='col col-md-3'>{this.props.sellingPrice}</td> 
        </tr>
      );
    } else if (this.props.resultType === 'user') {
      return (
        <tr className={rowClass} key={this.props.id}>
          <td className='col col-md-6'>{this.props.username}</td>
          <td className='col col-md-6'>{this.props.total}</td>
        </tr>
      );
    }
    
  }
}

export default ResultsRow;
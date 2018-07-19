import React, { Component } from 'react';
import './resultsRow.css';

class ResultsRow extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <tr className='d-flex tr-hover' key={this.props.id}>
        <td className='col col-md-1'>{this.props.num}</td>
        <td className='col col-md-4'>{this.props.name}</td>
        <td className='col col-md-4'>{this.props.winner}</td>
        <td className='col col-md-3'>{this.props.sellingPrice}</td>
      </tr>
    );
  }
}

export default ResultsRow;
import React, { Component } from 'react';
import './teamRow.css';

class TeamRow extends Component {
  constructor(props) {
    super(props);

    // Bind functions
    
  }

  render() { 

    return (
      <tr className='d-flex tr-hover' key={this.props.id}>
        <td className='col col-md-6'>{this.props.name}</td>
        <td className='col col-md-2'>{this.props.price}</td>
        <td className='col col-md-2'>{this.props.payout}</td>
        <td className={this.props.netReturnClass}>{this.props.netReturn}</td>
      </tr>
    );
    
  }
}

export default TeamRow;
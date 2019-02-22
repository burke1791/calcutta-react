import React, { Component } from 'react';
import './teamRow.css';
import ReactGA from 'react-ga';

class TeamRow extends Component {
  constructor(props) {
    super(props);

    // Bind functions
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    ReactGA.event({
      category: 'Navigation',
      action: 'Clicked Team Row'
    });
  }

  render() { 
    let rowClass;
    if (this.props.id === 'taxRow') {
      rowClass = 'd-flex tr-hover table-secondary';
    } else {
      rowClass = 'd-flex tr-hover';
    }

    return (
      <tr className={rowClass} key={this.props.id} onClick={this.handleClick}>
        <td className='col col-md-6'>{this.props.name}</td>
        <td className='col col-md-2'>{this.props.price}</td>
        <td className='col col-md-2'>{this.props.payout}</td>
        <td className={this.props.netReturnClass}>{this.props.netReturn}</td>
      </tr>
    );
    
  }
}

export default TeamRow;
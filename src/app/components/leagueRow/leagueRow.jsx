import React, { Component } from 'react';
import { Redirect, withRouter } from 'react-router-dom';
import './leagueRow.css';

class LeagueRow extends Component {

  constructor(props) {
    super(props);

    this.state = {
      toLeagueHome: false
    }

    // Bind functions
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    event.preventDefault();
    this.props.history.push('/league-home/' + this.props.id);
    // this.setState({toLeagueHome: true});
  }

  render() {

    return (
      <tr className='d-flex' key={this.props.id} onClick={this.handleClick}>
        <td className='col col-md-6'>{this.props.name}</td>
        <td className='col col-md-2'>{this.props.buyIn}</td>
        <td className='col col-md-2'>{this.props.payout}</td>
        <td className={this.props.netReturnClass}>{this.props.netReturn}</td>
      </tr>
    );
    
  }

}

export default withRouter(LeagueRow);
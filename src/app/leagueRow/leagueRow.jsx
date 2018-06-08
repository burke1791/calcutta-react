import React, { Component } from 'react';
import './leagueRow.css';
import { auth, database } from '../../services/fire';

class LeagueRow extends Component {
  constructor(props) {
    super(props);

    // gets a "league" passed in as a prop
  }

  render() {
    return(
        <tr>
        <td>{this.props.league.name}</td>
        <td>$0.00</td>
        <td>$0.00</td>
        <td>$0.00</td>
      </tr>
    );
  }
}

export default LeagueRow;
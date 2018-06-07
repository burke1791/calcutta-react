import React, { Component } from 'react';
import './leagueRow.css';
import { auth, database } from '../../services/fire';

class LeagueRow extends Component {
  constructor(props) {
    super(props);

    this.state = {
      leagues: []
    }

    // Bind functions
    this.loadLeagues = this.loadLeagues.bind(this);
  }

  render() {
    return(
      <div className={this.props.className}>

      </div>
    );
  }
}

export default LeagueRow;
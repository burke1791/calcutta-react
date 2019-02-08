import React, { Component } from 'react';
import './tournamentDropdownItem.css';

class TournamentDropdownItem extends Component {
  constructor(props) {
    super(props);

    // bind functions
  }

  render() {
    return (
      <option value={this.props.tournamentKey}>{this.props.tournamentName}</option>
    );
  }
}

export default TournamentDropdownItem;
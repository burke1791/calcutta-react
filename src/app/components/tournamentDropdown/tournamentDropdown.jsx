import React, { Component } from 'react';
import './tournamentDropdown.css';

import TournamentDropdownItem from '../tournamentDropdownItem/tournamentDropdownItem';

import DataService from '../../../services/data-service';

let ds = new DataService();

class TournamentDropdown extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tournamentKeys: '',
      tournaments: '',
      infoNodes: {}
    }

    // bind functions
    this.onTournamentSelected = this.onTournamentSelected.bind(this);
    this.generateDropdownItems = this.generateDropdownItems.bind(this);
  }

  componentDidMount() {
    var self = this;
    ds.getTournamentsList().then(function(tournaments) {
      var tournamentKeys = [];
      
      for (var tournament in tournaments) {
        tournamentKeys.push(tournament);
      }
      
      self.setState({
        tournamentKeys: tournamentKeys,
        tournaments: tournaments
      });
    });
  }

  onTournamentSelected(event) {
    var tournamentId = event.target.value;

    // parameters: tournamentId, team-info-node
    if (tournamentId === 'n/a') {
      this.props.onTournamentSelected(tournamentId, '');
    } else {
      this.props.onTournamentSelected(tournamentId, this.state.tournaments[tournamentId]['info-node-id']);
    }
    
  }

  generateDropdownItems = () => {
    if (this.state.tournamentKeys !== '') {
      const list = this.state.tournamentKeys.map((tournamentKey, i) => {
        return <TournamentDropdownItem tournamentKey={tournamentKey} tournamentName={this.state.tournaments[tournamentKey]['name']} key={i} />;
      });

      return (list);
    } else {
      return null;
    }
  }

  render() {
    return (
      <div className='tournaments-dropdown'>
        <div className='form-group'>
          <div className='row'>
            <div className='col-2'>
              <label><strong>Tournament:</strong></label>
            </div>
            <div className='col-8'>
              <select className='custom-select' value={this.props.selectedTournament} onChange={this.onTournamentSelected}>
                <option value='n/a'>Please Select a Tournament...</option>
                {this.generateDropdownItems()}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TournamentDropdown;
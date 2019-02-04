import React, { Component } from 'react';
import './tournamentDropdown.css';

class TournamentDropdown extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTournament: 'n/a'
    }

    // bind functions
    this.onTournamentSelected = this.onTournamentSelected.bind(this);
  }

  onTournamentSelected(event) {
    var tourneyInfo = event.target.value.split(' ');
    var year = tourneyInfo[0].match(/[0-9]{4}/g);

    this.setState({
      selectedTournament: event.target.value,
    });
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
              <select className='custom-select' value={this.state.selectedTournament} onChange={this.onTournamentSelected}>
                <option value='n/a'>Please select a tournament...</option>
                <option value='mens-btt-2019 cbb-mens-team-info btt-seeds'>2019 Men's Big Ten Tournament</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default TournamentDropdown;
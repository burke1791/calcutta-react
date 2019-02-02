import React, { Component } from 'react';
import './addSportTeam.css';

class AddSportTeam extends Component {
  constructor(props) {
    super(props);


  }

  render() {
    return (
      <div className='team-info' id={this.props.teamKey}>
        
      </div>
    );
  }
}

export default AddSportTeam;
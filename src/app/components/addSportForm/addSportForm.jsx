import React, { Component } from 'react';
import './addSportForm.css';

import Button from '../button/button';
import AddSportTeam from '../addSportTeam/addSportTeam';

class AddSportForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      nodeId: '',
      properties: '',
      propertiesFlag: false,
      teams: []
    }

    // bind functions
    this.onNodeIdChange = this.onNodeIdChange.bind(this);
    this.onPropertiesChange = this.onPropertiesChange.bind(this);
    this.newTeam = this.newTeam.bind(this);
    this.getTeamObjs = this.getTeamObjs.bind(this);
  
  }

  onNodeIdChange(event) {
    this.setState({nodeId: event.target.value});
  }

  onPropertiesChange(event) {
    var properties = event.target.value;
    var regex = /[a-z_0-9]{3,}/ig;

    // perform some validation to ensure use adheres to the desired style

    let result = properties.match(regex);

    this.setState({properties: result});
  }

  newTeam() {
    var teams = this.state.teams;
    var length = teams.length;

    console.log('teams: ' + teams);
    console.log('length: ' + length);

    teams.push('team' + length);

    this.setState({teams: teams});
  }

  getTeamObjs = () => {
    if (this.state.teams.length && this.state.properties.length) {
      const list = this.state.teams.map((team, i) => {
        var properties = this.state.properties;
        var numProps = properties.length;

        console.log('team: ' + team);

        return (
          <AddSportTeam id={team.key} key={i} properties={properties} />
        );
      });

      return (list);
    } else {
      return null;
    }
  }

  render() {
    return (
      <div className='add-sport-form container'>
        <form>
          <div className='row'>
            <div className='col-2'>
              <label className='add-sport-nodeId' htmlFor='sportNodeId'>Node ID:</label>
            </div>
            <div className='col-2'>
              <input type='text' className='form-control' id='sportNodeId' onChange={this.onNodeIdChange} placeholder='node_id' />
            </div>
          </div>
          <div className='row'>
            <div className='col-2'>
              <label className='team-properties' htmlFor='teamProperties'>Team Properties:</label>
            </div>
            <div className='col'>
              <input type='text' className='form-control' id='teamProperties' onChange={this.onPropertiesChange} placeholder='comma separated team properties' />
            </div>
          </div>
          <hr />
          {this.getTeamObjs()}
          <Button btnType='button' btnClass='btn btn-primary my-2' onClick={this.newTeam} btnValue='New Team' />
        </form>
      </div>
    );
  }
}

export default AddSportForm;
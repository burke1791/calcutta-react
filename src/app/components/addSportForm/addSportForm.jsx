import React, { Component } from 'react';
import './addSportForm.css';

import AddSportTeam from '../addSportTeam/addSportTeam';

class AddSportForm extends Component {
  constructor(props) {
    super(props);

    // bind functions
    this.getTeamObjs = this.getTeamObjs.bind(this);
  }

  render() {
    return (
      <div className='add-sport-form container'>
        <form>
          <div className='row'>
            <label htmlFor='sportNodeId'>Node ID:</label>
            <div className='col-2'>
              <input type='text' className='form-control' id='sportNodeId' placeholder='node_id' />
            </div>
          </div>
          {this.getTeamObjs()}
        </form>
      </div>
    );
  }
}

export default AddSportForm;
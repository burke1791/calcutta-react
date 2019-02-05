import React, { Component } from 'react';
import './godModeAddSport.css';
import Button from '../button/button';
import AddSportForm from '../addSportForm/addSportForm';

import DataService from '../../../services/data-service';

let ds = new DataService();

class GodModeAddSport extends Component {
  constructor(props) {
    super(props);

    this.state = {
      nodeId: ''
    }

    // bind functions
    this.addSportClicked = this.addSportClicked.bind(this);
  }

  addSportClicked() {
    var testObj = {name: 'btt test'};
    ds.addSportToDatabase(this.state.nodeId, testObj);
  }

  render() {
    return(
      <div className='god-mode-add-sport'>
        <h1>Add Sport</h1>
        <AddSportForm />
        <Button btnType='button' btnClass='btn btn-primary' onClick={this.addSportClicked} btnValue={'Add Sport'} />
      </div>
    ); 
  }
}

export default GodModeAddSport;
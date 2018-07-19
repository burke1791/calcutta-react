import React, { Component } from 'react';
import './resultsTable.css';
import ResultsRow from '../resultsRow/resultsRow';

import NotificationService from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();

class ResultsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      teams: {},
      teamKeys: []
    }
  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  render() {
    return (
      <div className='results-table'>
      
      </div>
    );
  }
}

export default ResultsTable;
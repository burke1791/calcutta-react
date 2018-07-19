import React, { Component } from 'react';
import './totalsTable.css';
import TotalsRow from '../totalsRow/totalsRow';

import NotificationService from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();

class TotalsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // best way to get and keep track of user totals?
    }
  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  render() {
    return (
      <div className='totals-table'>
      
      </div>
    );
  }
}

export default TotalsTable;
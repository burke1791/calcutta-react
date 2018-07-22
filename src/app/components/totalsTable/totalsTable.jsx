import React, { Component } from 'react';
import './totalsTable.css';
import TotalsRow from '../totalsRow/totalsRow';

import NotificationService, { NOTIF_AUCTION_ITEM_SOLD } from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();

class TotalsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // best way to get and keep track of user totals?
    }

    // bind functions
    this.newItemSold = this.newItemSold.bind(this);
    this.generateTotalsRows = this.generateTotalsRows.bind(this);
  }

  componentDidMount() {
    ds.attachLeagueBiddingListener(this.props.leagueId);
    ns.addObserver(NOTIF_AUCTION_ITEM_SOLD, this, this.newItemSold);
  }

  componentWillUnmount() {
    ds.detatchLeagueBiddingListener(this.props.leagueId);
    ns.removeObserver(this, NOTIF_AUCTION_ITEM_SOLD);
  }

  newItemSold(newData) {
    if (newData !== null) {
      var teams = newData;
      var keys = Object.keys(newData);

      this.setState({
        teams: teams,
        teamKeys: keys
      });
    }
  }

  generateTotalsRows = () => {

  }

  render() {
    return (
      <div className='row justify-content-md-center'>
        <table className='table table-striped table-hover'>
          <thead>
            <tr className='d-flex'>
              <th className='col col-md-6'>Name</th>
              <th className='col col-md-6'>Total</th>
            </tr>
          </thead>
          <tbody>
            {this.generateTotalsRows()}
          </tbody>
        </table>
      </div>
    );
  }
}

export default TotalsTable;
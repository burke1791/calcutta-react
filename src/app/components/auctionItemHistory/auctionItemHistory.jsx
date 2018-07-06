import React, { Component } from 'react';
import './auctionItemHistory.css';
import BidHistory from '../bidHistory/bidHistory';

class AuctionItemHistory extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='card col item-history'>
        <BidHistory className='table table-striped table-hover' leagueId={this.props.leagueId} />
      </div>
    );
  }
}

export default AuctionItemHistory;
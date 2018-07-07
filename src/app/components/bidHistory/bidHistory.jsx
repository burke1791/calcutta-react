import React, { Component } from 'react';
import './bidHistory.css';
import BidRow from '../bidRow/bidRow';
import NotificationService, { NOTIF_AUCTION_CHANGE } from '../../../services/notification-service';

let ns = new NotificationService();

class BidHistory extends Component {
  constructor(props) {
    super(props);

    this.state = {
      bidHistory: {},
      bidKeys: []
    }

    // Bind functions
    this.bidList = this.bidList.bind(this);
    this.newAuctionData = this.newAuctionData.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);
  }

  newAuctionData(newData) {
    var bids = newData['bids'];
    var keys = [];
    if (bids != null && typeof(bids) != 'undefined') {
      keys = Object.keys(bids);
      keys.reverse();
    }

    this.setState({
      bidHistory: bids,
      bidKeys: keys
    });
  }

  bidList = () => {
    // TODO: write logic to display them in order of most recent bid first
    var numBids = this.state.bidKeys.length;
    if (numBids > 0) {
      const list = this.state.bidKeys.map((bid, index) => {
        var num = numBids - index;
        var time = this.state.bidHistory[bid].time;
        var bidder = this.state.bidHistory[bid].bidder;
        var amount = this.state.bidHistory[bid].amount;

        return (
          <BidRow key={bid} id={bid} num={num} time={time} bidder={bidder} amount={amount} />
        );
      });
      return (list);
    }
  }

  render() {
    return (
      <div className='justify-content-md-center'>
        <table className={this.props.className}>
          <thead>
            <tr className='d-flex'>
              <th className='col col-md-1'>#</th>
              <th className='col col-md-2'>Time</th>
              <th className='col col-md-2'>Bidder</th>
              <th className='col col-md-2'>Amount</th>
            </tr>
          </thead>
          <tbody>
            {this.bidList()}
          </tbody>
        </table>
      </div>
    );
  }
}

export default BidHistory;
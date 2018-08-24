import React, { Component } from 'react';
import './auctionItemHistory.css';
import BidRow from '../bidRow/bidRow';
import NotificationService, { NOTIF_AUCTION_CHANGE } from '../../../services/notification-service';

let ns = new NotificationService();

class AuctionItemHistory extends Component {

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
    var code = newData['current-item']['code'];
    var bids = newData['bid-history'] == null ? null : newData['bid-history'][code];
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
      <div className='bid-history-table'>
        <table className={this.props.className}>
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Bidder</th>
              <th>Amount</th>
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

export default AuctionItemHistory;
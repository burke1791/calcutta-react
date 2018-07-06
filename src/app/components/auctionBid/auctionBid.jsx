import React, { Component } from 'react';
import './auctionBid.css';
import Button from '../button/button';

import DataService from '../../../services/data-service';
import NotificationService, { NOTIF_AUCTION_CHANGE } from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';

let ds = new DataService();
let ns = new NotificationService();
let authService = new AuthenticationService();

class AuctionBid extends Component {

  constructor(props) {
    super(props);

    this.state = {
      minBid: 1,
      bid: 1,
      leagueId: this.props.leagueId,
      currentBid: 0
    }

    // Bind functions
    this.placeBid = this.placeBid.bind(this);
    this.placeMinBid = this.placeMinBid.bind(this);
    this.onBidChange = this.onBidChange.bind(this);
    this.incrementBid = this.incrementBid.bind(this);
    this.decrementBid = this.decrementBid.bind(this);
    this.newAuctionData = this.newAuctionData.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);
  }

  placeMinBid() {
    //push bid amount to firebase
    var uid = authService.getUser().uid;
    var self = this;
    
    ds.getDisplayName(uid).then(function(username) {
      if (self.state.minBid > self.state.currentBid) {
        ds.placeBid(self.state.leagueId, username, self.state.minBid);
      }
    });
    
  }

  placeBid() {
    //push bid amount to firebase
  }

  onBidChange(event) {
    event.preventDefault();

    this.setState({bid: event.target.value});
  }

  incrementBid() {
    var newBid = parseInt(this.state.bid) + 1;
    this.setState({bid: newBid});
  }

  decrementBid() {
    var newBid = parseInt(this.state.bid) - 1;
    if (newBid < 0) {
      this.setState({bid: 0});
    } else {
      this.setState({bid: newBid});
    }
  }

  newAuctionData(newData) {
    var currentBid = newData['current-bid'];

    this.setState({
      minBid: currentBid + 1,
      currentBid: currentBid
    });
  }

  render() {
    var bidBtnClass = 'btn btn-primary';
    if (this.state.bid < this.state.minBid) {
      bidBtnClass = 'btn btn-danger';
    }

    return (
      <div className='card bid-actions'>
        <Button btnType='button' btnClass='btn btn-primary' btnValue={'Minimum Bid ($' + this.state.minBid + ')'} onClick={this.placeMinBid} />
        <Button btnType='button' btnClass={bidBtnClass} btnValue={'Bid: $' + this.state.bid} onClick={this.placeBid} />
        <Button btnType='button' btnClass='btn btn-secondary' btnValue='+' onClick={this.incrementBid} />
        <input type='number' value={this.state.bid} onChange={this.onBidChange} />
        <Button btnType='button' btnClass='btn btn-secondary' btnValue='-' onClick={this.decrementBid} />
      </div>
    );
  }
}

export default AuctionBid;
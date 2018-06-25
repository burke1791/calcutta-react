import React, { Component } from 'react';
import './auctionBid.css';
import Button from '../button/button';

import DataService from '../../../services/data-service';

let ds = new DataService();

class AuctionBid extends Component {

  constructor(props) {
    super(props);

    this.state = {
      minBid: 1,
      bid: 1,
      leagueId: this.props.leagueId
    }

    // Bind functions
    this.placeBid = this.placeBid.bind(this);
    this.placeMinBid = this.placeMinBid.bind(this);
    this.onBidChange = this.onBidChange.bind(this);
    this.incrementBid = this.incrementBid.bind(this);
    this.decrementBid = this.decrementBid.bind(this);
  }

  placeMinBid() {
    //push bid amount to firebase

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

  render() {
    return (
      <div className='card bid-actions'>
        <Button btnType='button' btnClass='btn btn-primary' btnValue={'Minimum Bid ($' + this.state.minBid + ')'} onClick={this.placeMinBid} />
        <Button btnType='button' btnClass='btn btn-primary' btnValue={'Bid: $' + this.state.bid} onClick={this.placeBid} />
        <Button btnType='button' btnClass='btn btn-secondary' btnValue='+' onClick={this.incrementBid} />
        <input type='number' value={this.state.bid} onChange={this.onBidChange} />
        <Button btnType='button' btnClass='btn btn-secondary' btnValue='-' onClick={this.decrementBid} />
      </div>
    );
  }
}

export default AuctionBid;
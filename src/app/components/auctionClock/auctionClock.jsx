import React, { Component } from 'react';
import './auctionClock.css';
import NotificationService, { NOTIF_AUCTION_CHANGE } from '../../../services/notification-service';

let ns = new NotificationService();

class AuctionClock extends Component {
  constructor(props) {
    super(props);

    this.state = {
      timeRemaining: this.props.interval,
      currentBid: this.props.currentBid
    }

    // Bind functions
    this.generateCountdownDisplay = this.generateCountdownDisplay.bind(this);
    this.tick = this.tick.bind(this);
    this.newAuctionData = this.newAuctionData.bind(this);
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );

    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);
  }

  tick() {
    if (this.state.timeRemaining == 0) {
      clearInterval(this.timerID);
    } else {
      var newRemainingTime = this.state.timeRemaining - 1;
      this.setState({timeRemaining: newRemainingTime});
    }
  }

  newAuctionData(newData) {
    this.setState({
      currentBid: newData['current-bid'],
      timeRemaining: this.props.interval
    });
  }

  generateCountdownDisplay = () => {
    if (this.state.timeRemaining < 10) {
      return (
        'Time Remaining: 00:0' + this.state.timeRemaining
      );
    } else {
      return (
        'Time Remaining: 00:' + this.state.timeRemaining
      );
    }
    
  }

  render() {
    return (
      <div className='time-remaining'>
        <h5>{this.generateCountdownDisplay()}</h5> 
      </div>
    );
  }
}

export default AuctionClock;
import React, { Component } from 'react';
import './auctionClock.css';
import NotificationService, { NOTIF_AUCTION_CHANGE, NOTIF_AUCTION_START_CLOCK, NOTIF_AUCTION_RESTART_CLOCK } from '../../../services/notification-service';

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
    this.startClock = this.startClock.bind(this);
    this.restartClcok = this.restartClcok.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);
    ns.addObserver(NOTIF_AUCTION_START_CLOCK, this, this.startClock);
    ns.addObserver(NOTIF_AUCTION_RESTART_CLOCK, this, this.restartClcok);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);

    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);
    ns.removeObserver(this, NOTIF_AUCTION_START_CLOCK);
    ns.removeObserver(this, NOTIF_AUCTION_RESTART_CLOCK);
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
      currentBid: newData['current-item']['current-bid'],
      timeRemaining: this.props.interval
    });
  }

  startClock() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
  }

  restartClcok() {
    clearInterval(this.timerID);
    this.setState({timeRemaining: this.props.interval});

    this.startClock();
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
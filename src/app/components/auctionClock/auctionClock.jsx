import React, { Component } from 'react';
import './auctionClock.css';
import NotificationService, { NOTIF_AUCTION_CHANGE, NOTIF_AUCTION_START_CLOCK, NOTIF_AUCTION_RESTART_CLOCK, NOTIF_AUCTION_ITEM_COMPLETE } from '../../../services/notification-service';

let ns = new NotificationService();

class AuctionClock extends Component {
  constructor(props) {
    super(props);

    this.state = {
      timeRemaining: 0,
      currentBid: this.props.currentBid,
      currentTeam: '',
      endTime: 0
    }

    // Bind functions
    this.generateCountdownDisplay = this.generateCountdownDisplay.bind(this);
    this.tick = this.tick.bind(this);
    this.newAuctionData = this.newAuctionData.bind(this);
    this.startClock = this.startClock.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);
    ns.addObserver(NOTIF_AUCTION_START_CLOCK, this, this.startClock);
  }

  componentWillUnmount() {
    clearInterval(this.timerID);

    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);
    ns.removeObserver(this, NOTIF_AUCTION_START_CLOCK);
  }

  tick() {
    if (this.state.timeRemaining == 0) {
      clearInterval(this.timerID);
      ns.postNotification(NOTIF_AUCTION_ITEM_COMPLETE, null);
    } else {
      let currentTime = new Date().getTime();
      var newRemainingTime = Math.round((this.state.endTime - currentTime) / 1000);
      this.setState({timeRemaining: newRemainingTime});
    } 
  }

  newAuctionData(newData) {
    var itemComplete = newData['current-item']['complete'];
    var code = newData['current-item']['code'];
    var currentBid = newData['current-item']['current-bid'];
    let endTime = newData['current-item']['end-time'] + (this.props.interval * 1000);
    let currentTime = new Date().getTime();

    console.log('currentTime: ' + currentTime);

    if (this.state.currentTeam !== code && !itemComplete) {
      clearInterval(this.timerID);
      this.setState({
        timeRemaining: Math.round((endTime - currentTime) / 1000),
        currentBid: currentBid,
        currentTeam: code,
        endTime: endTime
      });
      this.startClock();
      console.log('endTime: ' + endTime);
      console.log('currentTime: ' + currentTime);
    } else {
      if (itemComplete) {
        clearInterval(this.timerID);
        this.setState({
          currentBid: newData['current-item']['current-bid'],
          timeRemaining: 0
        });
      } else {
        clearInterval(this.timerID);
        this.setState({
          currentBid: newData['current-item']['current-bid'],
          timeRemaining: Math.round((endTime - currentTime) / 1000),
          endTime: endTime
        });
        this.startClock();
      }
    }
  }

  startClock() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
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
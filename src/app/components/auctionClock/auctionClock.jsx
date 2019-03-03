import React, { Component } from 'react';
import './auctionClock.css';
import NotificationService, { NOTIF_AUCTION_CHANGE, NOTIF_AUCTION_START_CLOCK, NOTIF_AUCTION_RESTART_CLOCK, NOTIF_AUCTION_ITEM_COMPLETE, NOTIF_MODAL_TOGGLE } from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();

class AuctionClock extends Component {
  constructor(props) {
    super(props);

    this.state = {
      timeRemaining: 0,
      currentBid: this.props.currentBid,
      currentTeam: '',
      endTime: 0,
      offset: 0,
      synchronizedWithServer: false
    }

    // Bind functions
    this.resetClockSynchronizationStateVariables = this.resetClockSynchronizationStateVariables.bind(this);
    this.synchronizeClockWithServer = this.synchronizeClockWithServer.bind(this);
    this.generateCountdownDisplay = this.generateCountdownDisplay.bind(this);
    this.tick = this.tick.bind(this);
    this.newAuctionData = this.newAuctionData.bind(this);
    this.startClock = this.startClock.bind(this);
  }

  componentDidMount() {
    ns.addObserver(NOTIF_AUCTION_CHANGE, this, this.newAuctionData);
    ns.addObserver(NOTIF_AUCTION_START_CLOCK, this, this.startClock);

    if (this.props.uid !== undefined) {
      this.resetClockSynchronizationStateVariables();
    }
  }

  componentWillUnmount() {
    clearInterval(this.timerID);

    ns.removeObserver(this, NOTIF_AUCTION_CHANGE);
    ns.removeObserver(this, NOTIF_AUCTION_START_CLOCK);
  }

  componentDidUpdate(prevProps) {
    if (this.props.uid !== prevProps.uid) {
      this.resetClockSynchronizationStateVariables();
    }
  }

  resetClockSynchronizationStateVariables() {
    ns.postNotification(NOTIF_MODAL_TOGGLE, 'timeout-clock-sync');
    this.setState({
      offset: 0,
      synchronizedWithServer: false
    }, this.synchronizeClockWithServer);
  }

  synchronizeClockWithServer() {
    var self = this;
    ds.getClientServerTimeOffset().then(offset => {
      console.log('offset: ' + offset);
      self.setState({
        offset: offset,
        synchronizedWithServer: true
      }, () => ns.postNotification(NOTIF_MODAL_TOGGLE, 'timeout-clock-sync'));
    });
  }

  tick() {
    if (this.state.timeRemaining == 0) {
      clearInterval(this.timerID);
      ns.postNotification(NOTIF_AUCTION_ITEM_COMPLETE, null);
    } else {
      let currentTime = new Date().getTime();
      var newRemainingTime = Math.round((this.state.endTime - currentTime - this.state.offset) / 1000);
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
        timeRemaining: Math.round((endTime - currentTime - this.state.offset) / 1000),
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
        let timeRemaining = Math.round((endTime - currentTime - this.state.offset) / 1000);
        this.checkClockSynchronization(timeRemaining);
        this.setState({
          currentBid: newData['current-item']['current-bid'],
          timeRemaining: timeRemaining,
          endTime: endTime
        });
        this.startClock();
      }
    }
  }

  checkClockSynchronization(timeRemaining) {
    console.log('timeRemaining: ' + timeRemaining);
    console.log('interval: ' + this.props.interval);
    if (Math.abs(timeRemaining - this.props.interval) > 1) {
      this.resetClockSynchronizationStateVariables();
    }
  }

  startClock() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
  }

  generateCountdownDisplay = () => {
    if (this.state.timeRemaining <= 5) {
      return (
        <span className='text-danger'>{'00:0' + this.state.timeRemaining}</span>
      );
    } else if (this.state.timeRemaining < 10) {
      return (
        <span>{'00:0' + this.state.timeRemaining}</span>
      );
    } else {
      return (
        <span>{'00:' + this.state.timeRemaining}</span>
      );
    }
    
  }

  render() {
    return (
      <div className='time-remaining'>
        <h5>{'Time Remaining: '}{this.generateCountdownDisplay()}</h5> 
      </div>
    );
  }
}

export default AuctionClock;
import React, { Component } from 'react';
import './auctionClock.css';

class AuctionClock extends Component {
  constructor(props) {
    super(props);

    this.state = {
      timeRemaining: this.props.interval
    }

    // Bind functions
    this.generateCountdownDisplay = this.generateCountdownDisplay.bind(this);
    this.tick = this.tick.bind(this);
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    if (this.state.timeRemaining == 0) {
      clearInterval(this.timerID);
    } else {
      var newRemainingTime = this.state.timeRemaining - 1;
      this.setState({timeRemaining: newRemainingTime});
    }
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
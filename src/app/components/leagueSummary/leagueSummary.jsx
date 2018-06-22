import React, { Component } from 'react';
import './leagueSummary.css';

class LeagueSummary extends Component {

    constructor(props) {
        super(props);

        this.state = {
          totalPot: '',
          myBet: '',
          grossReturn: '',
          percentReturn: ''
        }
    }

    render() {
        return (
          <div className='container'>
            <div className='row justify-content-md-center'>
              <div className='card col-md-4'>
                <h4>Total Pot</h4>
                <h5>{this.state.totalPot}</h5>
              </div>
            </div>
            <div className='row justify-content-md-center'>
              <div className='card col-md-3'>
                <h4>My Bet</h4>
                <h5>{this.state.myBet}</h5>
              </div>
              <div className='card col-md-3'>
                <h4>Gross Return</h4>
                <h5>{this.state.grossReturn}</h5>
              </div>
              <div className='card col-md-3'>
                <h4>% Return</h4>
                <h5>{this.state.percentReturn}</h5>
              </div>
            </div>
          </div>
        );
    }

}

export default LeagueSummary;
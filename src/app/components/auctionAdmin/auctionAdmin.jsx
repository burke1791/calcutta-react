import React, { Component } from 'react';
import './auctionAdmin.css';

class AuctionAdmin extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='admin-header'>
        <div className='btn-toolbar'>
          <div className='btn-group m-2'>
            <button type='button' className='btn btn-secondary'>Start Next Item</button>
          </div>
          <div className='btn-group m-2'>
            <button type='button' className='btn btn-secondary'>Restart Clock</button>
          </div>
          <div className='btn-group m-2'>
            <button type='button' className='btn btn-secondary'>Undo Last Bid</button>
          </div>
          <div className='btn-group m-2'>
            <button type='button' className='btn btn-secondary'>End Auction</button>
          </div>
        </div>
      </div>
    );
  }

}

export default AuctionAdmin;
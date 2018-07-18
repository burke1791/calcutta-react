import React, { Component } from 'react';
import './chatInput.css';
import Button from '../button/button';

class ChatInput extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className=''>
          <div className='input-group my-1'>
            <input type='text' />
            <div className='input-group-append'>
              <Button btnType='button' onClick={this.sendMessage} className='btn btn-outline-secondary' btnValue='Send' />
            </div>
          </div>
      </div>
    );
  }
}

export default ChatInput;
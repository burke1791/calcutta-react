import React, { Component } from 'react';
import './auctionChat.css';
import ChatMessage from '../chatMessage/chatMessage';
import ChatInput from '../chatInput/chatInput';

class AuctionChat extends Component {
  constructor(props) {
    super(props);

    // bind functions
    this.generateChatMessages = this.generateChatMessages.bind(this);
  }

  generateChatMessages = () => {

  }

  render() {
    return (
      <div className='auction-chat'>
        <div className=''>
          {this.generateChatMessages()}
        </div>
        <div className=''>
          <ChatInput />
        </div>
      </div>
    );
  }
}

export default AuctionChat;
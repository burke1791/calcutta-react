import React, { Component } from 'react';
import './chatMessage.css';

class ChatMessage extends Component {
  constructor(props) {
    super(props);
    
  }

  render() {
    return (
      <div className='d-flex flex-row mx-1 message'>
        <div className='' id='author'>{this.props.author + ':'}</div>
        <div className='ml-2 text-left' id='content'>{this.props.content}</div>
        <div className='ml-auto' id='time'>{this.props.time}</div>
      </div>
    );
  }
}

export default ChatMessage;
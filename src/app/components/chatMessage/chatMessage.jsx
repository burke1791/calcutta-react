import React, { Component } from 'react';
import './chatMessage.css';

import DataService from '../../../services/data-service';

let ds = new DataService();

class ChatMessage extends Component {
  constructor(props) {
    super(props);
    
    // bind functions
    this.convertTimestamp = this.convertTimestamp.bind(this);
  }

  convertTimestamp = () => {
    var timestampValue;
    if (this.props.timestamp !== '') {
      timestampValue = ds.formatServerTimestamp(this.props.timestamp);
    } else {
      timestampValue = this.props.time;
    }

    return timestampValue;
  }

  render() {

    return (
      <div className='d-flex flex-row mx-1 message'>
        <div className='' id='author'>{this.props.author + ':'}</div>
        <div className='ml-2 text-left' id='content'>{this.props.content}</div>
        <div className='ml-auto' id='time'>{this.convertTimestamp()}</div>
      </div>
    );
  }
}

export default ChatMessage;
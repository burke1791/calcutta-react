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
      <li className='message'>
        {/*<div className='d-flex flex-row mx-1 message'>*/}
          <span className='float-left text-right' id='author'>{this.props.author + ':'}</span>
          <span className='float-right text-right' id='time'>{this.convertTimestamp()}</span>
          <span className='text-left' id='content'>{this.props.content}</span>
        {/*</div>*/}
      </li>
    );
  }
}

export default ChatMessage;
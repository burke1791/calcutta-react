import React, { Component } from 'react';
import './auctionChat.css';
import ChatMessage from '../chatMessage/chatMessage';
import ChatInput from '../chatInput/chatInput';

import NotificationService, { NOTIF_AUCTION_NEW_MESSAGE } from '../../../services/notification-service';
import DataService from '../../../services/data-service';

let ns = new NotificationService();
let ds = new DataService();

class AuctionChat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: {},
      messageKeys: []
    }

    // bind functions
    this.newMessage = this.newMessage.bind(this);
    this.generateChatMessages = this.generateChatMessages.bind(this);
  }

  componentDidMount() {
    ds.attachAuctionMessagesListener(this.props.leagueId);

    ns.addObserver(NOTIF_AUCTION_NEW_MESSAGE, this, this.newMessage);
  }

  componentWillUnmount() {
    ds.detatchAuctionMessagesListener(this.props.leagueId);

    ns.removeObserver(this, NOTIF_AUCTION_NEW_MESSAGE);
  }

  newMessage(newData) {
    console.log('newData: ' + newData);
    var messages = newData;
    var keys = [];
    if (messages != null && typeof(messages) != 'undefined') {
      keys = Object.keys(messages);
    }

    this.setState({
      messages: messages,
      messageKeys: keys
    });
  }

  generateChatMessages = () => {
    var numMessages = this.state.messageKeys.length;
    if (numMessages > 0) {
      const list = this.state.messageKeys.map((key, index) => {
        var author = this.state.messages[key].author;
        var body = this.state.messages[key].body;
        var time = this.state.messages[key].time;
        var timestamp;

        if (this.state.messages[key].timestamp !== undefined) {
          timestamp = this.state.messages[key].timestamp;
        } else {
          timestamp = '';
        }

        return (
          <ChatMessage author={author} time={time} timestamp={timestamp} content={body} key={key} />
        );
      });
      return (list);
    }
  }

  render() {
    return (
      <div className='d-flex flex-column justify-content-end auction-chat'>
        <div className='chat-messages'>
          <ul className='messages-list'>
            {this.generateChatMessages()}
          </ul>
        </div>
        <ChatInput leagueId={this.props.leagueId} uid={this.props.uid} /> 
      </div>
    );
  }
}

export default AuctionChat;
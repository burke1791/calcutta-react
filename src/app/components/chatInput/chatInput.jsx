import React, { Component } from 'react';
import './chatInput.css';
import Button from '../button/button';

import DataService from '../../../services/data-service';
import AuthenticationService from '../../../services/authentication-service';

let ds = new DataService();
let authService = new AuthenticationService();

class ChatInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: '',
      uid: this.props.uid,
      username: ''
    }

    //bind functions
    this.sendMessage = this.sendMessage.bind(this);
    this.onMessageChange = this.onMessageChange.bind(this);
  }

  sendMessage(event) {
    event.preventDefault();

    console.log('send btn pressed');
    console.log(this.state.uid);

    var self = this;

    if (this.state.uid === '') {
      this.setState({uid: authService.getUser().uid});
      console.log('uid: ' + this.state.uid);
    }
    
    if (this.state.uid !== '') {
      
      ds.getDisplayName(this.state.uid).then(function(username) {
        ds.postAuctionChatMessage(self.props.leagueId, self.state.message, username, self.state.uid)
        self.setState({message: ''});
      });
    }
  }

  onMessageChange(event) {
    this.setState({message: event.target.value});
  }

  render() {
    return (
      <div className='input-group flex-row justify-content-end my-1'>
        <div className='input-grow'>
          <input type='text' className='form-control' value={this.state.message} onChange={this.onMessageChange} placeholder='Trash Talk Here' />
        </div>
        <div className='input-group-append'>
          <Button btnType='button' onClick={this.sendMessage} className='btn btn-outline-secondary' btnValue='Send' />
        </div>
      </div>
    ); 
  }
}

export default ChatInput;
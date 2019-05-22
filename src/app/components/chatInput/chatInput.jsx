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

    var self = this;

    if (this.state.uid === '' || this.state.uid === undefined || this.state.uid === null) {
      this.setState({uid: authService.getUser().uid});
    }
    
    if (this.state.uid !== '' && this.state.uid !== undefined && this.state.uid !== null) {
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
      <div className='justify-content-end my-1'>
        <form>
          <div className='form-row'>
            <div className='col-10'>
              <input type='text' className='form-control' value={this.state.message} onChange={this.onMessageChange} placeholder='Trash Talk Here' />
            </div>
            <div className='col-2'>
              <button type='submit' onClick={this.sendMessage} className='btn btn-primary' id='send-chat'>Send</button>
            </div>
          </div>
        </form>
      </div>
    ); 
  }
}

export default ChatInput;
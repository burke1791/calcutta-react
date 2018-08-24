import React, { Component } from 'react';
import './memberPage.css';
import { Redirect } from 'react-router-dom';
import TeamTable from '../teamTable/teamTable';

import DataService from '../../../services/data-service';
import NotificationService, { NOTIF_SIGNOUT } from '../../../services/notification-service';

let ds = new DataService();
let ns = new NotificationService();

class MemberPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: true,
      username: ''
    }

    this.getDisplayName = this.getDisplayName.bind(this);
    this.userSignedOut = this.userSignedOut.bind(this);
  }

  componentDidMount() {
    // TODO: Add auth checks
    this.getDisplayName();

    ns.addObserver(NOTIF_SIGNOUT, this, this.userSignedOut);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_SIGNOUT);
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.uid !== prevProps.match.params.uid) {
      this.getDisplayName();
    }
  }

  getDisplayName() {
    var self = this;
    ds.getDisplayName(this.props.match.params.uid).then(function(username) {
      self.setState({username: username});
    });
  }

  userSignedOut() {
    this.setState({isAuthenticated: false});
  }

  render() {
    if (this.state.isAuthenticated) {
      return (
        <div className='member-page'>
          <div className='container'>
            <div className='row justify-content-md-left'>
              <h1>{this.state.username}</h1>
            </div>
          </div>
          <div className='container card'>
            <TeamTable className='table table-striped table-hover' isAuthenticated={this.state.isAuthenticated} />
          </div>
        </div>
      );
    } else {
      return (
        <Redirect to='/' />
      );
    }
  }
}

export default MemberPage;
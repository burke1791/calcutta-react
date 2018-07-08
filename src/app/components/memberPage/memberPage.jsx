import React, { Component } from 'react';
import './memberPage.css';
import { Redirect } from 'react-router-dom';
import TeamTable from '../teamTable/teamTable';

import DataService from '../../../services/data-service';

let ds = new DataService();

class MemberPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: true,
      username: ''
    }
  }

  componentDidMount() {
    // TODO: Add auth checks
    var self = this;
    ds.getDisplayName(this.props.match.params.uid).then(function(username) {
      self.setState({username: username});
    });
  }

  render() {
    if (this.state.isAuthenticated) {
      return (
        <div className='member-page'>
          <div className='container'>
            <div className='row justify-content-md-center'>
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
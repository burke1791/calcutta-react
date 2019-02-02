import React, { Component } from 'react';
import './godModeNav.css';
import { Link } from 'react-router-dom';

import AuthenticationService from '../../../services/authentication-service';
import NotificationService from '../../../services/notification-service';

let authService = new AuthenticationService();
let ns = new NotificationService();

class GodModeNav extends Component {
  constructor(props) {
    super(props);

    // this.state

    // bind functions

  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  render() {
    var godModeRoot = '/god-mode/';

    return (
      <div className='god-mode-nav container my-2'>
        <nav className='navbar navbar-expand-lg'>
          <div className='mr-auto'>
            <Link className='to-add-sport mx-2' exact='true' to={godModeRoot + 'add-sport'}>Add Sport</Link>
            <Link className='update-scores mx-2' exact='true' to={godModeRoot + 'update-scores'}>Update Scores</Link>
          </div>
        </nav>
      </div>
    )
  }

}

export default GodModeNav;
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import './godMode.css';

class GodMode extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='test'>
        <h1>God Mode Test</h1>
      </div>
    );
  }
}

export default withRouter(GodMode);
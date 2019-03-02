import React, { Component } from 'react';
import './timeoutForm.css';
import Loader from 'react-loader-spinner';

class TimeoutForm extends Component {
  constructor(props) {
    super(props);

    // bind functions
  }

  render() {
    
    return (
      <div className='timeout-spinner'>
        <Loader type="Watch" color="#FFA500" height="75" width="75" />
      </div>
    );
    
  }
}

export default TimeoutForm;
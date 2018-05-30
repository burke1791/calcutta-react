import React, { Component } from 'react';
import './button.css';

class Button extends Component {
  render() {
    return (
      <div className="simple-button">
        <button type="button" onClick={this.props.onClick} className='btn btn-primary'>{this.props.btnValue}</button>
      </div>
    );
  }
}

export default Button;
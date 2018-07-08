import React, { Component } from 'react';
import './button.css';

class Button extends Component {
  
  render() {
    if (this.props.disabled) {
      return (
        <div className='simple-button'>
          <button type={this.props.btnType} onClick={this.props.onClick} className={this.props.btnClass} disabled>{this.props.btnValue}</button>
        </div>
      );
    } else {
      return (
        <div className='simple-button'>
          <button type={this.props.btnType} onClick={this.props.onClick} className={this.props.btnClass}>{this.props.btnValue}</button>
        </div>
      );
    }
  }
}

export default Button;
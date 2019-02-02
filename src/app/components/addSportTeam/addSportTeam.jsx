import React, { Component } from 'react';
import './addSportTeam.css';

class AddSportTeam extends Component {
  constructor(props) {
    super(props);

    this.generateProperties = this.generateProperties.bind(this);
  }

  generateProperties = () => {
    if (this.props.properties.length) {
      const list = this.props.properties.map((property, i) => {
        return (
          <div className='row my-2' key={i}>
            <div className='col-2'>
              <label htmlFor={this.props.teamKey + '-' + property}>{property}</label>
            </div>
            <div className='col'>
              <input type='text' className='form-control' id={this.props.teamKey + '-' + property} />
            </div>
          </div>
        );
      });

      return (list);
    }
  }

  render() {
    return (
      <div className='team-info' id={this.props.teamKey}>
        {this.generateProperties()}
        <hr />
      </div>
    );
  }
}

export default AddSportTeam;
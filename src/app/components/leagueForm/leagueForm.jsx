import React, {Component} from 'react';
import './leagueForm.css';
import NotificationService, { NOTIF_LEAGUE_SUBMIT, NOTIF_MODAL_TYPE_CHANGE } from '../../../services/notification-service';
import AuthenticationService from '../../../services/authentication-service';
import DataService from '../../../services/data-service';
import Button from '../button/button';

let ns = new NotificationService();
let authService = new AuthenticationService();
let ds = new DataService();

class LeagueForm extends Component {

  constructor(props) {
    super(props);

    this.state = {
      leagueType: props.leagueType,
      submitBtnText: props.leagueType === 'join' ? 'Join' : 'Create',
      leagueNameVal: '',
      leaguePassVal: '',
      leagueSportVal: ''
    };

    this.leagueSubmission = this.leagueSubmission.bind(this);
    this.onLeagueNameChange = this.onLeagueNameChange.bind(this);
    this.onLeaguePassChange = this.onLeaguePassChange.bind(this);
    this.onLeagueSportChange = this.onLeagueSportChange.bind(this);
    this.joinRadioClicked = this.joinRadioClicked.bind(this);
    this.createRadioClicked = this.createRadioClicked.bind(this);
    this.generateFormContents = this.generateFormContents.bind(this);
  }

  componentWillMount() {
    ns.addObserver(NOTIF_LEAGUE_SUBMIT, this, this.leagueSubmission);
  }

  componentWillUnmount() {
    ns.removeObserver(this, NOTIF_LEAGUE_SUBMIT);
  }

  leagueSubmission(event) {
    event.preventDefault();

    var user = authService.getUser();
    var uid = user.uid;
    var self = this;

    if (this.state.leagueNameVal === '' || this.state.leaguePassVal === '') {
      alert('Please enter a league name and password');
    } else if (this.state.leagueType === 'join') {
      // TODO: check for multiple leagues using the same name and password before adding user to members list
      
      ds.getDataSnapshot('/leagues').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var leagueName = childSnapshot.child('name').val();
          var leaguePass = childSnapshot.child('password').val();
          var leagueStatus = childSnapshot.child('status').val();
          var leagueMembers = childSnapshot.child('members').val();
          var key = childSnapshot.key;
  
          if (leagueStatus !== 'pending') {
            if (leagueName === self.state.leagueNameVal && leaguePass === self.state.leaguePassVal) {
              if (!leagueMembers[uid]) {
                ds.joinLeague(key, uid);
              }
            }
          }
        });
      });
    } else if (this.state.leagueType === 'create') {
      // TODO: move this to data service
      var league = {
        'status' : 'pending',
        'creator' : uid,
        'members' : {
          [uid] : true
        },
        'name' : this.state.leagueNameVal,
        'password' : this.state.leaguePassVal,
        'sport' : this.state.leagueSportVal
      };

      ds.createLeague(league);
      // redirect to new league page to complete setup information
    }
    // this will need to be moved - in some cases the modal will need to display an error message
    this.props.submitHandler();
  }

  onLeagueNameChange(event) {
    this.setState({leagueNameVal: event.target.value});
  }

  onLeaguePassChange(event) {
    this.setState({leaguePassVal: event.target.value});
  }

  onLeagueSportChange(event) {
    this.setState({leagueSportVal: event.target.value});
  }

  joinRadioClicked(event) {
    this.setState({
      leagueType: 'join',
      submitBtnText: 'Join'
    });
    ns.postNotification(NOTIF_MODAL_TYPE_CHANGE, 'join');
  }

  createRadioClicked(event) {
    this.setState({
      leagueType: 'create',
      submitBtnText: 'Create'
    });
    ns.postNotification(NOTIF_MODAL_TYPE_CHANGE, 'create');
  }

  generateFormContents = () => {
    if (this.state.leagueType === 'join') {
      return (
        <div className='join-form'>
          <div className='form-group'>
            <label><strong>League Name</strong></label>
            <input type='text' className='form-control' value={this.state.leagueNameVal} onChange={this.onLeagueNameChange} placeholder='' />
          </div>
          <div className='form-group'>
            <label><strong>League Password</strong></label>
            <input type='text' className='form-control' value={this.state.leaguePassVal} onChange={this.onLeaguePassChange} placeholder='' />
          </div>
        </div>
      );
    } else {
      // TODO: populate the select tag with options from the database
      return (
        <div className='create-form'>
          <div className='form-group'>
            <label><strong>League Sport</strong></label>
            <select className='custom-select' value={this.state.leagueSportVal} onChange={this.onLeagueSportChange}>
              <option value='ncaa-mens'>NCAA Men's Basketball</option>
              <option value='mlb-hrderby-2018'>Home Run Derby 2018</option>
              <option value='nfl-2018'>NFL 2018/19</option>
            </select>
          </div>
          <div className='form-group'>
            <label><strong>League Name</strong></label>
            <input type='text' className='form-control' value={this.state.leagueNameVal} onChange={this.onLeagueNameChange} placeholder='' />
          </div>
          <div className='form-group'>
            <label><strong>League Password</strong></label>
            <input type='text' className='form-control' value={this.state.leaguePassVal} onChange={this.onLeaguePassChange} placeholder='' />
          </div>
        </div>
      );
    }
  }

  render() {
    var joinChecked = false;
    var createChecked = false;

    if (this.state.leagueType === 'join') {
      joinChecked = true;
    } else if (this.state.leagueType === 'create') {
      createChecked = true;
    }

    return (
      <div className='league-form'>
        <form>
          <div className='form-check form-check-inline'>
            <input className='form-check-input' type='radio' name='league-type' onClick={this.joinRadioClicked} defaultChecked={joinChecked} />
            <label className='form-check-label'>Join</label>
          </div>
          <div className='form-check form-check-inline'>
            <input className='form-check-input' type='radio' name='league-type' onClick={this.createRadioClicked} defaultChecked={createChecked} />
            <label className='form-check-label'>Create</label>
          </div>
          {this.generateFormContents()}
          <div className='container'>
            <div className='row'>
              <div className='col-12'>
                <Button btnType='submit' btnClass='btn btn-primary btn-block' onClick={this.leagueSubmission} btnValue={this.state.submitBtnText} />
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default LeagueForm;
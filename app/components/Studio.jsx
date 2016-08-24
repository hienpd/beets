import React from 'react';
import cookie from 'react-cookie';
import DrumMachine from 'components/DrumMachine';
import Knob from 'components/Knob';
import axios from 'axios';

var Image = require('react-image-component')
// React.renderComponent(<Image src='./photos/blackbird.jpg')
var socket = io();

const Studio = React.createClass({
  getInitialState() {
    return {
      studio: this.props.params.id,
      username: cookie.load('mc_username'),
      collaborators: [
      ],
      image_url: '',
      sequence: '[[],[],[],[],[],[],[],[],[],[],[],[],[]]',
      title: ''
    }
  },
  componentWillMount() {
    socket.emit('enter studio', {
      studio: this.state.studio,
      username: this.state.username
    });
    this.setState({
      collaborators: this.state.collaborators.concat({ username: this.state.username })
    });

    socket.on('success', (data) => {
      console.log('success', data.usernames.map((name) => ({ username: name })));
      this.setState({
        collaborators: data.usernames.map((name) => ({ username: name }))
      });

      if (this.state.username === data.usernames[0]) {
        const sequence = this.refs['drumMachine'].state.sequence;

        socket.emit('sync', {
          studio: this.props.params.id,
          username: this.state.username,
          sequence: sequence
        });
      }
    });

    socket.on('sync', (data) => {
      const drumMachine = this.refs['drumMachine'];
      if (data.sequence) {
        if (data.username !== this.state.username) {
          drumMachine.setState({ sequence: data.sequence });
        }
      }
      else if(data.buttonClick) {
        if (data.username !== this.state.username) {
          const sequence = drumMachine.state.sequence;
          const { pattern, row, step } = data.buttonClick;
          sequence[pattern][row][step] = !sequence[pattern][row][step];
          drumMachine.setState({ sequence: sequence });
        }
      }
    });
  },

  buttonClick(pattern, row, step) {
    socket.emit('sync', {
      studio: this.props.params.id,
      username: this.state.username,
      buttonClick: { pattern: pattern, row: row, step: step }
    });
    console.log(pattern, row, step);
  },

  handleTitle(event) {
    const title = event.target.value;

    this.setState({
      title: title
    });
  },

  handleImageUrl(event) {
    const image_url = event.target.value;

    this.setState({
      image_url: image_url
    });
  },

  // handleSequence() {
  //
  // },

  handlePublish(event) {
    event.preventDefault();
    axios.post('/api/beets', {
      title: this.state.title,
      image_url: this.state.image_url,
      sequence: this.state.sequence
    })
    .then(() => {
      console.log(this.state);
    })
    .catch((err) => {
      throw err;
    })
  },

  render() {
    const params = this.props.params;

    return <div className="studio">
      <h1 className="studio-title">You Are in {params.id}</h1>
      <Knob />
      <div>
        <DrumMachine ref={'drumMachine'} buttonClick={this.buttonClick} />
      </div>
      <div>
        <h2>Publish Beet</h2>
        <div>
          <h3>Collaborators</h3>
          <ul>
            {this.state.collaborators.map((elem) => <li>{elem.username}</li>)}
          </ul>
        </div>
        <h3>Add Beet Info</h3>
        <form>
          <div>
            <input
              onChange={this.handleTitle}
              placeholder="Title"
              type="text"
            />
          </div>
          <div>
            <input
              onChange={this.handleImageUrl}
              placeholder="Album Image URL"
              type="text"
            />
          </div>
          <button onClick={this.handlePublish}>Publish Beet</button>
        </form>
      </div>
    </div>
  }
});

export default Studio;

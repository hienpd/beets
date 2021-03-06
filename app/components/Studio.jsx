/* globals io:false */
/* eslint-disable react/no-string-refs */
import Chat from 'components/Chat';
import DrumMachine from 'components/DrumMachine';
import Knob from 'components/Knob';
import React from 'react';
import axios from 'axios';
import cookie from 'react-cookie';
import { notify } from 'react-notify-toast';

const socket = io();

const Studio = React.createClass({
  getInitialState() {
    return {
      studio: this.props.params.id,
      username: cookie.load('beets_username'),
      collaborators: [
      ],
      imageUrl: '',
      sequence: '[[],[],[],[],[],[],[],[],[],[],[],[],[]]',
      title: '',
      bpm: 120,
      sequence: [
        [[], [], [], [], [], [], [], [], [], [], [], [], []],
        [[], [], [], [], [], [], [], [], [], [], [], [], []]
      ]
    };
  },
  componentWillMount() {
    socket.emit('enter studio', {
      studio: this.state.studio,
      username: this.state.username
    });
    this.setState({
      collaborators: this.state.collaborators.concat(
        { username: this.state.username })
    });

    socket.on('success', (data) => {
      this.setState({
        collaborators: data.usernames.map((name) => ({ username: name }))
      });

      if (this.state.username === data.usernames[0]) {
        const sequence = this.state.sequence;

        socket.emit('sync', {
          studio: this.props.params.id,
          username: this.state.username,
          sequence
        });

        socket.emit('sync', {
          studio: this.props.params.id,
          username: this.state.username,
          bpm: this.state.bpm
        });
      }
    });

    socket.on('sync', (data) => {
      if (data.sequence) {
        if (data.username !== this.state.username) {
          this.setState({ sequence: data.sequence });
        }
      }
      else if (data.buttonClick) {
        if (data.username !== this.state.username) {
          const sequence = this.state.sequence.slice(); // make copy
          const { pattern, row, step } = data.buttonClick;

          sequence[pattern][row][step] = !sequence[pattern][row][step];
          this.setState({ sequence });
        }
      }
      else if (data.bpm) {
        if (data.username !== this.state.username) {
          this.setState({ bpm: data.bpm });
        }
      }
    });
  },

  buttonClick(pattern, row, step) {
    const nextSequence = this.state.sequence.slice(); // make copy

    nextSequence[pattern][row][step] =
      !nextSequence[pattern][row][step];
    this.setState({ sequence: nextSequence });

    socket.emit('sync', {
      studio: this.props.params.id,
      username: this.state.username,
      buttonClick: { pattern, row, step }
    });
  },

  bpmChanged(newBpm) {
    this.setState({ bpm: newBpm });

    socket.emit('sync', {
      studio: this.props.params.id,
      username: this.state.username,
      bpm: newBpm
    });
  },

  handleTitle(event) {
    const title = event.target.value;

    this.setState({
      title
    });
  },

  handleImageUrl(event) {
    const imageUrl = event.target.value;

    this.setState({
      imageUrl
    });
  },

  handlePublish(event) {
    event.preventDefault();
    axios.post('/api/beets', {
      title: this.state.title,
      imageUrl: this.state.imageUrl,
      sequence: this.state.sequence
    })
    .then((newBeet) => {
      const newBeetId = newBeet.data.id;

      const promises = this.state.collaborators.map((collaborator) => {
        return axios.post('/api/beets_users',
          { beetId: newBeetId, username: collaborator.username });
      });

      return axios.all(promises);
    })
    .then(() => {
      notify.show('Your beet is now published!', 'success', 5000);
      this.setState({
        title: '',
        imageUrl: ''
      });
    })
    .catch((err) => {
      notify.show('Oops! Try again....', 'error', 5000);

      // eslint-disable-next-line no-console
      console.error(err);
    });
  },

  getBackgroundClass() {
    if (/Studio 54/i.test(this.props.params.id)) {
      return 'studio3-background';
    }

    return 'blackbird-background';
  },

  render() {
    const params = this.props.params;

    return (
      <div className={`studio ${this.getBackgroundClass()}`} >
        <div className="container">
          <h1 className="studio-title">You Are in {params.id}</h1>
          <Knob />
          <div>
            <DrumMachine
              bpm={this.state.bpm}
              bpmChanged={this.bpmChanged}
              buttonClick={this.buttonClick}
              sequence={this.state.sequence}
            />
          </div>
          <div className="meta-data">
            <div className="component">
              <h2 className="publish">Publish Beet</h2>
              <div>
                <h3>Collaborators</h3>
                <ul>
                  {this.state.collaborators.map(
                    (elem, index) => <li key={index}>{elem.username}</li>)}
                </ul>
              </div>
              <h3>Add Beet Info</h3>
              <form>
                <div>
                  <input
                    id="input-title"
                    onChange={this.handleTitle}
                    placeholder="Title"
                    type="text"
                    value={this.state.title}
                  />
                </div>
                <div>
                  <input
                    id="input-image-url"
                    onChange={this.handleImageUrl}
                    placeholder="Album Image URL"
                    type="text"
                    value={this.state.imageUrl}
                  />
                </div>
                <button
                  className="waves-effect waves-light btn"
                  id="publish"
                  onClick={this.handlePublish}
                >
                  Publish Beet
                </button>
              </form>
            </div>
            <Chat
              socket={socket}
              studio={this.state.studio}
              username={this.state.username}
            />
          </div>
        </div>
      </div>
    );
  }
});

export default Studio;

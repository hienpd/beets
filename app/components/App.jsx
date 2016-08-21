import DrumMachine from 'components/DrumMachine';
import Header from 'components/Header';
import Grid from 'components/Grid';
import Knobs from 'components/Knobs';
import React from 'react';
import { withRouter } from 'react-router';
import axios from 'axios';

//
// axios.get('./bd/bd0000.mp3')
//   .then(function (response) {
//     debugger;
//     console.log(response);
//   })
//   .catch(function (error) {
//     console.log(error);
//   });


const App = React.createClass({
  render() {
    return (<div>
      <h1>Musical Chairs</h1>
      {this.props.children}
    </div>);
    return (
      <div>
      <div>
        <Header />
      </div>

      <div className="drum-machines">
        <div className="machine-left">
          <DrumMachine  />
        </div>

        <div className="machine-right">
          <DrumMachine />
        </div>
      </div>
      </div>
    )
  }
});

export default withRouter(App);

import React, { Component } from "react";

class Slider extends Component {
  handleUpdate = (event) => {
    this.props.actionFnct(event.target.value);
  };

  changeInputLabel = (event) => {
    event.target.nextElementSibling.value = `${event.target.value}`;
  };

  componentDidMount() {
    const slider = document.getElementById(`${this.props.handle}`);
    slider.value = this.props.default;
  }

  render() {
    return (
      <div className="zoom-container">
        <label htmlFor={this.props.handle}>{this.props.label}</label>
        <input
          type="range"
          className="range"
          name="rank"
          min={this.props.min}
          max={this.props.max}
          step={this.props.step}
          onChange={this.handleUpdate}
          onInput={this.changeInputLabel}
          id={this.props.handle}
        />
        <output>{this.props.default}</output>
      </div>
    );
  }
}

export default Slider;
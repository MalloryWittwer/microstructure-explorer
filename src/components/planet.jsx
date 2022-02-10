import "./planet.css";
import React, { Component } from "react";

const colorKeys = {
  pearlite: "red",
  martensite: "orange",
  network: "blue",
  "pearlite+spheroidite": "black",
  "pearlite+widmanstatten": "pink",
  spheroidite: "green",
  "spheroidite+widmanstatten": "yellow",
  undefined: "purple",
};

class Planet extends Component {
  handleMouseEnter = (e) => {
    e.preventDefault();
    this.props.actionFnct(this.props.id);
    document.getElementById("micrograph").classList.remove("invisible");
  };

  handleMouseLeave = (e) => {
    e.preventDefault();
    document.getElementById("micrograph").classList.add("invisible");
  };

  render = () => {
    const { id, yPos, xPos, size, zIndex, constituent } = this.props;
    return (
      <div
        className="Planet"
        id={id}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        style={{
          top: `${Number.parseInt(yPos, 10) - size / 2}px`,
          left: `${Number.parseInt(xPos, 10) - size / 2}px`,
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${0.5 * size}px`,
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/${id}.png)`,
          // zIndex: zIndex,
          border: `2px solid ${colorKeys[constituent]}`,
        }}
      >
        {/* {this.props.id} */}
      </div>
    );
  };
}

export default Planet;

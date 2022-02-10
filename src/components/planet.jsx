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
    const { yPos, xPos, size, constituent } = this.props;
    e.preventDefault();
    e.currentTarget.classList.add("hovered-point");
    this.props.actionFnct(this.props.id);
    const micro = document.getElementById("micrograph");
    micro.classList.remove("invisible");
    micro.style.top = `${Number.parseInt(yPos, 10) - 270 - size / 2}px`;
    micro.style.left = `${Number.parseInt(xPos, 10) - 125}px`;
    micro.style.borderColor = `${colorKeys[constituent]}`;
    const triangle = document.getElementById("triangle");
    triangle.style.borderTopColor = `${colorKeys[constituent]}`;
  };

  handleMouseLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("hovered-point");
    document.getElementById("micrograph").classList.add("invisible");
  };

  render = () => {
    const { id, yPos, xPos, size, constituent } = this.props;
    return (
      <div
        className="planet"
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
          border: `2px solid ${colorKeys[constituent]}`,
        }}
      >

      </div>
    );
  };
}

export default Planet;

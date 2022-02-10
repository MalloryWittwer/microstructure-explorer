import React, { Component } from "react";
import Select from "react-select";

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    borderBottom: "1px solid aliceblue",
    color: "aliceblue",
    padding: 10,
    background: state.isFocused ? "black" : "none",
  }),

  indicatorsContainer: (provided, state) => ({
    ...provided,
  background: "#16181b", 
  }),

  valueContainer: (provided, state) => ({
    ...provided,
    background: "#16181b",
    border: "1px solid #aaaaaa",
  }),

  indicatorSeparator: (provided, state) => ({
    ...provided,
    background: "#999999",
  }),

  singleValue: (provided, state) => ({
    ...provided,
    color: "aliceblue",
  }),

  menu: (provided, state) => ({
    ...provided,
    background: "#282c34",
    width: 200,
  }),
};

class Dropdown extends Component {
  handleUpdate = (option) => {
    this.props.actionFnct(option.value);
  };

  componentDidMount() {
    this.handleUpdate({label: '0', value: [1, Math.PI / 2, Math.PI / 2]})
  }

  render() {
    return (
      <div className="range-container">
        <label htmlFor="selector">{this.props.label}</label>
        <Select
          options={this.props.options}
          styles={customStyles}
          defaultValue={{label: '0', value: [1, Math.PI / 2, Math.PI / 2]}}
          onChange={this.handleUpdate}
          id="selector"
          name="selector"
        />
      </div>
    );
  }
}

export default Dropdown;

import React, { Component } from "react";

class NavBtn extends Component {
  handleUpdate = (e) => {
    e.preventDefault();
    this.props.actionFnct();
  };

  render() {
    return (
      <div>
          <button className="btn-nav" onClick={this.handleUpdate}>
              {this.props.label}
          </button>
      </div>
    );
  }
}

export default NavBtn;

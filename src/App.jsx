import React, { Component } from "react";
import { rotationMatrix } from 'mathjs'
import {
  spher2cart,
  cart2spher,
  stereoProjection,
  invStereoProjection,
  reBase,
  matrixRot,
  angleBetweenVectors,
  crossVectorNormed,
  arraysEqual,
} from "./utils";
import Canvas from "./components/canvas";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      rawProjectedData: [],
      visibleChildren: [],
      zoom: 600,
      planetSize: 30,
      phiBase: 0,
      thetaBase: Math.PI,
      activeID: 0,
      metadata: [],
      metaSelected: {
        id: 0,
        magnification: "4910x",
        primary_microconstituent: "pearlite",
      },
    };
  }

  zoomSlider = (z) => {
    const newZoom = Math.max(150, z);
    this.setState(
      {
        zoom: newZoom,
        planetSize: Number.parseInt(0.06 * newZoom, 10),
      },
      this.manageZoom
    );
  }

  zoomWheel = (e) => {
    const newZoom = Math.max(150, this.state.zoom + e.deltaY);
    this.setState(
      {
        zoom: newZoom,
        planetSize: Number.parseInt(0.06 * newZoom, 10),
      },
      this.manageZoom
    );
  };

  manageZoom = () => {
    const children = [];
    Object.values(this.state.rawProjectedData).forEach((element) => {
      const X = element.data[0] * this.state.zoom + this.state.canvasSizeX / 2;
      const Y = element.data[1] * this.state.zoom + this.state.canvasSizeY / 2;
      children.push({
        id: element.id,
        posX: X,
        posY: Y,
        zIndex: element.zIndex,
      });
    });
    this.setState({ visibleChildren: children });
  };

  centerOnTP = (tp) => {
    this.setState({ thetaBase: tp[0], phiBase: tp[1] }, this.reCenterData);
  };

  centerOnID = (idClicked) => {
    const meta = this.state.metadata.filter(
      (x) => x.id === Number.parseInt(idClicked, 10)
    )[0];
    this.setState({ activeID: idClicked, metaSelected: meta });
  };

  reCenterData = () => {
    const { phiBase, thetaBase } = this.state;
    const centeredData = {};
    for (const [id, tp] of Object.entries(this.state.data)) {
      const dataRot = reBase(spher2cart(tp), phiBase, thetaBase);
      centeredData[`${id}`] = cart2spher(dataRot);
    }
    this.setState({ data: centeredData }, this.updateOptions);
  };

  projectData = () => {
    const { data } = this.state;
    const rawProjectedData = [];
    for (const [id, tp] of Object.entries(data)) {
      const dataProjected = stereoProjection(spher2cart(tp));
      rawProjectedData.push({ id: id, data: dataProjected });
    }
    this.setState({ rawProjectedData: rawProjectedData }, this.manageZoom);
  };

  updateOptions = () => {
    const options = [];
    for (const [id, tp] of Object.entries(this.state.data)) {
      options.push({ value: tp, label: id });
    }
    this.setState({ options: options }, this.projectData);
  };

  panView = (e) => {
    e.preventDefault();
    if (this.state.moving) {
      const canvas = document.getElementById("canvas");
      const localX = e.clientX - canvas.getBoundingClientRect().x;
      const localY = e.clientY - canvas.getBoundingClientRect().y;
      const XY = [
        (localX - this.state.canvasSizeX / 2) / this.state.zoom,
        (localY - this.state.canvasSizeY / 2) / this.state.zoom,
      ];
      const xyz = invStereoProjection(XY);

      if (arraysEqual(xyz, this.state.xyzOrigin)) {return}

      const cvNormed = crossVectorNormed(this.state.xyzOrigin, xyz);
      const angle = angleBetweenVectors(xyz, this.state.xyzOrigin);
      const matrixR = rotationMatrix(angle, cvNormed);

      const movedData = {};
      for (const [id, tp] of Object.entries(this.state.data)) {
        const dataCartesian = spher2cart(tp);
        const dataCartesianRotated = matrixRot(matrixR, dataCartesian);
        movedData[`${id}`] = cart2spher(dataCartesianRotated);
      }
      this.setState(
        { data: movedData, matrixR: matrixR, xyzOrigin: xyz },
        this.updateOptions
      );
    }
  };

  downListener = (e) => {
    e.preventDefault();
    const canvas = document.getElementById("canvas");
    const localX = e.clientX - canvas.getBoundingClientRect().x;
    const localY = e.clientY - canvas.getBoundingClientRect().y;
    const XY = [
      (localX - this.state.canvasSizeX / 2) / this.state.zoom,
      (localY - this.state.canvasSizeY / 2) / this.state.zoom,
    ];
    const xyz = invStereoProjection(XY);
    this.setState({ moving: true, xyzOrigin: xyz });
  };

  upListener = (e) => {
    e.preventDefault();
    const { thetaBase, phiBase, matrixR } = this.state;
    const tpAsCartesian = spher2cart([thetaBase, phiBase]);
    const newTpCartesian = matrixRot(matrixR, tpAsCartesian);
    const newTp = cart2spher(newTpCartesian);
    this.centerOnTP(newTp);
    const [newThetaBase, newPhiBAse] = newTp;
    this.setState({
      thetaBase: newThetaBase,
      phiBase: newPhiBAse,
      moving: false,
    });
  };

  componentDidMount = () => {
    // Adjust canvas width to full-screen
    const canvas = document.getElementById("canvas");
    this.setState({
      canvasSizeX: canvas.getBoundingClientRect().width, 
      canvasSizeY: canvas.getBoundingClientRect().height,
    })
    // Fetch data coordinates
    fetch(
      process.env.PUBLIC_URL + "/steel_embedding-tsne-vgg16-annealed-hard.json"
    )
      .then((response) => response.json())
      .then((d) => {this.setState({ data: d }, this.updateOptions)});
    // Fetch metadata 
    fetch(process.env.PUBLIC_URL + "/micro_metadata-new.json")
      .then((response) => response.json())
      .then((d) => { this.setState({ metadata: d }) });

    // document.addEventListener("keydown", this.navByKeys);
    document
      .getElementById("canvas")
      .addEventListener("wheel", this.zoomWheel, { passive: true });

    // PAN OVER CANVAS EVENTS
    document
      .getElementById("canvas")
      .addEventListener("mousedown", this.downListener);

    document
      .getElementById("canvas")
      .addEventListener("mousemove", this.panView, { passive: true });

    document
      .getElementById("canvas")
      .addEventListener("mouseup", this.upListener);

    // PAN VIA TOUCH
    document
      .getElementById("canvas")
      .addEventListener("touchstart", this.downListener);

    document
      .getElementById("canvas")
      .addEventListener("touchmove", this.panView);

    document
      .getElementById("canvas")
      .addEventListener("touchend", this.upListener);
  };

  render = () => {
    return (
      <div className="App">
        <Canvas
          visibleChildren={this.state.visibleChildren}
          planetSize={this.state.planetSize}
          actionFnct={this.centerOnID}
          metadata={this.state.metadata}
          sliderActionFnct={this.zoomSlider}
          activeID={this.state.activeID}
          metaSelected={this.state.metaSelected}
        />
      </div>
    );
  };
}

export default App;

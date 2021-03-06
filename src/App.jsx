import React, { Component } from "react";
import { rotationMatrix } from "mathjs";
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
import Slider from "./components/slider";

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

  setZoomActive = () => {
    this.setState({ zooming: true });
  };

  setZoomDone = () => {
    this.setState({ zooming: false });
  };

  zoomSlider = (z) => {
    const newZoom = Math.max(150, z);
    this.setState(
      {
        zoom: newZoom,
        planetSize: Number.parseInt(0.06 * newZoom, 10),
      },
      this.manageZoom
    );
  };

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
    if (this.state.moving) {
      const micro = document.getElementById("micrograph");
      micro.classList.add("invisible");

      const canvas = document.getElementById("canvas");
      const localX = e.clientX - canvas.getBoundingClientRect().x;
      const localY = e.clientY - canvas.getBoundingClientRect().y;
      const XY = [
        (localX - this.state.canvasSizeX / 2) / this.state.zoom,
        (localY - this.state.canvasSizeY / 2) / this.state.zoom,
      ];
      const xyz = invStereoProjection(XY);

      if (arraysEqual(xyz, this.state.xyzOrigin)) {
        return;
      }

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
    if (this.state.zooming) {
      return;
    }
    const canvas = document.getElementById("canvas");
    const localX = e.clientX - canvas.getBoundingClientRect().x;
    const localY = e.clientY - canvas.getBoundingClientRect().y;
    const XY = [
      (localX - this.state.canvasSizeX / 2) / this.state.zoom,
      (localY - this.state.canvasSizeY / 2) / this.state.zoom,
    ];
    const xyz = invStereoProjection(XY);
    canvas.style.cursor = "grabbing";
    this.setState({ moving: true, xyzOrigin: xyz });
  };

  upListener = (e) => {
    e.preventDefault();
    document.getElementById("canvas").style.cursor = "grab";
    this.setState({ moving: false });
  };

  adjustCanvasSize = () => {
    const canvas = document.getElementById("canvas");
    this.setState({
      canvasSizeX: canvas.getBoundingClientRect().width,
      canvasSizeY: canvas.getBoundingClientRect().height,
    }, this.updateOptions);
  }

  componentDidMount = () => {
    // Adjust canvas width to full-screen
    this.adjustCanvasSize();
    window.addEventListener('resize', this.adjustCanvasSize);
    // Fetch data coordinates
    fetch(
      process.env.PUBLIC_URL + "/steel_embedding-tsne-vgg16-annealed-pp100.json"
    )
      .then((response) => response.json())
      .then((d) => {
        this.setState({ data: d }, this.updateOptions);
      });
    // Fetch metadata
    fetch(process.env.PUBLIC_URL + "/micro_metadata-new.json")
      .then((response) => response.json())
      .then((d) => {
        this.setState({ metadata: d });
      });

    // document.addEventListener("keydown", this.navByKeys);
    document
      .getElementById("canvas")
      .addEventListener("wheel", this.zoomWheel, { passive: true });

    // PAN OVER CANVAS EVENTS
    document
      .getElementById("canvas")
      .addEventListener("pointerdown", this.downListener);

    document
      .getElementById("canvas")
      .addEventListener("pointermove", this.panView);

    document
      .getElementById("canvas")
      .addEventListener("pointerup", this.upListener);
  };

  render = () => {
    return (
      <div className="App">
        <div className="zoom-wrapper">
          <Slider
            label="Zoom"
            actionFnct={this.zoomSlider}
            signalZoomActive={this.setZoomActive}
            signalZoomDone={this.setZoomDone}
            handle="zoom-slider"
            min={10}
            max={2000}
            step={10}
            default={600}
          />
        </div>
        <Canvas
          visibleChildren={this.state.visibleChildren}
          planetSize={this.state.planetSize}
          actionFnct={this.centerOnID}
          metadata={this.state.metadata}
          activeID={this.state.activeID}
          metaSelected={this.state.metaSelected}
        />
        <div id="dataset">
          UHCS dataset:{" "}
          <a href="https://hdl.handle.net/11256/940">materialsdata.nist.gov</a>.
        </div>
        <div id="credits">
          <a href="https://github.com/MalloryWittwer/microstructure-explorer">
            <img
              src={`${process.env.PUBLIC_URL}/github.png`}
              alt="git"
              id="github"
            />
          </a>
        </div>
      </div>
    );
  };
}

export default App;

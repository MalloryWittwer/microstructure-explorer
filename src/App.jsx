import React, { Component } from "react";
import {
  spher2cart,
  cart2spher,
  stereoProjection,
  invStereoProjection,
  reBase,
  // rotX,
  // rotY,
  matrixRot,
  angleBetweenVectors,
  rodriguesRotMat,
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
      // stereoFactor: 0.6,
      stereoFactor: 1.0,
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

  // navByKeys = (event) => {
  //   event.preventDefault();
  //   let delta = (2 * Math.PI) / 180;
  //   let rotFnct;
  //   switch (event.which) {
  //     case 37:
  //       rotFnct = rotY;
  //       delta = -delta;
  //       break;
  //     case 38:
  //       rotFnct = rotX;
  //       break;
  //     case 39:
  //       rotFnct = rotY;
  //       break;
  //     case 40:
  //       rotFnct = rotX;
  //       delta = -delta;
  //       break;
  //     default:
  //       return;
  //   }
  //   const movedData = {};
  //   for (const [id, rtp] of Object.entries(this.state.data)) {
  //     const dataCartesian = spher2cart(rtp);
  //     const dataCartesianRotated = rotFnct(dataCartesian, delta);
  //     movedData[`${id}`] = cart2spher(dataCartesianRotated);
  //   }
  //   this.setState({ data: movedData }, this.updateOptions);
  // };

  centerOnRTP = (rtp) => {
    this.setState({ thetaBase: rtp[1], phiBase: rtp[2] }, this.reCenterData);
  };

  centerOnID = (idClicked) => {
    const { data } = this.state;
    // const rtp = data[Object.keys(data).find((id) => id === `${idClicked}`)];

    const meta = this.state.metadata.filter(
      (x) => x.id === Number.parseInt(idClicked, 10)
    )[0];

    this.setState({ activeID: idClicked, metaSelected: meta });
    // this.centerOnRTP(rtp);
  };

  reCenterData = () => {
    const { phiBase, thetaBase } = this.state;
    const centeredData = {};
    for (const [id, rtp] of Object.entries(this.state.data)) {
      const dataRot = reBase(spher2cart(rtp), phiBase, thetaBase);
      centeredData[`${id}`] = cart2spher(dataRot);
    }
    this.setState({ data: centeredData }, this.updateOptions);
  };

  projectData = () => {
    const { data, stereoFactor } = this.state;

    let zLocs = [];
    for (const [_, rtp] of Object.entries(data)) {
      const zval = rtp[0] * Math.cos(rtp[1]);
      zLocs.push(zval);
    }

    const min = Math.min(...zLocs);
    zLocs = zLocs.map((x) => x - min);
    const max = Math.max(...zLocs);
    zLocs = zLocs.map((x) => Number.parseInt((x / max) * zLocs.length, 10));

    const rawProjectedData = [];
    let counter = 0;
    for (const [id, rtp] of Object.entries(data)) {
      const dataProjected = stereoProjection(spher2cart(rtp), stereoFactor);
      const zIndex = zLocs[counter];
      counter = counter + 1;
      rawProjectedData.push({ id: id, data: dataProjected, zIndex: zIndex });
    }
    this.setState({ rawProjectedData: rawProjectedData }, this.manageZoom);
  };

  updateOptions = () => {
    const options = [];
    for (const [id, rtp] of Object.entries(this.state.data)) {
      options.push({ value: rtp, label: id });
    }
    this.setState({ options: options }, this.projectData);
  };

  panView = (e) => {
    if (this.state.moving) {
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
      const matrixR = rodriguesRotMat(cvNormed, angle);

      const movedData = {};
      for (const [id, rtp] of Object.entries(this.state.data)) {
        const dataCartesian = spher2cart(rtp);
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

  upListener = () => {
    const { thetaBase, phiBase, matrixR } = this.state;
    const rtpAsCartesian = spher2cart([1, thetaBase, phiBase]);
    const newRtpCartesian = matrixRot(matrixR, rtpAsCartesian);
    const newRtp = cart2spher(newRtpCartesian);
    this.centerOnRTP(newRtp);
    const [_, newThetaBase, newPhiBAse] = newRtp;

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
      .addEventListener("touchmove", this.panView, { passive: true });

    document
      .getElementById("canvas")
      .addEventListener("touchend", this.upListener);
  };

  render = () => {
    return (
      <div className="App">
        {/* <div className="side"> */}
          {/* <div className="wrapper"> */}
            {/* <h1>High-carbon steel microstructure explorer</h1> */}
            {/* <Dropdown
            label="Center on"
            actionFnct={this.centerOnRTP}
            options={this.state.options}
          /> */}
            {/* <Micrograph
              filename={this.state.activeID}
              metaSelected={this.state.metaSelected}
            /> */}
          {/* </div> */}
          {/* <table>
            <tbody>
              <tr
                style={{
                  color: "aliceblue",
                  opacity: "0.8",
                  paddingTop: "18px",
                }}
              >
                <td style={{ padding: "12px" }}>Dataset:</td>
                <td>
                  <p>
                    UHCS dataset available on{" "}
                    <a href="https://hdl.handle.net/11256/940">
                      materialsdata.nist.gov
                    </a>
                  </p>
                </td>
              </tr>
            </tbody>
          </table> */}
        {/* </div> */}
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

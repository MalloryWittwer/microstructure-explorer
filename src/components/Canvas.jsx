import React from "react";
import Planet from "./planet";
import Slider from "./slider";
import Micrograph from "./micrograph";

export default function Canvas(props) {
  const getMetaConstituent = (id) => {
    const { metadata } = props;
    const meta = metadata.filter((x) => x.id === Number.parseInt(id, 10))[0];
    if (meta) {
      return meta.primary_microconstituent;
    } else {
      return "undefined";
    }
  };

  return (
    <div id="canvas">
      {props.visibleChildren.map((child) => {
        return (
          <Planet
            key={child.id}
            id={child.id}
            xPos={child.posX}
            yPos={child.posY}
            size={props.planetSize}
            actionFnct={props.actionFnct}
            zIndex={child.zIndex}
            constituent={getMetaConstituent(child.id)}
          />
        );
      })}
      <Slider
        label="Zoom"
        actionFnct={props.sliderActionFnct}
        signalZoomActive={props.sliderSignalZoomActive}
        signalZoomDone={props.sliderSignalZoomDone}
        handle="zoom-slider"
        min={10}
        max={2000}
        step={10}
        default={600}
      />
      <Micrograph
        filename={props.activeID}
        metaSelected={props.metaSelected}
      />
    </div>
  );
}

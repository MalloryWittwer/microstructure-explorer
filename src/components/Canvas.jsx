import React from "react";
import Planet from "./planet";
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
      <Micrograph filename={props.activeID} metaSelected={props.metaSelected} />
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
}

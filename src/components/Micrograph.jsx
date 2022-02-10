import "./micrograph.css";

export default function Micrograph(props) {
  const { magnification, primary_microconstituent } = props.metaSelected;
  return (
    <div className="micrograph" id="micrograph">
      <img
        src={`${process.env.PUBLIC_URL}/images/${props.filename}.png`}
        alt="micrograph"
      />
      <p className="magnification">{magnification}</p>
      <p className="constituents">{primary_microconstituent}</p>
    </div>
  );
}

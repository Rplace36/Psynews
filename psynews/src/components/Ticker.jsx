import "./Ticker.css";

const tickerItems = [
  "New Study: Psilocybin Reduces OCD Symptoms by 60%",
  "Colorado Passes Natural Medicine Health Act",
  "FDA Grants Breakthrough Status to LSD for Anxiety",
  "MAPS Submits MDMA NDA to FDA",
  "Yale Opens First Academic Psychedelic Research Center",
  "Swiss Government Approves Expanded Psilocybin Access",
  "Ketamine Approved for Adolescent Depression in UK",
  "Indigenous Peyote Rights Protection Act Advances in Congress",
];

export default function Ticker() {
  return (
    <div className="ticker">
      <div className="ticker__label">BREAKING</div>
      <div className="ticker__track-wrap">
        <div className="ticker__track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="ticker__item">
              <span className="ticker__dot" aria-hidden="true">&#9679;</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

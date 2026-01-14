interface SatelliteAnimationProps {}

export const SatelliteAnimation = ({}: SatelliteAnimationProps) => {
  return (
    <div id="satellite" className="z-50 absolute top-0 left-0 w-full h-full">
      <div id="splash">
        <div className="anim">
          <div id="loader">
            <svg version="1.1" width="120px" height="140px" viewBox="0 0 60 70">
              <defs>
                <filter id="f1" x="0" y="0">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                </filter>
              </defs>
              <g id="mainSat">
                <path
                  fill="#0"
                  d="M26.9,5.1c-1.6-1.6-3.7-2.5-6-2.5c-2.2,0-4.2,0.8-5.8,2.3l-13,6.5c-0.5,0.2-0.7,0.8-0.4,1.3c0.2,0.4,0.5,0.6,0.9,0.6 c0.1,0,0.3,0,0.4-0.1l10-5c-0.3,0.9-0.5,1.8-0.5,2.8c0,1.9,0.6,3.7,1.8,5.2l-7.1,7.1c-0.4,0.4-0.4,1,0,1.4C7.5,24.9,7.7,25,8,25 s0.5-0.1,0.7-0.3l7-7c1.5,1.2,3.3,1.8,5.2,1.8c1,0,1.9-0.2,2.8-0.5l-5,10c-0.2,0.5,0,1.1,0.4,1.3c0.1,0.1,0.3,0.1,0.4,0.1 c0.4,0,0.7-0.2,0.9-0.6l6.5-13C30.2,13.6,30.2,8.3,26.9,5.1z"
                  transform="scale(1.2) translate(-5,15.5) rotate(-45 0 0)"
                />
              </g>
              <g id="shadowSat" transform="scale(.9)">
                <path
                  fill="#0"
                  fillOpacity="0.3"
                  d="M26.9,5.1c-1.6-1.6-3.7-2.5-6-2.5c-2.2,0-4.2,0.8-5.8,2.3l-13,6.5c-0.5,0.2-0.7,0.8-0.4,1.3c0.2,0.4,0.5,0.6,0.9,0.6 c0.1,0,0.3,0,0.4-0.1l10-5c-0.3,0.9-0.5,1.8-0.5,2.8c0,1.9,0.6,3.7,1.8,5.2l-7.1,7.1c-0.4,0.4-0.4,1,0,1.4C7.5,24.9,7.7,25,8,25 s0.5-0.1,0.7-0.3l7-7c1.5,1.2,3.3,1.8,5.2,1.8c1,0,1.9-0.2,2.8-0.5l-5,10c-0.2,0.5,0,1.1,0.4,1.3c0.1,0.1,0.3,0.1,0.4,0.1 c0.4,0,0.7-0.2,0.9-0.6l6.5-13C30.2,13.6,30.2,8.3,26.9,5.1z"
                  transform="scale(1.2) translate(15,44) rotate(-45 0 0)"
                  filter="url(#f1)"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

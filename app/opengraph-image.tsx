import { ImageResponse } from "next/og";

export const alt =
  "Steption — XLM options on Stellar. Puts, capped calls and fixed premiums. Testnet development release.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#11130f",
          color: "#f7f7ee",
          padding: "48px 60px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 38,
              fontWeight: 700,
            }}
          >
            <svg
              width="48"
              height="42"
              viewBox="0 0 48 42"
              style={{ marginRight: 14 }}
            >
              <path
                d="M5 32L26 4M15 38L36 10M25 40L43 16"
                stroke="#fded58"
                strokeWidth="5"
              />
            </svg>
            steption<span style={{ color: "#fded58" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              border: "1px solid #606146",
              borderRadius: 30,
              padding: "12px 18px",
              fontSize: 17,
              color: "#fded58",
            }}
          >
            BUILT ON STELLAR
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", width: 680 }}>
            <div
              style={{
                display: "flex",
                fontSize: 77,
                fontWeight: 700,
                letterSpacing: -4,
                lineHeight: 1.04,
              }}
            >
              Options,
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 77,
                fontWeight: 700,
                letterSpacing: -4,
                lineHeight: 1.15,
                color: "#fded58",
              }}
            >
              on your terms.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 25,
                color: "#c2c6b8",
                marginTop: 28,
              }}
            >
              XLM puts. Capped calls. Fixed premiums.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              width: 300,
              height: 230,
              border: "1px solid #424638",
              borderRadius: 24,
              padding: 24,
              flexDirection: "column",
              background: "#1b1e17",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 20,
              }}
            >
              <span>XLM / USDC</span>
              <span style={{ color: "#fded58" }}>PUT</span>
            </div>
            <svg
              width="250"
              height="140"
              viewBox="0 0 250 140"
              style={{ marginTop: 16 }}
            >
              <path
                d="M0 35H250M0 80H250M0 125H250"
                stroke="#3d4233"
                strokeDasharray="4 6"
              />
              <path
                d="M0 20L140 115H250"
                stroke="#fded58"
                strokeWidth="5"
                fill="none"
              />
              <circle cx="140" cy="115" r="6" fill="#fded58" />
            </svg>
            <div style={{ display: "flex", fontSize: 14, color: "#b2b8a6" }}>
              Illustrative payoff
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "1px solid #3b3f32",
            paddingTop: 22,
            fontSize: 19,
            color: "#c2c6b8",
          }}
        >
          <span>steptionprotocol.com</span>
          <span>TESTNET DEVELOPMENT RELEASE</span>
        </div>
      </div>
    ),
    size,
  );
}

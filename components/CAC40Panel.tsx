"use client";

import { useEffect, useRef } from "react";

// Top CAC40 components by market cap
const CAC40_SYMBOLS = [
  { s: "EURONEXT:PX1",  d: "CAC 40"         },
  { s: "EURONEXT:MC",   d: "LVMH"           },
  { s: "EURONEXT:TTE",  d: "TotalEnergies"  },
  { s: "EURONEXT:SAN",  d: "Sanofi"         },
  { s: "EURONEXT:AI",   d: "Air Liquide"    },
  { s: "EURONEXT:BNP",  d: "BNP Paribas"    },
  { s: "EURONEXT:OR",   d: "L'Oréal"        },
  { s: "EURONEXT:SU",   d: "Schneider"      },
  { s: "EURONEXT:AIR",  d: "Airbus"         },
  { s: "EURONEXT:CS",   d: "AXA"            },
  { s: "EURONEXT:DG",   d: "Vinci"          },
  { s: "EURONEXT:RMS",  d: "Hermès"         },
];

const WIDGET_CONFIG = {
  colorTheme: "dark",
  dateRange: "1D",
  showChart: true,
  locale: "fr",
  width: "100%",
  height: "100%",
  largeChartUrl: "",
  isTransparent: true,
  showSymbolLogo: false,
  showFloatingTooltip: false,
  plotLineColorGrowing: "rgba(0, 255, 65, 1)",
  plotLineColorFalling: "rgba(255, 32, 32, 1)",
  gridLineColor: "rgba(31, 31, 31, 0)",
  scaleFontColor: "rgba(102, 102, 102, 1)",
  belowLineFillColorGrowing: "rgba(0, 255, 65, 0.08)",
  belowLineFillColorFalling: "rgba(255, 32, 32, 0.08)",
  symbolActiveColor: "rgba(0, 255, 65, 0.08)",
  tabs: [
    {
      title: "CAC 40",
      symbols: CAC40_SYMBOLS,
      originalTitle: "CAC 40",
    },
  ],
};

export default function CAC40Panel() {
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    outer.innerHTML = "";

    // TradingView's embed pattern requires:
    //   <div class="tradingview-widget-container">
    //     <div class="tradingview-widget-container__widget"></div>
    //     <script src="..." async>{ json config }</script>
    //   </div>
    // The external script reads its own inline JSON from the DOM.
    // Plain appendChild with script.innerHTML does NOT execute scripts —
    // use createContextualFragment instead, which does.
    const widgetHTML = `
      <div class="tradingview-widget-container__widget" style="width:100%;height:100%;"></div>
      <script type="text/javascript"
        src="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
        async="true">
        ${JSON.stringify(WIDGET_CONFIG)}
      </script>
    `;

    const fragment = document.createRange().createContextualFragment(widgetHTML);
    outer.appendChild(fragment);

    return () => {
      outer.innerHTML = "";
    };
  }, []);

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--border)",
        borderLeft: "1px solid var(--border)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "var(--accent-yellow)",
          }}
        >
          CAC 40
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent-green)",
              boxShadow: "0 0 4px var(--accent-green)",
            }}
          />
          <span style={{ fontSize: 9, color: "var(--accent-green)", letterSpacing: "0.1em" }}>
            EURONEXT
          </span>
        </div>
      </div>

      {/* TradingView widget mount — must have explicit class for TradingView to target */}
      <div
        ref={outerRef}
        className="tradingview-widget-container"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}

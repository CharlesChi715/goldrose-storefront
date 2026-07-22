"use client";

/**
 * ROLE OF THIS FILE
 * The sales-over-time chart, built with Shopify's own @shopify/polaris-viz
 * (§1 rule 2) so the admin's charts have Shopify's literal look.
 */

import { useEffect, useState } from "react";
import { LineChart, PolarisVizProvider } from "@shopify/polaris-viz";
import "@shopify/polaris-viz/build/esm/styles.css";

export function SalesChart({
  data,
}: {
  data: Array<{ date: string; salesCents: number }>;
}) {
  // polaris-viz touches `window` during render — client-only (§15 risk note).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div style={{ height: 220 }} />;
  }
  return (
    <PolarisVizProvider>
      <div style={{ height: 220 }}>
        <LineChart
          isAnimated={false}
          theme="Light"
          data={[
            {
              name: "Total sales",
              data: data.map((point) => ({
                key: point.date,
                value: Math.round(point.salesCents) / 100,
              })),
            },
          ]}
        />
      </div>
    </PolarisVizProvider>
  );
}

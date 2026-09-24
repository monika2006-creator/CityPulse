// Mock civic situations for Jaipur — SIMULATED DATA.
// A situation is a potentially meaningful combination of signals occurring
// in the same area/time window. Wording stays hedged (possible/potential)
// since no correlation engine exists yet — this only prepares the shape.

export const situations = [
  {
    id: "SIT-001",
    title: "Possible weather-related traffic disruption",
    severity: "attention",
    status: "active",
    area: "Tonk Road",
    detectedAt: "14:28:00",
    description:
      "Traffic speeds have decreased while rainfall intensity has increased in the same area, indicating a possible weather-related slowdown.",
    relatedSignalIds: ["SIG-001", "SIG-002"],
    impact: "Moderate traffic delay",
    confidence: 82,
  },
  {
    id: "SIT-002",
    title: "Elevated incident activity on MI Road",
    severity: "critical",
    status: "active",
    area: "MI Road",
    detectedAt: "14:15:00",
    description:
      "Reported incidents and a sharp drop in traffic speed are occurring simultaneously on MI Road, suggesting a possible congestion event.",
    relatedSignalIds: ["SIG-003", "SIG-004"],
    impact: "Significant delay risk",
    confidence: 88,
  },
  {
    id: "SIT-003",
    title: "Air quality concern near C-Scheme",
    severity: "attention",
    status: "active",
    area: "C-Scheme",
    detectedAt: "13:58:00",
    description:
      "AQI readings in C-Scheme have climbed into a range considered unhealthy for sensitive groups.",
    relatedSignalIds: ["SIG-005"],
    impact: "Advisory for sensitive groups",
    confidence: 74,
  },
  {
    id: "SIT-004",
    title: "Air quality spike in Raja Park",
    severity: "critical",
    status: "active",
    area: "Raja Park",
    detectedAt: "13:50:00",
    description:
      "AQI has spiked well above typical levels for this time of day, with no corresponding weather signal explaining the change.",
    relatedSignalIds: ["SIG-012"],
    impact: "Health advisory recommended",
    confidence: 79,
  },
];

export const getActiveSituations = () => situations.filter((s) => s.status === "active");

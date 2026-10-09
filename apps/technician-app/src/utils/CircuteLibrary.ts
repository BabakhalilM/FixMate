// apps/technician-app/src/utils/circuitLibrary.ts
// import { CircuitComponentKind } from '@/types/circuit';

import { CircuitComponentKind } from "@/navigation/circuteTypes";

export interface LibraryItem {
  kind: CircuitComponentKind;
  label: string; // display name
  icon: string; // emoji or Ionicon name
  width: number; // rendered size for hit-testing
  height: number;
  pins: Array<{ id: string; offsetX: number; offsetY: number }>;
}

export const CIRCUIT_LIBRARY: LibraryItem[] = [
  {
    kind: "resistor",
    label: "Resistor",
    icon: "⚡",
    width: 60,
    height: 20,
    pins: [
      { id: "p1", offsetX: -30, offsetY: 0 },
      { id: "p2", offsetX: 30, offsetY: 0 },
    ],
  },
  {
    kind: "capacitor",
    label: "Capacitor",
    icon: "≡",
    width: 40,
    height: 24,
    pins: [
      { id: "p1", offsetX: -20, offsetY: 0 },
      { id: "p2", offsetX: 20, offsetY: 0 },
    ],
  },
  {
    kind: "inductor",
    label: "Inductor",
    icon: "⌇",
    width: 60,
    height: 20,
    pins: [
      { id: "p1", offsetX: -30, offsetY: 0 },
      { id: "p2", offsetX: 30, offsetY: 0 },
    ],
  },
  {
    kind: "diode",
    label: "Diode",
    icon: "▶|",
    width: 40,
    height: 20,
    pins: [
      { id: "p1", offsetX: -20, offsetY: 0 },
      { id: "p2", offsetX: 20, offsetY: 0 },
    ],
  },
  {
    kind: "transistor",
    label: "Transistor",
    icon: "⎓",
    width: 40,
    height: 40,
    pins: [
      { id: "b", offsetX: -20, offsetY: 0 },
      { id: "c", offsetX: 10, offsetY: -20 },
      { id: "e", offsetX: 10, offsetY: 20 },
    ],
  },
  {
    kind: "ic",
    label: "IC",
    icon: "▭",
    width: 80,
    height: 60,
    pins: [
      { id: "p1", offsetX: -40, offsetY: -20 },
      { id: "p2", offsetX: -40, offsetY: 0 },
      { id: "p3", offsetX: -40, offsetY: 20 },
      { id: "p4", offsetX: 40, offsetY: -20 },
      { id: "p5", offsetX: 40, offsetY: 0 },
      { id: "p6", offsetX: 40, offsetY: 20 },
    ],
  },
  {
    kind: "relay",
    label: "Relay",
    icon: "⏻",
    width: 70,
    height: 50,
    pins: [
      { id: "coil1", offsetX: -35, offsetY: -15 },
      { id: "coil2", offsetX: -35, offsetY: 15 },
      { id: "no", offsetX: 35, offsetY: -15 },
      { id: "nc", offsetX: 35, offsetY: 0 },
      { id: "com", offsetX: 35, offsetY: 15 },
    ],
  },
  {
    kind: "motor",
    label: "Motor",
    icon: "Ⓜ",
    width: 60,
    height: 60,
    pins: [
      { id: "p1", offsetX: -30, offsetY: 0 },
      { id: "p2", offsetX: 30, offsetY: 0 },
    ],
  },
  // Motor winding – single coil (like the loop in a stator slot)
  {
    kind: "coil",
    label: "Coil / Winding",
    icon: "◎",
    width: 80,
    height: 40,
    pins: [
      { id: "a", offsetX: -40, offsetY: 0 }, // start
      { id: "b", offsetX: 40, offsetY: 0 }, // finish
    ],
  },
  // 3-phase motor winding (U, V, W, N + two ends)
  {
    kind: "winding_3ph",
    label: "3Φ Winding",
    icon: "⋔",
    width: 120,
    height: 80,
    pins: [
      { id: "u1", offsetX: -60, offsetY: -30 },
      { id: "u2", offsetX: -60, offsetY: 30 },
      { id: "v1", offsetX: 0, offsetY: -40 },
      { id: "v2", offsetX: 0, offsetY: 40 },
      { id: "w1", offsetX: 60, offsetY: -30 },
      { id: "w2", offsetX: 60, offsetY: 30 },
      { id: "n", offsetX: 0, offsetY: 0 },
    ],
  },
  {
    kind: "brush",
    label: "Brush",
    icon: "▮",
    width: 20,
    height: 40,
    pins: [{ id: "p1", offsetX: 0, offsetY: 20 }],
  },
  {
    kind: "commutator",
    label: "Commutator",
    icon: "▤",
    width: 40,
    height: 20,
    pins: [{ id: "p1", offsetX: 0, offsetY: -10 }],
  },
  {
    kind: "switch",
    label: "Switch",
    icon: "⌁",
    width: 50,
    height: 24,
    pins: [
      { id: "p1", offsetX: -25, offsetY: 0 },
      { id: "p2", offsetX: 25, offsetY: 0 },
    ],
  },
  {
    kind: "ground",
    label: "GND",
    icon: "⏚",
    width: 30,
    height: 30,
    pins: [{ id: "p1", offsetX: 0, offsetY: -15 }],
  },
  {
    kind: "vcc",
    label: "VCC",
    icon: "↑",
    width: 30,
    height: 30,
    pins: [{ id: "p1", offsetX: 0, offsetY: 15 }],
  },
  {
    kind: "terminal",
    label: "Terminal",
    icon: "⏺",
    width: 30,
    height: 30,
    pins: [{ id: "p1", offsetX: 0, offsetY: 0 }],
  },
];

export const getLibraryItem = (kind: CircuitComponentKind) =>
  CIRCUIT_LIBRARY.find((c) => c.kind === kind);

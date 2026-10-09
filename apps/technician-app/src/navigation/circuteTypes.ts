// apps/technician-app/src/types/circuit.ts
  export type CircuitComponentKind =
  | 'resistor' | 'capacitor' | 'inductor' | 'diode' | 'led'
  | 'transistor' | 'ic' | 'relay' | 'motor' | 'switch'
  | 'ground' | 'vcc' | 'terminal'
  // NEW:
  | 'coil'          // motor winding / inductor coil
  | 'winding_3ph'   // 3-phase motor winding (U V W + N)
  | 'brush'         // motor brush
  | 'commutator'
  | 'pencil';

export interface CircuitComponent {
  id: string;
  kind: CircuitComponentKind;
  x: number;
  y: number;
  rotation?: number;
  label?: string;
  value?: string;
  notes?: string;
  faulty?: boolean;
  pins: Array<{ id: string; offsetX: number; offsetY: number }>;
}
export interface CircuitWire {
  id: string;
  from: { componentId: string; pinId: string };
  to:   { componentId: string; pinId: string };
  color?: string;         // default #111
  label?: string;         // "5V", "SIG"
}
export interface DrawnStroke {
  id: string;
  kind: "pencil";
  points: { x: number; y: number }[];
  color: string;
  width: number;
}


export interface CircuitDiagram {
  components: CircuitComponent[];
  wires: CircuitWire[];
   strokes?: DrawnStroke[];
  viewport?: { x: number; y: number; zoom: number };
}
// apps/technician-app/src/components/circuit/CircuitDesigner.tsx
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
  GestureResponderEvent,
} from "react-native";
import Svg, {
  G,
  Line,
  Circle,
  Rect,
  Text as SvgText,
  Path,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import {
  CircuitComponent,
  CircuitWire,
  CircuitDiagram,
  CircuitComponentKind,
} from "@/navigation/circuteTypes";
import { CIRCUIT_LIBRARY, getLibraryItem } from "@/utils/CircuteLibrary";

interface Props {
  value: CircuitDiagram;
  onChange: (next: CircuitDiagram) => void;
}

const GRID = 20;
const CANVAS_W = 2000;
const CANVAS_H = 1500;

const uid = () => Math.random().toString(36).slice(2, 10);
const snap = (n: number) => Math.round(n / GRID) * GRID;

type Tool = "select" | "wire" | "pencil";

export default function CircuitDesigner({ value, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<{
    componentId: string;
    pinId: string;
  } | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [showLibrary, setShowLibrary] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState<CircuitComponent | null>(null);

  // Live pencil stroke (in canvas coords)
  const [liveStroke, setLiveStroke] = useState<{ x: number; y: number }[]>([]);

  // Live wire preview — canvas coords of the finger/mouse while
  // user is completing a wire.
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Undo / redo
  const historyRef = useRef<CircuitDiagram[]>([]);
  const futureRef = useRef<CircuitDiagram[]>([]);

  const commit = useCallback(
    (next: CircuitDiagram, record = true) => {
      if (record) {
        historyRef.current.push(value);
        if (historyRef.current.length > 50) historyRef.current.shift();
        futureRef.current = [];
      }
      onChange(next);
    },
    [onChange, value],
  );

  const undo = () => {
    const prev = historyRef.current.pop();
    if (prev) {
      futureRef.current.push(value);
      onChange(prev);
    }
  };
  const redo = () => {
    const next = futureRef.current.pop();
    if (next) {
      historyRef.current.push(value);
      onChange(next);
    }
  };

  // ── Add / delete ────────────────────────────────────────
  const addComponent = (kind: CircuitComponentKind) => {
    const lib = getLibraryItem(kind);
    if (!lib) return;

    const count = value.components.filter((c) => c.kind === kind).length + 1;
    const prefix = kind.slice(0, 1).toUpperCase();

    const comp: CircuitComponent = {
      id: uid(),
      kind,
      x: 200,
      y: 200,
      rotation: 0,
      label: `${prefix}${count}`,
      value: "",
      pins: lib.pins.map((p) => ({ ...p })),
    };
    commit({ ...value, components: [...value.components, comp] });
    setShowLibrary(false);
    setSelectedId(comp.id);
    setTool("select");
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    // Preserve strokes + viewport!
    commit({
      ...value,
      components: value.components.filter((c) => c.id !== selectedId),
      wires: value.wires.filter(
        (w) =>
          w.from.componentId !== selectedId && w.to.componentId !== selectedId,
      ),
    });
    setSelectedId(null);
  };

  // ── Wire creation ───────────────────────────────────────
  const handlePinTap = (componentId: string, pinId: string) => {
    if (pendingPin) {
      if (
        pendingPin.componentId === componentId &&
        pendingPin.pinId === pinId
      ) {
        setPendingPin(null);
        setCursorPos(null);
        return;
      }
      const wire: CircuitWire = {
        id: uid(),
        from: pendingPin,
        to: { componentId, pinId },
        color: "#111827",
      };
      commit({ ...value, wires: [...value.wires, wire] });
      setPendingPin(null);
      setCursorPos(null);
      return;
    }
    setPendingPin({ componentId, pinId });
  };

  // ── Geometry ────────────────────────────────────────────
  const pinAbs = (
    comp: CircuitComponent,
    pin: { offsetX: number; offsetY: number },
  ) => {
    const r = ((comp.rotation ?? 0) * Math.PI) / 180;
    const rx = pin.offsetX * Math.cos(r) - pin.offsetY * Math.sin(r);
    const ry = pin.offsetX * Math.sin(r) + pin.offsetY * Math.cos(r);
    return { x: comp.x + rx, y: comp.y + ry };
  };

  const wirePath = (x1: number, y1: number, x2: number, y2: number) => {
    const midX = (x1 + x2) / 2;
    return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
  };

  const pointsToPath = (pts: { x: number; y: number }[]) =>
    pts.reduce(
      (d, p, i) => d + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`),
      "",
    );

  // ── Move / rotate ───────────────────────────────────────
  const moveBy = (dx: number, dy: number) => {
    if (!selectedId) return;
    commit(
      {
        ...value,
        components: value.components.map((c) =>
          c.id === selectedId
            ? { ...c, x: snap(c.x + dx), y: snap(c.y + dy) }
            : c,
        ),
      },
      false,
    );
  };

  const rotateSelected = () => {
    if (!selectedId) return;
    commit({
      ...value,
      components: value.components.map((c) =>
        c.id === selectedId
          ? { ...c, rotation: ((c.rotation ?? 0) + 90) % 360 }
          : c,
      ),
    });
  };

  // ── Pencil stroke helpers ───────────────────────────────
  const onPencilGrant = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    setLiveStroke([{ x: locationX, y: locationY }]);
  };
  const onPencilMove = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    setLiveStroke((s) => [...s, { x: locationX, y: locationY }]);
  };
  const onPencilRelease = () => {
    if (liveStroke.length > 1) {
      commit({
        ...value,
        strokes: [
          ...(value.strokes ?? []),
          {
            id: uid(),
            kind: "pencil",
            points: liveStroke,
            color: "#111827",
            width: 2,
          },
        ],
      });
    }
    setLiveStroke([]);
  };

  const clearStrokes = () => {
    if (!value.strokes?.length) return;
    commit({ ...value, strokes: [] });
  };

  // Erase single stroke: find a stroke whose nearest point to tap is < 12px
  const eraseStrokeAt = (x: number, y: number) => {
    const strokes = value.strokes ?? [];
    if (!strokes.length) return false;
    let bestIdx = -1;
    let bestDist = 12; // threshold in canvas units
    strokes.forEach((s, i) => {
      s.points.forEach((p) => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
    });
    if (bestIdx === -1) return false;
    const next = strokes.filter((_, i) => i !== bestIdx);
    commit({ ...value, strokes: next });
    return true;
  };

  // ── Renderers ───────────────────────────────────────────
  const renderComponent = (comp: CircuitComponent) => {
    const lib = getLibraryItem(comp.kind);
    if (!lib) return null;
    const isSel = selectedId === comp.id;
    const strokeColor = comp.faulty
      ? "#DC2626"
      : isSel
      ? "#4F46E5"
      : "#111827";
    const strokeWidth = isSel ? 2.5 : 1.5;

    return (
      <G
        key={comp.id}
        transform={`translate(${comp.x} ${comp.y}) rotate(${
          comp.rotation ?? 0
        })`}
      >
        <BodyForKind
          kind={comp.kind}
          width={lib.width}
          height={lib.height}
          color={strokeColor}
          sw={strokeWidth}
        />

        {comp.label ? (
          <SvgText
            x={0}
            y={-lib.height / 2 - 6}
            fontSize={11}
            fill="#4F46E5"
            textAnchor="middle"
            fontWeight="bold"
          >
            {comp.label}
          </SvgText>
        ) : null}

        {comp.value ? (
          <SvgText
            x={0}
            y={lib.height / 2 + 14}
            fontSize={10}
            fill="#6B7280"
            textAnchor="middle"
          >
            {comp.value}
          </SvgText>
        ) : null}

        {isSel ? (
          <Rect
            x={-lib.width / 2 - 6}
            y={-lib.height / 2 - 6}
            width={lib.width + 12}
            height={lib.height + 12}
            rx={6}
            fill="none"
            stroke="#4F46E5"
            strokeDasharray="4 3"
            strokeWidth={1}
          />
        ) : null}

        {/* Visual pins only — hit areas live in the overlay */}
        {comp.pins.map((pin) => {
          const isPending =
            pendingPin?.componentId === comp.id && pendingPin.pinId === pin.id;
          return (
            <Circle
              key={pin.id}
              cx={pin.offsetX}
              cy={pin.offsetY}
              r={isPending ? 7 : 5}
              fill={isPending ? "#7C3AED" : "#FFFFFF"}
              stroke={isPending ? "#7C3AED" : "#111827"}
              strokeWidth={2}
            />
          );
        })}
      </G>
    );
  };

  const renderWire = (wire: CircuitWire) => {
    const fromComp = value.components.find(
      (c) => c.id === wire.from.componentId,
    );
    const toComp = value.components.find((c) => c.id === wire.to.componentId);
    if (!fromComp || !toComp) return null;
    const fromPin = fromComp.pins.find((p) => p.id === wire.from.pinId);
    const toPin = toComp.pins.find((p) => p.id === wire.to.pinId);
    if (!fromPin || !toPin) return null;

    const a = pinAbs(fromComp, fromPin);
    const b = pinAbs(toComp, toPin);

    return (
      <Path
        key={wire.id}
        d={wirePath(a.x, a.y, b.x, b.y)}
        stroke={wire.color ?? "#111827"}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    );
  };

  // Live wire preview from pending pin to current cursor
  const renderWirePreview = () => {
    if (!pendingPin || !cursorPos) return null;
    const comp = value.components.find(
      (c) => c.id === pendingPin.componentId,
    );
    if (!comp) return null;
    const pin = comp.pins.find((p) => p.id === pendingPin.pinId);
    if (!pin) return null;
    const a = pinAbs(comp, pin);
    return (
      <Path
        d={wirePath(a.x, a.y, cursorPos.x, cursorPos.y)}
        stroke="#7C3AED"
        strokeWidth={2}
        strokeDasharray="5 4"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    );
  };

  // ── Edit modal ──────────────────────────────────────────
  const openEdit = () => {
    const comp = value.components.find((c) => c.id === selectedId);
    if (comp) {
      setEditing({ ...comp });
      setShowEditModal(true);
    }
  };

  const saveEdit = () => {
    if (!editing) return;
    commit({
      ...value,
      components: value.components.map((c) =>
        c.id === editing.id ? editing : c,
      ),
    });
    setShowEditModal(false);
    setEditing(null);
  };

  // Detect whether a tap on empty canvas should erase a stroke
  // (only in select mode, and only if a stroke is nearby).
  const handleCanvasBackgroundTap = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    // Only erase if user tapped near an existing stroke AND nothing is selected
    if (tool === "select" && !pendingPin) {
      const erased = eraseStrokeAt(locationX, locationY);
      if (erased) return;
      setSelectedId(null);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Toolbar ─────────────────────────────────── */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolBtn}
          onPress={() => setShowLibrary(true)}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.toolBtnText}>Add</Text>
        </TouchableOpacity>

        <ToolChip
          active={tool === "select"}
          icon="hand-left-outline"
          label="Select"
          onPress={() => {
            setTool("select");
            setPendingPin(null);
            setCursorPos(null);
          }}
        />
        <ToolChip
          active={tool === "wire"}
          icon="git-network-outline"
          label="Wire"
          onPress={() => {
            setTool("wire");
            setLiveStroke([]);
          }}
        />
        <ToolChip
          active={tool === "pencil"}
          icon="pencil-outline"
          label="Draw"
          onPress={() => {
            setTool("pencil");
            setSelectedId(null);
            setPendingPin(null);
            setCursorPos(null);
          }}
        />

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[styles.toolBtn, styles.toolBtnGhost]}
          onPress={openEdit}
          disabled={!selectedId}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={selectedId ? "#4F46E5" : "#9CA3AF"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, styles.toolBtnGhost]}
          onPress={rotateSelected}
          disabled={!selectedId}
        >
          <Ionicons
            name="refresh-outline"
            size={18}
            color={selectedId ? "#4F46E5" : "#9CA3AF"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, styles.toolBtnGhost]}
          onPress={deleteSelected}
          disabled={!selectedId}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={selectedId ? "#DC2626" : "#9CA3AF"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, styles.toolBtnGhost]}
          onPress={clearStrokes}
          disabled={!value.strokes?.length}
        >
          <Ionicons
            name="brush-outline"
            size={18}
            color={value.strokes?.length ? "#DC2626" : "#9CA3AF"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, styles.toolBtnGhost]}
          onPress={undo}
        >
          <Ionicons name="arrow-undo-outline" size={18} color="#4F46E5" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, styles.toolBtnGhost]}
          onPress={redo}
        >
          <Ionicons name="arrow-redo-outline" size={18} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* ── Hint bar ────────────────────────────────── */}
      {pendingPin ? (
        <View style={styles.hintBar}>
          <Ionicons name="git-network-outline" size={14} color="#7C3AED" />
          <Text style={styles.hintText}>
            Tap another pin to complete the wire
          </Text>
          <TouchableOpacity
            onPress={() => {
              setPendingPin(null);
              setCursorPos(null);
            }}
          >
            <Text style={styles.hintCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Canvas ──────────────────────────────────── */}
      <ScrollView
        horizontal
        style={styles.canvasScroll}
        contentContainerStyle={{ width: CANVAS_W, height: CANVAS_H }}
        scrollEnabled={tool === "select"}
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView
          contentContainerStyle={{ width: CANVAS_W, height: CANVAS_H }}
          scrollEnabled={tool === "select"}
          keyboardShouldPersistTaps="handled"
        >
          <Svg width={CANVAS_W} height={CANVAS_H}>
            <GridBackground />

            {/* Wires under components */}
            {value.wires.map(renderWire)}
            {renderWirePreview()}

            {/* Saved pencil strokes — under components */}
            {(value.strokes ?? []).map((s) => (
              <Path
                key={s.id}
                d={pointsToPath(s.points)}
                stroke={s.color}
                strokeWidth={s.width}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {/* Live pencil preview */}
            {liveStroke.length > 1 && (
              <Path
                d={pointsToPath(liveStroke)}
                stroke="#7C3AED"
                strokeWidth={2}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {value.components.map(renderComponent)}
          </Svg>

          {/* ── Pencil capture overlay ─────────────────── */}
          {tool === "pencil" && (
            <View
              style={[StyleSheet.absoluteFill, { pointerEvents: "auto" }]}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={onPencilGrant}
              onResponderMove={onPencilMove}
              onResponderRelease={onPencilRelease}
              onResponderTerminate={() => setLiveStroke([])}
            />
          )}

          {/* ── Wire preview cursor tracker ─────────────
              When a pin is pending, this transparent overlay
              tracks finger position to draw the dashed wire. */}
          {pendingPin && tool !== "pencil" && (
            <View
              style={[StyleSheet.absoluteFill, { pointerEvents: "auto" }]}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) =>
                setCursorPos({
                  x: e.nativeEvent.locationX,
                  y: e.nativeEvent.locationY,
                })
              }
              onResponderMove={(e) =>
                setCursorPos({
                  x: e.nativeEvent.locationX,
                  y: e.nativeEvent.locationY,
                })
              }
            />
          )}

          {/* ── Selection / pin overlay (always active
              except in pencil mode) ──────────────────── */}
          {tool !== "pencil" && (
            <View
              style={[StyleSheet.absoluteFill, { pointerEvents: "box-none" }]}
              onStartShouldSetResponder={() => true}
              onResponderRelease={handleCanvasBackgroundTap}
            >
              {value.components.map((comp) => {
                const lib = getLibraryItem(comp.kind);
                if (!lib) return null;
                return (
                  <React.Fragment key={comp.id}>
                    {/* Body tap → select */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        if (tool === "select") setSelectedId(comp.id);
                      }}
                      style={{
                        position: "absolute",
                        left: comp.x - lib.width / 2,
                        top: comp.y - lib.height / 2,
                        width: lib.width,
                        height: lib.height,
                      }}
                    />

                    {/* Pin hit areas — always tappable so wiring
                        works the moment user taps a pin */}
                    {comp.pins.map((pin) => {
                      const abs = pinAbs(comp, pin);
                      return (
                        <TouchableOpacity
                          key={pin.id}
                          onPress={() => handlePinTap(comp.id, pin.id)}
                          style={{
                            position: "absolute",
                            left: abs.x - 14,
                            top: abs.y - 14,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                          }}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </ScrollView>
      </ScrollView>

      {/* ── Nudge pad ────────────────────────────────── */}
      {selectedId && tool === "select" ? (
        <View style={styles.nudgePad}>
          <TouchableOpacity
            style={styles.nudgeBtn}
            onPress={() => moveBy(0, -GRID)}
          >
            <Ionicons name="chevron-up" size={20} color="#4F46E5" />
          </TouchableOpacity>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={styles.nudgeBtn}
              onPress={() => moveBy(-GRID, 0)}
            >
              <Ionicons name="chevron-back" size={20} color="#4F46E5" />
            </TouchableOpacity>
            <View style={[styles.nudgeBtn, { opacity: 0.4 }]}>
              <Ionicons name="move-outline" size={20} color="#4F46E5" />
            </View>
            <TouchableOpacity
              style={styles.nudgeBtn}
              onPress={() => moveBy(GRID, 0)}
            >
              <Ionicons name="chevron-forward" size={20} color="#4F46E5" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.nudgeBtn}
            onPress={() => moveBy(0, GRID)}
          >
            <Ionicons name="chevron-down" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Component library modal ─────────────────── */}
      <Modal
        visible={showLibrary}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLibrary(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.librarySheet}>
            <View style={styles.libraryHeader}>
              <Text style={styles.libraryTitle}>Component Library</Text>
              <TouchableOpacity onPress={() => setShowLibrary(false)}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.libraryGrid}>
                {CIRCUIT_LIBRARY.map((item) => (
                  <TouchableOpacity
                    key={item.kind}
                    style={styles.libraryCard}
                    onPress={() => addComponent(item.kind)}
                  >
                    <Text style={styles.libraryIcon}>{item.icon}</Text>
                    <Text style={styles.libraryLabel}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Edit component modal ────────────────────── */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Edit Component</Text>

            <Text style={styles.editLabel}>Label</Text>
            <TextInput
              style={styles.editInput}
              value={editing?.label ?? ""}
              onChangeText={(t) =>
                setEditing((e) => (e ? { ...e, label: t } : e))
              }
              placeholder="e.g., R1"
            />

            <Text style={styles.editLabel}>Value</Text>
            <TextInput
              style={styles.editInput}
              value={editing?.value ?? ""}
              onChangeText={(t) =>
                setEditing((e) => (e ? { ...e, value: t } : e))
              }
              placeholder="e.g., 10kΩ"
            />

            <Text style={styles.editLabel}>Notes</Text>
            <TextInput
              style={[styles.editInput, { minHeight: 70 }]}
              multiline
              value={editing?.notes ?? ""}
              onChangeText={(t) =>
                setEditing((e) => (e ? { ...e, notes: t } : e))
              }
              placeholder="Diagnostic notes"
            />

            <TouchableOpacity
              style={styles.faultyRow}
              onPress={() =>
                setEditing((e) => (e ? { ...e, faulty: !e.faulty } : e))
              }
            >
              <Ionicons
                name={editing?.faulty ? "checkbox" : "square-outline"}
                size={20}
                color={editing?.faulty ? "#DC2626" : "#6B7280"}
              />
              <Text
                style={[
                  styles.faultyLabel,
                  editing?.faulty && { color: "#DC2626" },
                ]}
              >
                Mark as faulty (highlight red)
              </Text>
            </TouchableOpacity>

            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editBtn, styles.editBtnGhost]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.editBtnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, styles.editBtnPrimary]}
                onPress={saveEdit}
              >
                <Text style={styles.editBtnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Toolbar chip ──────────────────────────────────────────
function ToolChip({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.toolChip, active && { backgroundColor: "#4F46E5" }]}
    >
      <Ionicons name={icon} size={16} color={active ? "#fff" : "#4F46E5"} />
      <Text style={[styles.toolChipText, active && { color: "#fff" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Grid background ───────────────────────────────────────
function GridBackground() {
  const lines = [];
  for (let x = 0; x <= CANVAS_W; x += GRID * 2) {
    lines.push(
      <Line
        key={`vx${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={CANVAS_H}
        stroke="#E5E7EB"
        strokeWidth={x % (GRID * 10) === 0 ? 1 : 0.3}
      />,
    );
  }
  for (let y = 0; y <= CANVAS_H; y += GRID * 2) {
    lines.push(
      <Line
        key={`hy${y}`}
        x1={0}
        y1={y}
        x2={CANVAS_W}
        y2={y}
        stroke="#E5E7EB"
        strokeWidth={y % (GRID * 10) === 0 ? 1 : 0.3}
      />,
    );
  }
  return <G>{lines}</G>;
}

// ── Body shape per component kind ─────────────────────────
function BodyForKind({
  kind,
  width,
  height,
  color,
  sw,
}: {
  kind: CircuitComponentKind;
  width: number;
  height: number;
  color: string;
  sw: number;
}) {
  const halfW = width / 2;
  const halfH = height / 2;

  switch (kind) {
    case "resistor":
      return (
        <Path
          d={`M ${-halfW} 0 L ${-halfW + 10} 0 L ${-halfW + 14} -8 L ${
            -halfW + 20
          } 8 L ${-halfW + 26} -8 L ${-halfW + 32} 8 L ${
            -halfW + 38
          } 0 L ${halfW} 0`}
          stroke={color}
          strokeWidth={sw}
          fill="none"
        />
      );
    case "capacitor":
      return (
        <G>
          <Line x1={-halfW} y1={0} x2={-4} y2={0} stroke={color} strokeWidth={sw} />
          <Line x1={-4} y1={-halfH} x2={-4} y2={halfH} stroke={color} strokeWidth={sw} />
          <Line x1={4} y1={-halfH} x2={4} y2={halfH} stroke={color} strokeWidth={sw} />
          <Line x1={4} y1={0} x2={halfW} y2={0} stroke={color} strokeWidth={sw} />
        </G>
      );
    case "inductor":
      return (
        <Path
          d={`M ${-halfW} 0 q 6 -12 12 0 q 6 -12 12 0 q 6 -12 12 0 q 6 -12 12 0`}
          stroke={color}
          strokeWidth={sw}
          fill="none"
        />
      );
    case "diode":
      return (
        <G>
          <Line x1={-halfW} y1={0} x2={-8} y2={0} stroke={color} strokeWidth={sw} />
          <Path d={`M -8 -8 L -8 8 L 8 0 Z`} fill={color} />
          <Line x1={8} y1={-8} x2={8} y2={8} stroke={color} strokeWidth={sw} />
          <Line x1={8} y1={0} x2={halfW} y2={0} stroke={color} strokeWidth={sw} />
        </G>
      );
    case "transistor":
      return (
        <G>
          <Circle cx={0} cy={0} r={Math.min(halfW, halfH)} stroke={color} strokeWidth={sw} fill="none" />
          <Line x1={-halfW} y1={0} x2={-6} y2={0} stroke={color} strokeWidth={sw} />
          <Line x1={-6} y1={-8} x2={-6} y2={8} stroke={color} strokeWidth={sw} />
          <Line x1={-6} y1={-4} x2={10} y2={-halfH + 5} stroke={color} strokeWidth={sw} />
          <Line x1={-6} y1={4} x2={10} y2={halfH - 5} stroke={color} strokeWidth={sw} />
        </G>
      );
    case "coil":
      return (
        <G>
          <Line x1={-halfW} y1={0} x2={-halfW + 10} y2={0} stroke={color} strokeWidth={sw} />
          <Path
            d={`M ${-halfW + 10} 0
                a 8 12 0 1 1 16 0
                a 8 12 0 1 1 16 0
                a 8 12 0 1 1 16 0`}
            stroke={color}
            strokeWidth={sw}
            fill="none"
          />
          <Line x1={halfW - 10} y1={0} x2={halfW} y2={0} stroke={color} strokeWidth={sw} />
        </G>
      );
    case "winding_3ph":
      return (
        <G>
          <Rect x={-halfW} y={-halfH} width={width} height={height} rx={6} stroke={color} strokeWidth={sw} fill="none" />
          <SvgText x={0} y={4} fontSize={12} fill={color} textAnchor="middle" fontWeight="bold">
            3Φ
          </SvgText>
          {["U", "V", "W"].map((p, i) => (
            <SvgText
              key={p}
              x={-halfW + 12 + i * 40}
              y={-halfH + 12}
              fontSize={9}
              fill={color}
              textAnchor="middle"
            >
              {p}
            </SvgText>
          ))}
        </G>
      );
    case "brush":
      return (
        <Rect
          x={-halfW}
          y={-halfH}
          width={width}
          height={height}
          rx={3}
          stroke={color}
          strokeWidth={sw}
          fill={color}
          fillOpacity={0.15}
        />
      );
    case "commutator":
      return (
        <G>
          <Rect x={-halfW} y={-halfH} width={width} height={height} rx={3} stroke={color} strokeWidth={sw} fill="none" />
          {[-12, -4, 4, 12].map((x) => (
            <Line key={x} x1={x} y1={-halfH} x2={x} y2={halfH} stroke={color} strokeWidth={sw} />
          ))}
        </G>
      );
    case "ic":
      return (
        <G>
          <Rect x={-halfW} y={-halfH} width={width} height={height} rx={4} stroke={color} strokeWidth={sw} fill="none" />
          <Circle cx={-halfW + 8} cy={-halfH + 8} r={3} fill={color} />
        </G>
      );
    case "relay":
      return (
        <G>
          <Rect x={-halfW} y={-halfH} width={width} height={height} rx={4} stroke={color} strokeWidth={sw} fill="none" />
          <Path d={`M -15 -10 q 15 20 0 20`} stroke={color} strokeWidth={sw} fill="none" />
        </G>
      );
    case "motor":
      return (
        <G>
          <Circle cx={0} cy={0} r={Math.min(halfW, halfH)} stroke={color} strokeWidth={sw} fill="none" />
          <SvgText x={0} y={4} fontSize={14} textAnchor="middle" fill={color} fontWeight="bold">
            M
          </SvgText>
        </G>
      );
    case "switch":
      return (
        <G>
          <Line x1={-halfW} y1={0} x2={-8} y2={0} stroke={color} strokeWidth={sw} />
          <Line x1={-8} y1={0} x2={8} y2={-8} stroke={color} strokeWidth={sw} />
          <Circle cx={-8} cy={0} r={2} fill={color} />
          <Circle cx={8} cy={0} r={2} fill={color} />
          <Line x1={8} y1={0} x2={halfW} y2={0} stroke={color} strokeWidth={sw} />
        </G>
      );
    case "ground":
      return (
        <G>
          <Line x1={0} y1={-halfH} x2={0} y2={4} stroke={color} strokeWidth={sw} />
          <Line x1={-12} y1={4} x2={12} y2={4} stroke={color} strokeWidth={sw} />
          <Line x1={-8} y1={10} x2={8} y2={10} stroke={color} strokeWidth={sw} />
          <Line x1={-4} y1={16} x2={4} y2={16} stroke={color} strokeWidth={sw} />
        </G>
      );
    case "vcc":
      return (
        <G>
          <Line x1={0} y1={halfH} x2={0} y2={-4} stroke={color} strokeWidth={sw} />
          <Path d={`M -8 -4 L 8 -4 L 0 -14 Z`} fill={color} />
        </G>
      );
    case "terminal":
      return <Circle cx={0} cy={0} r={6} fill={color} />;
    default:
      return (
        <Rect x={-halfW} y={-halfH} width={width} height={height} rx={4} stroke={color} strokeWidth={sw} fill="none" />
      );
  }
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 480,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 6,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexWrap: "wrap",
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toolBtnGhost: { backgroundColor: "#EEF2FF", paddingHorizontal: 10 },
  toolBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  toolChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
  },
  toolChipText: { fontSize: 12, fontWeight: "600", color: "#4F46E5" },
  hintBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hintText: { flex: 1, color: "#5B21B6", fontSize: 12 },
  hintCancel: { color: "#7C3AED", fontWeight: "600", fontSize: 12 },
  canvasScroll: { flex: 1, backgroundColor: "#fff" },
  nudgePad: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  nudgeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  librarySheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    padding: 16,
  },
  libraryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  libraryTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  libraryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 20,
  },
  libraryCard: {
    width: "31%",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
  },
  libraryIcon: { fontSize: 26 },
  libraryLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  editCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  editLabel: { fontSize: 12, color: "#6B7280", marginTop: 8, marginBottom: 4 },
  editInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
  },
  faultyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  faultyLabel: { fontSize: 13, color: "#6B7280" },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 20,
  },
  editBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  editBtnGhost: { backgroundColor: "#F1F5F9" },
  editBtnPrimary: { backgroundColor: "#4F46E5" },
  editBtnGhostText: { color: "#111827", fontWeight: "600" },
  editBtnPrimaryText: { color: "#fff", fontWeight: "600" },
});
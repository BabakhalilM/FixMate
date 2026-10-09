// apps/technician-app/src/components/auth/OtpInput.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  Pressable,
  Text,
} from "react-native";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  autoFocus?: boolean;
  editable?: boolean;
  hasError?: boolean;
  onComplete?: (code: string) => void;
}

const BOX_SIZE = 48; // fixed size → consistent on all screens
const GAP = 8;

export default function OtpInput({
  length = 6,
  value,
  onChange,
  autoFocus = false,
  editable = true,
  hasError = false,
  onComplete,
}: OtpInputProps) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Split value into digits
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputs.current[0]?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  // Auto-fire onComplete when full
  useEffect(() => {
    if (value.length === length && onComplete) onComplete(value);
  }, [value, length, onComplete]);

  const setDigit = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setDigit(index, "");
      return;
    }

    // Paste support: user pastes "123456" into any box
    if (cleaned.length > 1) {
      const spread = cleaned.slice(0, length).split("");
      const merged = [...digits];
      for (let i = 0; i < spread.length && index + i < length; i++) {
        merged[index + i] = spread[i];
      }
      onChange(merged.join("").slice(0, length));
      const lastIdx = Math.min(index + spread.length, length - 1);
      inputs.current[lastIdx]?.focus();
      return;
    }

    setDigit(index, cleaned);
    // Auto-advance
    if (index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        // Move back and clear previous
        setDigit(index - 1, "");
        inputs.current[index - 1]?.focus();
      }
    }
  };

  // Tap on the row → focus first empty box (or last box if full)
  const handleRowPress = () => {
    if (!editable) return;
    const firstEmpty = digits.findIndex((d) => !d);
    const target = firstEmpty === -1 ? length - 1 : firstEmpty;
    inputs.current[target]?.focus();
  };

  return (
    <Pressable onPress={handleRowPress} style={styles.row}>
      {digits.map((digit, i) => {
        const isFocused = focusedIndex === i;
        const isFilled = !!digit;
        return (
          <View
            key={i}
            style={[
              styles.box,
              isFocused && styles.boxFocused,
              isFilled && !hasError && styles.boxFilled,
              hasError && styles.boxError,
            ]}
          >
            <TextInput
              ref={(r) => {
                inputs.current[i] = r;
              }}
              value={digit}
              onChangeText={(v) => handleChange(i, v)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(i, nativeEvent.key)
              }
              onFocus={() => setFocusedIndex(i)}
              onBlur={() =>
                setFocusedIndex((cur) => (cur === i ? null : cur))
              }
              keyboardType="number-pad"
              // maxLength must be > 1 to allow paste; we slice in code
              maxLength={Platform.OS === "ios" ? 1 : length}
              textContentType="oneTimeCode"     // iOS SMS autofill
              autoComplete="sms-otp"            // Android SMS autofill
              editable={editable}
              selectTextOnFocus
              caretHidden={isFilled}
              style={styles.input}
              selectionColor="#4F46E5"
            />
            {/* Show a caret-like marker when focused & empty */}
            {isFocused && !digit ? (
              <View pointerEvents="none" style={styles.caret} />
            ) : null}
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: GAP,
    marginVertical: 8,
    flexWrap: "nowrap",
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE + 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  boxFocused: {
    borderColor: "#4F46E5",
    backgroundColor: "#FFFFFF",
    shadowColor: "#4F46E5",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  boxFilled: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  boxError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  input: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    padding: 0,
    ...Platform.select({
      // Nudge text up slightly on Android where padding differs
      android: { paddingBottom: 2 },
      default: {},
    }),
  },
  caret: {
    position: "absolute",
    width: 2,
    height: 24,
    backgroundColor: "#4F46E5",
    borderRadius: 1,
  },
});
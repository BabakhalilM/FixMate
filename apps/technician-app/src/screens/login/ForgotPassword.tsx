// apps/technician-app/src/screens/auth/ForgotPasswordScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import OtpInput from "./OTPInputs";

type Channel = "email" | "mobile";
type Step = "input" | "otp" | "password" | "done";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { sendOTP, verifyOTP, changePassword } = useAuth();

  const [channel, setChannel] = useState<Channel>("email");
  const [step, setStep] = useState<Step>("input");

  // Email step
  const [email, setEmail] = useState("");

  // OTP step
  const [otp, setOtp] = useState("");
  //   const otpRefs = useRef<Array<TextInput | null>>([]);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  // Reset token from backend after OTP verification
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Password step
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Resend countdown ────────────────────────────────────
  useEffect(() => {
    if (step !== "otp") return;
    setResendIn(RESEND_SECONDS);
    const t = setInterval(() => {
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  const validateEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  // ── Password strength ───────────────────────────────────
  const pwdChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const pwdScore = Object.values(pwdChecks).filter(Boolean).length;
  const pwdStrong = pwdScore >= 4;

  const strengthLabel =
    pwdScore <= 1
      ? "Weak"
      : pwdScore <= 3
        ? "Fair"
        : pwdScore === 4
          ? "Good"
          : "Strong";

  const strengthColor =
    pwdScore <= 1
      ? "#DC2626"
      : pwdScore <= 3
        ? "#F59E0B"
        : pwdScore === 4
          ? "#10B981"
          : "#059669";

  // ── STEP 1: send OTP ────────────────────────────────────
  const handleSendOtp = async () => {
    setError(null);

    if (channel === "mobile") {
      Alert.alert(
        "Coming soon",
        "Password recovery via mobile OTP is not available yet. Please use email recovery.",
        [{ text: "OK" }],
      );
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await sendOTP(email.trim().toLowerCase());
      setOtp("");
      setStep("otp");
      // setTimeout(() => otpRefs.current[0]?.focus(), 250);
    } catch (e: any) {
      setError(e?.message ?? "Could not send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: OTP input handling ──────────────────────────
  //   const handleOtpChange = (index: number, value: string) => {
  //     const digits = value.replace(/\D/g, "");
  //     if (!digits) {
  //       const next = [...otp];
  //       next[index] = "";
  //       setOtp(next);
  //       return;
  //     }

  //     const next = [...otp];
  //     for (let i = 0; i < digits.length && index + i < OTP_LENGTH; i++) {
  //       next[index + i] = digits[i];
  //     }
  //     setOtp(next);

  //     const lastFilled = Math.min(index + digits.length, OTP_LENGTH - 1);
  //     otpRefs.current[lastFilled]?.focus();
  //   };

  //   const handleOtpKeyPress = (index: number, key: string) => {
  //     if (key === "Backspace" && !otp[index] && index > 0) {
  //       const next = [...otp];
  //       next[index - 1] = "";
  //       setOtp(next);
  //       otpRefs.current[index - 1]?.focus();
  //     }
  //   };

  //   const otpCode = otp.join("");
  //   const otpComplete = otpCode.length === OTP_LENGTH && !otp.includes("");
  const otpComplete = otp.length === OTP_LENGTH;
  const otpCode = otp;
  const handleVerifyOtpWithCode = async (code: string) => {
  setError(null);
  if (code.length !== OTP_LENGTH) {
    setError("Please enter the full 6-digit code.");
    return;
  }

  setLoading(true);
  try {
    const data = await verifyOTP(email.trim().toLowerCase(), code);
    const response = data as
      | { token?: string; resetToken?: string }
      | null
      | undefined;
    const token = response?.token ?? response?.resetToken;
    if (!token) {
      throw new Error("Reset token missing from server response.");
    }
    setResetToken(token);
    setStep("password");
  } catch (e: any) {
    setError(e?.message ?? "Invalid or expired code. Please try again.");
    setOtp("");
  } finally {
    setLoading(false);
  }
};

// Button handler just delegates
const handleVerifyOtp = () => handleVerifyOtpWithCode(otpCode);
  const handleVerifyOtp1 = async () => {
    setError(null);
    if (!otpComplete) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOTP(email.trim().toLowerCase(), otpCode);
      // Backend returns { message, token } — token is our reset token
      const response = data as
        | { token?: string; resetToken?: string }
        | null
        | undefined;
      const token = response?.token ?? response?.resetToken;
      if (!token) {
        throw new Error("Reset token missing from server response.");
      }
      setResetToken(token);
      setStep("password");
    } catch (e: any) {
      setError(e?.message ?? "Invalid or expired code. Please try again.");
      setOtp("");
      //   otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendIn > 0) return;
    setError(null);
    setLoading(true);
    try {
      await sendOTP(email.trim().toLowerCase());
      setOtp("");
      setResendIn(RESEND_SECONDS);
      //   otpRefs.current[0]?.focus();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not resend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: set new password ────────────────────────────
  const handleResetPassword = async () => {
    setError(null);

    if (!pwdStrong) {
      setError("Please choose a stronger password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!resetToken) {
      setError("Session expired. Please restart the process.");
      setStep("input");
      return;
    }

    setLoading(true);
    try {
      await changePassword(resetToken, password);
      setStep("done");
    } catch (e: any) {
      setError(e?.message ?? "Could not change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Back button handler ─────────────────────────────────
  const goBack = () => {
    setError(null);
    if (step === "otp") return setStep("input");
    if (step === "password") return setStep("otp");
    if (step === "done") return navigation.navigate("Login");
    navigation.goBack();
  };

  // ── Render helpers ──────────────────────────────────────
  const stepIcon =
    step === "done"
      ? "checkmark-circle-outline"
      : step === "password"
        ? "key-outline"
        : step === "otp"
          ? "shield-checkmark-outline"
          : channel === "email"
            ? "mail-outline"
            : "call-outline";

  const stepIconColor = step === "done" ? "#16A34A" : "#4F46E5";

  const title =
    step === "done"
      ? "Password reset!"
      : step === "password"
        ? "Set new password"
        : step === "otp"
          ? "Enter verification code"
          : "Forgot Password?";

  const subtitle =
    step === "done"
      ? "Your password has been changed. You can now sign in with your new password."
      : step === "password"
        ? "Choose a strong password you haven't used before."
        : step === "otp"
          ? `We sent a 6-digit code to ${email}. It expires in 10 minutes.`
          : "Choose how you'd like to recover your account. We'll send a one-time code.";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name={stepIcon as any} size={34} color={stepIconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* ── STEP 1: Email / Mobile input ───────────── */}
          {step === "input" && (
            <>
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, channel === "email" && styles.tabActive]}
                  onPress={() => {
                    setChannel("email");
                    setError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={channel === "email" ? "#fff" : "#4F46E5"}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      channel === "email" && styles.tabTextActive,
                    ]}
                  >
                    Email
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, channel === "mobile" && styles.tabActive]}
                  onPress={() => {
                    setChannel("mobile");
                    setError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={channel === "mobile" ? "#fff" : "#4F46E5"}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      channel === "mobile" && styles.tabTextActive,
                    ]}
                  >
                    Mobile
                  </Text>
                </TouchableOpacity>
              </View>

              {channel === "email" ? (
                <>
                  <Text style={styles.label}>Email address</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      error ? styles.inputWrapError : null,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color="#6B7280"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        if (error) setError(null);
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                      returnKeyType="send"
                      onSubmitEditing={handleSendOtp}
                    />
                  </View>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                    onPress={handleSendOtp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Send code</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.notAvailable}>
                  <Ionicons name="time-outline" size={20} color="#B45309" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notAvailableTitle}>
                      Mobile OTP recovery — coming soon
                    </Text>
                    <Text style={styles.notAvailableText}>
                      We're working on SMS verification. For now, please use{" "}
                      <Text style={styles.notAvailableLink}>Email</Text>{" "}
                      recovery.
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}

          {/* ── STEP 2: OTP input ──────────────────────── */}
          {step === "otp" && (
            <>
              <OtpInput
                length={OTP_LENGTH}
                value={otp}
                onChange={(code) => {
                  setOtp(code);
                  if (error) setError(null);
                }}
                onComplete={(code) => {
                  // Auto-verify when the last digit is entered
                  // (comment this out if you'd rather force a button tap)
                  if (!loading) handleVerifyOtpWithCode(code);
                }}
                autoFocus
                editable={!loading}
                hasError={!!error}
              />

              {error ? (
                <Text style={[styles.errorText, { textAlign: "center" }]}>
                  {error}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (loading || !otpComplete) && { opacity: 0.6 },
                ]}
                onPress={handleVerifyOtp}
                disabled={loading || !otpComplete}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify code</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.footerText}>Didn't receive the code? </Text>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resendIn > 0 || loading}
                >
                  <Text
                    style={[
                      styles.forgotText,
                      (resendIn > 0 || loading) && { color: "#9CA3AF" },
                    ]}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setStep("input");
                  setError(null);
                }}
                style={{ marginTop: 12, alignSelf: "center" }}
              >
                <Text style={styles.forgotText}>Change email</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP 3: New password ───────────────────── */}
          {step === "password" && (
            <>
              <Text style={styles.label}>New password</Text>
              <View
                style={[styles.inputWrap, error ? styles.inputWrapError : null]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error) setError(null);
                  }}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPwd((v) => !v)}>
                  <Ionicons
                    name={showPwd ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBars}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              i < pwdScore ? strengthColor : "#E5E7EB",
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[styles.strengthLabel, { color: strengthColor }]}
                  >
                    {strengthLabel}
                  </Text>
                </View>
              )}

              {password.length > 0 && (
                <View style={styles.checkList}>
                  <CheckRow
                    ok={pwdChecks.length}
                    label="At least 8 characters"
                  />
                  <CheckRow ok={pwdChecks.upper} label="One uppercase letter" />
                  <CheckRow ok={pwdChecks.lower} label="One lowercase letter" />
                  <CheckRow ok={pwdChecks.number} label="One number" />
                  <CheckRow
                    ok={pwdChecks.special}
                    label="One special character"
                  />
                </View>
              )}

              <Text style={[styles.label, { marginTop: 16 }]}>
                Confirm password
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  confirm.length > 0 &&
                    password !== confirm &&
                    styles.inputWrapError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={(t) => {
                    setConfirm(t);
                    if (error) setError(null);
                  }}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {confirm.length > 0 && password !== confirm && (
                <Text style={styles.errorText}>Passwords do not match.</Text>
              )}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Reset password</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP 4: Done ───────────────────────────── */}
          {step === "done" && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Back to sign in</Text>
            </TouchableOpacity>
          )}

          {step === "input" && (
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.forgotText}>Sign in</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Small reusable checklist row ──────────────────────────
function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons
        name={ok ? "checkmark-circle" : "ellipse-outline"}
        size={14}
        color={ok ? "#059669" : "#9CA3AF"}
      />
      <Text
        style={[
          styles.checkLabel,
          ok && { color: "#059669", fontWeight: "600" },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Styles (unchanged from your file) ─────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabActive: { backgroundColor: "#4F46E5" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#4F46E5" },
  tabTextActive: { color: "#fff" },
  label: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
  },
  inputWrapError: { borderColor: "#DC2626", backgroundColor: "#FEF2F2" },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  primaryBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    minHeight: 50,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    flexWrap: "wrap",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    flexWrap: "wrap",
  },
  footerText: { fontSize: 13, color: "#6B7280" },
  forgotText: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "600",
  },
  notAvailable: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    padding: 14,
  },
  notAvailableTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  notAvailableText: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 18,
  },
  notAvailableLink: { color: "#4F46E5", fontWeight: "700" },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    backgroundColor: "#F9FAFB",
    paddingVertical: 0,
  },
  otpBoxFilled: {
    borderColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
  },
  otpBoxError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  strengthWrap: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  strengthBars: { flex: 1, flexDirection: "row", gap: 4 },
  strengthBar: { flex: 1, height: 5, borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: "700" },
  checkList: { marginTop: 10, gap: 6 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  checkLabel: { fontSize: 12, color: "#6B7280" },
});

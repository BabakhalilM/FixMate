// app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);
  const isFormValid = email.trim() !== "" && password.trim() !== "";
  const [token, setToken] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await login({ email, password });
      console.log("login response", response);
      if (response.success) {
        // const token = response?.data?.token;
        setToken(response?.data?.token || "");
        const userRole = response?.data?.user?.role;
        const authToken = response?.data?.token;
        const TECHNICIAN_DOMAIN =
          process.env.NEXT_PUBLIC_TECHNICIAN_WEB_URL || "http://localhost:8081";
        switch (userRole) {
          case "customer":
            window.location.href = "http://localhost:8082";
            // router.push('/customer-dashboard');
            break;
          // case "technician": {
          //   const technicianUrl = token
          //     ? `${process.env.EXPO_PUBLIC_TECHNICIAN_URL}?token=${encodeURIComponent(token)}`
          //     : "http://localhost:8081";
          //   window.location.href = technicianUrl;
          //   break;
          // }
          // case "technician": {
          //   const TECHNICIAN_WEB_URL =
          //     process.env.EXPO_PUBLIC_TECHNICIAN_URL || "http://localhost:8081";

          //   // Build the web fallback URL WITH the token
          //   const webUrl = token
          //     ? `${TECHNICIAN_WEB_URL}?token=${encodeURIComponent(token)}`
          //     : TECHNICIAN_WEB_URL;

          //   if (!token) {
          //     window.location.href = webUrl;
          //     break;
          //   }

          //   // Build the deep link URL
          //   const schemeUrl = `fixmate://login?token=${encodeURIComponent(token)}`;

          //   // Android uses the `intent://` syntax which handles fallback automatically
          //   const isAndroid = /android/i.test(navigator.userAgent);
          //   const androidIntentUrl =
          //     `intent://login?token=${encodeURIComponent(token)}` +
          //     `#Intent;scheme=fixmate;` +
          //     `package=com.babakhalilmsteam.technicianapp;` +
          //     `S.browser_fallback_url=${encodeURIComponent(webUrl)};` +
          //     `end`;

          //   // Track whether the app opened (best effort)
          //   let appOpened = false;
          //   const onVisibilityChange = () => {
          //     if (document.hidden) appOpened = true;
          //   };
          //   window.addEventListener("visibilitychange", onVisibilityChange);

          //   // Launch the app. Use a direct anchor click for best browser support.
          //   const link = document.createElement("a");
          //   link.href = isAndroid ? androidIntentUrl : schemeUrl;
          //   link.rel = "noopener";
          //   document.body.appendChild(link);
          //   link.click();
          //   document.body.removeChild(link);

          //   // Fallback: after 1.5s, if the app didn't open, show the modal
          //   setTimeout(() => {
          //     window.removeEventListener(
          //       "visibilitychange",
          //       onVisibilityChange,
          //     );

          //     // Only show the modal if we're NOT on Android (Android handles its own fallback)
          //     if (!appOpened && !isAndroid) {
          //       setShowAppModal(true); // Show "Install App" vs "Continue in Browser"
          //     }
          //   }, 1500);

          //   break;
          // }
          case "technician": {
            const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL; // ← Next.js domain
            const authToken = response?.data?.token;

            if (!LANDING_URL) {
              console.error("NEXT_PUBLIC_LANDING_URL is not set");
              setError("Configuration error. Please try again later.");
              break;
            }

            if (!authToken) {
              console.error("Technician login succeeded but no token returned");
              setError("Login failed. Please try again.");
              break;
            }

            // Build App Link using the NEXT.JS domain, not the Expo web domain
            const appLinkUrl = `${LANDING_URL}/technician-login?token=${encodeURIComponent(authToken)}`;

            console.log("Redirecting to App Link:", appLinkUrl);
            window.location.href = appLinkUrl; // ← make sure this is uncommented
            break;
          }
          case "admin":
            window.location.href = "http://localhost:5173";
            // router.push('/admin-dashboard');
            break;
          default:
            router.push("/");
        }
        router.refresh();
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error: any) {
      setError(error?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // const handleInstallApp = () => {
  //   // Replace with your actual Expo APK download URL
  //   const apkUrl =
  //     "https://expo.dev/accounts/YOUR_ACCOUNT/projects/YOUR_PROJECT/builds/BUILD_ID";
  //   window.open(apkUrl, "_blank");
  // };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
      {showAppModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-2">Open in App?</h2>
            <p className="text-gray-600 mb-4">
              Get the full experience in the FixMate Technician app.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://play.google.com/store/apps/details?id=com.babakhalilmsteam.technicianapp"
                className="bg-blue-600 text-white px-4 py-2 rounded text-center"
              >
                Install App
              </a>
              <button
                onClick={() => {
                  window.location.href = `${process.env.EXPO_PUBLIC_TECHNICIAN_URL}?token=${encodeURIComponent(token)}`;
                }}
                className="border border-gray-300 px-4 py-2 rounded"
              >
                Continue in Browser
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">Login to your FixMate account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <span>Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-indigo-600 hover:text-indigo-700"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              or continue with
            </span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span>Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span>Facebook</span>
          </button>
        </div>

        {/* Register Link */}
        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

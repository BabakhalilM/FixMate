// app/technician-login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ANDROID_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.babakhalilmsteam.technicianapp";

// If not on Play Store yet, use your EAS APK direct download URL:
const APK_DIRECT_URL =
  "https://expo.dev/accounts/babakhalilms-team/projects/technician-app/builds";

export default function TechnicianLoginFallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  const handleInstallApp = () => {
    // Prefer Play Store if published; otherwise direct APK link
    window.location.href = ANDROID_PLAY_STORE_URL;
    // Or for direct APK:
    // window.location.href = APK_DIRECT_URL;
  };

  const handleContinueOnWeb = () => {
    // Send user to the web version of the technician app with the token
    const webUrl = `${
      process.env.NEXT_PUBLIC_TECHNICIAN_WEB_URL ||
      "https://fix-mate-technician-app-eight.vercel.app"
    }?token=${encodeURIComponent(token)}`;
    window.location.href = webUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">F</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Open FixMate Technician
        </h1>
        <p className="text-gray-600 mb-8">
          Get the full experience in our mobile app, or continue in your
          browser.
        </p>

        <div className="flex flex-col gap-3">
          {isAndroid && (
            <button
              onClick={handleInstallApp}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Install App
            </button>
          )}

          <button
            onClick={handleContinueOnWeb}
            className="w-full bg-white text-indigo-600 border border-indigo-600 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            Continue in Browser
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Already installed? The app should open automatically. If not, tap
          "Install App" to reinstall.
        </p>
      </div>
    </div>
  );
}
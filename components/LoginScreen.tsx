"use client";

import { initiateLogin } from "@/lib/spotify";

export default function LoginScreen() {
  const handleLogin = async () => {
    await initiateLogin();
  };

  return (
    <div className="login-screen">
      <div className="login-content">
        <p className="login-title">ascii · standby</p>
        <button className="login-btn" onClick={handleLogin}>
          connect spotify
        </button>
        <p className="login-note">requires premium</p>
      </div>
    </div>
  );
}

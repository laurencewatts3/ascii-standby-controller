"use client";

import { useEffect, useState } from "react";
import { handleCallback } from "@/lib/spotify";
import { getBasePath } from "@/lib/basePath";

export default function CallbackPage() {
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );

  useEffect(() => {
    const process = async () => {
      const success = await handleCallback();
      if (success) {
        setStatus("success");
        // Redirect to main app
        const basePath = getBasePath();
        window.location.href = `${window.location.origin}${basePath}/`;
      } else {
        setStatus("error");
      }
    };

    process();
  }, []);

  return (
    <div className="login-screen">
      <div className="login-content">
        {status === "processing" && (
          <p className="login-title">connecting...</p>
        )}
        {status === "error" && (
          <>
            <p className="login-title">connection failed</p>
            <a
              className="login-btn"
              href={`${getBasePath()}/`}
              style={{ textDecoration: "none" }}
            >
              try again
            </a>
          </>
        )}
      </div>
    </div>
  );
}

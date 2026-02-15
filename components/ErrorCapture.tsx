"use client";

import { useEffect } from "react";
import { initGlobalErrorCapture } from "@/lib/errorLogger";

// This component initializes global error capture on mount
// It renders nothing - just activates the error interceptors
export default function ErrorCapture() {
    useEffect(() => {
        initGlobalErrorCapture();
    }, []);

    return null;
}

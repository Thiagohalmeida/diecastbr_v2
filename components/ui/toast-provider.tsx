"use client"

import { Toaster } from "@/components/ui/toaster"

export function ToastProvider() {
  return (
    <Toaster
      toastOptions={{
        duration: 4000,
        className: "animate-slide-up",
      }}
    />
  )
}

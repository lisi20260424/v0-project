"use client"

import * as React from "react"
import { MembershipDialog } from "@/components/membership-dialog"

type Tab = "membership" | "points"

type Ctx = {
  open: (tab?: Tab) => void
  close: () => void
}

const MembershipContext = React.createContext<Ctx | null>(null)

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState<Tab>("membership")

  const api = React.useMemo<Ctx>(
    () => ({
      open: (t: Tab = "membership") => {
        setTab(t)
        setOpen(true)
      },
      close: () => setOpen(false),
    }),
    [],
  )

  return (
    <MembershipContext.Provider value={api}>
      {children}
      <MembershipDialog open={open} onOpenChange={setOpen} defaultTab={tab} />
    </MembershipContext.Provider>
  )
}

export function useMembership() {
  const ctx = React.useContext(MembershipContext)
  if (!ctx) {
    return {
      open: () => {
        // no-op fallback when provider is missing
        console.log("[v0] MembershipProvider not mounted")
      },
      close: () => {},
    }
  }
  return ctx
}

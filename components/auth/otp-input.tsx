"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

/**
 * 6 位数字验证码输入框
 * - 自动聚焦、自动跳格、支持粘贴 6 位码
 * - 只接受数字
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  autoFocus = true,
  className,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus()
    }
  }, [autoFocus])

  function setDigit(index: number, digit: string) {
    const cleaned = digit.replace(/\D/g, "")
    const chars = value.split("")
    chars[index] = cleaned.slice(-1) ?? ""
    const next = chars.join("").slice(0, length)
    onChange(next)

    if (cleaned && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }

    if (next.length === length) {
      onComplete?.(next)
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
    if (!text) return
    onChange(text)
    const focusIndex = Math.min(text.length, length - 1)
    inputsRef.current[focusIndex]?.focus()
    if (text.length === length) {
      onComplete?.(text)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus()
        const chars = value.split("")
        chars[index - 1] = ""
        onChange(chars.join(""))
        e.preventDefault()
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={value[index] ?? ""}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(
            "h-12 w-10 rounded-lg border border-border bg-background text-center text-lg font-semibold tabular-nums shadow-sm transition-colors sm:h-14 sm:w-12 sm:text-xl",
            "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            value[index] ? "border-primary/60" : "",
          )}
        />
      ))}
    </div>
  )
}

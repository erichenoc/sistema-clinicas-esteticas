import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[#998577] selection:bg-[#A67C52]/20 selection:text-[#A67C52] border-[#e8e4df] h-11 w-full min-w-0 rounded-xl border bg-white px-4 py-2 text-base text-[#3d3d3d] shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-[#A67C52]/30 focus-visible:border-[#A67C52] focus-visible:ring-2 focus-visible:ring-[#A67C52]/20",
        "aria-invalid:ring-[#c9515c]/20 aria-invalid:border-[#c9515c]",
        className
      )}
      {...props}
    />
  )
}

export { Input }

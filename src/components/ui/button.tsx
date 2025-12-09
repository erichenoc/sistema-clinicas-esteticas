import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#A67C52]/30 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#A67C52] text-white hover:bg-[#8a6543] shadow-md shadow-[#A67C52]/20 hover:shadow-lg hover:shadow-[#A67C52]/30 active:scale-[0.98]",
        destructive:
          "bg-[#c9515c] text-white hover:bg-[#b04550] shadow-md shadow-[#c9515c]/20 focus-visible:ring-[#c9515c]/30",
        outline:
          "border-2 border-[#e8e4df] bg-white text-[#3d3d3d] hover:bg-[#f5f3f0] hover:border-[#A67C52]/30 hover:text-[#A67C52]",
        secondary:
          "bg-[#93beb8] text-white hover:bg-[#7aada6] shadow-md shadow-[#93beb8]/20",
        ghost:
          "text-[#3d3d3d] hover:bg-[#f5f3f0] hover:text-[#A67C52]",
        link:
          "text-[#A67C52] underline-offset-4 hover:underline hover:text-[#8a6543]",
        luxury:
          "bg-gradient-to-r from-[#A67C52] to-[#c9a67a] text-white hover:from-[#8a6543] hover:to-[#A67C52] shadow-lg shadow-[#A67C52]/25 hover:shadow-xl hover:shadow-[#A67C52]/35 active:scale-[0.98]",
        "outline-gold":
          "border-2 border-[#A67C52] bg-transparent text-[#A67C52] hover:bg-[#A67C52] hover:text-white",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-12 rounded-xl px-8 has-[>svg]:px-6 text-base",
        xl: "h-14 rounded-2xl px-10 has-[>svg]:px-8 text-base font-semibold",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-[#A67C52]/30 transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#A67C52] text-white [a&]:hover:bg-[#8a6543]",
        secondary:
          "border-transparent bg-[#93beb8] text-white [a&]:hover:bg-[#7aada6]",
        destructive:
          "border-transparent bg-[#c9515c] text-white [a&]:hover:bg-[#b04550]",
        outline:
          "border-[#e8e4df] text-[#3d3d3d] bg-white [a&]:hover:bg-[#f5f3f0] [a&]:hover:border-[#A67C52]/30",
        success:
          "border-transparent bg-[#22c55e]/10 text-[#16a34a] [a&]:hover:bg-[#22c55e]/20",
        warning:
          "border-transparent bg-[#eaa86a]/10 text-[#b47d3c] [a&]:hover:bg-[#eaa86a]/20",
        rose:
          "border-transparent bg-[#e8a0c0]/10 text-[#c77a9e] [a&]:hover:bg-[#e8a0c0]/20",
        gold:
          "border-transparent bg-[#A67C52]/10 text-[#A67C52] [a&]:hover:bg-[#A67C52]/20",
        teal:
          "border-transparent bg-[#93beb8]/10 text-[#6a9994] [a&]:hover:bg-[#93beb8]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

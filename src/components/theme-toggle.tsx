'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Modo oscuro</Label>
          <p className="text-xs text-muted-foreground">Usar tema oscuro en la interfaz</p>
        </div>
        <Switch disabled />
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Modo oscuro</Label>
        <p className="text-xs text-muted-foreground">Usar tema oscuro en la interfaz</p>
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      />
    </div>
  )
}

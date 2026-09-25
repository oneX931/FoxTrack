import { Gamepad2, Joystick, Monitor, Smartphone } from 'lucide-react'
import { platformColor, platformIconKind } from '../utils/platforms.js'

const ICONS = { monitor: Monitor, smartphone: Smartphone, joystick: Joystick, gamepad: Gamepad2 }

export function PlatformIcon({ name, size = 14 }) {
  const Icon = ICONS[platformIconKind(name)]
  return <Icon size={size} color={platformColor(name)} aria-hidden="true" style={{ flexShrink: 0 }} />
}

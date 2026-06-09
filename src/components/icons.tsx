import React from 'react'

interface IconProps {
  d: string[]
  size?: number
  stroke?: string
  sw?: number
  fill?: string
  style?: React.CSSProperties
}

export function Icon({ d, size = 22, stroke = 'currentColor', sw = 1.8, fill = 'none', style }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill} stroke={stroke} strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round"
      style={style}
    >
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

export const icons: Record<string, string[]> = {
  speaker: ['M11 5 6 9H3v6h3l5 4z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M18.5 6a9 9 0 0 1 0 12'],
  play:    ['M8 5v14l11-7z'],
  mic:     ['M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'],
  check:   ['M4 12.5 9.5 18 20 6.5'],
  lock:    ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  arrow:   ['M5 12h14', 'M13 6l6 6-6 6'],
  arrowUR: ['M7 17 17 7', 'M8 7h9v9'],
  arrowL:  ['M19 12H5', 'M11 6l-6 6 6 6'],
  flame:   ['M12 3c.6 3-1.8 4.2-2.6 6.1C8.3 11.6 9.7 14 12 14s3.7-2.4 2.6-4.9c-.4-1-.9-1.6-.6-3 1.8 1 4 3.4 4 6.4a6 6 0 1 1-12 0c0-2.3 1.2-4 2.6-5.4C11.6 5.6 12 4.4 12 3z'],
  home:    ['M4 11 12 4l8 7', 'M6 9.5V19h12V9.5'],
  island:  ['M3 19h18', 'M12 19v-7', 'M12 12c2.5-2 5-1 6 0-2.5 0-3.5 1.5-6 1.5S8.5 12 6 12c1-1 3.5-2 6 0z'],
  chart:   ['M5 19V5', 'M5 19h14', 'M9 16v-4', 'M13 16V8', 'M17 16v-7'],
  cards:   ['M4 6h16v12H4z', 'M4 10h16'],
  close:   ['M6 6l12 12', 'M18 6 6 18'],
  sparkle: ['M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z'],
  plus:    ['M12 5v14', 'M5 12h14'],
  chevD:   ['M6 9l6 6 6-6'],
}

interface IProps {
  name: keyof typeof icons
  size?: number
  sw?: number
  fill?: string
  style?: React.CSSProperties
}

export function I({ name, size = 22, sw = 1.8, fill, style }: IProps) {
  return <Icon d={icons[name]} size={size} sw={sw} fill={fill} style={style} />
}

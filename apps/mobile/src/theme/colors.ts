export const colors = {
  // Backgrounds
  background:    '#FAFAF8',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F3F4F6',
  border:        '#E5E7EB',

  // Pastéis primários
  blue:          '#A8C8E8',
  blueDark:      '#6D8FB0',
  blueLight:     '#D4E8F5',
  green:         '#A8D8B0',
  greenDark:     '#5A9468',
  greenLight:    '#D4F0DA',
  yellow:        '#F2E8A8',
  yellowDark:    '#C8A840',
  yellowLight:   '#F9F3D0',
  pink:          '#E8A8C8',
  pinkDark:      '#B06890',
  red:           '#E8B0A8',
  redDark:       '#C05040',
  purple:        '#C8A8E8',
  purpleDark:    '#8868B0',
  teal:          '#A8E8D8',
  tealDark:      '#5A9890',

  // Texto
  textPrimary:   '#1A1C2E',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  textInverse:   '#FFFFFF',

  // Curva ABC
  abcA:          '#A8D8B0',
  abcB:          '#F2E8A8',
  abcC:          '#E8B0A8',

  // Kanban padrão (sobrescrito por tenant.settings)
  kanbanPendente:    '#FFD6A5',
  kanbanAndamento:   '#CAFFBF',
  kanbanConcluido:   '#A8D8EA',

  // Semântico
  error:         '#EF4444',
  errorLight:    '#FEE2E2',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  success:       '#22C55E',
  successLight:  '#DCFCE7',
  info:          '#3B82F6',
  infoLight:     '#DBEAFE',
} as const

export type ColorKey = keyof typeof colors

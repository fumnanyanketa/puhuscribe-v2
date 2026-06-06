import { OrbCluster, Label } from './primitives'
import { ScreenScroll } from './Shell'

/**
 * Full-screen loading / empty / error placeholder, styled with the brand
 * tokens so it sits naturally inside any screen while data resolves.
 */
export function StatePane({ title, detail, tone = 'normal', bottom }: {
  title: string
  detail?: string
  tone?: 'normal' | 'error'
  bottom?: number
}) {
  const isError = tone === 'error'
  return (
    <ScreenScroll bottom={bottom}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 20,
      }}>
        <OrbCluster size={150} />
        <div>
          <Label color={isError ? 'var(--flag)' : 'var(--written)'} style={{ display: 'block', marginBottom: 8 }}>
            {isError ? 'Virhe' : 'PuhuScribe'}
          </Label>
          <h2 className="ps-title-1">{title}</h2>
          {detail && (
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 320 }}>{detail}</p>
          )}
        </div>
      </div>
    </ScreenScroll>
  )
}

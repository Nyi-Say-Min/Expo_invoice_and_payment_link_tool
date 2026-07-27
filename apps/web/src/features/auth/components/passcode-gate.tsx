type Props = {
  value: string
  loading: boolean
  error: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function PasscodeGate({
  value,
  loading,
  error,
  onChange,
  onSubmit,
}: Props) {
  return (
    <main className="gate">
      <div className="gate-card">
        <span className="eyebrow">TRUNOV HAIR · EXPO DESK</span>
        <h1>Fast orders.<br />Zero mental math.</h1>
        <p>Enter the booth passcode to open the invoice and payment workspace.</p>
        <form onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}>
          <label htmlFor="passcode">Booth passcode</label>
          <input
            id="passcode"
            type="password"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoFocus
            required
          />
          {error && <div className="alert">{error}</div>}
          <button className="primary" disabled={loading}>
            {loading ? 'Opening workspace…' : 'Open workspace'}
          </button>
        </form>
      </div>
    </main>
  )
}

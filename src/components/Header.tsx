export default function Header() {
  return (
    <header className="header">
      <div className="header-brand">
        <h1 className="logo">DRYDOCK</h1>
        <span className="tagline">Ship Blueprint Calculator</span>
      </div>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>v0.1.0</span>
    </header>
  );
}

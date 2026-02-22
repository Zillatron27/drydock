export default function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <h1 className="logo">DRYDOCK</h1>
          <span className="tagline">Ship Blueprint Calculator</span>
        </div>
      </header>
      <main className="main">
        <div className="empty-state">
          Click + to create your first blueprint
        </div>
      </main>
      <footer className="footer">
        <span>DryDock v0.1.0</span>
        <span className="separator">|</span>
        <span>27bit industries</span>
      </footer>
    </div>
  )
}

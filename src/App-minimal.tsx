const App = () => {
  return (
    <div style={{
      padding: '40px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '24px',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <h1>🎉 Minimal App Works!</h1>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>
        Basic React rendering successful
      </p>
    </div>
  );
};

export default App;

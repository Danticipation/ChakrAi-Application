export default function ButtonTest() {
  return (
    <div style={{
      margin: 40,
      padding: 40,
      background: 'black',
      color: 'white',
      zIndex: 99999999,
      position: 'relative',
      border: '5px solid lime'
    }}>
      <h1>🔨 Button Test Component</h1>
      <button
        onClick={() => alert('It lives!')}
        style={{
          background: 'red',
          color: 'white',
          padding: '20px 40px',
          fontSize: '24px',
          border: '3px solid white',
        }}
      >
        💥 DELETE
      </button>
    </div>
  );
}
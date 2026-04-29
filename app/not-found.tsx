export default function NotFound() {
  return (
    <html>
      <head>
        <title>404 - Not Found</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            flexDirection: 'column',
            backgroundColor: '#fafafa',
          }}
        >
          <h1 style={{ fontSize: '48px', margin: 0, fontWeight: 700 }}>404</h1>
          <p style={{ fontSize: '18px', color: '#666', marginTop: '8px' }}>
            This page could not be found
          </p>
        </div>
      </body>
    </html>
  )
}

'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Erro na aplicação</h1>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Recarregar</button>
    </div>
  );
}
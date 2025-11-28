import React, { useEffect, useState } from 'react';
import './MinijuegoBase.css';

// Props:
// - pedido: { id, nombre, ingredientes: ["tomate", "queso"] }
// - ingredientesDisponibles: [{key: 'tomate', label: 'Tomate', color: '#f88'}, ...]
// - tiempo: seconds
// - pais: { id, nombre, banderaSrc }
// - onComplete(resultado: 'gano'|'perdio')

export default function MinijuegoBase({ pedidos = null, pedido = null, ingredientesDisponibles = [], tiempo = 30, pais = {}, onComplete, onCancel }) {
  const [segundos, setSegundos] = useState(tiempo);
  const [selected, setSelected] = useState([]);
  const [completado, setCompletado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [indicePedido, setIndicePedido] = useState(0);
  const [mensajeTemporal, setMensajeTemporal] = useState(null);
  const [penalty, setPenalty] = useState(null);

  useEffect(() => {
    if (segundos <= 0) {
      finish('perdio');
      return;
    }
    if (completado) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos, completado]);

  function handleDragStart(e, key) {
    e.dataTransfer.setData('text/plain', key);
  }

  function handleDrop(e) {
    e.preventDefault();
    if (completado) return;
    const key = e.dataTransfer.getData('text/plain');
    if (!key) return;
    setSelected((prev) => [...prev, key]);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function intentarAgregarEnTabla() {
    if (completado) return;
    const currentPedido = pedidos && pedidos.length > 0 ? pedidos[indicePedido] : pedido;
    const req = currentPedido?.ingredientes || [];
    const ok = req.length === selected.length && req.every(r => selected.includes(r));
    if (ok) {
      // si hay más pedidos, pasar al siguiente
      if (pedidos && indicePedido < pedidos.length - 1) {
        setIndicePedido((i) => i + 1);
        setSelected([]);
        setMensajeTemporal('Pedido OK — siguiente');
        setTimeout(() => setMensajeTemporal(null), 1500);
      } else {
        setCompletado(true);
        finish('gano');
      }
    } else {
      // pedido malo: penalizar con -5s y mostrar mensaje
      setMensajeTemporal('Pedido malo');
      // mostrar indicador -5s
      setPenalty(5);
      setTimeout(() => setPenalty(null), 1400);
      setSegundos((s) => Math.max(0, s - 5));
      setTimeout(() => setMensajeTemporal(null), 2000);
      // opcional: limpiar selección parcial
      setSelected((s) => s.slice(0, Math.max(0, s.length - 1)));
    }
  }

  function finish(res) {
    if (resultado) return; // already finished
    setResultado(res);
    if (onComplete) onComplete(res);
  }

  return (
    <div className="minijuego-overlay">
      <div className="minijuego-card">
        <header className="minijuego-header">
          <h2>{pais?.nombre || 'Minijuego'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div className="minijuego-timer">{String(segundos).padStart(2,'0')}s</div>
            {penalty && <div className="penalty">-{penalty}s</div>}
          </div>
        </header>

        <div className="minijuego-body">
          <aside className="minijuego-pedido">
            <div className="pedido-title">Pedido</div>
            <div className="pedido-card">
              {
                (() => {
                  const currentPedido = pedidos && pedidos.length > 0 ? pedidos[indicePedido] : pedido;
                  return (
                    <>
                      <div className="pedido-nombre">{currentPedido?.nombre || 'Plato'}</div>
                      <div className="pedido-ingredientes">
                        {(currentPedido?.ingredientes || []).map((ing) => {
                          const found = ingredientesDisponibles.find(i => (typeof i === 'string' ? i : i.key) === ing);
                          const label = found ? (typeof found === 'string' ? found : found.label) : ing;
                          const img = found && typeof found !== 'string' ? found.img : null;
                          return (
                            <div key={ing} className="pedido-ing">
                              {img ? <img src={img} alt={label} style={{ width: 36, height: 36, borderRadius: 6 }} /> : label}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()
              }
            </div>
            {pedidos && pedidos.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 12 }}>Pedido {indicePedido + 1} de {pedidos.length}</div>
            )}
          </aside>

            <main className="minijuego-cocina">
              <div className="ingredientes-list">
                {ingredientesDisponibles.map((ingRaw) => {
                  // soportar tanto string como objeto { key, label, img }
                  const ing = typeof ingRaw === 'string' ? { key: ingRaw, label: String(ingRaw) } : ingRaw || {};
                  const isSelected = selected.includes(ing.key);
                  return (
                    <div
                      key={ing.key}
                      className={`ingrediente-btn ${isSelected ? 'selected' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ing.key)}
                      title={`Arrastra ${ing.label} a la mesa`}
                    >
                      {ing.img ? (
                        <img src={ing.img} alt={ing.label} className="ingrediente-icon" />
                      ) : (
                        <div className="ingrediente-icon" style={{background: ing.color || '#ddd'}} />
                      )}
                      <div className="ingrediente-label">{ing.label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="tabla-cocina" onDrop={handleDrop} onDragOver={handleDragOver}>
                <div className="tabla-center">Arrastra los ingredientes aquí</div>
                <div className="tabla-selected">
                  {selected.map((s, idx) => {
                    const found = ingredientesDisponibles.find(i => (typeof i === 'string' ? i : i.key) === s);
                    const label = found ? (typeof found === 'string' ? found : found.label) : s;
                    const img = found && typeof found !== 'string' ? found.img : null;
                    return (
                      <span key={`${s}-${idx}`} className="sel-pill">
                        {img ? <img src={img} alt={label} style={{ width: 28, height: 28, verticalAlign: 'middle', borderRadius: 6 }} /> : label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </main>
        </div>
        <footer className="minijuego-footer">
          <div style={{ flex: 1 }}>
            {mensajeTemporal && <div style={{ fontWeight: 700 }}>{mensajeTemporal}</div>}
          </div>
          <div className="minijuego-actions" style={{ justifyContent: 'flex-end' }}>
            <button onClick={() => intentarAgregarEnTabla()} className="btn-prepare">Entregar</button>
          </div>
          {resultado && (
            <div className={`resultado ${resultado}`}>{resultado === 'gano' ? '¡Todos los pedidos listos!' : 'Se acabó el tiempo'}</div>
          )}
        </footer>
      </div>
    </div>
  );
}

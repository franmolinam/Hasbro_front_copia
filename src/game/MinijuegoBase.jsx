import React, { useEffect, useState, useCallback } from 'react';
// Cargar imágenes disponibles (misma estrategia que en Board.jsx)
const IMAGES = import.meta.glob('../imagenes/**', { eager: true, query: '?url', import: 'default' });
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
  const [paused, setPaused] = useState(false);
  const [showCompletedImage, setShowCompletedImage] = useState(false);
  const [completedImageSrc, setCompletedImageSrc] = useState(null);

  const finish = useCallback((res) => {
    if (resultado) return; // already finished
    setResultado(res);
    if (onComplete) onComplete(res);
  }, [resultado, onComplete]);

  useEffect(() => {
    console.debug('[MinijuegoBase] mounted, tiempo=', tiempo, 'pedidos=', pedidos ? pedidos.length : (pedido ? 1 : 0));
    if (segundos <= 0) {
      finish('perdio');
      return;
    }
    if (completado) return;
    if (paused) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos, completado, paused, finish, pedido, pedidos, tiempo]);

  function handleDragStart(event, key, options = {}) {
    // options: { from: 'list'|'selected', idx }
    const payload = { key, from: options.from || 'list', idx: options.idx ?? null };
    try {
      event.dataTransfer.setData('application/json', JSON.stringify(payload));
    } catch {
      event.dataTransfer.setData('text/plain', key);
    }
    // allow move operation
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(event) {
    event.preventDefault();
    if (completado) return;
    let dataStr = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
    if (!dataStr) return;
    let data;
    try { data = JSON.parse(dataStr); } catch {  data = { key: dataStr, from: 'list' }; }
    // If dragged from ingredient list, add to selected
    if (!data) return;
    if (data.from === 'list') {
      setSelected((prev) => [...prev, data.key]);
      return;
    }
    // if dragged from selected back into table, ignore (no-op) or reorder could be implemented
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function intentarAgregarEnTabla() {
    if (completado) return;
    const currentPedido = pedidos && pedidos.length > 0 ? pedidos[indicePedido] : pedido;
    const req = currentPedido?.ingredientes || [];
    const ok = req.length === selected.length && req.every(r => selected.includes(r));
    if (ok) {
      // Mostrar imagen del pedido terminado y pausar el temporizador
      let src = currentPedido?.img || null;
      // Si no vino resuelta desde el padre, intentar buscar en IMAGES por patrón pedido_N en la carpeta del país
      if (!src) {
        const imageIndex = (pedidos && pedidos.length > 0) ? (indicePedido + 1) : 1;
        const folder = getCountryFolder(pais?.nombre || '');
        // buscar key que incluya la carpeta y el nombre pedido_{n}
        for (const k of Object.keys(IMAGES)) {
          if (!k.includes(`../imagenes/${folder}/`)) continue;
          if (k.toLowerCase().includes(`pedido_${imageIndex}`)) {
            src = IMAGES[k];
            break;
          }
        }
        // fallback: buscar cualquier pedido_{n} global
        if (!src) {
          for (const k of Object.keys(IMAGES)) {
            if (k.toLowerCase().includes(`pedido_${imageIndex}`)) {
              src = IMAGES[k];
              break;
            }
          }
        }
      }

      const finalizar = () => {
        if (pedidos && indicePedido < pedidos.length - 1) {
          setIndicePedido((i) => i + 1);
          setSelected([]);
          setMensajeTemporal('Pedido OK — siguiente');
          setTimeout(() => setMensajeTemporal(null), 1500);
        } else {
          setCompletado(true);
          finish('gano');
        }
      };

      if (src) {
        setCompletedImageSrc(src);
        setShowCompletedImage(true);
        setPaused(true);
        setTimeout(() => {
          setShowCompletedImage(false);
          setCompletedImageSrc(null);
          setPaused(false);
          finalizar();
        }, 2000);
      } else {
        // si no hay imagen, comportarse como antes
        finalizar();
      }
      } else {
      // pedido malo: penalizar con -5s y mostrar mensaje
      setMensajeTemporal('Pedido malo');
      // mostrar indicador -5s
      setPenalty(5);
      setTimeout(() => setPenalty(null), 1400);
      setSegundos((s) => Math.max(0, s - 5));
      setTimeout(() => setMensajeTemporal(null), 2000);
      // limpiar toda la zona de preparación (volver al estado vacío)
      setSelected([]);
    }
  }

  function getCountryFolder(nombre) {
    if (!nombre) return 'usa';
    const n = nombre.toLowerCase();
    if (n.includes('italia')) return 'italia';
    if (n.includes('mexico')) return 'mexico';
    if (n.includes('japon') || n.includes('japón')) return 'japon';
    if (n.includes('eeuu') || n.includes('estados') || n.includes('usa') || n.includes('unidos')) return 'usa';
    return n.replace(/\s+/g, '');
  }

  

  // handler to remove selected pill when dropped anywhere outside the prep table
  function handleGlobalDrop(e) {
    e.preventDefault();
    let dataStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
    if (!dataStr) return;
    let data;
    try { data = JSON.parse(dataStr); } catch {  data = { key: dataStr, from: 'list' }; }
    // if dropped outside and came from selected, remove that occurrence
    if (data && data.from === 'selected') {
      const insideTabla = e.target && e.target.closest && e.target.closest('.tabla-cocina');
      if (!insideTabla) {
        setSelected((prev) => {
          const copy = [...prev];
          if (data.idx != null && copy[data.idx] === data.key) {
            copy.splice(data.idx, 1);
          } else {
            const i = copy.indexOf(data.key);
            if (i >= 0) copy.splice(i, 1);
          }
          return copy;
        });
      }
    }
  }

  return (
    <div className="minijuego-overlay" onDragOver={(ev) => ev.preventDefault()} onDrop={handleGlobalDrop}>
      <div className="minijuego-card">
        <header className="minijuego-header">
          <h2>{pais?.nombre || 'Minijuego'}</h2>
          <div className="minijuego-header-close">
            {typeof onCancel === 'function' && (
              <button onClick={() => { try { onCancel(); } catch (err) { console.warn('[MinijuegoBase] onCancel error', err); } }} aria-label="Cerrar">✕</button>
            )}
          </div>
          <div className="minijuego-header-right">
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
                                  {img ? <img src={img} alt={label} /> : label}
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
              <div className="pedido-index">Pedido {indicePedido + 1} de {pedidos.length}</div>
            )}
          </aside>

            <main className="minijuego-cocina">
              <div className="ingredientes-list" onDragOver={(ev) => ev.preventDefault()} onDrop={(ev) => {
                // allow dropping a selected pill back to the ingredientes list container
                ev.preventDefault();
                let dataStr = ev.dataTransfer.getData('application/json') || ev.dataTransfer.getData('text/plain');
                if (!dataStr) return;
                let data;
                try { data = JSON.parse(dataStr); } catch {  data = { key: dataStr, from: 'list' }; }
                if (data && data.from === 'selected') {
                  setSelected((prev) => {
                    const copy = [...prev];
                    if (data.idx != null && copy[data.idx] === data.key) {
                      copy.splice(data.idx, 1);
                    } else {
                      const i = copy.indexOf(data.key);
                      if (i >= 0) copy.splice(i, 1);
                    }
                    return copy;
                  });
                }
              }}>
                {ingredientesDisponibles.map((ingRaw) => {
                  // soportar tanto string como objeto { key, label, img }
                  const ing = typeof ingRaw === 'string' ? { key: ingRaw, label: String(ingRaw) } : ingRaw || {};
                  const isSelected = selected.includes(ing.key);
                    return (
                    <div
                      key={ing.key}
                      className={`ingrediente-btn ${isSelected ? 'selected' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ing.key, { from: 'list' })}
                      title={`Arrastra ${ing.label} a la mesa`}
                    >
                      {ing.img ? (
                        <img src={ing.img} alt={ing.label} className="ingrediente-icon" />
                      ) : (
                        <div className={`ingrediente-icon ${['blue','red','green','yellow','purple'].includes((ing.color||'').toString().toLowerCase()) ? `color-${(ing.color||'').toString().toLowerCase()}` : ''}`} />
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
                      <span
                        key={`${s}-${idx}`}
                        className="sel-pill"
                        draggable
                        onDragStart={(e) => handleDragStart(e, s, { from: 'selected', idx })}
                      >
                        {img ? <img src={img} alt={label} /> : label}
                      </span>
                    );
                  })}
                </div>
                {showCompletedImage && (
                  <div className="completed-image-wrap">
                    <img className="completed-image" src={completedImageSrc} alt="Pedido completado" />
                  </div>
                )}
              </div>
            </main>
        </div>
        <footer className="minijuego-footer">
          <div className="mensaje-col">
            {mensajeTemporal && <div className="mensaje-temporal">{mensajeTemporal}</div>}
          </div>
          <div className="minijuego-actions">
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

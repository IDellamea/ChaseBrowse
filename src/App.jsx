import { useState, useEffect } from 'react';
import { Resizable } from 're-resizable';
import './App.css';
import Tab from './Tab';
import logoOscuro from './assets/logoanimado-oscuro.webp';
import logoClaro from './assets/logoanimado-claro.webp';

function App() {
  const [urlInput, setUrlInput] = useState('https://www.facebook.com');
  const [tabs, setTabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // IPC renderer (disponible porque en main.cjs seteamos nodeIntegration: true)
  const { ipcRenderer } = window.require ? window.require('electron') : { ipcRenderer: null };

  // Listener para mensajes del menú
  useEffect(() => {
    if (!ipcRenderer) return;
    const handleNewTab = () => {
      handleAddTab();
    };
    ipcRenderer.on('new-tab', handleNewTab);
    return () => {
      ipcRenderer.removeListener('new-tab', handleNewTab);
    };
  }, [urlInput]);

  // Cargar pestañas desde disco al montar
  useEffect(() => {
    let mounted = true;
    async function loadTabs() {
      if (!ipcRenderer) return;
      try {
        const saved = await ipcRenderer.invoke('read-tabs');
        if (mounted && Array.isArray(saved)) {
          setTabs(saved);
        }
      } catch (err) {
        console.error('Error al cargar pestañas:', err);
      } finally {
        // Esperar al menos 2 segundos para mostrar el spinner completo
        setTimeout(() => {
          if (mounted) setIsLoading(false);
        }, 2000);
      }
    }
    loadTabs();

    return () => { mounted = false; };
  }, []);

  // Guardar pestañas en disco cuando cambien
  useEffect(() => {
    if (!ipcRenderer) return;
    const save = async () => {
      try {
        await ipcRenderer.invoke('write-tabs', tabs);
      } catch (err) {
        console.error('Error guardando pestañas:', err);
      }
    };
    save();
  }, [tabs]);

  // Guardar al cerrar la ventana (por si acaso)
  useEffect(() => {
    const handler = (e) => {
      if (ipcRenderer) ipcRenderer.invoke('write-tabs', tabs);
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [tabs]);

  const handleAddTab = () => {
    if (urlInput.trim() === '') return;

    const newTab = {
      id: Date.now(),
      url: urlInput,
      width: 375,
      label: 'Nueva Pestaña',
      color: '#f0f2f5', // Color por defecto para la cabecera
    };
    setTabs([...tabs, newTab]);
  };

  const handleDeleteTab = (idToDelete) => {
    setTabs(tabs.filter(tab => tab.id !== idToDelete));
  };

  const handleResizeStop = (id, newWidth) => {
    const updatedTabs = tabs.map(tab => 
      tab.id === id ? { ...tab, width: newWidth } : tab
    );
    setTabs(updatedTabs);
  };

  // Función para actualizar cualquier propiedad de una pestaña
  const handleUpdateTab = (tabId, newProps) => {
    const updatedTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, ...newProps } : tab
    );
    setTabs(updatedTabs);
  };

  if (isLoading) {
    return (
      <div className="loading-container" style={{ backgroundColor: isDarkMode ? '#000' : '#fff' }}>
        <div className="spinner" style={{ backgroundImage: `url(${isDarkMode ? logoOscuro : logoClaro})` }}></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="controls-container">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Introduce una URL"
        />
        <button onClick={handleAddTab}>Añadir Pestaña</button>
      </div>
      <div className="column-container">
        {tabs.map((tab) => (
          <Resizable
            key={tab.id}
            className="column"
            size={{ width: tab.width, height: '100%' }}
            onResizeStop={(e, direction, ref, d) => {
              handleResizeStop(tab.id, tab.width + d.width);
            }}
            enable={{ right: true }}
            minWidth={250}
          >
            <Tab
              tab={tab} // Pasamos el objeto tab completo
              onDelete={() => handleDeleteTab(tab.id)}
              onUpdate={handleUpdateTab} // Pasamos la función de actualización
            />
          </Resizable>
        ))}
      </div>
    </div>
  );
}

export default App;
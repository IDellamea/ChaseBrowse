import React, { useState, useEffect, useRef } from 'react';
import './Tab.css';

// IPC renderer para comunicación con main process
const { ipcRenderer } = window.require('electron');

const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function Tab({ tab, onDelete, onUpdate }) {
  const webviewRef = useRef(null);
  const colorInputRef = useRef(null);
  const labelRef = useRef(null);
  const [isUrlVisible, setUrlVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(tab.label);
  const lastPersistedUrlRef = useRef(tab.url);

  useEffect(() => {
    setLabelValue(tab.label);
  }, [tab.label]);

  useEffect(() => {
    lastPersistedUrlRef.current = tab.url;
  }, [tab.url]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (webview) {
      webview.setAttribute('useragent', DESKTOP_USER_AGENT);
    }
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleNavigation = (event) => {
      const navigatedUrl = event?.url?.trim();
      if (!navigatedUrl) return;
      if (lastPersistedUrlRef.current === navigatedUrl) return;

      lastPersistedUrlRef.current = navigatedUrl;
      onUpdate(tab.id, { url: navigatedUrl });
    };

    const handleFailLoad = (event) => {
      if (event.errorCode === -3) {
        // ERR_ABORTED, ignorar silenciosamente ya que es común en redirecciones
        return;
      } else {
        console.error('Error al cargar página:', event.errorDescription, event.validatedURL);
      }
    };

    webview.addEventListener('did-navigate', handleNavigation);
    webview.addEventListener('did-navigate-in-page', handleNavigation);
    webview.addEventListener('did-redirect-navigation', handleNavigation);
    webview.addEventListener('did-fail-load', handleFailLoad);

    return () => {
      webview.removeEventListener('did-navigate', handleNavigation);
      webview.removeEventListener('did-navigate-in-page', handleNavigation);
      webview.removeEventListener('did-redirect-navigation', handleNavigation);
      webview.removeEventListener('did-fail-load', handleFailLoad);
    };
  }, [tab.id, onUpdate]);

  const handleGoBack = () => {
    if (webviewRef.current) {
      webviewRef.current.goBack();
    }
  };

  const handleLabelClick = () => {
    setIsEditing(true);
  };

  // Cuando se entra en modo edición, ponemos el foco en el elemento editable y colocamos el caret al final
  useEffect(() => {
    if (isEditing && labelRef.current) {
      const el = labelRef.current;
      // Inicializar el contenido una sola vez
      if (el.innerText !== labelValue) el.innerText = labelValue || '';
      // Foco y colocar caret al final
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isEditing]);

  const handleLabelBlur = () => {
    const el = labelRef.current;
    const newText = el ? el.innerText : labelValue;
    setIsEditing(false);
    if (newText !== tab.label) {
      setLabelValue(newText);
      onUpdate(tab.id, { label: newText });
    } else {
      setLabelValue(newText);
    }
  };

  const toggleUrlVisibility = () => {
    setUrlVisible(!isUrlVisible);
  };

  const [palettePosition, setPalettePosition] = useState({ top: 0, left: 0 });
  const handleColorButtonClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    setPalettePosition({
      top: rect.bottom + 6,
      left: rect.left,
    });
    setShowPalette(true);
  };

  const [showPalette, setShowPalette] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleColorChange = (e) => {
    onUpdate(tab.id, { color: e.target.value });
  };

  const handleSavePage = async () => {
    setIsSaving(true);
    try {
      const result = await ipcRenderer.invoke('save-page', { url: tab.url, label: tab.label });
      // Feedback adicional opcional, ya que main.cjs maneja dialog
      if (result.success) {
        console.log('Página guardada en:', result.path);
      } else {
        console.error('Error guardando página:', result.error);
      }
    } catch (err) {
      console.error('Error en IPC save-page:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Función para determinar el color de texto según el fondo
  function getContrastYIQ(hexcolor) {
    hexcolor = hexcolor.replace('#', '');
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#222' : '#fff';
  }

  const textColor = getContrastYIQ(tab.color);

  return (
    <div className="column-content-wrapper">
      <div className="column-header" style={{ backgroundColor: tab.color }}>
        <button onClick={handleGoBack} className="header-btn">‹</button>
        {isUrlVisible ? (
          <>
            <button onClick={toggleUrlVisibility} className="header-btn">Aa</button>
            <div className="tab-url-display">{tab.url}</div>
          </>
        ) : (
          <>
            <button onClick={toggleUrlVisibility} className="header-btn">i</button>
            {isEditing ? (
              <span
                ref={labelRef}
                className="tab-label editable"
                contentEditable
                suppressContentEditableWarning
                onBlur={handleLabelBlur}
                autoFocus
                style={{ outline: '2px solid #007bff', borderRadius: '4px', padding: '2px 6px', minWidth: '60px', color: textColor, background: 'rgba(255,255,255,0.2)' }}
                spellCheck={false}
              >
                {/* El valor inicial solo al crear, luego el usuario edita libremente */}
                {labelValue}
              </span>
            ) : (
              <span
                className="tab-label"
                onClick={handleLabelClick}
                style={{ cursor: 'pointer', color: textColor }}
              >
                {labelValue}
              </span>
            )}
          </>
        )}
  <button onClick={handleColorButtonClick} className="header-btn">🎨</button>
        <button onClick={handleSavePage} className="header-btn" disabled={isSaving}>
          {isSaving ? '⏳' : '💾'}
        </button>
        <button onClick={onDelete} className="close-btn">X</button>
      </div>
      {showPalette && (
        <div
          className="color-palette-float"
          style={{ position: 'fixed', top: palettePosition.top, left: palettePosition.left, zIndex: 99999 }}
        >
          <input
            type="color"
            ref={colorInputRef}
            onChange={handleColorChange}
            value={tab.color}
            style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            onBlur={() => setShowPalette(false)}
            autoFocus
          />
        </div>
      )}
      <div className="column-webview-container">
        <webview
          ref={webviewRef}
          src={tab.url}
          partition="persist:main_session"
          style={{ height: '100%' }}
        ></webview>
      </div>
    </div>
  );
}

export default Tab;

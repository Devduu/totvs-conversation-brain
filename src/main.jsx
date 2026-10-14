import React from 'react';
import ReactDOM from 'react-dom/client';

// Ponto de entrada: carrega as fontes, o CSS global e monta o App na pagina.
// Fontes empacotadas no projeto (nao dependem de internet nem do Google Fonts).
import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import '@fontsource/inter/latin-900.css';
import '@fontsource/dm-mono/latin-400.css';
import '@fontsource/dm-mono/latin-500.css';

import { App } from './App.jsx';
import { carregarDados } from './services/api';
import './styles/global.css';

// Busca os dados da API Java antes de montar as telas. Sem API configurada
// a promessa resolve na hora e o site sobe com os dados de exemplo.
carregarDados().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

import React from 'react';
import { createRoot } from 'react-dom/client';
import SchoolApp from './SchoolApp.jsx';
import './school.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SchoolApp />
  </React.StrictMode>,
);

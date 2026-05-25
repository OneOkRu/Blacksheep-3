/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
import { Elo } from './pages/Elo';
import { Tournaments } from './pages/Tournaments';
import { Tiers } from './pages/Tiers';
import { Archive } from './pages/Archive';
import { Admin } from './pages/Admin';

export default function App() {
  return (
    <DataProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Tiers />} />
            <Route path="/elo" element={<Elo />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tiers" element={<Tiers />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </Router>
    </DataProvider>
  );
}

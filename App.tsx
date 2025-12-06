import React from 'react';
import { createRoot } from 'react-dom/client';
import { Layout } from './components/Layout';
import { VoxelGenerator } from './components/VoxelGenerator';

const App: React.FC = () => {
  return (
    <Layout>
      <VoxelGenerator />
    </Layout>
  );
};

export default App;

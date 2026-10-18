import OceanGlobeView from '../components/OceanGlobeView';

/**
 * Dashboard page — the main 3D ocean visualisation.
 * Moved here from App.tsx so App can focus purely on routing.
 * Protected by <ProtectedRoute /> in the router.
 */
const Dashboard = () => (
  <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', touchAction: 'none' }}>
    <OceanGlobeView />
  </div>
);

export default Dashboard;

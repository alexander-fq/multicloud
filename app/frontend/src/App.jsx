import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import NewTramitePage from './pages/NewTramitePage';
import ConsultPage from './pages/ConsultPage';
import AllTramitesPage from './pages/AllTramitesPage';
import TramiteDetailsPage from './pages/TramiteDetailsPage';
import EditTramitePage from './pages/EditTramitePage';
import StatisticsPage from './pages/StatisticsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="tramites">
          <Route index element={<AllTramitesPage />} />
          <Route path="nuevo" element={<NewTramitePage />} />
          <Route path="consultar" element={<ConsultPage />} />
          <Route path=":numeroTramite" element={<TramiteDetailsPage />} />
          <Route path=":numeroTramite/editar" element={<EditTramitePage />} />
        </Route>
        <Route path="estadisticas" element={<StatisticsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;

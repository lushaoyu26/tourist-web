import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { TripProvider } from './hooks/useTrip.jsx'
import NavBar from './components/NavBar.jsx'
import HomePage from './pages/HomePage.jsx'
import CountryPage from './pages/CountryPage.jsx'
import RegionPage from './pages/RegionPage.jsx'
import DestinationsPage from './pages/DestinationsPage.jsx'
import TripPlannerPage from './pages/TripPlannerPage.jsx'

export default function App() {
  return (
    <TripProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/trip" element={<TripPlannerPage />} />
          <Route path="/country/:countryId" element={<CountryPage />} />
          <Route path="/country/:countryId/region/:regionId" element={<RegionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TripProvider>
  )
}

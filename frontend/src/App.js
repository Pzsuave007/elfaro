import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import ThemeApplier from "@/components/ThemeApplier";

import PublicLayout from "@/components/PublicLayout";
import Home from "@/pages/Home";
import Enterate from "@/pages/Enterate";
import ArticleDetail from "@/pages/ArticleDetail";
import Recursos from "@/pages/Recursos";
import ResourceDetail from "@/pages/ResourceDetail";
import OregonTeInforma from "@/pages/OregonTeInforma";
import OregonInfoDetail from "@/pages/OregonInfoDetail";
import ConoceOregon from "@/pages/ConoceOregon";
import PlaceDetail from "@/pages/PlaceDetail";
import Elecciones from "@/pages/Elecciones";
import RaceCompare from "@/pages/RaceCompare";
import CandidateDetail from "@/pages/CandidateDetail";
import SearchResults from "@/pages/SearchResults";
import StaticPage from "@/pages/StaticPage";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import ContentList from "@/pages/admin/ContentList";
import ContentEditor from "@/pages/admin/ContentEditor";
import ElectionsAdmin from "@/pages/admin/ElectionsAdmin";
import RaceEditor from "@/pages/admin/RaceEditor";
import CandidateEditor from "@/pages/admin/CandidateEditor";
import MediaLibrary from "@/pages/admin/MediaLibrary";
import UsersAdmin from "@/pages/admin/UsersAdmin";
import SiteSettings from "@/pages/admin/SiteSettings";
import Aliados from "@/pages/Aliados";
import Patrocina from "@/pages/Patrocina";
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeApplier />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/historias" element={<Enterate />} />
            <Route path="/historias/:slug" element={<ArticleDetail />} />
            <Route path="/recursos" element={<Recursos />} />
            <Route path="/recursos/:slug" element={<ResourceDetail />} />
            <Route path="/oregon-te-informa" element={<OregonTeInforma />} />
            <Route path="/oregon-te-informa/:slug" element={<OregonInfoDetail />} />
            <Route path="/conoce-oregon" element={<ConoceOregon />} />
            <Route path="/conoce-oregon/:slug" element={<PlaceDetail />} />
            <Route path="/aliados" element={<Aliados />} />
            <Route path="/patrocina" element={<Patrocina />} />
            <Route path="/elecciones" element={<Elecciones />} />
            <Route path="/elecciones/carrera/:raceId" element={<RaceCompare />} />
            <Route path="/elecciones/candidato/:id" element={<CandidateDetail />} />
            <Route path="/buscar" element={<SearchResults />} />
            <Route path="/acerca" element={<StaticPage page="acerca" />} />
            <Route path="/politica-editorial" element={<StaticPage page="politica-editorial" />} />
            <Route path="/correcciones" element={<StaticPage page="correcciones" />} />
            <Route path="/contacto" element={<StaticPage page="contacto" />} />
            <Route path="/privacidad" element={<StaticPage page="privacidad" />} />
            <Route path="/terminos" element={<StaticPage page="terminos" />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="elections" element={<ElectionsAdmin />} />
            <Route path="races/:raceId" element={<RaceEditor />} />
            <Route path="races/:raceId/candidate/:cid" element={<CandidateEditor />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="settings" element={<SiteSettings />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path=":kind" element={<ContentList />} />
            <Route path=":kind/:id" element={<ContentEditor />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

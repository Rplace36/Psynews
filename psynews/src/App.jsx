import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Ticker from "./components/Ticker";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ArticlePage from "./pages/ArticlePage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const handleSearch = (q) => {
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="app">
      {!isAdmin && <Navbar onSearch={handleSearch} />}
      {!isAdmin && <Ticker />}
      <main className="main-content" id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

export default App;

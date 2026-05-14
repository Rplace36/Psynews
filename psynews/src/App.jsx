import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Ticker from "./components/Ticker";
import Hero from "./components/Hero";
import TrendingBar from "./components/TrendingBar";
import LatestNews from "./components/LatestNews";
import CategorySection from "./components/CategorySection";
import Newsletter from "./components/Newsletter";
import Footer from "./components/Footer";
import SearchResults from "./components/SearchResults";

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="app">
      <Navbar onSearch={setSearchQuery} />
      <Ticker />
      <main className="main-content">
        {searchQuery ? (
          <SearchResults query={searchQuery} onClear={() => setSearchQuery("")} />
        ) : (
          <>
            <Hero />
            <TrendingBar />
            <LatestNews />
            <CategorySection />
            <Newsletter />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;

import { CompetitorAdScraper } from "../components/CompetitorAdScraper";

export default function CompetitorAdScraperPage() {
  return (
    <>
      {/* Sub-navigation bar (copied from Index.tsx, but 'Competitor Ad Scraper' is active) */}
      <div className="border-b border-slate-200 bg-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 py-2">
          <a
            href="/"
            className="px-4 py-2 rounded-md font-medium text-slate-700 hover:bg-slate-100"
          >
            Dashboard
          </a>
          <a
            href="/competitor-ad-scraper"
            className="px-4 py-2 rounded-md font-medium bg-blue-600 text-white shadow"
          >
            Competitor Ad Scraper
          </a>
        </nav>
      </div>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <CompetitorAdScraper />
      </div>
    </>
  );
} 
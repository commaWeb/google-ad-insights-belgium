import React, { useState } from 'react';

interface SerpAd {
  position: number;
  title: string;
  description: string;
  display_url: string;
  advertiser: string;
  date?: string;
}

export const CompetitorAdScraper: React.FC = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('valueserp_api_key') || '');
  const [keywords, setKeywords] = useState('');
  const [region, setRegion] = useState('BE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SerpAd[]>([]);

  const handleScrape = async () => {
    setError(null);
    setLoading(true);
    setResults([]);
    localStorage.setItem('valueserp_api_key', apiKey);
    try {
      const keywordList = keywords.split(/[,\n]/).map(k => k.trim()).filter(Boolean);
      let allAds: SerpAd[] = [];
      for (const keyword of keywordList) {
        const url = `https://api.valueserp.com/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(keyword)}&gl=${region.toLowerCase()}&hl=en`;
        const resp = await fetch(url);
        if (!resp.ok) {
          const errorBody = await resp.text();
          throw new Error(`API error for "${keyword}": ${resp.statusText} - ${errorBody}`);
        }
        const data = await resp.json();
        if (!data.ads || !Array.isArray(data.ads)) throw new Error(`No ads found for "${keyword}". Full response: ${JSON.stringify(data)}`);
        const ads: SerpAd[] = data.ads.map((ad: any, i: number) => ({
          position: ad.position || i + 1,
          title: ad.title || '',
          description: ad.description || '',
          display_url: ad.displayed_url || ad.url || '',
          advertiser: ad.advertiser || '',
          date: new Date().toISOString().slice(0, 10),
        }));
        allAds = allAds.concat(ads);
      }
      setResults(allAds);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">🔎 Competitor Ad Scraper</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ValueSERP API Key</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter your ValueSERP API key"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Keywords (comma or line separated)</label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            rows={3}
            placeholder="e.g. luxe reizen, unieke rondreizen, ..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Region/Country Code</label>
          <input
            type="text"
            className="w-32 border rounded px-3 py-2 text-sm"
            value={region}
            onChange={e => setRegion(e.target.value)}
            placeholder="BE"
          />
        </div>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleScrape}
          disabled={loading || !apiKey || !keywords}
        >
          {loading ? 'Scraping...' : 'Scrape Now'}
        </button>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      </div>
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Results ({results.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-slate-100">
                  <th className="px-2 py-1 border">#</th>
                  <th className="px-2 py-1 border">Title</th>
                  <th className="px-2 py-1 border">Description</th>
                  <th className="px-2 py-1 border">URL</th>
                  <th className="px-2 py-1 border">Advertiser</th>
                  <th className="px-2 py-1 border">Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((ad, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-2 py-1 border text-center">{ad.position}</td>
                    <td className="px-2 py-1 border font-medium">{ad.title}</td>
                    <td className="px-2 py-1 border">{ad.description}</td>
                    <td className="px-2 py-1 border text-blue-700 underline"><a href={`https://${ad.display_url}`} target="_blank" rel="noopener noreferrer">{ad.display_url}</a></td>
                    <td className="px-2 py-1 border">{ad.advertiser}</td>
                    <td className="px-2 py-1 border text-center">{ad.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}; 
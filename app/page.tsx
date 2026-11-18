"use client";

import { useRef, useState } from "react";

type Slot = { activity: string; details: string };
type Day = {
  day: number;
  title: string;
  morning: Slot;
  afternoon: Slot;
  evening: Slot;
  food: string[];
  tip: string;
};
type Itinerary = {
  title: string;
  summary: string;
  bestTimeToVisit: string;
  estimatedBudget: string;
  gettingAround: string;
  days: Day[];
  packingList: string[];
  travelTips: string[];
};

const INTERESTS = [
  "Culture & History",
  "Food & Drink",
  "Nature & Hiking",
  "Beaches",
  "Nightlife",
  "Shopping",
  "Art & Museums",
  "Adventure",
  "Photography",
  "Relaxation",
];

const EXAMPLES = ["Kyoto, Japan", "Lisbon, Portugal", "Bali, Indonesia", "Jaipur, India"];

export default function Home() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [startDate, setStartDate] = useState("");
  const [travelers, setTravelers] = useState("Couple");
  const [budget, setBudget] = useState("Moderate");
  const [pace, setPace] = useState("Balanced");
  const [interests, setInterests] = useState<string[]>(["Food & Drink", "Culture & History"]);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setItinerary(null);
    setLoading(true);
    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, days, startDate, travelers, budget, pace, interests, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setItinerary(data.itinerary);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function asText(it: Itinerary) {
    const lines = [it.title, "", it.summary, ""];
    it.days.forEach((d) => {
      lines.push(`Day ${d.day}: ${d.title}`);
      lines.push(`  Morning: ${d.morning?.activity} — ${d.morning?.details}`);
      lines.push(`  Afternoon: ${d.afternoon?.activity} — ${d.afternoon?.details}`);
      lines.push(`  Evening: ${d.evening?.activity} — ${d.evening?.details}`);
      if (d.food?.length) lines.push(`  Eat: ${d.food.join(", ")}`);
      if (d.tip) lines.push(`  Tip: ${d.tip}`);
      lines.push("");
    });
    return lines.join("\n");
  }

  async function copy() {
    if (!itinerary) return;
    await navigator.clipboard.writeText(asText(itinerary));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main>
      <header className="hero">
        <nav className="nav">
          <span className="logo">✈ Wayfarer</span>
          <a href="#plan" className="nav-link">Plan a trip</a>
        </nav>
        <div className="hero-inner">
          <h1>Your next trip, planned in seconds.</h1>
          <p>
            Tell us where you&apos;re going and what you love. Our AI builds a
            day-by-day itinerary with places to see, food to try and local tips.
          </p>
        </div>
      </header>

      <section id="plan" className="container">
        <form className="card form" onSubmit={generate}>
          <div className="field full">
            <label htmlFor="dest">Where to?</label>
            <input
              id="dest"
              placeholder="e.g. Kyoto, Japan"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              maxLength={100}
            />
            <div className="examples">
              {EXAMPLES.map((ex) => (
                <button type="button" key={ex} className="link-btn" onClick={() => setDestination(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="days">Days: <strong>{days}</strong></label>
            <input
              id="days"
              type="range"
              min={1}
              max={14}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor="start">Start date (optional)</label>
            <input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="travelers">Travelers</label>
            <select id="travelers" value={travelers} onChange={(e) => setTravelers(e.target.value)}>
              <option>Solo</option>
              <option>Couple</option>
              <option>Family with kids</option>
              <option>Group of friends</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="budget">Budget</label>
            <select id="budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
              <option>Budget</option>
              <option>Moderate</option>
              <option>Luxury</option>
            </select>
          </div>

          <div className="field full">
            <label>Pace</label>
            <div className="segmented">
              {["Relaxed", "Balanced", "Packed"].map((p) => (
                <button
                  type="button"
                  key={p}
                  className={pace === p ? "active" : ""}
                  onClick={() => setPace(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="field full">
            <label>Interests</label>
            <div className="chips">
              {INTERESTS.map((i) => (
                <button
                  type="button"
                  key={i}
                  className={`chip ${interests.includes(i) ? "on" : ""}`}
                  onClick={() => toggleInterest(i)}
                  aria-pressed={interests.includes(i)}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="field full">
            <label htmlFor="notes">Anything else? (optional)</label>
            <textarea
              id="notes"
              rows={2}
              maxLength={500}
              placeholder="Vegetarian, avoid long walks, celebrating an anniversary…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button className="primary full" disabled={loading || !destination.trim()}>
            {loading ? <><span className="spinner" /> Planning your trip…</> : "Generate itinerary"}
          </button>

          {error && <p className="error full">{error}</p>}
        </form>

        {loading && (
          <div className="skeletons">
            {Array.from({ length: Math.min(days, 3) }).map((_, i) => (
              <div key={i} className="card skeleton" />
            ))}
          </div>
        )}

        {itinerary && (
          <div ref={resultRef} className="result">
            <div className="result-head">
              <div>
                <h2>{itinerary.title}</h2>
                <p className="muted">{itinerary.summary}</p>
              </div>
              <div className="actions no-print">
                <button className="ghost" onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
                <button className="ghost" onClick={() => window.print()}>Print</button>
              </div>
            </div>

            <div className="facts">
              <Fact icon="📅" label="Best time to visit" value={itinerary.bestTimeToVisit} />
              <Fact icon="💰" label="Estimated budget" value={itinerary.estimatedBudget} />
              <Fact icon="🚇" label="Getting around" value={itinerary.gettingAround} />
            </div>

            <ol className="timeline">
              {itinerary.days.map((d) => (
                <li key={d.day} className="card day">
                  <div className="day-badge">Day {d.day}</div>
                  <h3>{d.title}</h3>
                  <SlotRow label="Morning" icon="🌅" slot={d.morning} />
                  <SlotRow label="Afternoon" icon="☀️" slot={d.afternoon} />
                  <SlotRow label="Evening" icon="🌙" slot={d.evening} />
                  {d.food?.length > 0 && (
                    <p className="food"><strong>🍽 Eat:</strong> {d.food.join(" · ")}</p>
                  )}
                  {d.tip && <p className="tip">💡 {d.tip}</p>}
                </li>
              ))}
            </ol>

            <div className="lists">
              {itinerary.packingList?.length > 0 && (
                <div className="card">
                  <h3>🎒 Packing list</h3>
                  <ul>{itinerary.packingList.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
              )}
              {itinerary.travelTips?.length > 0 && (
                <div className="card">
                  <h3>🧭 Travel tips</h3>
                  <ul>{itinerary.travelTips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
              )}
            </div>
            <p className="disclaimer">AI-generated. Check opening hours and bookings before you go.</p>
          </div>
        )}
      </section>

      <footer className="footer">Built with Next.js &amp; Groq</footer>
    </main>
  );
}

function Fact({ icon, label, value }: { icon: string; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="card fact">
      <span className="fact-icon">{icon}</span>
      <div>
        <div className="fact-label">{label}</div>
        <div>{value}</div>
      </div>
    </div>
  );
}

function SlotRow({ label, icon, slot }: { label: string; icon: string; slot?: Slot }) {
  if (!slot?.activity) return null;
  return (
    <div className="slot">
      <div className="slot-label">{icon} {label}</div>
      <div>
        <div className="slot-activity">{slot.activity}</div>
        <div className="muted">{slot.details}</div>
      </div>
    </div>
  );
}

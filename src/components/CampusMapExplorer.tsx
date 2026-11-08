import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, Search, Navigation, ExternalLink, Globe, GraduationCap, 
  Building2, Train, Plane, DollarSign, Award, CheckCircle2, Info 
} from 'lucide-react';
import { CampusLocation } from '../types';

export default function CampusMapExplorer() {
  const [selectedTier, setSelectedTier] = useState<'All' | 'Dream' | 'Target' | 'Safe'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const campuses: CampusLocation[] = [
    {
      id: 'iit-bombay',
      name: 'IIT Bombay (Indian Institute of Technology)',
      state: 'Maharashtra',
      city: 'Powai, Mumbai',
      lat: 19.1334,
      lng: 72.9133,
      tier: 'Dream',
      topCourse: 'B.Tech Computer Science & AI',
      avgFees: '₹2.2 Lakhs/year',
      avgPlacement: '₹24.8 Lakhs/year',
      nearestMetroStation: 'Kanjurmarg / Powai Metro Station (1.2 km)',
      distanceFromAirportKm: 9.5,
      hostelAvailability: 'Mandatory on-campus residential hostels (100% capacity)',
      description: 'Premier national institute of technology with world-renowned alumni network, state-of-the-art incubation labs (SINE), and elite recruiters.'
    },
    {
      id: 'iit-delhi',
      name: 'IIT Delhi (Indian Institute of Technology)',
      state: 'Delhi NCR',
      city: 'Hauz Khas, New Delhi',
      lat: 28.5450,
      lng: 77.1926,
      tier: 'Dream',
      topCourse: 'B.Tech Electrical & Computing',
      avgFees: '₹2.2 Lakhs/year',
      avgPlacement: '₹25.2 Lakhs/year',
      nearestMetroStation: 'IIT Delhi Metro Station (Magenta Line, 0.1 km)',
      distanceFromAirportKm: 11.0,
      hostelAvailability: 'On-campus residential hostels with high-speed internet',
      description: 'Located in the heart of South Delhi, NIRF Rank 2 engineering institution renowned for cutting-edge robotics, clean energy, and AI computing.'
    },
    {
      id: 'bits-pilani',
      name: 'BITS Pilani (Birla Institute of Technology & Science)',
      state: 'Rajasthan',
      city: 'Pilani',
      lat: 28.3639,
      lng: 75.5873,
      tier: 'Target',
      topCourse: 'B.E. Computer Science / Electronics',
      avgFees: '₹4.8 Lakhs/year',
      avgPlacement: '₹19.5 Lakhs/year',
      nearestMetroStation: 'Loharu Junction (24 km intercity rail link)',
      distanceFromAirportKm: 180.0,
      hostelAvailability: 'Complete residential township with 100% hostel guarantee',
      description: 'Pioneered zero-attendance policy, Practice School corporate internships, and a peerless meritocratic admission system via BITSAT.'
    },
    {
      id: 'srcc-delhi',
      name: 'Shri Ram College of Commerce (SRCC)',
      state: 'Delhi NCR',
      city: 'North Campus, Delhi University',
      lat: 28.6908,
      lng: 77.2132,
      tier: 'Dream',
      topCourse: 'B.Com (Honours) / B.A. Economics (Hons)',
      avgFees: '₹35,000/year',
      avgPlacement: '₹13.8 Lakhs/year',
      nearestMetroStation: 'Vishwa Vidyalaya Metro Station (Yellow Line, 0.8 km)',
      distanceFromAirportKm: 19.0,
      hostelAvailability: 'Limited merit-allocated on-campus hostels; abundant North Campus PGs',
      description: 'The pinnacle of commerce education in Asia. Unmatched recruiting presence from McKinsey, Bain, BCG, Morgan Stanley, and EY Parthenon.'
    },
    {
      id: 'aiims-delhi',
      name: 'AIIMS New Delhi (All India Institute of Medical Sciences)',
      state: 'Delhi NCR',
      city: 'Ansari Nagar, New Delhi',
      lat: 28.5672,
      lng: 77.2100,
      tier: 'Dream',
      topCourse: 'MBBS (Bachelor of Medicine & Surgery)',
      avgFees: '₹1,628/year',
      avgPlacement: '₹18.0 Lakhs/year (Post-internship medical residency)',
      nearestMetroStation: 'AIIMS Metro Station (Yellow Line, 0.1 km direct concourse)',
      distanceFromAirportKm: 12.5,
      hostelAvailability: '100% hostel allotment for medical and nursing undergraduates',
      description: 'Apex medical institution in India with unparalleled patient diversity, supreme surgery suites, and global medical research recognitions.'
    },
    {
      id: 'vit-vellore',
      name: 'VIT University (Vellore Institute of Technology)',
      state: 'Tamil Nadu',
      city: 'Vellore',
      lat: 12.9692,
      lng: 79.1559,
      tier: 'Safe',
      topCourse: 'B.Tech Information Technology & AI',
      avgFees: '₹3.9 Lakhs/year',
      avgPlacement: '₹9.8 Lakhs/year',
      nearestMetroStation: 'Katpadi Junction (2.5 km rail junction)',
      distanceFromAirportKm: 125.0,
      hostelAvailability: 'Expansive modern hostel blocks with biometric access and gymnasiums',
      description: 'Massive private university known for international ABET accreditation, vibrant club ecosystem, and over 850 campus recruitment drives annually.'
    },
    {
      id: 'nlsiu-bengaluru',
      name: 'National Law School of India University (NLSIU)',
      state: 'Karnataka',
      city: 'Nagarbhavi, Bengaluru',
      lat: 12.9553,
      lng: 77.5140,
      tier: 'Dream',
      topCourse: 'B.A. LL.B (Honours) 5-Year Integrated',
      avgFees: '₹3.2 Lakhs/year',
      avgPlacement: '₹16.8 Lakhs/year',
      nearestMetroStation: 'Attiguppe / Nayandahalli Metro (3.2 km)',
      distanceFromAirportKm: 42.0,
      hostelAvailability: 'Fully residential campus with separate student halls',
      description: 'The Harvard of Indian legal education. NIRF Rank 1 law school with dominant moot court victories, premier judicial clerkships, and corporate law placements.'
    }
  ];

  const [selectedCampus, setSelectedCampus] = useState<CampusLocation>(campuses[0]);

  const filteredCampuses = campuses.filter((c) => {
    const matchesTier = selectedTier === 'All' || c.tier === selectedTier;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.topCourse.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const getTierColor = (tier: CampusLocation['tier']) => {
    if (tier === 'Dream') return 'bg-red-50 text-red-700 border-red-200';
    if (tier === 'Target') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <MapPin size={18} className="text-red-600" />
            Interactive Google Maps Campus & Transit Explorer
          </h2>
          <p className="text-[11px] text-slate-500">Geospatial location intelligence, transit distances, and residential hostel insights</p>
        </div>

        {/* Tier filter tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(['All', 'Dream', 'Target', 'Safe'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedTier === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t} {t !== 'All' && 'Tier'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Campus List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by college, city, or stream..."
              className="w-full bg-white border border-slate-200/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          {/* List Cards */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredCampuses.map((c) => {
              const isSelected = selectedCampus.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCampus(c)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-red-50/20 border-red-500 ring-2 ring-red-500/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(c.tier)}`}>
                        {c.tier} Tier
                      </span>
                      <h4 className="text-xs font-black text-slate-900 mt-1.5 leading-snug">{c.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-400" />
                        <span>{c.city}, {c.state}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block text-xs font-black text-emerald-600 font-mono">{c.avgPlacement}</span>
                      <span className="block text-[9px] text-slate-400">Avg CTC</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[200px]">{c.topCourse}</span>
                    <span className="font-bold text-slate-700">{c.avgFees}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Map View & Selected Campus Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive Map Visualizer */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md relative min-h-[340px] flex flex-col justify-between">
            {/* Embedded OpenStreetMap / Google Map Leaflet Iframe Container */}
            <iframe
              title={`Google Map Location for ${selectedCampus.name}`}
              src={`https://maps.google.com/maps?q=${selectedCampus.lat},${selectedCampus.lng}&z=13&output=embed`}
              className="w-full h-80 border-0 filter contrast-105"
              loading="lazy"
            />

            {/* Map Overlay Badge */}
            <div className="p-3 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-2">
                <Navigation size={14} className="text-red-500 animate-pulse" />
                <span className="font-bold">{selectedCampus.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({selectedCampus.lat.toFixed(4)}, {selectedCampus.lng.toFixed(4)})</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedCampus.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 underline"
              >
                <span>Full Maps View</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Selected Campus Intelligence Dossier */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getTierColor(selectedCampus.tier)}`}>
                  {selectedCampus.tier} Tier Academic Target
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">{selectedCampus.name}</h3>
                <p className="text-xs text-slate-500">{selectedCampus.city}, {selectedCampus.state}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Google Live Search Shortcut */}
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(selectedCampus.name + ' cutoffs admission placements 2026')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe size={13} className="text-blue-600" />
                  <span>Google Search Insights</span>
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{selectedCampus.description}</p>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Tuition / Year</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{selectedCampus.avgFees}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Median CTC</span>
                <span className="text-xs font-black text-emerald-600 mt-0.5 block">{selectedCampus.avgPlacement}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Airport Distance</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">{selectedCampus.distanceFromAirportKm} km</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Metro Station</span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block truncate" title={selectedCampus.nearestMetroStation}>
                  {selectedCampus.nearestMetroStation.split('(')[0]}
                </span>
              </div>
            </div>

            {/* Residential Hostel Status */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Accommodation & Hostel Status: </span>
                <span>{selectedCampus.hostelAvailability}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

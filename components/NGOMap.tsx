import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Minus, Navigation, MapPin, Star, Crosshair, Loader2, Building2, Phone, User, CheckCircle, RefreshCw, Mail, Globe, HeartHandshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet.markercluster';
import { searchNearbyNGOs } from '../services/geminiService';
import { NGO } from '../types';

// Fix Leaflet's default icon path issues in some bundlers/environments
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Generate realistic mock data around San Francisco (Initial Fallback)
const generateNGOs = (): NGO[] => {
    const baseNGOs: NGO[] = [
        { id: '1', name: "Helping Hands Shelter", distance: "1.2 km", rating: 4.8, description: "Provides hot meals to homeless individuals and families in the downtown area.", lat: 37.7749, lng: -122.4194, needs: [], phone: "5551234567" },
        { id: '2', name: "City Food Bank", distance: "3.5 km", rating: 4.5, description: "Distributes grocery packages to low-income households weekly.", lat: 37.7849, lng: -122.4094, needs: [], phone: "5559876543" },
        { id: '3', name: "Green Earth Rescue", distance: "5.0 km", rating: 4.9, description: "Focuses on rescuing perishable produce from wholesalers.", lat: 37.7649, lng: -122.4294, needs: [], phone: "5554567890" },
    ];
    return baseNGOs;
};

const NGOMap: React.FC = () => {
    const navigate = useNavigate();
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<any>(null); // To store the cluster group instance
    const userMarkerRef = useRef<L.CircleMarker | null>(null);
    
    // State
    const [allNgos, setAllNgos] = useState<NGO[]>(() => generateNGOs()); // Lazy init with mocks
    const [searchText, setSearchText] = useState('');
    const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isLoadingLoc, setIsLoadingLoc] = useState(false);
    const [isSearchingReal, setIsSearchingReal] = useState(false);
    const [showContactInfo, setShowContactInfo] = useState(false);

    // Registration Modal State
    const [isRegistering, setIsRegistering] = useState(false);
    const [regForm, setRegForm] = useState({
        name: '',
        address: '',
        phone: '',
        type: 'Food Bank'
    });

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        // Default: San Francisco
        const map = L.map(mapContainerRef.current, {
            zoomControl: false, // We use custom buttons
            attributionControl: false
        }).setView([37.7749, -122.4194], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapRef.current = map;

        // Initialize Marker Cluster Group
        // @ts-ignore - L.markerClusterGroup is injected by the plugin
        const markers = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true
        });
        
        markersRef.current = markers;
        map.addLayer(markers);

        // Add Attribution manually to bottom right
        L.control.attribution({ position: 'bottomright' }).addTo(map);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update Markers when NGOs or Search changes
    useEffect(() => {
        if (!mapRef.current || !markersRef.current) return;
        
        const markers = markersRef.current;
        markers.clearLayers();

        const filtered = allNgos.filter(n => n.name.toLowerCase().includes(searchText.toLowerCase()));

        filtered.forEach(ngo => {
            const marker = L.marker([ngo.lat, ngo.lng]);
            marker.on('click', () => {
                setSelectedNGO(ngo);
                setShowContactInfo(false);
                mapRef.current?.panTo([ngo.lat, ngo.lng]);
            });
            markers.addLayer(marker);
        });
    }, [allNgos, searchText]);

    const fetchRealNGOs = async (lat: number, lng: number) => {
        setIsSearchingReal(true);
        try {
            const realData = await searchNearbyNGOs(lat, lng);
            if (realData.length > 0) {
                setAllNgos(realData);
                // Also center map
                mapRef.current?.setView([lat, lng], 13);
            } else {
                alert("No NGOs found nearby via AI search. Showing demo data.");
            }
        } catch (e) {
            console.error(e);
            const msg = e instanceof Error ? e.message : '';
            if (msg.includes('GEMINI_API_KEY') || msg.includes('API Key')) {
                // Keep demo data; no alert so we don't annoy users without API key
            } else {
                alert("Could not fetch nearby NGOs. Showing demo data.");
            }
        } finally {
            setIsSearchingReal(false);
        }
    };

    const handleLocateMe = () => {
        setIsLoadingLoc(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    
                    if (mapRef.current) {
                        // Remove old user marker
                        if (userMarkerRef.current) {
                            userMarkerRef.current.remove();
                        }

                        // Add User Marker (Non-clustered)
                        const userMarker = L.circleMarker([latitude, longitude], {
                            radius: 8,
                            fillColor: "#00796B",
                            color: "#fff",
                            weight: 3,
                            opacity: 1,
                            fillOpacity: 1
                        }).addTo(mapRef.current).bindPopup("You are here").openPopup();
                        
                        userMarkerRef.current = userMarker;
                        
                        mapRef.current.flyTo([latitude, longitude], 14);
                    }
                    
                    // Trigger real search
                    fetchRealNGOs(latitude, longitude);
                    
                    setIsLoadingLoc(false);
                },
                (error) => {
                    console.error("Error getting location", error);
                    alert("Could not get your location. Please check permissions.");
                    setIsLoadingLoc(false);
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
            setIsLoadingLoc(false);
        }
    };

    const handleZoom = (delta: number) => {
        if (mapRef.current) {
            mapRef.current.setZoom(mapRef.current.getZoom() + delta);
        }
    };

    const handleDonateToNGO = () => {
        if (selectedNGO) {
            navigate('/donate', { state: { preSelectedNgo: selectedNGO } });
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        setRegForm({ ...regForm, phone: val });
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (regForm.phone.length !== 10) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        // Mock Geocoding: Place the new NGO slightly offset from the map center
        const center = mapRef.current?.getCenter() || { lat: 37.7749, lng: -122.4194 };
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;

        const newNgo: NGO = {
            id: `new-${Date.now()}`,
            name: regForm.name,
            description: `A newly registered ${regForm.type}.`,
            distance: "0.1 km", // Mock
            rating: 5.0, // New entries start high
            lat: center.lat + latOffset,
            lng: center.lng + lngOffset,
            address: regForm.address,
            phone: regForm.phone,
            needs: []
        };

        setAllNgos(prev => [...prev, newNgo]);
        setIsRegistering(false);
        setRegForm({ name: '', address: '', phone: '', type: 'Food Bank' });
        
        // Select the new NGO and fly to it
        setTimeout(() => {
            setSelectedNGO(newNgo);
            mapRef.current?.flyTo([newNgo.lat, newNgo.lng], 16);
        }, 300);
    };

    const isRegFormValid = regForm.name.length > 2 && regForm.address.length > 5 && regForm.phone.length === 10;

    return (
        <div className="relative w-full h-screen bg-[#F5F1E8] overflow-hidden flex flex-col">
            
            {/* --- Z-Layer 1: Map View --- */}
            <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full outline-none" />

            {/* --- Z-Layer 2: Header & Search --- */}
            <div className="absolute top-0 left-0 right-0 z-20 pt-[16px] px-[16px] pointer-events-none">
                {/* Header Row */}
                <div className="flex justify-between items-center mb-[12px] pointer-events-auto">
                    <div>
                        <h1 className="text-[28px] font-[700] text-[#212121] leading-tight drop-shadow-sm bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                            Find Partner NGOs
                        </h1>
                    </div>
                    
                    {/* Prominent Register Button */}
                    <button 
                        onClick={() => setIsRegistering(true)}
                        className="h-[44px] bg-[#212121] dark:bg-slate-900 text-white px-[16px] rounded-[22px] text-[14px] font-[700] shadow-lg shadow-black/20 active:scale-95 transition-all hover:bg-black flex items-center gap-2 border border-white/20"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Register NGO
                    </button>
                </div>

                {/* Search Input */}
                <div className="pointer-events-auto h-[44px] bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center px-[12px]">
                    <Search size={20} className="text-[#757575]" />
                    <input 
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search organizations..."
                        className="flex-1 h-full px-[8px] outline-none text-[14px] text-[#212121]"
                        aria-label="Search NGOs"
                    />
                    {searchText && (
                        <button onClick={() => setSearchText('')} aria-label="Clear Search">
                            <X size={16} className="text-[#757575]" />
                        </button>
                    )}
                </div>
            </div>

            {/* --- Z-Layer 2: Map Controls --- */}
            <div className="absolute top-[160px] right-[12px] z-20 flex flex-col gap-[8px]">
                 <button 
                    onClick={() => handleZoom(1)}
                    className="w-[40px] h-[40px] bg-white rounded-[8px] shadow-md flex items-center justify-center active:bg-gray-50 text-[#212121]"
                    aria-label="Zoom In"
                 >
                    <Plus size={20} />
                 </button>
                 <button 
                    onClick={() => handleZoom(-1)}
                    className="w-[40px] h-[40px] bg-white rounded-[8px] shadow-md flex items-center justify-center active:bg-gray-50 text-[#212121]"
                    aria-label="Zoom Out"
                 >
                    <Minus size={20} />
                 </button>
            </div>

            <div className="absolute bottom-[100px] right-[16px] z-20 flex flex-col items-end gap-3">
                <button 
                    onClick={handleLocateMe}
                    className="w-[44px] h-[44px] bg-white rounded-full shadow-lg flex items-center justify-center active:bg-gray-50 text-[#00796B]"
                    aria-label="Current Location"
                >
                    {isLoadingLoc || isSearchingReal ? <Loader2 size={24} className="animate-spin" /> : <Crosshair size={24} />}
                </button>
            </div>
            
            {/* Search Overlay Indicator */}
            {isSearchingReal && (
                <div className="absolute top-[120px] left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[#00796B]" />
                    <span className="text-sm font-medium text-slate-700">Searching nearby NGOs...</span>
                </div>
            )}

            {/* --- Z-Layer 3: NGO Detail Bottom Sheet --- */}
            <div 
                className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[16px] shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-30 transition-transform duration-300 ease-out flex flex-col ${
                    selectedNGO ? 'translate-y-0 pb-[20px]' : 'translate-y-[120%]'
                }`}
                style={{ maxHeight: '70%' }}
                aria-hidden={!selectedNGO}
            >
                {/* Drag Handle */}
                <div className="w-full flex justify-center pt-[8px] pb-[4px]">
                    <div className="w-[40px] h-[4px] bg-[#E0E0E0] rounded-full" />
                </div>

                {/* Content */}
                {selectedNGO && (
                    <div className="px-[20px] pt-[8px]">
                        <div className="flex justify-between items-start mb-[8px]">
                            <h2 className="text-[20px] font-[700] text-[#212121]">{selectedNGO.name}</h2>
                            <button onClick={() => setSelectedNGO(null)} className="p-1 -mr-2 text-gray-400 hover:text-gray-600" aria-label="Close Details">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-[12px] mb-[12px]">
                            <span className="text-[14px] font-[500] text-[#00796B]">{selectedNGO.distance} away</span>
                            <div className="flex items-center gap-1 text-[13px] text-[#757575]">
                                <Star size={12} fill="#FFC107" className="text-[#FFC107]" /> {selectedNGO.rating}
                            </div>
                        </div>

                        <p className="text-[14px] leading-[20px] text-[#757575] mb-[20px] line-clamp-2">
                            {selectedNGO.description}
                        </p>
                        
                        <div className="flex flex-col gap-2 mb-[20px]">
                            {selectedNGO.address && (
                                <p className="text-[12px] text-[#757575] flex items-center gap-2">
                                    <MapPin size={14} /> {selectedNGO.address}
                                </p>
                            )}
                            {showContactInfo && (
                                <div className="animate-in fade-in slide-in-from-top-1 bg-slate-50 p-3 rounded-lg mt-2 space-y-2">
                                    <p className="text-[13px] text-[#212121] flex items-center gap-2 font-medium">
                                        <Phone size={14} className="text-[#00796B]" />
                                        <a
                                          href={selectedNGO.phone ? `tel:${selectedNGO.phone}` : undefined}
                                          className="hover:underline"
                                        >
                                          {selectedNGO.phone || 'No phone available'}
                                        </a>
                                    </p>
                                    <p className="text-[13px] text-[#212121] flex items-center gap-2 font-medium">
                                        <Mail size={14} className="text-[#00796B]" />
                                        {(() => {
                                          const email = `${selectedNGO.name.replace(/\s+/g, '').toLowerCase()}@org.com`;
                                          return (
                                            <a href={`mailto:${email}`} className="hover:underline">
                                              {email}
                                            </a>
                                          );
                                        })()}
                                    </p>
                                    <p className="text-[13px] text-[#212121] flex items-center gap-2 font-medium">
                                        <Globe size={14} className="text-[#00796B]" />
                                        {(() => {
                                          const domain = `${selectedNGO.name.replace(/\s+/g, '').toLowerCase()}.org`;
                                          return (
                                            <a
                                              href={`https://www.${domain}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="hover:underline"
                                            >
                                              www.{domain}
                                            </a>
                                          );
                                        })()}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-[12px]">
                            <button 
                                onClick={() => setShowContactInfo(!showContactInfo)}
                                className="flex-1 h-[48px] border border-[#00796B] rounded-[12px] text-[#00796B] font-[700] text-[14px] flex items-center justify-center active:bg-teal-50 hover:bg-teal-50 transition-colors"
                            >
                                <Phone size={18} className="mr-2" /> Contact
                            </button>
                            <button 
                                onClick={handleDonateToNGO}
                                className="flex-1 h-[48px] bg-[#00796B] rounded-[12px] text-white font-[700] text-[14px] flex items-center justify-center active:bg-[#00695C] hover:bg-[#00695C] transition-colors shadow-lg shadow-teal-500/30"
                            >
                                <HeartHandshake size={18} className="mr-2" /> Donate Here
                            </button>
                        </div>
                    </div>
                )}
                {/* Safe Area Spacer for Bottom Nav (Mobile) */}
                <div className="h-[80px] md:hidden" />
            </div>

            {/* --- Z-Layer 4: Registration Modal Overlay --- */}
            {isRegistering && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="reg-title">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#00796B] px-6 py-4 flex justify-between items-center">
                            <h2 id="reg-title" className="text-white text-lg font-bold flex items-center gap-2">
                                <Building2 size={20} /> New NGO Partner
                            </h2>
                            <button onClick={() => setIsRegistering(false)} className="text-white/80 hover:text-white transition-colors" aria-label="Close Registration">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="orgName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Organization Name</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    <input 
                                        id="orgName"
                                        type="text" 
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/20 rounded-xl outline-none transition-all"
                                        placeholder="e.g. Downtown Food Rescue"
                                        value={regForm.name}
                                        onChange={e => setRegForm({...regForm, name: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="orgType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select 
                                        id="orgType"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-transparent rounded-xl outline-none focus:ring-2 focus:ring-[#00796B]/20 appearance-none font-medium"
                                        value={regForm.type}
                                        onChange={e => setRegForm({...regForm, type: e.target.value})}
                                    >
                                        <option>Food Bank</option>
                                        <option>Shelter</option>
                                        <option>Soup Kitchen</option>
                                        <option>Community Fridge</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="orgPhone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                                      <span>Contact Phone</span>
                                      <span className={`text-[10px] font-bold ${regForm.phone.length === 10 ? 'text-green-600' : 'text-slate-400'}`}>
                                        {regForm.phone.length}/10
                                      </span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                        <input 
                                            id="orgPhone"
                                            type="tel" 
                                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 rounded-xl outline-none transition-all ${regForm.phone.length > 0 && regForm.phone.length < 10 ? 'border-orange-200' : 'border-transparent focus:border-[#00796B]'}`}
                                            placeholder="10 digit number"
                                            value={regForm.phone}
                                            onChange={handlePhoneChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="orgAddress" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                    <input 
                                        id="orgAddress"
                                        type="text" 
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-[#00796B] focus:ring-2 focus:ring-[#00796B]/20 rounded-xl outline-none transition-all"
                                        placeholder="123 Green Street, San Francisco, CA"
                                        value={regForm.address}
                                        onChange={e => setRegForm({...regForm, address: e.target.value})}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5 ml-1">
                                    * Location will be estimated on the map based on this address.
                                </p>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit" 
                                    disabled={!isRegFormValid}
                                    className="w-full py-3.5 bg-[#212121] dark:bg-white text-white dark:text-[#212121] rounded-xl font-bold shadow-lg shadow-black/10 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <CheckCircle size={20} />
                                    {isRegFormValid ? 'Complete Registration' : 'Enter Valid Details'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NGOMap;
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FoodItem, NGO, FoodCategory, UserStats } from '../types';
import { ChevronLeft, Check, ShoppingBag, Map as MapIcon, List, MapPin, AlertCircle, Star, Loader2, Phone, Calendar, Truck, MessageSquare, Clock, Info, ImageIcon, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import L from 'leaflet';
import { searchNearbyNGOs } from '../services/geminiService';
import { useTranslation } from 'react-i18next';

// Fix Leaflet's default icon path issues
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

interface DonationProps {
  inventory: FoodItem[];
  stats?: UserStats;
  onDonateComplete: (itemIds: string[], amount: number) => void;
}

const DEFAULT_NGOS: NGO[] = [
  { id: '1', name: "Helping Hands Shelter", distance: "1.2 km", urgency: "High", lat: 37.7749, lng: -122.4194, description: "Shelter", needs: [], rating: 4.8 },
  { id: '2', name: "City Food Bank", distance: "3.5 km", urgency: "Medium", lat: 37.7849, lng: -122.4094, description: "Food Bank", needs: [], rating: 4.5 },
  { id: '3', name: "Green Earth Rescue", distance: "5.0 km", urgency: "Low", lat: 37.7649, lng: -122.4294, description: "Community Fridge", needs: [], rating: 4.9 },
  { id: '4', name: "St. Mary's Kitchen", distance: "2.1 km", urgency: "High", lat: 37.7699, lng: -122.4100, description: "Soup Kitchen", needs: [], rating: 4.7 },
];

const Stepper: React.FC<{ currentStep: number; totalSteps?: number }> = ({ currentStep, totalSteps = 4 }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  const displayStep = currentStep > totalSteps ? totalSteps : currentStep;
  return (
    <div className="flex items-center justify-center h-[48px] mt-[12px]">
      {steps.map((step, index) => {
        const isCompleted = step < displayStep;
        const isActive = step === displayStep;
        let bgColor = '#E0E0E0';
        let textColor = '#757575';
        if (isCompleted || isActive) {
            bgColor = '#00796B';
            textColor = '#FFFFFF';
        }
        return (
          <React.Fragment key={step}>
            <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[12px] font-bold z-10 transition-colors duration-300" style={{ backgroundColor: bgColor, color: textColor }}>
              {isCompleted ? <Check size={14} strokeWidth={3} /> : step}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-[40px] h-[2px] mx-[4px] transition-colors duration-300 ${isCompleted ? 'bg-[#00796B]' : 'bg-[#E0E0E0]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const DonationItemRow: React.FC<{
  item: FoodItem;
  selected: boolean;
  onToggle: (id: string) => void;
}> = ({ item, selected, onToggle }) => {
  const expiryDate = new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  return (
    <div 
        onClick={() => onToggle(item.id)}
        className={`h-[84px] w-full px-[16px] mb-[8px] flex items-center border-b border-[#EEEEEE] dark:border-slate-800 transition-colors duration-200 cursor-pointer ${
            selected ? 'bg-[#F0FFFB] dark:bg-[#00796B]/10' : 'bg-white dark:bg-slate-900'
        }`}
    >
        <div className={`w-[24px] h-[24px] rounded-[4px] border-[2px] flex items-center justify-center transition-colors ${selected ? 'bg-[#00796B] border-[#00796B]' : 'border-[#BDBDBD]'}`}>
            {selected && <Check size={16} color="white" strokeWidth={3} />}
        </div>
        <div className="ml-[12px] flex-1 min-w-0">
            <h3 className="text-[16px] font-[600] text-[#212121] dark:text-white truncate">{item.name}</h3>
            <p className="text-[14px] font-[400] text-[#757575] dark:text-slate-400 mt-[2px]">{item.quantity} {item.unit}</p>
        </div>
        <div className="bg-[#F5F5F5] dark:bg-slate-800 rounded-[4px] px-[8px] py-[4px] ml-[8px]">
            <span className="text-[12px] font-[500] text-[#757575] dark:text-slate-400">Exp: {expiryDate}</span>
        </div>
    </div>
  );
};

const Donation: React.FC<DonationProps> = ({ inventory, stats, onDonateComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [ngos, setNgos] = useState<NGO[]>(DEFAULT_NGOS);
  const [loadingNGOs, setLoadingNGOs] = useState(false);
  const [selectedNgoId, setSelectedNgoId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [verificationSubmittedAt, setVerificationSubmittedAt] = useState<number | null>(null);
  const [ngoRejected, setNgoRejected] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [logistics, setLogistics] = useState({
      mode: 'dropoff' as 'dropoff' | 'pickup',
      contactPhone: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      time: '12:00'
  });

  // Filter ONLY non-expired active items
  const donatableItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inventory.filter(i => {
      if (i.status !== 'active') return false;
      const expiry = new Date(i.expiryDate);
      return expiry >= today; // Exclude expired
    });
  }, [inventory]);

  const selectedFoodObjects = useMemo(() => 
    donatableItems.filter(i => selectedItems.includes(i.id)), 
    [donatableItems, selectedItems]
  );

  useEffect(() => {
      if (location.state?.preSelectedNgo) {
          const pre = location.state.preSelectedNgo;
          setNgos(prev => prev.find(n => n.id === pre.id) ? prev : [pre, ...prev]);
          setSelectedNgoId(pre.id);
      }
      if (location.state?.preSelectedItemIds) {
          // Verify pre-selected items are not expired
          const validIds = location.state.preSelectedItemIds.filter((id: string) => 
            donatableItems.some(item => item.id === id)
          );
          setSelectedItems(validIds);
      }
  }, [location.state, donatableItems]);

  const handleToggleItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
    else navigate(-1);
  };

  const isPhoneValid = logistics.contactPhone.length === 10 && /^\d+$/.test(logistics.contactPhone);

  const handleContinue = () => {
      if (currentStep < 3) setCurrentStep(prev => prev + 1);
      else if (currentStep === 3) {
          setVerificationSubmittedAt(Date.now());
          setNgoRejected(false);
          setCurrentStep(4);
      }
  };

  const donorRating = useMemo(() => {
      if (!stats?.history?.length) return 4.8;
      const withReview = stats.history.filter(h => h.review?.rating != null);
      if (withReview.length === 0) return 4.8;
      return Math.round((withReview.reduce((a, h) => a + (h.review!.rating ?? 0), 0) / withReview.length) * 10) / 10;
  }, [stats]);

  const preparationTimeLabel = useMemo(() => {
      if (!verificationSubmittedAt) return t('donation.prep_just_now', 'Just now');
      const mins = Math.floor((Date.now() - verificationSubmittedAt) / 60000);
      if (mins < 1) return t('donation.prep_just_now', 'Just now');
      if (mins < 60) return t('donation.prep_mins_ago', '{{count}} min ago', { count: mins });
      const hours = Math.floor(mins / 60);
      return t('donation.prep_hours_ago', 'Cooked {{count}} hours ago', { count: hours });
  }, [verificationSubmittedAt, t]);

  const handleNgoAccept = () => {
      onDonateComplete(selectedItems, selectedItems.length * 10);
      setCurrentStep(5);
  };

  const handleNgoReject = () => {
      setNgoRejected(true);
      setCurrentStep(3);
  };

  useEffect(() => {
    if (currentStep === 2) {
        setLoadingNGOs(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const results = await searchNearbyNGOs(pos.coords.latitude, pos.coords.longitude);
                    if (results.length > 0) setNgos(results);
                } catch (e) { console.error(e); }
                finally { setLoadingNGOs(false); }
            }, () => setLoadingNGOs(false));
        } else setLoadingNGOs(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 2 && viewMode === 'map' && mapContainerRef.current) {
        if (mapRef.current) mapRef.current.remove();
        const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([37.7749, -122.4194], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        if (ngos.length > 0 && ngos[0].id.startsWith('real')) map.setView([ngos[0].lat, ngos[0].lng], 13);
        ngos.forEach(ngo => {
            const marker = L.marker([ngo.lat, ngo.lng])
              .bindPopup(ngo.name, { className: 'font-semibold' })
              .addTo(map)
              .on('click', () => setSelectedNgoId(ngo.id));
            if (ngo.id === selectedNgoId) marker.openPopup();
        });
        mapRef.current = map;
    }
    return () => { mapRef.current?.remove(); mapRef.current = null; }
  }, [currentStep, viewMode, ngos]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setLogistics({ ...logistics, contactPhone: val });
  };

  const renderStep1 = () => (
    <>
        <div className="px-[16px] mt-[24px] mb-[8px]">
            <h2 className="text-[20px] font-[700] text-[#212121] dark:text-white">
              {t('donation.step1_title', 'Select Items to Donate')}
            </h2>
            <p className="text-[14px] text-[#757575] dark:text-slate-400 mt-[2px]">
              {t('donation.step1_subtitle', 'Tap items to add. Expired items are hidden for safety.')}
            </p>
        </div>
        <div className="flex-1 overflow-y-auto pb-[100px]">
            {donatableItems.length > 0 ? (
                donatableItems.map(item => (
                    <DonationItemRow key={item.id} item={item} selected={selectedItems.includes(item.id)} onToggle={handleToggleItem} />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center pt-[60px] px-[32px] text-center">
                     <ShoppingBag size={48} className="text-[#E0E0E0] mb-[16px]" />
                     <h3 className="text-[16px] font-[600] text-[#212121] dark:text-white mb-[8px]">
                       {t('donation.empty_title', 'No valid food items available')}
                     </h3>
                     <p className="text-sm text-slate-500 mb-6">
                       {t(
                         'donation.empty_description',
                         'Expired food items cannot be donated through our platform to ensure recipient safety.'
                       )}
                     </p>
                     <button
                       onClick={() => navigate('/inventory')}
                       className="bg-[#00796B] text-white h-[44px] px-[24px] rounded-[8px] font-[600]"
                     >
                       {t('donation.check_inventory', 'Check Inventory')}
                     </button>
                </div>
            )}
        </div>
    </>
  );

  const renderStep2 = () => (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="px-[16px] mt-[24px] mb-[16px] flex justify-between items-end">
             <div>
                <h2 className="text-[20px] font-[700] text-[#212121] dark:text-white">
                  {t('donation.step2_title', 'Choose Recipient')}
                </h2>
                <p className="text-[14px] text-[#757575] dark:text-slate-400 mt-[2px]">
                  {t('donation.step2_subtitle', 'Who receives this donation?')}
                </p>
             </div>
             <div className="flex bg-[#F5F5F5] dark:bg-slate-800 p-1 rounded-lg">
                 <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#00796B]' : 'text-[#757575]'}`}><List size={20} /></button>
                 <button onClick={() => setViewMode('map')} className={`p-2 rounded-md ${viewMode === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#00796B]' : 'text-[#757575]'}`}><MapIcon size={20} /></button>
             </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-[100px]">
            {loadingNGOs && viewMode === 'list' && (
              <div className="px-[16px] mb-4 flex items-center gap-2 text-[#00796B]">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">
                  {t('donation.finding_ngos', 'Finding nearby organizations...')}
                </span>
              </div>
            )}
            {viewMode === 'list' ? (
                <div className="px-[16px] space-y-[12px]">
                    {ngos.map(ngo => (
                        <div key={ngo.id} onClick={() => setSelectedNgoId(ngo.id)} className={`p-[16px] rounded-[12px] border transition-all cursor-pointer flex justify-between items-center ${selectedNgoId === ngo.id ? 'bg-[#F0FFFB] dark:bg-[#00796B]/20 border-[#00796B]' : 'bg-white dark:bg-slate-900 border-[#EEEEEE] dark:border-slate-700 hover:border-[#00796B]/50'}`}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-[600] text-[#212121] dark:text-white">{ngo.name}</h3>
                                    {ngo.urgency === 'High' && (
                                      <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <AlertCircle size={10} />{t('donation.high_need', 'High Need')}
                                      </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[13px] text-[#757575]"><span className="flex items-center gap-1"><MapPin size={12} /> {ngo.distance}</span><span>•</span><span>{ngo.description || ngo.name}</span></div>
                            </div>
                            {selectedNgoId === ngo.id ? <div className="w-[24px] h-[24px] rounded-full bg-[#00796B] flex items-center justify-center"><Check size={14} color="white" strokeWidth={3} /></div> : <div className="w-[24px] h-[24px] rounded-full border-2 border-[#E0E0E0]" />}
                        </div>
                    ))}
                </div>
            ) : <div ref={mapContainerRef} className="w-full h-full bg-[#E0E0E0] dark:bg-slate-800" />}
        </div>
    </div>
  );

  const renderStep3 = () => {
      const selectedNgo = ngos.find(n => n.id === selectedNgoId);
      return (
        <div className="flex-1 overflow-y-auto px-[16px] pb-[100px]">
            <div className="mt-[24px] mb-[20px]">
                <h2 className="text-[20px] font-[700] text-[#212121] dark:text-white">
                  {t('donation.step3_title', 'Coordinate Handover')}
                </h2>
                <p className="text-[14px] text-[#757575] dark:text-slate-400 mt-[2px]">
                  {t('donation.step3_subtitle', 'Review items and logistics for {{name}}.', {
                    name: selectedNgo?.name ?? '',
                  })}
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm">
                <h3 className="text-xs font-bold text-[#00796B] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Info size={14} /> {t('donation.shared_receipt', 'Shared Receipt Info for NGO')}
                </h3>
                <div className="space-y-2">
                    {selectedFoodObjects.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-50 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                            <span className="font-semibold text-[#212121] dark:text-white">{item.name}</span>
                            <div className="text-right">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">Expires On</span>
                                <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">
                                    {new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setLogistics({ ...logistics, mode: 'dropoff' })}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    logistics.mode === 'dropoff'
                      ? 'bg-[#00796B] border-[#00796B] text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 border-[#EEEEEE] text-[#757575]'
                  }`}
                >
                  <MapPin size={24} />
                  <span className="font-bold text-sm">
                    {t('donation.mode_dropoff', "I'll Drop Off")}
                  </span>
                </button>
                <button
                  onClick={() => setLogistics({ ...logistics, mode: 'pickup' })}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    logistics.mode === 'pickup'
                      ? 'bg-[#00796B] border-[#00796B] text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 border-[#EEEEEE] text-[#757575]'
                  }`}
                >
                  <Truck size={24} />
                  <span className="font-bold text-sm">
                    {t('donation.mode_pickup', 'Request Pickup')}
                  </span>
                </button>
            </div>

            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Phone size={16} /> {t('donation.contact_phone', 'Contact Phone')}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        logistics.contactPhone.length === 10 ? 'text-green-600' : 'text-slate-400'
                      }`}
                    >
                      {logistics.contactPhone.length}/10 {t('donation.digits', 'digits')}
                    </span>
                  </label>
                  <input 
                    type="tel" 
                    placeholder={t('donation.phone_placeholder', 'Enter 10 digit number')}
                    value={logistics.contactPhone} 
                    onChange={handlePhoneChange} 
                    className={`w-full h-[48px] px-4 rounded-xl bg-[#F5F5F5] dark:bg-slate-800 text-[#212121] dark:text-white outline-none transition-all font-medium border-2 ${logistics.contactPhone.length > 0 && logistics.contactPhone.length < 10 ? 'border-orange-300' : 'border-transparent focus:border-[#00796B]'}`} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-[#212121] dark:text-white">
                        <Calendar size={16} /> {t('donation.date', 'Date')}
                      </label>
                      <input
                        type="date"
                        value={logistics.date}
                        onChange={(e) => setLogistics({ ...logistics, date: e.target.value })}
                        className="w-full h-[48px] px-4 rounded-xl bg-[#F5F5F5] dark:bg-slate-800 text-[#212121] dark:text-white outline-none transition-all font-medium border-2 border-transparent focus:border-[#00796B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-[#212121] dark:text-white">
                        <Clock size={16} /> {t('donation.time', 'Time')}
                      </label>
                      <input
                        type="time"
                        value={logistics.time}
                        onChange={(e) => setLogistics({ ...logistics, time: e.target.value })}
                        className="w-full h-[48px] px-4 rounded-xl bg-[#F5F5F5] dark:bg-slate-800 text-[#212121] dark:text-white outline-none transition-all font-medium border-2 border-transparent focus:border-[#00796B]"
                      />
                    </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 flex items-center gap-2 text-[#212121] dark:text-white">
                    <MessageSquare size={16} /> {t('donation.notes', 'Notes')}
                  </label>
                  <textarea
                    placeholder={t('donation.notes_placeholder', 'Details for the recipient...')}
                    value={logistics.notes}
                    onChange={(e) => setLogistics({ ...logistics, notes: e.target.value })}
                    className="w-full h-[80px] p-4 rounded-xl bg-[#F5F5F5] dark:bg-slate-800 text-[#212121] dark:text-white placeholder:text-slate-400 dark:placeholder-slate-500 outline-none transition-all font-medium resize-none border-2 border-transparent focus:border-[#00796B]"
                  />
                </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                {t(
                  'donation.expiry_note',
                  "NGOs require accurate expiry dates to prioritize distribution. We've included these in the handover details sent to {{name}}.",
                  { name: selectedNgo?.name ?? '' }
                )}
              </p>
            </div>
        </div>
      );
  }

  const renderStep4Verification = () => {
      const selectedNgo = ngos.find(n => n.id === selectedNgoId);
      const donationPhotoUrl = selectedFoodObjects.find(i => i.imageUrl)?.imageUrl;
      return (
        <div className="flex-1 overflow-y-auto px-[16px] pb-[24px]">
            <div className="mt-[24px] mb-[20px]">
                <h2 className="text-[20px] font-[700] text-[#212121] dark:text-white">
                  {t('donation.verification_title', 'NGO Acceptance Verification')}
                </h2>
                <p className="text-[14px] text-[#757575] dark:text-slate-400 mt-[2px]">
                  {t('donation.verification_subtitle', 'Before accepting, the recipient can review donor info and food details.')}
                </p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-[#00796B] uppercase tracking-wider mb-3">
                      {t('donation.verification_what_ngo_sees', 'What the NGO sees')}
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#757575] dark:text-slate-400">{t('donation.donor_rating', 'Donor rating')}</span>
                            <span className="flex items-center gap-1 font-bold text-[#212121] dark:text-white">
                                <Star size={16} fill="#FFC107" className="text-[#FFC107]" /> {donorRating}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#757575] dark:text-slate-400">{t('donation.food_prep_time', 'Food preparation time')}</span>
                            <span className="text-sm font-semibold text-[#212121] dark:text-white">{preparationTimeLabel}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-[#757575] dark:text-slate-400 shrink-0">{t('donation.uploaded_photo', 'Uploaded photo')}</span>
                            {donationPhotoUrl ? (
                                <div className="flex-1 min-w-0">
                                    <img src={donationPhotoUrl} alt="" className="h-20 w-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1 inline-block">{t('donation.image_verified', 'Image verified')}</span>
                                </div>
                            ) : (
                                <div className="h-20 w-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                    <ImageIcon size={24} className="text-slate-400" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 flex gap-3">
                    <button
                      type="button"
                      onClick={handleNgoReject}
                      className="flex-1 h-[48px] border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <X size={18} /> {t('donation.reject', 'Reject')}
                    </button>
                    <button
                      type="button"
                      onClick={handleNgoAccept}
                      className="flex-1 h-[48px] bg-[#00796B] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-[#00695C] transition-colors"
                    >
                      <Check size={18} /> {t('donation.accept', 'Accept')}
                    </button>
                </div>
            </div>
            {ngoRejected && (
                <p className="mt-4 text-sm text-amber-700 dark:text-amber-400 font-medium text-center">
                  {t('donation.ngo_declined', 'NGO declined this offer. You can edit handover details and try again.')}
                </p>
            )}
        </div>
      );
  };

  const renderStep5Success = () => {
      const selectedNgo = ngos.find(n => n.id === selectedNgoId);
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6"><Check size={48} className="text-green-600" /></div>
              <h2 className="text-2xl font-bold mb-2 dark:text-white">
                {t('donation.step4_title', 'Donation Delivered!')}
              </h2>
              <p className="text-[#757575] dark:text-slate-300 mb-8 leading-relaxed max-w-xs mx-auto">
                {t(
                  'donation.step4_description',
                  '{{name}} has received your offer, including the full list of items and their expiry dates. They will contact you shortly.',
                  { name: selectedNgo?.name ?? '' }
                )}
              </p>
              <div className="w-full max-w-xs space-y-3">
                <button
                  onClick={() => navigate('/')}
                  className="w-full h-[52px] bg-[#00796B] rounded-xl text-white font-bold shadow-lg"
                >
                  {t('common.dashboard', 'Dashboard')}
                </button>
                {selectedNgo?.phone && (
                  <button
                    onClick={() => window.open(`tel:${selectedNgo.phone}`)}
                    className="w-full h-[52px] border border-[#00796B] text-[#00796B] rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Phone size={18} /> {t('donation.call_recipient', 'Call Recipient')}
                  </button>
                )}
              </div>
          </div>
      );
  };

  return (
    <div className="h-screen bg-white dark:bg-slate-950 flex flex-col relative">
      {currentStep < 5 && (
        <header className="pt-[12px] px-[16px] flex flex-col items-center relative z-20 bg-white dark:bg-slate-950">
            <div className="w-full h-[44px] flex items-center justify-between">
              <button
                onClick={handleBack}
                className="w-[44px] h-[44px] flex items-center justify-center -ml-[12px] rounded-full active:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={24} className="dark:text-white" />
              </button>
              <h1 className="text-[18px] font-[700] absolute left-0 right-0 text-center pointer-events-none dark:text-white">
                {currentStep === 1
                  ? t('donation.header_step1', 'Select Safe Food')
                  : currentStep === 2
                  ? t('donation.header_step2', 'Choose Recipient')
                  : currentStep === 3
                  ? t('donation.header_step3', 'Coordinate Handover')
                  : t('donation.verification_title', 'NGO Verification')}
              </h1>
              <div className="w-[44px]" />
            </div>
        </header>
      )}
      {currentStep < 5 && <Stepper currentStep={currentStep} totalSteps={4} />}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4Verification()}
      {currentStep === 5 && renderStep5Success()}
      {(donatableItems.length > 0 && currentStep < 4) && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-950 pt-[16px] pb-[32px] px-[16px] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t dark:border-slate-800 z-30">
              <button 
                onClick={handleContinue} 
                disabled={
                  (currentStep === 1 && selectedItems.length === 0) ||
                  (currentStep === 2 && !selectedNgoId) ||
                  (currentStep === 3 && (!isPhoneValid || !logistics.date || !logistics.time))
                } 
                className="w-full h-[52px] bg-[#00796B] rounded-[10px] flex items-center justify-center text-white text-[16px] font-[600] disabled:bg-[#BDBDBD] transition-all"
              >
                {currentStep === 3
                  ? isPhoneValid
                    ? t('donation.confirm_handover', 'Confirm Handover Info')
                    : t('donation.enter_phone', 'Enter 10 Digit Phone')
                  : t('common.continue', 'Continue')}
              </button>
          </div>
      )}
    </div>
  );
};

export default Donation;
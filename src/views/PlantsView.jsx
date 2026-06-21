import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import usePlantStore, { PlantPhase, StrainType } from '../store/usePlantStore';
import useGrowLogStore from '../store/useGrowLogStore';
import useGalleryStore from '../store/useGalleryStore';
import useNutrientStore from '../store/useNutrientStore';
import useEnvironmentStore from '../store/useEnvironmentStore';
import { fetchApi } from '../utils/api';
import { Plus, Droplet, Activity, X, Camera, Search, Settings, FileText, BarChart2, ArrowLeft, Sprout, MapPin, Clock, Zap, Bug, Scissors, Check, Trash2, Edit, Calendar, Tag } from 'lucide-react';
import { differenceInDays, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';

const IconMap = {
  Droplet, FileText, Bug, Scissors, Plus, Activity, Zap, Check, Settings, Camera, Search
};

let cachedStrains = null;

export default function PlantsView() {
  const { t } = useTranslation();
  const { plants, addPlant, updatePlant, toggleMoistureSensor, fetchPlantSensorStates, fetchPlantSensorHistory, deletePlant } = usePlantStore();
  const { logs, addLog, fetchLogsForPlant } = useGrowLogStore();
  const { images, addGalleryImage } = useGalleryStore();
  const { recipes } = useNutrientStore();
  const { environments } = useEnvironmentStore();
  
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [activeTab, setActiveTab] = useState('log');
  const [historyTab, setHistoryTab] = useState('actions');
  const [logForm, setLogForm] = useState({ waterVolume: 1.0, phInput: 6.2, ecInput: 1.2, recipeId: '', recipeScale: 100 });
  const [logImage, setLogImage] = useState(null);
  const [logImageFile, setLogImageFile] = useState(null);
  const logImageInputRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlant, setNewPlant] = useState({ name: '', environmentId: '', strainName: '', strainType: StrainType.PHOTOPERIODIC, image: null, imageFile: null, flowerDays: null });
  const [strainQuery, setStrainQuery] = useState('');
  const [strainResults, setStrainResults] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [editingQuickAction, setEditingQuickAction] = useState(null);
  const fileInputRef = useRef(null);

  const getActionColor = (type) => {
    switch(type) {
      case 'water': return 'info';
      case 'nutrients': return 'success';
      case 'bug': return 'warning';
      case 'trim': return 'muted';
      default: return 'primary';
    }
  };

  const handleQuickAction = async (action) => {
    setActionFeedback(action.id);
    await addLog({
      plantId: currentPlant.id,
      waterVolumeLiters: (action.actionType === 'water' || action.actionType === 'nutrients') ? (action.waterVolumeLiters || 0) : null,
      ecInput: action.actionType === 'nutrients' ? (action.ecInput || null) : null,
      phInput: action.actionType === 'nutrients' ? (action.phInput || null) : null,
      notes: action.label + '|~|' + (action.notes || ''),
      appliedRecipeId: action.actionType === 'nutrients' ? (action.recipeId || null) : null,
      recipeScale: 100
    });
    setTimeout(() => setActionFeedback(null), 1500);
  };

  const handleAddQuickAction = () => {
    setEditingQuickAction({
      id: 'qa-' + Math.random().toString(36).substr(2, 9),
      icon: 'Droplet',
      actionType: 'water',
      label: 'New Action',
      waterVolumeLiters: 1,
      notes: ''
    });
  };

  const handleSaveQuickAction = () => {
    const currentActions = currentPlant.sensorConfig?.quickActions || [];
    const existingIndex = currentActions.findIndex(a => a.id === editingQuickAction.id);
    let newActions;
    if (existingIndex >= 0) {
      newActions = [...currentActions];
      newActions[existingIndex] = editingQuickAction;
    } else {
      newActions = [...currentActions, editingQuickAction];
    }
    updatePlant(currentPlant.id, { 
      sensorConfig: { ...(currentPlant.sensorConfig || {}), quickActions: newActions } 
    });
    setEditingQuickAction(null);
  };

  const handleDeleteQuickAction = (id) => {
    const currentActions = currentPlant.sensorConfig?.quickActions || [];
    const newActions = currentActions.filter(a => a.id !== id);
    updatePlant(currentPlant.id, { 
      sensorConfig: { ...(currentPlant.sensorConfig || {}), quickActions: newActions } 
    });
  };

  React.useEffect(() => {
    fetchPlantSensorStates();
  }, []);

  const currentPlant = selectedPlant ? plants.find(p => p.id === selectedPlant.id) || selectedPlant : null;

  React.useEffect(() => {
    if (activeTab === 'charts' && historyTab === 'sensors' && currentPlant?.id) {
      if (!currentPlant.history || currentPlant.history.length === 0) {
        fetchPlantSensorHistory(currentPlant.id);
      }
    }
  }, [activeTab, historyTab, currentPlant?.id]);

  const handleSelectPlant = (plant) => {
    setSelectedPlant(plant);
    setActiveTab('log');
    setLogImage(null);
    setLogImageFile(null);
    fetchLogsForPlant(plant.id);
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!currentPlant) return;
    
    await addLog({
      plantId: currentPlant.id,
      waterVolumeLiters: logForm.waterVolume,
      phInput: (currentPlant.trackPH ?? true) ? logForm.phInput : null,
      ecInput: (currentPlant.trackEC ?? true) ? logForm.ecInput : null,
      appliedRecipeId: logForm.recipeId,
      recipeScale: logForm.recipeScale
    });
    
    if (logImageFile) {
      let days = 0;
      if (currentPlant.dateGerminated) {
        days = Math.floor((new Date() - new Date(currentPlant.dateGerminated)) / (1000 * 60 * 60 * 24));
      }

      await addGalleryImage({
        plantId: currentPlant.id,
        phase: currentPlant.currentPhase,
        daysSinceGermination: days
      }, logImageFile);
    }
    
    setActiveTab('charts');
    setHistoryTab('actions');
    setLogImage(null);
    setLogImageFile(null);
  };

  const handleSavePhotoOnly = async () => {
    if (!currentPlant || !logImageFile) return;

    let days = 0;
    if (currentPlant.dateGerminated) {
      days = Math.floor((new Date() - new Date(currentPlant.dateGerminated)) / (1000 * 60 * 60 * 24));
    }

    await addGalleryImage({
      plantId: currentPlant.id,
      phase: currentPlant.currentPhase,
      daysSinceGermination: days
    }, logImageFile);

    setLogImage(null);
    setLogImageFile(null);
  };

  const plantLogs = currentPlant ? logs.filter(l => l.plantId === currentPlant.id) : [];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPlant({...newPlant, imageFile: file});
      const reader = new FileReader();
      reader.onloadend = () => setNewPlant({...newPlant, image: reader.result, imageFile: file});
      reader.readAsDataURL(file);
    }
  };

  const handleLogImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleStrainSelect = (strain) => {
    setNewPlant({...newPlant, strainName: strain.name, strainType: strain.type, flowerDays: strain.flowerDays});
    setStrainQuery(strain.name);
    setStrainResults([]);
  };

  const handleStrainSearch = async (query) => {
    setStrainQuery(query);
    
    if (newPlant.strainName && query !== newPlant.strainName) {
      setNewPlant({...newPlant, strainName: '', flowerDays: null});
    }

    if (!query) {
      setStrainResults([]);
      return;
    }
    try {
      if (!cachedStrains) {
        const res = await fetch('/strains.json');
        cachedStrains = await res.json();
      }
      
      const lowerQuery = query.toLowerCase();
      const results = cachedStrains
        .filter(s => s.name.toLowerCase().includes(lowerQuery))
        .slice(0, 50);
        
      setStrainResults(results);
    } catch (err) {
      console.error('Failed to search strains', err);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewPlant({ name: '', environmentId: '', strainName: '', strainType: StrainType.PHOTOPERIODIC, image: null, imageFile: null, flowerDays: null });
    setStrainQuery('');
    setStrainResults([]);
  };

  const handleAddPlant = async (e) => {
    e.preventDefault();
    const createdPlant = await addPlant({
      ...newPlant,
      dateGerminated: startOfDay(new Date()).toISOString(),
      dateFlippedToFlower: null,
      currentPhase: PlantPhase.SEEDLING
    });

    if (createdPlant && newPlant.imageFile) {
      await addGalleryImage({
        plantId: createdPlant.id,
        phase: PlantPhase.SEEDLING,
        daysSinceGermination: 0
      }, newPlant.imageFile);
    }

    closeAddModal();
  };

  const getLatestPlantImage = (plantId) => {
    return images.find(img => img.plantId === plantId)?.fileUrl;
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-6">
        <h1>{t('plants.title', 'Plants')}</h1>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}>{t('plants.add_plant', 'Add Plant')}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
        {plants.map(plant => {
          const daysSinceGermination = differenceInDays(new Date(), new Date(plant.dateGerminated));
          const latestImg = getLatestPlantImage(plant.id);
          return (
            <div key={plant.id} className="glass-card interactive" onClick={() => handleSelectPlant(plant)} style={{ cursor: 'pointer' }}>
              <div style={{ position: 'relative', width: '100%', height: '120px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {latestImg ? (
                  <img src={latestImg} alt={plant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '3rem' }}>🪴</span>
                )}
                
                {plant.hasSoilMoistureSensor && (plant.currentMoistureLevel !== null || plant.currentSoilTemp !== null) && (
                  <div style={{ position: 'absolute', bottom: '6px', right: '6px', display: 'flex', gap: '4px', zIndex: 10 }}>
                    {plant.currentMoistureLevel !== null && (
                      <span className="text-xs font-semibold" style={{ background: plant.currentMoistureLevel < 30 ? 'rgba(var(--error-rgb), 0.85)' : 'rgba(0,0,0,0.65)', color: plant.currentMoistureLevel < 30 ? '#fff' : 'var(--info)', padding: '3px 6px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '3px', backdropFilter: 'blur(4px)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        💧 {plant.currentMoistureLevel}%
                      </span>
                    )}
                    {plant.currentSoilTemp !== null && (
                      <span className="text-xs font-semibold" style={{ background: 'rgba(0,0,0,0.65)', color: 'var(--warning)', padding: '3px 6px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '3px', backdropFilter: 'blur(4px)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        🌡️ {plant.currentSoilTemp}°C
                      </span>
                    )}
                  </div>
                )}
              </div>
              <h3 className="text-md mb-1">{plant.name}</h3>
              <p className="text-xs text-muted mb-2">{plant.strainName}</p>
              <div className="flex-between">
                <span className="text-xs text-primary font-semibold">{t(`plants.phase_${currentPlant?.currentPhase?.toLowerCase() || 'unknown'}`, plant.currentPhase)}</span>
                <span className="text-xs">{t('plants.day', 'Day {{day}}', { day: daysSinceGermination })}</span>
              </div>
            </div>
          )
        })}
      </div>

      {selectedPlant && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-dark)', zIndex: 1000, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '500px', minHeight: '100%', position: 'relative', background: 'var(--bg-dark)', boxShadow: '0 0 40px rgba(0,0,0,0.5)', paddingBottom: '3rem' }}>
            
            <div style={{ position: 'relative', height: '40vh', width: '100%', overflow: 'hidden', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
              <div 
                onClick={() => {
                  const url = getLatestPlantImage(currentPlant.id);
                  if (url) {
                    setFullScreenImage({
                      url,
                      title: currentPlant.name,
                      phase: currentPlant.currentPhase,
                      days: differenceInDays(new Date(), new Date(currentPlant.dateGerminated))
                    });
                  }
                }}
                style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundImage: `url(${getLatestPlantImage(currentPlant.id) || ''})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: getLatestPlantImage(currentPlant.id) ? 'none' : 'brightness(0.3)',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  cursor: getLatestPlantImage(currentPlant.id) ? 'pointer' : 'default'
                }}
              />
              <button 
                className="btn" 
                onClick={() => setSelectedPlant(null)} 
                style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '0.5rem', borderRadius: '50%', zIndex: 10, background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff', backdropFilter: 'blur(5px)' }}
              >
                <ArrowLeft size={24} />
              </button>
              
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3rem 1.5rem 1.5rem', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)' }}>
                <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{currentPlant.name}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--info)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {t(`plants.phase_${currentPlant?.currentPhase?.toLowerCase() || 'unknown'}`, currentPlant.currentPhase)}
                  </span>
                  {currentPlant.strainName && (
                    <span style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Sprout size={12} /> {currentPlant.strainName}
                    </span>
                  )}
                  {currentPlant.environmentId && environments.find(e => e.id === currentPlant.environmentId) && (
                    <span style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <MapPin size={12} /> {environments.find(e => e.id === currentPlant.environmentId).name}
                    </span>
                  )}
                  <span style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Clock size={12} /> {t('plants.day', 'Day {{day}}', { day: differenceInDays(new Date(), new Date(currentPlant.dateGerminated)) })}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="flex-between text-xs text-info mb-3 font-semibold" style={{ letterSpacing: '0.05em' }}>
                  <span>{new Date().toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase()}</span>
                  <span>DAY {differenceInDays(new Date(), new Date(currentPlant.dateGerminated))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {Array.from({length: 7}).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - d.getDay() + i + 1);
                    const isToday = d.getDate() === new Date().getDate();
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', opacity: isToday ? 1 : 0.5 }}>
                        <span className="text-xs">{d.toLocaleString('default', { weekday: 'short' }).substring(0, 2)}</span>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isToday ? 'var(--primary)' : 'transparent', color: isToday ? '#fff' : 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {d.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '16px', background: 'var(--bg-glass)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <div onClick={() => setActiveTab('log')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: activeTab === 'log' ? 1 : 0.6, color: activeTab === 'log' ? 'var(--success)' : 'inherit' }}>
                    <Zap size={24} />
                    <span className="text-xs font-semibold">{t('plants.tab_action', 'Action')}</span>
                  </div>
                  <div onClick={() => setActiveTab('charts')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: activeTab === 'charts' ? 1 : 0.6, color: activeTab === 'charts' ? 'var(--info)' : 'inherit' }}>
                    <BarChart2 size={24} />
                    <span className="text-xs font-semibold">{t('plants.tab_log', 'Plant Log')}</span>
                  </div>
                  <div onClick={() => setActiveTab('settings')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: activeTab === 'settings' ? 1 : 0.6, color: activeTab === 'settings' ? 'var(--warning)' : 'inherit' }}>
                    <Settings size={24} />
                    <span className="text-xs font-semibold">{t('plants.tab_more', 'More')}</span>
                  </div>
                </div>
              </div>

              {currentPlant?.sensorConfig?.quickActions?.length > 0 && (
                <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '16px', background: 'var(--bg-glass)' }}>
                  <div className="text-xs text-muted mb-4 font-semibold tracking-wider flex-between">
                    <span>{t('plants.quick_actions', 'QUICK ACTIONS')}</span>
                    <Settings size={14} className="hover-opacity" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('settings')} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
                    {currentPlant.sensorConfig.quickActions.map(action => {
                      const IconComponent = IconMap[action.icon] || Zap;
                      const isSuccess = actionFeedback === action.id;
                      return (
                        <div key={action.id} onClick={() => handleQuickAction(action)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', transform: isSuccess ? 'scale(1.1)' : 'scale(1)' }}>
                          {isSuccess ? (
                            <Check size={28} className={`text-success`} />
                          ) : (
                            <IconComponent size={28} className={`text-${getActionColor(action.actionType)}`} />
                          )}
                          <span className="text-xs text-center" style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isSuccess ? t('plants.saved', 'Saved') : action.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1rem' }}>
                <div className="text-xs text-muted mb-3 font-semibold tracking-wider">{activeTab === 'log' ? t('plants.new_entry', 'NEW ENTRY') : activeTab === 'settings' ? t('plants.settings', 'SETTINGS') : t('plants.history', 'HISTORY')}</div>
            {activeTab === 'log' && (
              <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                  <input type="file" accept="image/*" ref={logImageInputRef} onChange={handleLogImageUpload} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div onClick={() => logImageInputRef.current.click()} style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                      {logImage ? <img src={logImage} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={24} className="text-muted" />}
                    </div>
                    {logImageFile && (
                      <button type="button" className="btn btn-secondary" onClick={handleSavePhotoOnly} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        {t('plants.save_photo_only', 'Save Photo Only')}
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-muted">{t('plants.quick_photo', 'Quick Photo (updates profile)')}</span>
                </div>

                <div>
                  <label className="text-sm text-muted mb-2 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                    <Droplet size={16} className="text-info" /> {t('plants.water_volume', 'Water Volume (Liters)')}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="range" min="0" max="5" step="0.1" value={logForm.waterVolume} onChange={(e) => setLogForm({...logForm, waterVolume: parseFloat(e.target.value)})} style={{ flex: 1 }} />
                    <span className="font-semibold" style={{ width: '40px', textAlign: 'right' }}>{logForm.waterVolume}L</span>
                  </div>
                </div>

                {(currentPlant.trackPH ?? true) && (
                  <div>
                    <label className="text-sm text-muted mb-2 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                      <Activity size={16} className="text-warning" /> {t('plants.ph_input', 'pH Input')}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="range" min="4.0" max="8.0" step="0.1" value={logForm.phInput} onChange={(e) => setLogForm({...logForm, phInput: parseFloat(e.target.value)})} style={{ flex: 1 }} />
                      <span className="font-semibold" style={{ width: '40px', textAlign: 'right' }}>{logForm.phInput}</span>
                    </div>
                  </div>
                )}

                {(currentPlant.trackEC ?? true) && (
                  <div>
                    <label className="text-sm text-muted mb-2 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                      <Activity size={16} className="text-primary" /> {t('plants.ec_input', 'EC Input')}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="range" min="0.0" max="3.0" step="0.1" value={logForm.ecInput} onChange={(e) => setLogForm({...logForm, ecInput: parseFloat(e.target.value)})} style={{ flex: 1 }} />
                      <span className="font-semibold" style={{ width: '40px', textAlign: 'right' }}>{logForm.ecInput}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm text-muted mb-2">{t('plants.nutrient_recipe', 'Nutrient Recipe')}</label>
                  <select className="input-premium" value={logForm.recipeId} onChange={(e) => setLogForm({...logForm, recipeId: e.target.value})}>
                    <option value="">{t('plants.none_water_only', 'None (Water only)')}</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {logForm.recipeId && (
                  <div className="glass p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                    <div className="flex-between mb-3">
                      <label className="text-sm text-primary font-semibold">{t('plants.calculator', 'Calculator')}</label>
                      <span className="text-xs text-muted">{t('plants.for_volume', 'For {{volume}}L', { volume: logForm.waterVolume })}</span>
                    </div>
                    
                    <div className="mb-4">
                      <label className="text-xs text-muted mb-2 flex-between">
                        <span>{t('plants.strength_scale', 'Strength Scale')}</span>
                        <span className="font-semibold text-info">{logForm.recipeScale}%</span>
                      </label>
                      <input type="range" min="10" max="200" step="10" value={logForm.recipeScale} onChange={(e) => setLogForm({...logForm, recipeScale: parseInt(e.target.value)})} style={{ width: '100%' }} />
                      <div className="flex-between text-xs text-muted mt-1" style={{ opacity: 0.6 }}>
                        <span>{t('plants.scale_seedling', 'Seedling (25%)')}</span>
                        <span>{t('plants.scale_normal', 'Normal (100%)')}</span>
                        <span>{t('plants.scale_heavy', 'Heavy (150%)')}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {recipes.find(r => r.id === logForm.recipeId)?.ingredients.map(ing => {
                        const amount = (ing.mlPerLiter * logForm.waterVolume * (logForm.recipeScale / 100)).toFixed(1);
                        return (
                          <div key={ing.productId} className="flex-between p-2" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            <span className="text-sm">{ing.name || t('plants.product', 'Product')}</span>
                            <span className="text-sm font-semibold text-success">{amount} ml</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>{t('plants.save_log', 'Save Log')}</button>
              </form>
            )}

            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <h3 className="text-md text-primary mb-3">{t('plants.general_profile', 'General Profile')}</h3>
                  <div className="mb-3">
                    <label className="text-xs text-muted mb-1 block">{t('plants.plant_name', 'Plant Name')}</label>
                    <input type="text" className="input-premium" value={currentPlant.name} onChange={(e) => updatePlant(currentPlant.id, { name: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="text-xs text-muted mb-1 block">{t('plants.strain_name', 'Strain Name')}</label>
                    <input type="text" className="input-premium" value={currentPlant.strainName} onChange={(e) => updatePlant(currentPlant.id, { strainName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1 block">{t('plants.current_phase', 'Current Phase')}</label>
                    <select className="input-premium" value={currentPlant.currentPhase} onChange={(e) => updatePlant(currentPlant.id, { currentPhase: e.target.value })}>
                      {Object.values(PlantPhase).map(p => <option key={p} value={p}>{t(`plants.phase_${p.toLowerCase()}`, p)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <h3 className="text-md text-primary mb-3">{t('plants.tracking_features', 'Tracking Features')}</h3>
                  <div className="flex-between mb-3">
                    <span className="text-sm font-semibold">{t('plants.track_ec', 'Track EC')}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={currentPlant.trackEC ?? true} onChange={(e) => updatePlant(currentPlant.id, { trackEC: e.target.checked })} />
                    </label>
                  </div>
                  <div className="flex-between mb-3">
                    <span className="text-sm font-semibold">{t('plants.track_ph', 'Track pH')}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={currentPlant.trackPH ?? true} onChange={(e) => updatePlant(currentPlant.id, { trackPH: e.target.checked })} />
                    </label>
                  </div>
                  <div className="flex-between">
                    <span className="text-sm font-semibold">{t('plants.soil_sensor_installed', 'Soil Sensor Installed')}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={currentPlant.hasSoilMoistureSensor} onChange={(e) => toggleMoistureSensor(currentPlant.id, e.target.checked)} />
                    </label>
                  </div>
                  {currentPlant.hasSoilMoistureSensor && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <label className="text-xs text-muted mb-1 block">{t('plants.soil_moisture_entity', 'Soil Moisture Sensor Entity ID')}</label>
                        <input type="text" className="input-premium" value={currentPlant.sensorConfig?.soilMoisture || ''} onChange={(e) => updatePlant(currentPlant.id, { sensorConfig: { ...(currentPlant.sensorConfig || {}), soilMoisture: e.target.value } })} placeholder="sensor.moisture_1" />
                      </div>
                      <div>
                        <label className="text-xs text-muted mb-1 block">{t('plants.soil_temp_entity', 'Soil Temperature Sensor Entity ID')}</label>
                        <input type="text" className="input-premium" value={currentPlant.sensorConfig?.soilTemp || ''} onChange={(e) => updatePlant(currentPlant.id, { sensorConfig: { ...(currentPlant.sensorConfig || {}), soilTemp: e.target.value } })} placeholder="sensor.temp_1" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex-between mb-3">
                    <h3 className="text-md text-primary m-0">{t('plants.quick_actions', 'Quick Actions')}</h3>
                    <button className="btn btn-secondary" onClick={handleAddQuickAction} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                      <Plus size={16} className="mr-1" /> {t('plants.add', 'Add')}
                    </button>
                  </div>
                  
                  {editingQuickAction ? (
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                      <div className="mb-3">
                        <label className="text-xs text-muted mb-1 block">{t('plants.label', 'Label')}</label>
                        <input type="text" className="input-premium" value={editingQuickAction.label} onChange={(e) => setEditingQuickAction({...editingQuickAction, label: e.target.value})} />
                      </div>
                      <div className="flex-between gap-2 mb-3">
                        <div style={{ flex: 1 }}>
                          <label className="text-xs text-muted mb-1 block">{t('plants.icon', 'Icon')}</label>
                          <select className="input-premium" value={editingQuickAction.icon} onChange={(e) => setEditingQuickAction({...editingQuickAction, icon: e.target.value})}>
                            <option value="Droplet">Droplet</option>
                            <option value="FileText">FileText</option>
                            <option value="Bug">Bug</option>
                            <option value="Scissors">Scissors</option>
                            <option value="Activity">Activity</option>
                            <option value="Zap">Zap</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="text-xs text-muted mb-1 block">{t('plants.action_type', 'Action Type')}</label>
                          <select className="input-premium" value={editingQuickAction.actionType} onChange={(e) => setEditingQuickAction({...editingQuickAction, actionType: e.target.value})}>
                            <option value="water">{t('plants.action_water', 'Water')}</option>
                            <option value="nutrients">{t('plants.action_nutrients', 'Nutrients')}</option>
                            <option value="bug">{t('plants.action_bug', 'Bug Treatment')}</option>
                            <option value="trim">{t('plants.action_trim', 'Pruning')}</option>
                            <option value="other">{t('plants.action_other', 'Custom')}</option>
                          </select>
                        </div>
                      </div>
                      {(editingQuickAction.actionType === 'water' || editingQuickAction.actionType === 'nutrients') && (
                        <div className="flex-between gap-2 mb-3">
                          <div style={{ flex: 1 }}>
                            <label className="text-xs text-muted mb-1 block">{t('plants.water_volume', 'Water Volume (Liters)')}</label>
                            <input type="number" step="0.1" className="input-premium" value={editingQuickAction.waterVolumeLiters} onChange={(e) => setEditingQuickAction({...editingQuickAction, waterVolumeLiters: parseFloat(e.target.value) || 0})} />
                          </div>
                          {editingQuickAction.actionType === 'nutrients' && (
                            <div style={{ flex: 1 }}>
                              <label className="text-xs text-muted mb-1 block">{t('plants.nutrient_recipe', 'Nutrient Recipe')}</label>
                              <select className="input-premium" value={editingQuickAction.recipeId || ''} onChange={(e) => setEditingQuickAction({...editingQuickAction, recipeId: e.target.value})}>
                                <option value="">{t('plants.none', '(None)')}</option>
                                {recipes.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mb-3">
                        <label className="text-xs text-muted mb-1 block">{t('plants.notes', 'Notes')}</label>
                        <input type="text" className="input-premium" value={editingQuickAction.notes} onChange={(e) => setEditingQuickAction({...editingQuickAction, notes: e.target.value})} />
                      </div>
                      <div className="flex-between">
                        <button className="btn btn-secondary" onClick={() => setEditingQuickAction(null)}>{t('plants.cancel', 'Cancel')}</button>
                        <button className="btn btn-primary" onClick={handleSaveQuickAction}>{t('plants.save_action', 'Save Action')}</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {currentPlant?.sensorConfig?.quickActions?.map(action => {
                        const IconComponent = IconMap[action.icon] || Zap;
                        return (
                          <div key={action.id} className="flex-between" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <IconComponent size={20} className={`text-${getActionColor(action.actionType)}`} />
                              <div>
                                <div className="text-sm font-semibold">{action.label}</div>
                                <div className="text-xs text-muted">
                                  {(action.actionType === 'water' || action.actionType === 'nutrients') && `${action.waterVolumeLiters}L • `}
                                  {action.notes}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-secondary" onClick={() => setEditingQuickAction(action)} style={{ padding: '4px 8px' }}><Edit size={14} /></button>
                              <button className="btn btn-error" onClick={() => handleDeleteQuickAction(action.id)} style={{ padding: '4px 8px' }}><Trash2 size={14} /></button>
                            </div>
                          </div>
                        );
                      })}
                      {(!currentPlant?.sensorConfig?.quickActions || currentPlant.sensorConfig.quickActions.length === 0) && (
                        <div className="text-xs text-muted text-center py-2">{t('plants.no_quick_actions', 'No quick actions defined.')}</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="glass mb-6" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255, 0.1)' }}>
                  <button className="btn btn-primary w-full" onClick={() => {
                    fetchPlantSensorStates();
                    // Additional visual feedback could be added here if needed
                  }}>
                    {t('plants.save_sync', 'Save Settings & Sync Sensors')}
                  </button>
                </div>

                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--error-rgb), 0.3)' }}>
                  <h3 className="text-md text-error mb-2">{t('plants.danger_zone', 'Danger Zone')}</h3>
                  <p className="text-sm text-muted mb-4">{t('plants.delete_warning', 'Deleting this plant will permanently remove all of its logs, photos, and history.')}</p>
                  <button className="btn btn-error w-full" onClick={() => {
                    if (window.confirm(t('plants.delete_confirm', "Are you absolutely sure you want to delete this plant and all its data?"))) {
                      deletePlant(currentPlant.id);
                      setSelectedPlant(null);
                    }
                  }}>
                    {t('plants.delete_plant', 'Delete Plant')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'charts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div className="flex-center" style={{ background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                  <button className={`btn ${historyTab === 'actions' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }} onClick={() => setHistoryTab('actions')}>
                    {t('plants.recent_actions', 'Recent Actions')}
                  </button>
                  <button className={`btn ${historyTab === 'sensors' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }} onClick={() => setHistoryTab('sensors')}>
                    {t('plants.sensor_history', 'Sensor History')}
                  </button>
                </div>

                {historyTab === 'actions' && (
                  <div>
                    {plantLogs.length === 0 ? (
                      <div className="text-muted text-sm p-4 glass" style={{ borderRadius: 'var(--radius-md)', textAlign: 'center' }}>{t('plants.no_logs', 'No logs recorded yet.')}</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {plantLogs.map(log => {
                          const date = new Date(log.timestamp);
                          return (
                            <div key={log.id} onClick={() => setSelectedLog(log)} className="glass hover-opacity" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                              <div className="flex-between mb-1">
                                <span className="text-xs text-muted">{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {log.waterVolumeLiters > 0 && <span className="text-xs font-semibold text-info">{log.waterVolumeLiters}L {t('plants.water', 'Water')}</span>}
                              </div>
                              <div className="flex-between">
                                <span className="text-sm">
                                  {log.notes && log.notes.includes('|~|') 
                                    ? log.notes.split('|~|')[0] 
                                    : (log.waterVolumeLiters > 0 ? t('plants.water_feed', 'Watering / Feed') : (log.notes || t('plants.action', 'Action')))}
                                </span>
                                <span className="text-xs">
                                  {log.phInput != null && `pH: ${log.phInput}`}
                                  {log.phInput != null && log.ecInput != null && ' | '}
                                  {log.ecInput != null && `EC: ${log.ecInput}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {historyTab === 'sensors' && (
                  <div>
                    {!currentPlant.hasSoilMoistureSensor ? (
                      <div className="text-center text-muted p-4 glass" style={{ borderRadius: 'var(--radius-md)' }}>{t('plants.sensor_disabled', 'Soil sensor is disabled. Enable it in Settings to see charts.')}</div>
                    ) : (!currentPlant.history || currentPlant.history.length === 0) ? (
                      <div className="text-center text-muted p-4 glass" style={{ borderRadius: 'var(--radius-md)' }}>{t('plants.no_sensor_history', 'No sensor history available yet.')}</div>
                    ) : (
                      <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ height: '180px', width: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={currentPlant.history} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickMargin={5} />
                              <YAxis yAxisId="left" stroke="var(--info)" fontSize={10} />
                              <YAxis yAxisId="right" orientation="right" stroke="var(--warning)" fontSize={10} />
                              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                              <Line yAxisId="left" type="monotone" dataKey="moisture" name={t('plants.moisture_percent', 'Moisture %')} stroke="var(--info)" strokeWidth={2} dot={false} />
                              <Line yAxisId="right" type="monotone" dataKey="temp" name={t('plants.soil_temp', 'Soil Temp')} stroke="var(--warning)" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAddModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem 1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-6">
              <h2>{t('plants.add_new_plant', 'Add New Plant')}</h2>
              <button className="btn btn-secondary" type="button" onClick={closeAddModal} style={{ padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddPlant} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                <div onClick={() => fileInputRef.current.click()} style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                  {newPlant.image ? <img src={newPlant.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={32} className="text-muted" />}
                </div>
                <span className="text-xs text-muted">{t('plants.upload_photo_opt', 'Upload Photo (Optional)')}</span>
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">{t('plants.plant_name_id', 'Plant Name / ID')}</label>
                <input type="text" className="input-premium" value={newPlant.name} onChange={e => setNewPlant({...newPlant, name: e.target.value})} placeholder="e.g. KES #3" required />
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">{t('plants.assign_to_tent', 'Assign to Tent')}</label>
                <select className="input-premium" value={newPlant.environmentId} onChange={e => setNewPlant({...newPlant, environmentId: e.target.value})} required>
                  <option value="" disabled>{t('plants.select_environment', 'Select Environment...')}</option>
                  {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <label className="text-sm text-muted mb-2 block">{t('plants.strain_search_db', 'Strain Search (Offline DB)')}</label>
                <div className="input-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem' }}>
                  <Search size={16} className="text-muted" />
                  <input type="text" style={{ flex: 1, background: 'transparent', border: 'none', color: 'inherit', outline: 'none', padding: '0.75rem 0' }} value={strainQuery} onChange={e => handleStrainSearch(e.target.value)} placeholder={t('plants.search_strain', 'Search strain...')} />
                </div>
                {strainQuery && !newPlant.strainName && strainResults.length > 0 && (
                  <div className="glass" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: '0.25rem', borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {strainResults.map(strain => (
                      <div key={strain.name} onClick={() => handleStrainSelect(strain)} style={{ padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                        <div className="font-semibold text-sm">{strain.name}</div>
                        <div className="text-xs text-primary" style={{ marginBottom: '2px' }}>{t(`plants.strain_type_${strain.type.toLowerCase()}`, strain.type)} {strain.flowerDays ? `• ${strain.flowerDays} ${t('plants.days', 'Days')}` : ''} {strain.feminized === 'Feminized' ? `• ${t('plants.fem', 'Fem')}` : ''}</div>
                        {(strain.breeder || strain.parents) && (
                          <div className="text-xs text-muted" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', opacity: 0.8 }}>
                            {strain.breeder && <span>{t('plants.breeder', 'Breeder:')} {strain.breeder}</span>}
                            {strain.breeder && strain.parents && <span>|</span>}
                            {strain.parents && <span>{t('plants.genetics', 'Genetics:')} {strain.parents}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {strainQuery && !newPlant.strainName && strainResults.length === 0 && (
                  <div className="glass" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: '0.25rem', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                    <div className="text-xs text-muted p-2">{t('plants.no_strains', 'No strains found. Type manually.')}</div>
                  </div>
                )}
              </div>

              {/* Show manual input if search isn't enough */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 2 }}>
                  <label className="text-sm text-muted mb-2 block">{t('plants.strain_name', 'Strain Name')}</label>
                  <input type="text" className="input-premium" value={newPlant.strainName} onChange={e => setNewPlant({...newPlant, strainName: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="text-sm text-muted mb-2 block">{t('plants.type', 'Type')}</label>
                  <select className="input-premium" value={newPlant.strainType} onChange={e => setNewPlant({...newPlant, strainType: e.target.value})}>
                    {Object.values(StrainType).map(t_val => <option key={t_val} value={t_val}>{t(`plants.strain_type_${t_val.toLowerCase()}`, t_val)}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>{t('plants.create_plant', 'Create Plant')}</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {selectedLog && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem 1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-6">
              <h2>{selectedLog.notes && selectedLog.notes.includes('|~|') ? selectedLog.notes.split('|~|')[0] : t('plants.action_log_details', 'Action Log Details')}</h2>
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)} style={{ padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-muted mb-1">{t('plants.date_time', 'Date & Time')}</div>
              <div className="font-semibold">{new Date(selectedLog.timestamp).toLocaleString()}</div>
            </div>

            {(selectedLog.waterVolumeLiters > 0 || selectedLog.phInput != null || selectedLog.ecInput != null) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div className="text-xs text-muted mb-1">{t('plants.water_volume_short', 'Water Volume')}</div>
                  <div className="text-lg font-bold text-info">{selectedLog.waterVolumeLiters || 0} L</div>
                </div>
                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div className="text-xs text-muted mb-1">{t('plants.ph_ec', 'pH / EC')}</div>
                  <div className="text-lg font-bold">
                    {selectedLog.phInput != null ? selectedLog.phInput : '--'} / {selectedLog.ecInput != null ? selectedLog.ecInput : '--'}
                  </div>
                </div>
              </div>
            )}

            {selectedLog.waterVolumeLiters > 0 && (
              <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <h3 className="text-sm text-primary mb-3">{t('plants.nutrient_mix', 'Nutrient Mix')}</h3>
                {(() => {
                  if (!selectedLog.appliedRecipeId) return <div className="text-sm text-muted">{t('plants.plain_water', 'Plain Water (No nutrients added)')}</div>;
                  
                  const recipe = recipes.find(r => r.id === selectedLog.appliedRecipeId);
                  if (!recipe) return <div className="text-sm text-muted">{t('plants.unknown_recipe', 'Unknown Recipe (Deleted)')}</div>;

                  return (
                    <div>
                      <div className="flex-between mb-2">
                        <span className="font-semibold">{recipe.name}</span>
                        <span className="text-xs text-accent bg-glass px-2 py-1" style={{ borderRadius: '4px' }}>{t('plants.scale', 'Scale:')} {selectedLog.recipeScale}%</span>
                      </div>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        {recipe.ingredients.map(ing => {
                          const amount = (ing.mlPerLiter * selectedLog.waterVolumeLiters * (selectedLog.recipeScale / 100)).toFixed(1);
                          return (
                            <li key={ing.productId} className="flex-between text-sm" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                              <span>{ing.name}</span>
                              <span className="font-semibold text-success">{amount} ml</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })()}
              </div>
            )}

            {selectedLog.notes && (selectedLog.notes.includes('|~|') ? selectedLog.notes.split('|~|')[1] : selectedLog.notes).trim() !== '' && (
              <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h3 className="text-sm text-primary mb-2">{t('plants.notes', 'Notes')}</h3>
                <p className="text-sm whitespace-pre-wrap">{selectedLog.notes.includes('|~|') ? selectedLog.notes.split('|~|')[1] : selectedLog.notes}</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {fullScreenImage && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.95)', 
          backdropFilter: 'blur(10px)', 
          zIndex: 2000, 
          display: 'flex', 
          flexDirection: 'column'
        }}>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setFullScreenImage(null)} style={{ padding: '0.5rem', borderRadius: '50%' }}>
              <X size={24} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
            <img 
              src={fullScreenImage.url} 
              alt="Full size" 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} 
            />
          </div>
          <div style={{ padding: '2rem 1rem', background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)' }}>
            <h2 className="text-lg mb-4">{fullScreenImage.title}</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div className="glass flex-center" style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', gap: '6px' }}>
                <Calendar size={14} className="text-info" />
                <span className="text-xs font-semibold">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="glass flex-center" style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', gap: '6px' }}>
                <Tag size={14} className="text-primary" />
                <span className="text-xs font-semibold">{t('plants.day', 'Day {{day}}', { day: fullScreenImage.days })}</span>
              </div>
              {fullScreenImage.phase && (
                <div className="glass flex-center" style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', gap: '6px' }}>
                  <Sprout size={14} className="text-accent" />
                  <span className="text-xs font-semibold">{fullScreenImage.phase}</span>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

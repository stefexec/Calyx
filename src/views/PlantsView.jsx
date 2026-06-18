import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import usePlantStore, { PlantPhase, StrainType } from '../store/usePlantStore';
import useGrowLogStore from '../store/useGrowLogStore';
import useGalleryStore from '../store/useGalleryStore';
import useNutrientStore from '../store/useNutrientStore';
import useEnvironmentStore from '../store/useEnvironmentStore';
import { fetchApi } from '../utils/api';
import { Plus, Droplet, Activity, X, Camera, Search, Settings, FileText, BarChart2 } from 'lucide-react';
import { differenceInDays, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function PlantsView() {
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
  const fileInputRef = useRef(null);

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
      const results = await fetchApi(`/settings/strains/search?q=${encodeURIComponent(query)}`);
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
        <h1>Plants</h1>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => setShowAddModal(true)}>
          <Plus size={20} /> <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}>Add Plant</span>
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
                <span className="text-xs text-primary font-semibold">{plant.currentPhase}</span>
                <span className="text-xs">Day {daysSinceGermination}</span>
              </div>
            </div>
          )
        })}
      </div>

      {selectedPlant && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem 1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-4" style={{ alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {getLatestPlantImage(currentPlant.id) ? (
                  <div 
                    onClick={() => setFullScreenImage(getLatestPlantImage(currentPlant.id))}
                    style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                    className="hover-opacity"
                  >
                    <img src={getLatestPlantImage(currentPlant.id)} alt={currentPlant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border)' }}>
                    <span style={{ fontSize: '1.5rem' }}>🪴</span>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', lineHeight: 1.2 }}>{currentPlant.name}</h2>
                  <span className="text-xs text-muted font-semibold">{currentPlant.strainName || 'Unknown Strain'}</span>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedPlant(null)} style={{ padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            
            <div className="flex-center mb-6" style={{ background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
              <button className={`btn ${activeTab === 'log' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => setActiveTab('log')}>
                <FileText size={16} className="mr-2" /> Log
              </button>
              <button className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => setActiveTab('settings')}>
                <Settings size={16} className="mr-2" /> Settings
              </button>
              <button className={`btn ${activeTab === 'charts' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => setActiveTab('charts')}>
                <BarChart2 size={16} className="mr-2" /> History
              </button>
            </div>

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
                        Save Photo Only
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-muted">Quick Photo (updates profile)</span>
                </div>

                <div>
                  <label className="text-sm text-muted mb-2 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                    <Droplet size={16} className="text-info" /> Water Volume (Liters)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input type="range" min="0" max="5" step="0.1" value={logForm.waterVolume} onChange={(e) => setLogForm({...logForm, waterVolume: parseFloat(e.target.value)})} style={{ flex: 1 }} />
                    <span className="font-semibold" style={{ width: '40px', textAlign: 'right' }}>{logForm.waterVolume}L</span>
                  </div>
                </div>

                {(currentPlant.trackPH ?? true) && (
                  <div>
                    <label className="text-sm text-muted mb-2 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                      <Activity size={16} className="text-warning" /> pH Input
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
                      <Activity size={16} className="text-primary" /> EC Input
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="range" min="0.0" max="3.0" step="0.1" value={logForm.ecInput} onChange={(e) => setLogForm({...logForm, ecInput: parseFloat(e.target.value)})} style={{ flex: 1 }} />
                      <span className="font-semibold" style={{ width: '40px', textAlign: 'right' }}>{logForm.ecInput}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm text-muted mb-2">Nutrient Recipe</label>
                  <select className="input-premium" value={logForm.recipeId} onChange={(e) => setLogForm({...logForm, recipeId: e.target.value})}>
                    <option value="">None (Water only)</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {logForm.recipeId && (
                  <div className="glass p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                    <div className="flex-between mb-3">
                      <label className="text-sm text-primary font-semibold">Calculator</label>
                      <span className="text-xs text-muted">For {logForm.waterVolume}L</span>
                    </div>
                    
                    <div className="mb-4">
                      <label className="text-xs text-muted mb-2 flex-between">
                        <span>Strength Scale</span>
                        <span className="font-semibold text-info">{logForm.recipeScale}%</span>
                      </label>
                      <input type="range" min="10" max="200" step="10" value={logForm.recipeScale} onChange={(e) => setLogForm({...logForm, recipeScale: parseInt(e.target.value)})} style={{ width: '100%' }} />
                      <div className="flex-between text-xs text-muted mt-1" style={{ opacity: 0.6 }}>
                        <span>Seedling (25%)</span>
                        <span>Normal (100%)</span>
                        <span>Heavy (150%)</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {recipes.find(r => r.id === logForm.recipeId)?.ingredients.map(ing => {
                        const amount = (ing.mlPerLiter * logForm.waterVolume * (logForm.recipeScale / 100)).toFixed(1);
                        return (
                          <div key={ing.productId} className="flex-between p-2" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            <span className="text-sm">{ing.name || 'Product'}</span>
                            <span className="text-sm font-semibold text-success">{amount} ml</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>Save Log</button>
              </form>
            )}

            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <h3 className="text-md text-primary mb-3">General Profile</h3>
                  <div className="mb-3">
                    <label className="text-xs text-muted mb-1 block">Plant Name</label>
                    <input type="text" className="input-premium" value={currentPlant.name} onChange={(e) => updatePlant(currentPlant.id, { name: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="text-xs text-muted mb-1 block">Strain Name</label>
                    <input type="text" className="input-premium" value={currentPlant.strainName} onChange={(e) => updatePlant(currentPlant.id, { strainName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1 block">Current Phase</label>
                    <select className="input-premium" value={currentPlant.currentPhase} onChange={(e) => updatePlant(currentPlant.id, { currentPhase: e.target.value })}>
                      {Object.values(PlantPhase).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <h3 className="text-md text-primary mb-3">Tracking Features</h3>
                  <div className="flex-between mb-3">
                    <span className="text-sm font-semibold">Track EC</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={currentPlant.trackEC ?? true} onChange={(e) => updatePlant(currentPlant.id, { trackEC: e.target.checked })} />
                    </label>
                  </div>
                  <div className="flex-between mb-3">
                    <span className="text-sm font-semibold">Track pH</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={currentPlant.trackPH ?? true} onChange={(e) => updatePlant(currentPlant.id, { trackPH: e.target.checked })} />
                    </label>
                  </div>
                  <div className="flex-between">
                    <span className="text-sm font-semibold">Soil Sensor Installed</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={currentPlant.hasSoilMoistureSensor} onChange={(e) => toggleMoistureSensor(currentPlant.id, e.target.checked)} />
                    </label>
                  </div>
                  {currentPlant.hasSoilMoistureSensor && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <label className="text-xs text-muted mb-1 block">Soil Moisture Sensor Entity ID</label>
                        <input type="text" className="input-premium" value={currentPlant.sensorConfig?.soilMoisture || ''} onChange={(e) => updatePlant(currentPlant.id, { sensorConfig: { ...(currentPlant.sensorConfig || {}), soilMoisture: e.target.value } })} placeholder="sensor.moisture_1" />
                      </div>
                      <div>
                        <label className="text-xs text-muted mb-1 block">Soil Temperature Sensor Entity ID</label>
                        <input type="text" className="input-premium" value={currentPlant.sensorConfig?.soilTemp || ''} onChange={(e) => updatePlant(currentPlant.id, { sensorConfig: { ...(currentPlant.sensorConfig || {}), soilTemp: e.target.value } })} placeholder="sensor.temp_1" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass mb-6" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255, 0.1)' }}>
                  <button className="btn btn-primary w-full" onClick={() => {
                    fetchPlantSensorStates();
                    // Additional visual feedback could be added here if needed
                  }}>
                    Save Settings & Sync Sensors
                  </button>
                </div>

                <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--error-rgb), 0.3)' }}>
                  <h3 className="text-md text-error mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted mb-4">Deleting this plant will permanently remove all of its logs, photos, and history.</p>
                  <button className="btn btn-error w-full" onClick={() => {
                    if (window.confirm("Are you absolutely sure you want to delete this plant and all its data?")) {
                      deletePlant(currentPlant.id);
                      setSelectedPlant(null);
                    }
                  }}>
                    Delete Plant
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'charts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div className="flex-center" style={{ background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                  <button className={`btn ${historyTab === 'actions' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }} onClick={() => setHistoryTab('actions')}>
                    Recent Actions
                  </button>
                  <button className={`btn ${historyTab === 'sensors' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }} onClick={() => setHistoryTab('sensors')}>
                    Sensor History
                  </button>
                </div>

                {historyTab === 'actions' && (
                  <div>
                    {plantLogs.length === 0 ? (
                      <div className="text-muted text-sm p-4 glass" style={{ borderRadius: 'var(--radius-md)', textAlign: 'center' }}>No logs recorded yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {plantLogs.map(log => {
                          const date = new Date(log.timestamp);
                          return (
                            <div key={log.id} onClick={() => setSelectedLog(log)} className="glass hover-opacity" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                              <div className="flex-between mb-1">
                                <span className="text-xs text-muted">{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <span className="text-xs font-semibold text-info">{log.waterVolumeLiters}L Water</span>
                              </div>
                              <div className="flex-between">
                                <span className="text-sm">Watering / Feed</span>
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
                      <div className="text-center text-muted p-4 glass" style={{ borderRadius: 'var(--radius-md)' }}>Soil sensor is disabled. Enable it in Settings to see charts.</div>
                    ) : (!currentPlant.history || currentPlant.history.length === 0) ? (
                      <div className="text-center text-muted p-4 glass" style={{ borderRadius: 'var(--radius-md)' }}>No sensor history available yet.</div>
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
                              <Line yAxisId="left" type="monotone" dataKey="moisture" name="Moisture %" stroke="var(--info)" strokeWidth={2} dot={false} />
                              <Line yAxisId="right" type="monotone" dataKey="temp" name="Soil Temp" stroke="var(--warning)" strokeWidth={2} dot={false} />
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
        </div>,
        document.body
      )}

      {showAddModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem 1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-6">
              <h2>Add New Plant</h2>
              <button className="btn btn-secondary" type="button" onClick={closeAddModal} style={{ padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddPlant} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                <div onClick={() => fileInputRef.current.click()} style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                  {newPlant.image ? <img src={newPlant.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={32} className="text-muted" />}
                </div>
                <span className="text-xs text-muted">Upload Photo (Optional)</span>
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">Plant Name / ID</label>
                <input type="text" className="input-premium" value={newPlant.name} onChange={e => setNewPlant({...newPlant, name: e.target.value})} placeholder="e.g. KES #3" required />
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">Assign to Tent</label>
                <select className="input-premium" value={newPlant.environmentId} onChange={e => setNewPlant({...newPlant, environmentId: e.target.value})} required>
                  <option value="" disabled>Select Environment...</option>
                  {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <label className="text-sm text-muted mb-2 block">Strain Search (Offline DB)</label>
                <div className="input-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem' }}>
                  <Search size={16} className="text-muted" />
                  <input type="text" style={{ flex: 1, background: 'transparent', border: 'none', color: 'inherit', outline: 'none', padding: '0.75rem 0' }} value={strainQuery} onChange={e => handleStrainSearch(e.target.value)} placeholder="Search strain..." />
                </div>
                {strainQuery && !newPlant.strainName && strainResults.length > 0 && (
                  <div className="glass" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: '0.25rem', borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {strainResults.map(strain => (
                      <div key={strain.name} onClick={() => handleStrainSelect(strain)} style={{ padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                        <div className="font-semibold text-sm">{strain.name}</div>
                        <div className="text-xs text-primary" style={{ marginBottom: '2px' }}>{strain.type} {strain.flowerDays ? `• ${strain.flowerDays} Days` : ''} {strain.feminized === 'Feminized' ? '• Fem' : ''}</div>
                        {(strain.breeder || strain.parents) && (
                          <div className="text-xs text-muted" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', opacity: 0.8 }}>
                            {strain.breeder && <span>Breeder: {strain.breeder}</span>}
                            {strain.breeder && strain.parents && <span>|</span>}
                            {strain.parents && <span>Genetics: {strain.parents}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {strainQuery && !newPlant.strainName && strainResults.length === 0 && (
                  <div className="glass" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: '0.25rem', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
                    <div className="text-xs text-muted p-2">No strains found. Type manually.</div>
                  </div>
                )}
              </div>

              {/* Show manual input if search isn't enough */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 2 }}>
                  <label className="text-sm text-muted mb-2 block">Strain Name</label>
                  <input type="text" className="input-premium" value={newPlant.strainName} onChange={e => setNewPlant({...newPlant, strainName: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="text-sm text-muted mb-2 block">Type</label>
                  <select className="input-premium" value={newPlant.strainType} onChange={e => setNewPlant({...newPlant, strainType: e.target.value})}>
                    {Object.values(StrainType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>Create Plant</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {selectedLog && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem 1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-6">
              <h2>Action Log Details</h2>
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)} style={{ padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-muted mb-1">Date & Time</div>
              <div className="font-semibold">{new Date(selectedLog.timestamp).toLocaleString()}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs text-muted mb-1">Water Volume</div>
                <div className="text-lg font-bold text-info">{selectedLog.waterVolumeLiters} L</div>
              </div>
              <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div className="text-xs text-muted mb-1">pH / EC</div>
                <div className="text-lg font-bold">
                  {selectedLog.phInput != null ? selectedLog.phInput : '--'} / {selectedLog.ecInput != null ? selectedLog.ecInput : '--'}
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <h3 className="text-sm text-primary mb-3">Nutrient Mix</h3>
              {(() => {
                if (!selectedLog.appliedRecipeId) return <div className="text-sm text-muted">Plain Water (No nutrients added)</div>;
                
                const recipe = recipes.find(r => r.id === selectedLog.appliedRecipeId);
                if (!recipe) return <div className="text-sm text-muted">Unknown Recipe (Deleted)</div>;

                return (
                  <div>
                    <div className="flex-between mb-2">
                      <span className="font-semibold">{recipe.name}</span>
                      <span className="text-xs text-accent bg-glass px-2 py-1" style={{ borderRadius: '4px' }}>Scale: {selectedLog.recipeScale}%</span>
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

            {selectedLog.notes && (
              <div className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h3 className="text-sm text-primary mb-2">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{selectedLog.notes}</p>
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
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem', paddingBottom: '2rem' }}>
            <img 
              src={fullScreenImage} 
              alt="Full size" 
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} 
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

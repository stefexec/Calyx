import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import usePlantStore, { PlantPhase, StrainType } from '../store/usePlantStore';
import useGrowLogStore from '../store/useGrowLogStore';
import useNutrientStore from '../store/useNutrientStore';
import useEnvironmentStore from '../store/useEnvironmentStore';
import { Plus, Droplet, Activity, X, Camera, Search, Settings, FileText, BarChart2 } from 'lucide-react';
import { differenceInDays, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function PlantsView() {
  const { plants, addPlant, updatePlant, toggleMoistureSensor } = usePlantStore();
  const { logs, addLog } = useGrowLogStore();
  const { recipes } = useNutrientStore();
  const { environments } = useEnvironmentStore();
  
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [activeTab, setActiveTab] = useState('log');
  const [logForm, setLogForm] = useState({ waterVolume: 1.0, phInput: 6.2, ecInput: 1.2, recipeId: '' });
  const [logImage, setLogImage] = useState(null);
  const logImageInputRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlant, setNewPlant] = useState({ name: '', environmentId: '', strainName: '', strainType: StrainType.PHOTOPERIODIC, image: null });
  const [strainQuery, setStrainQuery] = useState('');
  const fileInputRef = useRef(null);

  const mockStrainDb = [
    { name: 'Super Lemon Haze', type: StrainType.PHOTOPERIODIC, flowerDays: 70 },
    { name: 'Northern Lights Auto', type: StrainType.AUTOFLOWER, flowerDays: 55 },
    { name: 'White Widow', type: StrainType.PHOTOPERIODIC, flowerDays: 60 }
  ];

  const currentPlant = selectedPlant ? plants.find(p => p.id === selectedPlant.id) || selectedPlant : null;

  const handleLogSubmit = (e) => {
    e.preventDefault();
    if (!currentPlant) return;
    
    addLog({
      plantId: currentPlant.id,
      waterVolumeLiters: logForm.waterVolume,
      phInput: (currentPlant.trackPH ?? true) ? logForm.phInput : null,
      ecInput: (currentPlant.trackEC ?? true) ? logForm.ecInput : null,
      appliedRecipeId: logForm.recipeId
    });
    
    // Auto-update profile picture if a new photo was uploaded during log
    if (logImage) {
      updatePlant(currentPlant.id, { image: logImage });
    }
    
    setActiveTab('charts'); // switch to history tab so they see it
    setLogImage(null);
  };

  const plantLogs = currentPlant ? logs.filter(l => l.plantId === currentPlant.id) : [];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPlant({...newPlant, image: reader.result});
      reader.readAsDataURL(file);
    }
  };

  const handleLogImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleStrainSelect = (strain) => {
    setNewPlant({...newPlant, strainName: strain.name, strainType: strain.type});
    setStrainQuery(strain.name);
  };

  const handleAddPlant = (e) => {
    e.preventDefault();
    addPlant({
      id: crypto.randomUUID(),
      ...newPlant,
      dateGerminated: startOfDay(new Date()).toISOString(),
      dateFlippedToFlower: null,
      currentPhase: PlantPhase.SEEDLING
    });
    setShowAddModal(false);
    setNewPlant({ name: '', environmentId: '', strainName: '', strainType: StrainType.PHOTOPERIODIC, image: null });
    setStrainQuery('');
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
          return (
            <div key={plant.id} className="glass-card interactive" onClick={() => { setSelectedPlant(plant); setActiveTab('log'); setLogImage(null); }} style={{ cursor: 'pointer' }}>
              <div style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {plant.image ? (
                  <img src={plant.image} alt={plant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '3rem' }}>🪴</span>
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
            <div className="flex-between mb-4">
              <h2>{currentPlant.name}</h2>
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
                  <div onClick={() => logImageInputRef.current.click()} style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                    {logImage ? <img src={logImage} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={24} className="text-muted" />}
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
                </div>
              </div>
            )}

            {activeTab === 'charts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Recent Logs Section */}
                <div>
                  <h3 className="mb-3 text-md flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                    <FileText size={18} className="text-primary" /> Recent Actions
                  </h3>
                  {plantLogs.length === 0 ? (
                    <div className="text-muted text-sm p-4 glass" style={{ borderRadius: 'var(--radius-md)', textAlign: 'center' }}>No logs recorded yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {plantLogs.map(log => {
                        const date = new Date(log.timestamp);
                        return (
                          <div key={log.id} className="glass" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
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

                {/* Sensor Charts Section */}
                <div>
                  <h3 className="mb-3 text-md flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                    <Activity size={18} className="text-warning" /> Sensor History
                  </h3>
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
                      <div style={{ height: '100px', width: '100%', marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={currentPlant.history} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickMargin={5} hide />
                            <YAxis stroke="var(--secondary)" fontSize={10} />
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                            <Line type="stepAfter" dataKey="lux" name="Lux (Light)" stroke="var(--secondary)" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
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
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} style={{ padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
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
                <label className="text-sm text-muted mb-2 block">Strain Search (StrainDB API Mock)</label>
                <div className="input-premium" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem' }}>
                  <Search size={16} className="text-muted" />
                  <input type="text" style={{ flex: 1, background: 'transparent', border: 'none', color: 'inherit', outline: 'none', padding: '0.75rem 0' }} value={strainQuery} onChange={e => setStrainQuery(e.target.value)} placeholder="Search strain..." />
                </div>
                {strainQuery && !newPlant.strainName && (
                  <div className="glass" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: '0.25rem', borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {mockStrainDb.filter(s => s.name.toLowerCase().includes(strainQuery.toLowerCase())).map(strain => (
                      <div key={strain.name} onClick={() => handleStrainSelect(strain)} style={{ padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                        <div className="font-semibold text-sm">{strain.name}</div>
                        <div className="text-xs text-primary">{strain.type} • {strain.flowerDays} Days</div>
                      </div>
                    ))}
                    {mockStrainDb.filter(s => s.name.toLowerCase().includes(strainQuery.toLowerCase())).length === 0 && (
                      <div className="text-xs text-muted p-2">No strains found. Type manually.</div>
                    )}
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
    </div>
  );
}

import { useState, useRef } from 'react';
import usePlantStore, { PlantPhase, StrainType } from '../store/usePlantStore';
import useGrowLogStore from '../store/useGrowLogStore';
import useNutrientStore from '../store/useNutrientStore';
import useEnvironmentStore from '../store/useEnvironmentStore';
import { Plus, Droplet, Activity, X, Camera, Search } from 'lucide-react';
import { differenceInDays, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function PlantsView() {
  const { plants, addPlant } = usePlantStore();
  const { addLog } = useGrowLogStore();
  const { recipes } = useNutrientStore();
  const { environments } = useEnvironmentStore();
  
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [logForm, setLogForm] = useState({ waterVolume: 1.0, phInput: 6.2, ecInput: 1.2, recipeId: '' });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlant, setNewPlant] = useState({ name: '', environmentId: '', strainName: '', strainType: StrainType.PHOTOPERIODIC, image: null });
  const [strainQuery, setStrainQuery] = useState('');
  const fileInputRef = useRef(null);

  const mockStrainDb = [
    { name: 'Super Lemon Haze', type: StrainType.PHOTOPERIODIC, flowerDays: 70 },
    { name: 'Northern Lights Auto', type: StrainType.AUTOFLOWER, flowerDays: 55 },
    { name: 'White Widow', type: StrainType.PHOTOPERIODIC, flowerDays: 60 }
  ];

  const handleLogSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlant) return;
    
    addLog({
      plantId: selectedPlant.id,
      waterVolumeLiters: logForm.waterVolume,
      phInput: logForm.phInput,
      ecInput: logForm.ecInput,
      appliedRecipeId: logForm.recipeId
    });
    setSelectedPlant(null); // close modal
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPlant({...newPlant, image: reader.result});
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
            <div key={plant.id} className="glass-card" onClick={() => setSelectedPlant(plant)} style={{ cursor: 'pointer' }}>
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

      {selectedPlant && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem 1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-6">
              <h2>Log: {selectedPlant.name}</h2>
              <button className="btn btn-secondary" onClick={() => setSelectedPlant(null)} style={{ padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="text-sm text-muted mb-2 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                  <Droplet size={16} className="text-info" /> Water Volume (Liters)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="range" min="0" max="5" step="0.1" value={logForm.waterVolume} onChange={(e) => setLogForm({...logForm, waterVolume: parseFloat(e.target.value)})} style={{ flex: 1 }} />
                  <span className="font-semibold" style={{ width: '40px', textAlign: 'right' }}>{logForm.waterVolume}L</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-2 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                  <Activity size={16} className="text-warning" /> pH Input
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="range" min="4.0" max="8.0" step="0.1" value={logForm.phInput} onChange={(e) => setLogForm({...logForm, phInput: parseFloat(e.target.value)})} style={{ flex: 1 }} />
                  <span className="font-semibold" style={{ width: '40px', textAlign: 'right' }}>{logForm.phInput}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-2 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                  <Activity size={16} className="text-primary" /> EC Input
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="range" min="0.0" max="3.0" step="0.1" value={logForm.ecInput} onChange={(e) => setLogForm({...logForm, ecInput: parseFloat(e.target.value)})} style={{ flex: 1 }} />
                  <span className="font-semibold" style={{ width: '40px', textAlign: 'right' }}>{logForm.ecInput}</span>
                </div>
              </div>

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

            {selectedPlant.hasSoilMoistureSensor && selectedPlant.history && selectedPlant.history.length > 0 && (
              <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                <h3 className="mb-4 text-md flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                  <Activity size={18} className="text-primary" /> Soil Sensor History
                </h3>
                <div style={{ height: '180px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedPlant.history} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
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
                    <LineChart data={selectedPlant.history} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
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

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
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
        </div>
      )}
    </div>
  );
}

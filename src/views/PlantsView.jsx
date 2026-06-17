import { useState } from 'react';
import usePlantStore from '../store/usePlantStore';
import useGrowLogStore from '../store/useGrowLogStore';
import useNutrientStore from '../store/useNutrientStore';
import { Plus, Droplet, Activity, Sun } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function PlantsView() {
  const { plants } = usePlantStore();
  const { addLog } = useGrowLogStore();
  const { recipes } = useNutrientStore();
  
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [logForm, setLogForm] = useState({ waterVolume: 1.0, phInput: 6.2, ecInput: 1.2, recipeId: '' });

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

  return (
    <div className="page-container">
      <div className="flex-between mb-6">
        <h1>Plants</h1>
        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
          <Plus size={20} /> <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem' }}>Add Plant</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
        {plants.map(plant => {
          const daysSinceGermination = differenceInDays(new Date(), new Date(plant.dateGerminated));
          return (
            <div key={plant.id} className="glass-card" onClick={() => setSelectedPlant(plant)} style={{ cursor: 'pointer' }}>
              <div style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '3rem' }}>🪴</span>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div className="glass-card" style={{ width: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '2rem 1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="flex-between mb-6">
              <h2>Log: {selectedPlant.name}</h2>
              <button className="btn btn-secondary" onClick={() => setSelectedPlant(null)}>Close</button>
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
    </div>
  );
}

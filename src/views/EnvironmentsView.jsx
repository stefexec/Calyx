import useEnvironmentStore, { GrowMedium } from '../store/useEnvironmentStore';
import { Settings, Sun, Moon, Database, Power, Wind, Droplets, BellRing, Plus, X, Settings2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { sendNotification } from '../utils/notifications';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function EnvironmentsView() {
  const { environments, togglePlug, addEnvironment, updatePlugConfig } = useEnvironmentStore();
  const [showModal, setShowModal] = useState(false);
  const [newEnv, setNewEnv] = useState({ name: '', growMedium: GrowMedium.SOIL, lightHoursOn: 18, lightHoursOff: 6 });
  const [selectedEnvForSettings, setSelectedEnvForSettings] = useState(null);

  const handleTestAlarm = async () => {
    await sendNotification('🚨 LIGHT LEAK ALARM', 'Lux sensor detected light during Dark Phase in Tent #1!', 'high');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newEnv.name) return;
    addEnvironment({
      id: crypto.randomUUID(),
      ...newEnv,
      homeAssistantEntityIds: []
    });
    setShowModal(false);
    setNewEnv({ name: '', growMedium: GrowMedium.SOIL, lightHoursOn: 18, lightHoursOff: 6 });
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-6">
        <h1>Environments</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" style={{ padding: '0.5rem' }} onClick={() => setShowModal(true)}>
            <Plus size={20} />
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <Settings2 size={20} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {environments.map(env => (
          <div key={env.id} className="glass-card">
            <div className="flex-between mb-4">
              <div className="flex-center" style={{ gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)' }}>
                  <Database className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="text-lg">{env.name}</h2>
                  <p className="text-xs text-muted flex-center" style={{ justifyContent: 'flex-start', gap: '0.25rem' }}>
                    <Sun size={12} /> {env.lightHoursOn}h ON <Moon size={12} className="ml-2" /> {env.lightHoursOff}h OFF
                  </p>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }} onClick={() => setSelectedEnvForSettings(env)}>
                <Settings size={20} />
              </button>
            </div>

            <div className="mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem' }}>
              {(env.plugConfig?.light?.enabled ?? true) && (
                <button onClick={() => togglePlug(env.id, 'light')} className="btn" style={{ 
                  flexDirection: 'column', 
                  padding: '1rem 0.5rem', 
                  background: (env.plugConfig?.light?.isOn || env.plugs?.light) ? 'var(--warning)' : 'rgba(255, 255, 255, 0.1)',
                  border: (env.plugConfig?.light?.isOn || env.plugs?.light) ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                  color: (env.plugConfig?.light?.isOn || env.plugs?.light) ? '#000' : 'var(--text-main)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <Power size={20} className="mb-2" />
                  <span className="text-xs">Light</span>
                </button>
              )}
              {(env.plugConfig?.exhaust?.enabled ?? true) && (
                <button onClick={() => togglePlug(env.id, 'exhaust')} className="btn" style={{ 
                  flexDirection: 'column', 
                  padding: '1rem 0.5rem', 
                  background: (env.plugConfig?.exhaust?.isOn || env.plugs?.exhaust) ? 'var(--info)' : 'rgba(255, 255, 255, 0.1)',
                  border: (env.plugConfig?.exhaust?.isOn || env.plugs?.exhaust) ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                  color: (env.plugConfig?.exhaust?.isOn || env.plugs?.exhaust) ? '#000' : 'var(--text-main)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <Wind size={20} className="mb-2" />
                  <span className="text-xs">Exhaust</span>
                </button>
              )}
              {(env.plugConfig?.humidifier?.enabled ?? true) && (
                <button onClick={() => togglePlug(env.id, 'humidifier')} className="btn" style={{ 
                  flexDirection: 'column', 
                  padding: '1rem 0.5rem', 
                  background: (env.plugConfig?.humidifier?.isOn || env.plugs?.humidifier) ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                  border: (env.plugConfig?.humidifier?.isOn || env.plugs?.humidifier) ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                  color: (env.plugConfig?.humidifier?.isOn || env.plugs?.humidifier) ? '#000' : 'var(--text-main)',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <Droplets size={20} className="mb-2" />
                  <span className="text-xs">Humidifier</span>
                </button>
              )}
            </div>

            {env.history && env.history.length > 0 && (
              <div className="mt-6">
                <div className="flex-between mb-2">
                  <h4 className="text-sm font-semibold">24h Climate History</h4>
                  <button onClick={handleTestAlarm} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>
                    <BellRing size={12} /> Test Leak Alarm
                  </button>
                </div>
                <div style={{ height: '150px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={env.history} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} tickMargin={5} />
                      <YAxis yAxisId="left" stroke="var(--warning)" fontSize={10} />
                      <YAxis yAxisId="right" orientation="right" stroke="var(--info)" fontSize={10} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="temp" stroke="var(--warning)" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="rh" stroke="var(--info)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="text-xs text-muted mb-2 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                <Database size={14} /> Connected HA Entities
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {env.homeAssistantEntityIds.map(id => (
                  <span key={id} style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary)' }}>
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem 1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-6">
              <h2>New Tent</h2>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label className="text-sm text-muted mb-2 block">Tent Name</label>
                <input type="text" className="input-premium" value={newEnv.name} onChange={e => setNewEnv({...newEnv, name: e.target.value})} placeholder="e.g. Flower Tent 2" required />
              </div>
              <div>
                <label className="text-sm text-muted mb-2 block">Grow Medium</label>
                <select className="input-premium" value={newEnv.growMedium} onChange={e => setNewEnv({...newEnv, growMedium: e.target.value})}>
                  {Object.values(GrowMedium).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="text-sm text-muted mb-2 block">Light Hours ON</label>
                  <input type="number" className="input-premium" value={newEnv.lightHoursOn} onChange={e => setNewEnv({...newEnv, lightHoursOn: parseInt(e.target.value)})} min="0" max="24" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="text-sm text-muted mb-2 block">Light Hours OFF</label>
                  <input type="number" className="input-premium" value={newEnv.lightHoursOff} onChange={e => setNewEnv({...newEnv, lightHoursOff: parseInt(e.target.value)})} min="0" max="24" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>Create Tent</button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {selectedEnvForSettings && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem 1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-6">
              <h2>{selectedEnvForSettings.name} Settings</h2>
              <button className="btn btn-secondary" onClick={() => setSelectedEnvForSettings(null)} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 className="text-md text-primary">Smart Plugs</h3>
              
              {['light', 'exhaust', 'humidifier'].map(plugKey => {
                const plugConfig = selectedEnvForSettings.plugConfig || {};
                const config = plugConfig[plugKey] || { enabled: true, entityId: '', isOn: false };
                return (
                  <div key={plugKey} className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div className="flex-between mb-3">
                      <span className="font-semibold capitalize">{plugKey}</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <span className="text-xs text-muted">Enabled</span>
                        <input 
                          type="checkbox" 
                          checked={config.enabled}
                          onChange={(e) => {
                            updatePlugConfig(selectedEnvForSettings.id, plugKey, { enabled: e.target.checked });
                            setSelectedEnvForSettings(state => ({
                              ...state, plugConfig: { ...(state.plugConfig || {}), [plugKey]: { ...config, enabled: e.target.checked } }
                            }));
                          }}
                        />
                      </label>
                    </div>
                    {config.enabled && (
                      <div>
                        <label className="text-xs text-muted mb-1 block">HA Entity ID</label>
                        <input 
                          type="text" 
                          className="input-premium" 
                          style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                          value={config.entityId} 
                          onChange={(e) => {
                            updatePlugConfig(selectedEnvForSettings.id, plugKey, { entityId: e.target.value });
                            setSelectedEnvForSettings(state => ({
                              ...state, plugConfig: { ...(state.plugConfig || {}), [plugKey]: { ...config, entityId: e.target.value } }
                            }));
                          }}
                          placeholder={`e.g. switch.tent_${plugKey}`} 
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              <button className="btn btn-primary mt-4" onClick={() => setSelectedEnvForSettings(null)}>Save & Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

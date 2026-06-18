import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Database, Link, Wrench, Bell, Sprout, X, Plus, Trash2, Save } from 'lucide-react';
import useSettingsStore from '../store/useSettingsStore';
import useNutrientStore from '../store/useNutrientStore';
import { sendNotification } from '../utils/notifications';
import { fetchApi } from '../utils/api';

export default function SettingsView() {
  const { ntfyUrl, ntfyTopic, ntfyToken, haUrl, haToken, defaultVegDays, luxThreshold, updateNtfySettings, updateHaSettings, updateDefaultVegDays, updateLuxThreshold } = useSettingsStore();
  const { products, recipes, addProduct, deleteProduct, addRecipe, deleteRecipe } = useNutrientStore();
  
  const [showNutrientModal, setShowNutrientModal] = useState(false);
  const [nutrientTab, setNutrientTab] = useState('products'); // 'products' or 'recipes'
  
  const [newProduct, setNewProduct] = useState({ brand: '', name: '' });
  const [newRecipe, setNewRecipe] = useState({ name: '', ingredients: [] });
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [ingredientMl, setIngredientMl] = useState(1);
  
  const [calcBoxDose, setCalcBoxDose] = useState(20);
  const [calcBoxVolume, setCalcBoxVolume] = useState(10);
  const [calcTargetScale, setCalcTargetScale] = useState(100);

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (newProduct.brand && newProduct.name) {
      addProduct(newProduct);
      setNewProduct({ brand: '', name: '' });
    }
  };

  const handleAddIngredient = () => {
    if (selectedIngredient && ingredientMl > 0) {
      const prod = products.find(p => p.id === selectedIngredient);
      if (prod && !newRecipe.ingredients.find(i => i.productId === prod.id)) {
        setNewRecipe({
          ...newRecipe,
          ingredients: [...newRecipe.ingredients, { productId: prod.id, name: `${prod.brand} ${prod.name}`, mlPerLiter: ingredientMl }]
        });
      }
      setSelectedIngredient('');
      setIngredientMl(1);
    }
  };

  const handleRemoveIngredient = (productId) => {
    setNewRecipe({
      ...newRecipe,
      ingredients: newRecipe.ingredients.filter(i => i.productId !== productId)
    });
  };

  const handleSaveRecipe = (e) => {
    e.preventDefault();
    if (newRecipe.name && newRecipe.ingredients.length > 0) {
      addRecipe(newRecipe);
      setNewRecipe({ name: '', ingredients: [] });
    }
  };

  const handleTestNotification = async () => {
    await sendNotification("Test Alert! 🚀", "This is a test message from Calyx settings.", "high");
  };

  const handleTestHaConnection = async () => {
    try {
      await fetchApi('/ha/test');
      alert("Home Assistant Connection Successful!");
    } catch (e) {
      alert(`Error connecting to Home Assistant: ${e.message}`);
    }
  };

  return (
    <div className="page-container">
      <h1 className="mb-6">Settings & Integrations</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-card">
          <div className="flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.75rem' }}>
            <Link className="text-primary" size={24} />
            <h2 className="text-lg">Home Assistant</h2>
          </div>
          <p className="text-sm text-muted mb-4">Connect to your local Home Assistant instance to pull real-time environment data and control smart plugs.</p>
          <div className="mb-4">
            <label className="text-xs text-muted mb-1 block">HA URL</label>
            <input type="text" className="input-premium" placeholder="http://homeassistant.local:8123" value={haUrl} onChange={(e) => updateHaSettings(e.target.value, haToken)} />
          </div>
          <div className="mb-4">
            <label className="text-xs text-muted mb-1 block">Long-Lived Access Token</label>
            <input type="password" className="input-premium" placeholder="ey..." value={haToken} onChange={(e) => updateHaSettings(haUrl, e.target.value)} />
          </div>
          <button className="btn btn-secondary w-full" onClick={handleTestHaConnection}>Test Connection</button>
        </div>

        <div className="glass-card">
          <div className="flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.75rem' }}>
            <Bell className="text-info" size={24} />
            <h2 className="text-lg">Push Notifications (ntfy)</h2>
          </div>
          <p className="text-sm text-muted mb-4">Configure self-hosted ntfy.sh alerts for warnings and updates.</p>
          <div className="mb-4">
            <label className="text-xs text-muted mb-1 block">Server URL</label>
            <input type="text" className="input-premium" value={ntfyUrl} onChange={(e) => updateNtfySettings(e.target.value, ntfyTopic, ntfyToken)} placeholder="https://ntfy.sh" />
          </div>
          <div className="mb-4">
            <label className="text-xs text-muted mb-1 block">Topic / Channel Name</label>
            <input type="text" className="input-premium" value={ntfyTopic} onChange={(e) => updateNtfySettings(ntfyUrl, e.target.value, ntfyToken)} placeholder="calyx_alerts" />
          </div>
          <div className="mb-4">
            <label className="text-xs text-muted mb-1 block">Access Token (Optional)</label>
            <input type="password" className="input-premium" value={ntfyToken} onChange={(e) => updateNtfySettings(ntfyUrl, ntfyTopic, e.target.value)} placeholder="tk_..." />
          </div>
          <button className="btn btn-secondary w-full" onClick={handleTestNotification}>Test Notification</button>
        </div>

        <div className="glass-card">
          <div className="flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.75rem' }}>
            <Database className="text-secondary" size={24} />
            <h2 className="text-lg">Strain Database</h2>
          </div>
          <p className="text-sm text-muted mb-4">Uses the built-in offline Strain Database to auto-fill genetics and flowering times. No rate limits.</p>
          <button className="btn btn-secondary w-full" disabled>Database Synced</button>
        </div>

        <div className="glass-card">
          <div className="flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.75rem' }}>
            <Sprout className="text-success" size={24} />
            <h2 className="text-lg">Cultivation Settings</h2>
          </div>
          <p className="text-sm text-muted mb-4">Configure defaults for plant lifecycle calculations and scheduling.</p>
          <div className="mb-4">
            <label className="text-xs text-muted mb-1 block">Standard Vegi-Dauer (Tage)</label>
            <input 
              type="number" 
              className="input-premium" 
              value={defaultVegDays} 
              onChange={(e) => updateDefaultVegDays(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="mb-4">
            <label className="text-xs text-muted mb-1 block">Lux Sensor Light Bleed Threshold</label>
            <input 
              type="number" 
              className="input-premium" 
              value={luxThreshold} 
              onChange={(e) => updateLuxThreshold(parseInt(e.target.value) || 0)} 
            />
            <p className="text-xs text-muted mt-1">If your tent's lux sensor exceeds this value while the light plug is OFF, you will receive a high-priority push notification.</p>
          </div>
        </div>

        <div className="glass-card">
          <div className="flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.75rem' }}>
            <Wrench className="text-warning" size={24} />
            <h2 className="text-lg">Nutrient Configurator</h2>
          </div>
          <p className="text-sm text-muted mb-4">Manage your fertilizer brands, products, and custom feeding recipes.</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary w-full" onClick={() => { setShowNutrientModal(true); setNutrientTab('products'); }}>Manage Nutrients</button>
            <button className="btn btn-primary w-full" onClick={() => { setShowNutrientModal(true); setNutrientTab('calculator'); }}>Calculator</button>
          </div>
        </div>
      </div>

      {showNutrientModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '2rem 1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-4">
              <div className="flex-center" style={{ gap: '0.75rem' }}>
                <Wrench className="text-warning" size={24} />
                <h2>Nutrient Configurator</h2>
              </div>
              <button className="btn btn-secondary" onClick={() => setShowNutrientModal(false)} style={{ padding: '0.5rem', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            
            <div className="flex-center mb-6" style={{ background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
              <button className={`btn ${nutrientTab === 'products' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => setNutrientTab('products')}>
                Products
              </button>
              <button className={`btn ${nutrientTab === 'recipes' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => setNutrientTab('recipes')}>
                Presets
              </button>
              <button className={`btn ${nutrientTab === 'calculator' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => setNutrientTab('calculator')}>
                Calculator
              </button>
            </div>

            {nutrientTab === 'products' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <form onSubmit={handleAddProduct} className="glass p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                  <h3 className="text-md mb-3">Add New Product</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label className="text-xs text-muted mb-1 block">Brand</label>
                      <input type="text" className="input-premium" placeholder="e.g. BioBizz" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="text-xs text-muted mb-1 block">Product Name</label>
                      <input type="text" className="input-premium" placeholder="e.g. Grow" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary w-full flex-center"><Plus size={18} className="mr-2"/> Add Product</button>
                </form>

                <div className="glass p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                  <h3 className="text-md mb-3">Existing Products</h3>
                  {products.length === 0 ? <p className="text-sm text-muted">No products found.</p> : (
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {products.map(p => (
                        <li key={p.id} className="flex-between p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                          <span className="text-sm font-semibold">{p.brand} {p.name}</span>
                          <button className="text-error hover-opacity" onClick={() => deleteProduct(p.id)}><Trash2 size={18} /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {nutrientTab === 'recipes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <form onSubmit={handleSaveRecipe} className="glass p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                  <h3 className="text-md mb-3">Create Preset</h3>
                  <div className="mb-3">
                    <label className="text-xs text-muted mb-1 block">Preset Name</label>
                    <input type="text" className="input-premium" placeholder="e.g. Week 2 Veg" value={newRecipe.name} onChange={e => setNewRecipe({...newRecipe, name: e.target.value})} required />
                  </div>
                  
                  <div className="mb-3">
                    <label className="text-xs text-muted mb-1 block">Ingredients (Baseline per 1 Liter)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <select className="input-premium" style={{ flex: 2 }} value={selectedIngredient} onChange={e => setSelectedIngredient(e.target.value)}>
                        <option value="">Select Product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.brand} {p.name}</option>)}
                      </select>
                      <input type="number" min="0.1" step="0.1" className="input-premium" style={{ flex: 1 }} value={ingredientMl} onChange={e => setIngredientMl(parseFloat(e.target.value) || 0)} placeholder="ml/L" />
                      <button type="button" className="btn btn-secondary" onClick={handleAddIngredient}><Plus size={18} /></button>
                    </div>
                    {newRecipe.ingredients.length > 0 && (
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                        {newRecipe.ingredients.map(i => (
                          <li key={i.productId} className="flex-between p-2 text-xs" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                            <span>{i.name}</span>
                            <div className="flex-center" style={{ gap: '0.5rem' }}>
                              <span className="text-primary">{i.mlPerLiter} ml/L</span>
                              <button type="button" className="text-error hover-opacity" onClick={() => handleRemoveIngredient(i.productId)}><X size={14} /></button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary w-full flex-center" disabled={!newRecipe.name || newRecipe.ingredients.length === 0}>
                    <Save size={18} className="mr-2"/> Save Preset
                  </button>
                </form>

                <div className="glass p-4" style={{ borderRadius: 'var(--radius-md)' }}>
                  <h3 className="text-md mb-3">Saved Presets</h3>
                  {recipes.length === 0 ? <p className="text-sm text-muted">No presets found.</p> : (
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {recipes.map(r => (
                        <li key={r.id} className="p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                          <div className="flex-between mb-2">
                            <span className="font-semibold text-primary">{r.name}</span>
                            <button className="text-error hover-opacity" onClick={() => deleteRecipe(r.id)}><Trash2 size={16} /></button>
                          </div>
                          <div className="text-xs text-muted" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {r.ingredients.map(i => (
                              <span key={i.productId} style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{i.name || 'Product'} ({i.mlPerLiter}ml/L)</span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {nutrientTab === 'calculator' && (
              <div className="glass p-4" style={{ borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 className="text-md mb-2">Dosage Calculator</h3>
                  <p className="text-sm text-muted">Calculate the baseline (ml per 1 Liter) for your presets based on what's written on the fertilizer bottle.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label className="text-xs text-muted mb-1 block">Recommended Dose (ml)</label>
                    <input type="number" min="0" step="0.1" className="input-premium" value={calcBoxDose} onChange={e => setCalcBoxDose(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="text-xs text-muted mb-1 block">Per Water Volume (Liters)</label>
                    <input type="number" min="0.1" step="0.1" className="input-premium" value={calcBoxVolume} onChange={e => setCalcBoxVolume(parseFloat(e.target.value) || 1)} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted mb-2 flex-between">
                    <span>Target Strength Scale</span>
                    <span className="font-semibold text-info">{calcTargetScale}%</span>
                  </label>
                  <input type="range" min="10" max="200" step="10" value={calcTargetScale} onChange={e => setCalcTargetScale(parseInt(e.target.value))} style={{ width: '100%' }} />
                </div>

                <div className="p-4" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <span className="text-sm text-muted block mb-1">Your Baseline for Presets</span>
                  <span className="text-2xl font-bold text-success">
                    {((calcBoxDose / calcBoxVolume) * (calcTargetScale / 100)).toFixed(2)} ml / Liter
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

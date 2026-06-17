import { Database, Link, Wrench, Bell } from 'lucide-react';
import useSettingsStore from '../store/useSettingsStore';
import { sendNotification } from '../utils/notifications';

export default function SettingsView() {
  const { ntfyUrl, ntfyTopic, ntfyToken, updateNtfySettings } = useSettingsStore();

  const handleTestNotification = async () => {
    await sendNotification("Test Alert! 🚀", "This is a test message from Calyx settings.", "high");
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
            <input type="text" className="input-premium" placeholder="http://homeassistant.local:8123" defaultValue="http://homeassistant.local:8123" />
          </div>
          <div className="mb-4">
            <label className="text-xs text-muted mb-1 block">Long-Lived Access Token</label>
            <input type="password" className="input-premium" placeholder="ey..." defaultValue="mock-token" />
          </div>
          <button className="btn btn-secondary w-full">Test Connection</button>
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
          <p className="text-sm text-muted mb-4">Integration with github.com/strain-database to auto-fill genetics and breeder information.</p>
          <button className="btn btn-secondary w-full">Sync Database</button>
        </div>

        <div className="glass-card">
          <div className="flex-center mb-4" style={{ justifyContent: 'flex-start', gap: '0.75rem' }}>
            <Wrench className="text-warning" size={24} />
            <h2 className="text-lg">Nutrient Configurator</h2>
          </div>
          <p className="text-sm text-muted mb-4">Manage your fertilizer brands, products, and custom feeding recipes.</p>
          <button className="btn btn-secondary w-full">Manage Nutrients</button>
        </div>
      </div>
    </div>
  );
}

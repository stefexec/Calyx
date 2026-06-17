import { Thermometer, Droplets, Wind, CheckCircle2, Plus, X, Calendar } from 'lucide-react';
import useEnvironmentStore from '../store/useEnvironmentStore';
import usePlantStore from '../store/usePlantStore';
import useTaskStore, { TaskCategory } from '../store/useTaskStore';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function DashboardView() {
  const { environments } = useEnvironmentStore();
  const { plants } = usePlantStore();
  const { tasks, addTask, toggleTaskCompletion } = useTaskStore();

  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ plantId: '', category: TaskCategory.TRAINING, description: '' });

  const scrollRef = useRef(null);
  const selectedDateRef = useRef(null);

  const today = startOfDay(new Date());
  // Generate a window of 60 days (30 past, 30 future)
  const calendarDays = Array.from({ length: 61 }).map((_, i) => addDays(today, i - 30));

  useEffect(() => {
    if (selectedDateRef.current) {
      selectedDateRef.current.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
    }
  }, []); // Only scroll to center on initial mount

  // Mock HA Data for demonstration
  const getMockHAData = (envId) => {
    if (envId === '1') return { temp: 24.5, rh: 65, vpd: 0.8 };
    return { temp: 26.0, rh: 50, vpd: 1.2 };
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient">Calyx</h1>
          <p className="text-muted text-sm">Your Garden Overview</p>
        </div>
        <div className="glass flex-center" style={{ width: 40, height: 40, borderRadius: '50%' }}>
          <span role="img" aria-label="leaf">🌿</span>
        </div>
      </div>

      <div className="mb-6 horizontal-scroll" ref={scrollRef}>
        {calendarDays.map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          
          // Tasks for this specific day
          const dayTasks = tasks.filter(t => isSameDay(new Date(t.date), day));
          
          // Predictive watering indicator
          let needsWatering = false;
          if (isToday) {
            needsWatering = plants.some(p => p.hasSoilMoistureSensor && p.currentMoistureLevel < 30);
          }

          return (
            <div key={idx} ref={isSelected ? selectedDateRef : null} onClick={() => setSelectedDate(startOfDay(day))} className="flex-center" style={{ 
              flexDirection: 'column', 
              minWidth: '50px', 
              scrollSnapAlign: 'center',
              padding: '0.5rem', 
              borderRadius: 'var(--radius-md)', 
              background: isSelected ? 'var(--primary)' : 'var(--bg-glass)',
              color: isSelected ? '#000' : 'var(--text-main)',
              border: `1px solid ${isSelected ? 'transparent' : 'var(--border)'}`,
              position: 'relative',
              cursor: 'pointer'
            }}>
              <span className="text-xs" style={{ fontWeight: isSelected ? 600 : 400 }}>{format(day, 'EEE')}</span>
              <span className="text-lg font-semibold">{format(day, 'd')}</span>
              <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '4px' }}>
                {needsWatering && (
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? '#000' : 'var(--info)' }} />
                )}
                {dayTasks.length > 0 && (
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? '#000' : 'var(--accent)' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-lg mb-4">Environment Metrics</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {environments.map(env => {
          const ha = getMockHAData(env.id);
          return (
            <div key={env.id} className="glass-card">
              <h3 className="mb-4">{env.name}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                  <Thermometer className="text-warning" />
                  <span className="font-semibold">{ha.temp}°C</span>
                </div>
                <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                  <Droplets className="text-info" />
                  <span className="font-semibold">{ha.rh}%</span>
                </div>
                <div className="flex-center" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                  <Wind className="text-primary" />
                  <span className="font-semibold">{ha.vpd} kPa</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex-between mb-4">
        <h2 className="text-lg">Agenda for {format(selectedDate, 'MMM d')}</h2>
        <button onClick={() => setShowEventModal(true)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
          <Calendar size={14} /> Plan Event
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tasks.filter(t => isSameDay(new Date(t.date), selectedDate)).map(task => {
          const plant = plants.find(p => p.id === task.plantId);
          return (
            <div key={task.id} className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: task.isCompleted ? 0.5 : 1 }}>
              <div>
                <div className="font-semibold mb-1 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                  {plant ? plant.name : 'General Task'}
                  <span className="text-xs text-accent" style={{ background: 'rgba(244, 114, 182, 0.1)', padding: '2px 6px', borderRadius: '8px' }}>
                    {task.category}
                  </span>
                </div>
                <div className="text-sm text-muted">{task.description}</div>
              </div>
              <button onClick={() => toggleTaskCompletion(task.id)} className={`btn ${task.isCompleted ? 'btn-secondary' : 'btn-primary'}`} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                <CheckCircle2 size={20} />
              </button>
            </div>
          );
        })}
        {tasks.filter(t => isSameDay(new Date(t.date), selectedDate)).length === 0 && (
          <div className="text-muted text-sm text-center py-4">No events scheduled for this day.</div>
        )}
      </div>

      {showEventModal && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '2rem 1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-6">
              <h2>Plan Event</h2>
              <button className="btn btn-secondary" onClick={() => setShowEventModal(false)} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              addTask({ date: selectedDate.toISOString(), ...newEvent });
              setShowEventModal(false);
              setNewEvent({ plantId: '', category: TaskCategory.TRAINING, description: '' });
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div>
                <label className="text-sm text-muted mb-2 block">Target Plant</label>
                <select className="input-premium" value={newEvent.plantId} onChange={e => setNewEvent({...newEvent, plantId: e.target.value})} required>
                  <option value="" disabled>Select a Plant...</option>
                  {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">Event Category</label>
                <select className="input-premium" value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})}>
                  {Object.values(TaskCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted mb-2 block">Description (Optional)</label>
                <input type="text" className="input-premium" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} placeholder="e.g. LST Tie down" />
              </div>

              <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>Schedule Event</button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

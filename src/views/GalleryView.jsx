import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar as CalendarIcon, Tag, Sprout, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import useGalleryStore from '../store/useGalleryStore';
import usePlantStore from '../store/usePlantStore';

export default function GalleryView() {
  const { images, deleteGalleryImage } = useGalleryStore();
  const { plants } = usePlantStore();
  const [selectedImage, setSelectedImage] = useState(null);
  const [collapsedPlants, setCollapsedPlants] = useState({});

  const getPlant = (plantId) => {
    return plants.find(p => p.id === plantId);
  };

  const getPlantName = (plantId) => {
    return getPlant(plantId)?.name || 'Unknown Plant';
  };

  const getPlantStartDate = (plantId) => {
    const plant = getPlant(plantId);
    if (!plant || !plant.dateGerminated) return null;
    return new Date(plant.dateGerminated).toLocaleDateString();
  };

  // Group images by plantId
  const groupedImages = images.reduce((acc, img) => {
    if (!acc[img.plantId]) acc[img.plantId] = [];
    acc[img.plantId].push(img);
    return acc;
  }, {});

  // Sort inside each group (newest first)
  Object.keys(groupedImages).forEach(plantId => {
    groupedImages[plantId].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  });

  // Sort plant groups by the timestamp of their newest image
  const sortedPlantIds = Object.keys(groupedImages).sort((a, b) => {
    const aNewest = groupedImages[a][0]?.timestamp;
    const bNewest = groupedImages[b][0]?.timestamp;
    return new Date(bNewest) - new Date(aNewest);
  });

  const toggleCollapse = (plantId) => {
    setCollapsedPlants(prev => ({ ...prev, [plantId]: !prev[plantId] }));
  };

  return (
    <div className="page-container">
      <div className="flex-between mb-4">
        <div>
          <h1 className="text-gradient">Gallery</h1>
          <p className="text-muted text-sm">Chronological grow history</p>
        </div>
      </div>

      {sortedPlantIds.length === 0 ? (
        <div className="flex-center text-muted" style={{ height: '50vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass flex-center" style={{ width: 64, height: 64, borderRadius: '50%' }}>📸</div>
          <p>No photos yet. Add some in the Plant Log!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sortedPlantIds.map(plantId => {
            const plantImages = groupedImages[plantId];
            const isCollapsed = collapsedPlants[plantId];
            const startDate = getPlantStartDate(plantId);
            
            return (
              <div key={plantId}>
                <div 
                  className="flex-between glass" 
                  onClick={() => toggleCollapse(plantId)}
                  style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: 'var(--radius-md)', 
                    cursor: 'pointer',
                    marginBottom: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                    <h2 className="text-md font-semibold" style={{ margin: 0 }}>{getPlantName(plantId)}</h2>
                    <span className="text-muted text-sm ml-2">({plantImages.length})</span>
                  </div>
                  {startDate && (
                    <div className="text-sm text-muted flex-center" style={{ gap: '0.25rem' }}>
                      <CalendarIcon size={14} />
                      <span className="font-semibold">Started:</span> {startDate}
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                    {plantImages.map(img => (
                      <div 
                        key={img.id} 
                        onClick={() => setSelectedImage(img)}
                        style={{ 
                          aspectRatio: '1', 
                          borderRadius: 'var(--radius-sm)', 
                          overflow: 'hidden', 
                          cursor: 'pointer',
                          background: 'var(--bg-glass)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <img 
                          src={img.fileUrl} 
                          alt={getPlantName(img.plantId)} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedImage && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.95)', 
          backdropFilter: 'blur(10px)', 
          zIndex: 2000, 
          display: 'flex', 
          flexDirection: 'column'
        }}>
          <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              className="btn" 
              onClick={() => {
                if (window.confirm("Delete this photo?")) {
                  deleteGalleryImage(selectedImage.id);
                  setSelectedImage(null);
                }
              }} 
              style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(255,0,0,0.2)', color: 'var(--error)', border: '1px solid rgba(var(--error-rgb), 0.4)' }}
            >
              <Trash2 size={24} />
            </button>
            <button className="btn btn-secondary" onClick={() => setSelectedImage(null)} style={{ padding: '0.5rem', borderRadius: '50%' }}>
              <X size={24} />
            </button>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
            <img 
              src={selectedImage.fileUrl} 
              alt="Full size" 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} 
            />
          </div>

          <div style={{ padding: '2rem 1rem', background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)' }}>
            <h2 className="text-lg mb-4">{getPlantName(selectedImage.plantId)}</h2>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div className="glass flex-center" style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', gap: '6px' }}>
                <CalendarIcon size={14} className="text-info" />
                <span className="text-xs font-semibold">{new Date(selectedImage.timestamp).toLocaleDateString()}</span>
              </div>
              
              <div className="glass flex-center" style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', gap: '6px' }}>
                <Tag size={14} className="text-primary" />
                <span className="text-xs font-semibold">Day {selectedImage.daysSinceGermination}</span>
              </div>
              
              {selectedImage.phase && (
                <div className="glass flex-center" style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', gap: '6px' }}>
                  <Sprout size={14} className="text-accent" />
                  <span className="text-xs font-semibold">{selectedImage.phase}</span>
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

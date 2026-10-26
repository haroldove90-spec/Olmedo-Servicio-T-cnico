import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  Video, 
  Truck, 
  Calendar, 
  MapPin, 
  Eye, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  ZoomIn,
  Clock,
  User,
  ChevronRight
} from 'lucide-react';
import { ServiceOrder, EvidencePhoto, VideoEvidence } from '../../types';

interface ClientEvidenceViewerModalProps {
  order: ServiceOrder | null;
  onClose: () => void;
}

export const ClientEvidenceViewerModal: React.FC<ClientEvidenceViewerModalProps> = ({ order, onClose }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<EvidencePhoto | null>(null);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'fotos' | 'videos' | 'antes' | 'correctivo'>('todos');

  if (!order) return null;

  const photos: EvidencePhoto[] = order.evidences || [];
  const videos: VideoEvidence[] = order.videoEvidences || [];

  const filteredPhotos = photos.filter((p) => {
    if (activeFilter === 'videos') return false;
    if (activeFilter === 'antes') return p.phase === 'antes';
    if (activeFilter === 'correctivo') return p.phase === 'despues' || p.phase === 'correctivo_realizado' || p.phase === 'durante';
    return true;
  });

  const filteredVideos = (activeFilter === 'fotos' || activeFilter === 'antes' || activeFilter === 'correctivo') 
    ? [] 
    : videos;

  const totalCount = photos.length + videos.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 bg-[#040057] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/60 border border-indigo-400/40 text-emerald-300 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white truncate">
                  Evidencias del Servicio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black">
                  {totalCount} registro(s)
                </span>
              </div>
              <p className="text-xs text-indigo-200 truncate mt-0.5">
                {order.unitNumber || `Unidad ${order.vehicle.economicNumber}`} • Placas: <span className="font-bold text-white">{order.vehicle.plates}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
            title="Cerrar ventana de evidencias"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen Rápido de la Falla y Unidad */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="text-slate-600 line-clamp-1">
            <strong className="text-slate-900 uppercase">Falla Reportada:</strong> {order.vehicle.failureDescription}
          </div>
          {order.assignedTechnicianName && (
            <div className="text-indigo-700 font-bold shrink-0">
              Técnico: {order.assignedTechnicianName}
            </div>
          )}
        </div>

        {/* Filtros de Evidencia */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('todos')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeFilter === 'todos' 
                  ? 'bg-[#040057] text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('fotos')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                activeFilter === 'fotos' 
                  ? 'bg-[#040057] text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-indigo-500" />
              <span>Fotos ({photos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('videos')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                activeFilter === 'videos' 
                  ? 'bg-[#040057] text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-rose-500" />
              <span>Videos ({videos.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('antes')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeFilter === 'antes' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Fase Antes
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('correctivo')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                activeFilter === 'correctivo' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Fase Correctivo
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Haz click en cualquier fotografía para verla en pantalla completa
          </span>
        </div>

        {/* Galería Principal de Evidencias */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          
          {totalCount === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Camera className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-extrabold text-slate-700 text-base">
                Sin Evidencias Multimedia Registradas
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Aún no se han capturado fotografías o videos para este reporte de servicio.
              </p>
            </div>
          ) : (
            <>
              {/* Sección de Fotografías */}
              {filteredPhotos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wider">
                      Fotografías Técnicas ({filteredPhotos.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredPhotos.map((photo, idx) => {
                      const isBefore = photo.phase === 'antes';
                      return (
                        <div
                          key={photo.id || idx}
                          onClick={() => setSelectedPhoto(photo)}
                          className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs hover:shadow-md hover:border-indigo-400 transition cursor-pointer group flex flex-col justify-between space-y-2"
                        >
                          <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                            <img
                              src={photo.url}
                              alt={photo.title || `Evidencia ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="px-3 py-1 rounded-full bg-white/90 text-slate-900 text-xs font-black shadow-md flex items-center gap-1">
                                <ZoomIn className="w-3.5 h-3.5" /> Ampliar
                              </span>
                            </div>
                            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs ${
                              isBefore 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-emerald-600 text-white'
                            }`}>
                              {isBefore ? 'Antes' : 'Correctivo'}
                            </span>
                          </div>

                          <div className="space-y-1 px-1">
                            <h5 className="font-extrabold text-xs text-slate-800 line-clamp-1" title={photo.title}>
                              {photo.title || `Foto de Evidencia #${idx + 1}`}
                            </h5>
                            {photo.notes && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-relaxed">
                                {photo.notes}
                              </p>
                            )}
                            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(photo.timestamp).toLocaleDateString('es-MX', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </span>
                              {photo.uploaderName && (
                                <span className="truncate max-w-[120px] font-medium text-slate-600">
                                  {photo.uploaderName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sección de Videos */}
              {filteredVideos.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-rose-600" />
                    <h4 className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wider">
                      Videos Operativos Registrados ({filteredVideos.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredVideos.map((video, idx) => (
                      <div
                        key={video.id || idx}
                        className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs space-y-2"
                      >
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                          <video
                            src={video.url}
                            controls
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-extrabold text-xs text-slate-800 truncate">
                              {video.title || `Video de Inspección #${idx + 1}`}
                            </h5>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black shrink-0">
                              {video.duration || 15}s
                            </span>
                          </div>
                          {video.notes && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">
                              {video.notes}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-1 border-t border-slate-100">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(video.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Pie del Modal */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-black text-xs sm:text-sm shadow-xs transition cursor-pointer"
          >
            Cerrar Evidencias
          </button>
        </div>

      </div>

      {/* LIGHTBOX / ZOOM DE FOTOGRAFÍA EN PANTALLA COMPLETA */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between gap-3 border-b border-slate-800">
              <div className="min-w-0">
                <h4 className="font-black text-sm text-white truncate">
                  {selectedPhoto.title || 'Fotografía de Evidencia'}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className={`px-2 py-0.2 rounded-full font-bold uppercase text-[9px] ${
                    selectedPhoto.phase === 'antes' ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-300'
                  }`}>
                    {selectedPhoto.phase === 'antes' ? 'Fase Antes' : 'Fase Correctivo'}
                  </span>
                  <span>•</span>
                  <span>{new Date(selectedPhoto.timestamp).toLocaleString('es-MX')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedPhoto.url}
                  download={`evidencia_${order.folio || 'unidad'}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Abrir imagen en pestaña nueva"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Cerrar vista ampliada"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-2 sm:p-4 bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title || 'Evidencia'}
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>

            {selectedPhoto.notes && (
              <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-300">
                <strong className="text-white block uppercase text-[10px] font-black mb-0.5">Notas del Registro:</strong>
                <p>{selectedPhoto.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

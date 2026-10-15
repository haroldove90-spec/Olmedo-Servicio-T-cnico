import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  User, 
  Truck, 
  Gauge, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  X, 
  Clock, 
  Wrench,
  Camera,
  Video,
  ListFilter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playEmergencyAlertSound } from '../../utils/audioAlert';
import { ServiceStatus } from '../../types';

export const EmergencyAlertModal: React.FC = () => {
  const { 
    incomingAlertOrder, 
    dismissIncomingAlert, 
    currentRole, 
    setActiveModule,
    updateOrderStatus 
  } = useApp();

  const [soundMuted, setSoundMuted] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ServiceStatus>('por_atender');

  // Solo se muestra a Admin/Gerencia y Jefe de Taller
  const isAuthorizedRole = currentRole === 'jefe_taller' || currentRole === 'gerencia';

  useEffect(() => {
    if (incomingAlertOrder && isAuthorizedRole && !soundMuted) {
      playEmergencyAlertSound();
      setSelectedStatus(incomingAlertOrder.status || 'por_atender');
    }
  }, [incomingAlertOrder, isAuthorizedRole]);

  if (!incomingAlertOrder || !isAuthorizedRole) {
    return null;
  }

  const order = incomingAlertOrder;
  const isRescue = order.requiresRescue || order.serviceType === 'rescate';

  const handleAttend = () => {
    dismissIncomingAlert();
    if (currentRole === 'jefe_taller') {
      setActiveModule('bandeja_solicitudes');
    } else {
      setActiveModule('recepcion_unidades');
    }
  };

  const handleStatusChange = (newSt: ServiceStatus) => {
    setSelectedStatus(newSt);
    updateOrderStatus(order.id, newSt, `Estatus actualizado desde la alerta emergente por ${currentRole === 'jefe_taller' ? 'Jefe de Taller' : 'Administración'}`);
  };

  const handlePlaySoundAgain = () => {
    playEmergencyAlertSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div 
        className={`bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-4 ${
          isRescue ? 'border-rose-600 animate-pulse-border' : 'border-blue-600'
        }`}
      >
        {/* Cabecera de Alerta */}
        <div className={`p-5 text-white flex items-center justify-between ${
          isRescue 
            ? 'bg-linear-to-r from-rose-700 via-rose-600 to-amber-600' 
            : 'bg-linear-to-r from-[#040057] to-indigo-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              isRescue ? 'bg-white text-rose-700 animate-bounce' : 'bg-white/20 text-white'
            }`}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider bg-black/30 px-2.5 py-0.5 rounded-full">
                  {isRescue ? '🚨 Solicitud Urgente de Rescate' : '🔔 Nuevo Reporte de Falla'}
                </span>
                <span className="text-xs opacity-90">
                  {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-0.5">
                Folio: {order.folio}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePlaySoundAgain}
              title="Repetir sonido de alerta"
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              onClick={dismissIncomingAlert}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo de la Alerta */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Banner de Rescate / Operabilidad */}
          {isRescue ? (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-sm sm:text-base text-rose-800">
                    UNIDAD INOPERABLE • REQUIERE RESCATE EN RUTA
                  </div>
                  <div className="text-xs text-rose-700 mt-0.5">
                    El operador notificó que el vehículo no puede rodar y requiere asistencia inmediata.
                  </div>
                </div>
              </div>
              {order.rescueLocationUrl && (
                <a
                  href={order.rescueLocationUrl.startsWith('http') ? order.rescueLocationUrl : `https://${order.rescueLocationUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Ver en Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-3 text-blue-900">
              <Truck className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="text-xs font-medium">
                <span className="font-bold">Atención Ordinaria de Taller / Asistencia:</span> La unidad está operable para su ingreso programado o revisión en patio.
              </div>
            </div>
          )}

          {/* Ficha de la Unidad y Operador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Datos de la Unidad</span>
              <div className="text-base font-extrabold text-[#040057] mt-0.5 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>{order.unitNumber || `Económico ${order.vehicle.economicNumber}`}</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-medium">
                Placas: <span className="font-bold text-slate-800">{order.vehicle.plates}</span> • Eco: <span className="font-bold text-slate-800">{order.vehicle.economicNumber}</span>
              </div>
              {order.vehicle.brandModel && (
                <div className="text-xs text-slate-500 mt-0.5">
                  Modelo: <span className="font-semibold text-slate-700">{order.vehicle.brandModel}</span> ({order.vehicle.type})
                </div>
              )}
              {order.vehicle.mileage && (
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-semibold">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" />
                  <span>Km / Odómetro: {order.vehicle.mileage}</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operador y Contacto</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span>{order.operatorName || order.clientContact}</span>
              </div>
              {order.operatorPhone && (
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <a href={`tel:${order.operatorPhone}`} className="font-bold text-emerald-700 hover:underline">
                    {order.operatorPhone}
                  </a>
                </div>
              )}
              <div className="text-xs text-slate-500 mt-1">
                Empresa: <span className="font-semibold text-slate-700">{order.clientCompany || order.clientName}</span>
              </div>
            </div>
          </div>

          {/* Falla Reportada y Ubicación */}
          <div className="space-y-3">
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                Falla Reportada por el Cliente
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                {order.vehicle.failureDescription}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-700 block">Ubicación y Referencias:</span>
                <span className="text-slate-600">{order.vehicle.location}</span>
                {order.rescueLocationUrl && (
                  <div className="mt-1">
                    <a 
                      href={order.rescueLocationUrl.startsWith('http') ? order.rescueLocationUrl : `https://${order.rescueLocationUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Abrir coordenadas / Link GPS compartido</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Evidencias Multimedia (Fotos y Videos) */}
          {((order.evidences && order.evidences.length > 0) || (order.videoEvidences && order.videoEvidences.length > 0)) && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Evidencias Registradas por el Operador ({order.evidences.length} fotos, {order.videoEvidences?.length || 0} videos)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {order.evidences.slice(0, 4).map((ev, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square group bg-slate-100">
                    <img src={ev.url} alt={ev.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <Camera className="w-2.5 h-2.5" /> Foto
                    </span>
                  </div>
                ))}

                {order.videoEvidences?.map((vid, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-900 flex items-center justify-center">
                    <video src={vid.url} className="w-full h-full object-cover opacity-75" />
                    <span className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40">
                      <Video className="w-6 h-6 text-rose-500" />
                      <span className="text-[9px] font-bold mt-1">{vid.duration || 15}s</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selector Rápido de Estatus para Admin / Jefe de Taller */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Actualizar Estatus de la Solicitud Directamente:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'por_atender', label: 'Por Atender', color: 'bg-amber-100 text-amber-900 border-amber-300' },
                { id: 'en_proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-900 border-blue-300' },
                { id: 'pendiente_refacciones', label: 'Pend. Refacciones', color: 'bg-purple-100 text-purple-900 border-purple-300' },
                { id: 'validando_pruebas', label: 'Validando Pruebas', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
                { id: 'habilitada', label: 'Habilitada / Lista', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                { id: 'cerrado', label: 'Cerrado', color: 'bg-slate-200 text-slate-800 border-slate-400' },
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStatusChange(st.id as ServiceStatus)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                    selectedStatus === st.id 
                      ? `${st.color} ring-2 ring-[#040057] shadow-xs` 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Acciones de Cierre */}
        <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={dismissIncomingAlert}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
          >
            Cerrar Alerta
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAttend}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <ListFilter className="w-4 h-4" />
              <span>{currentRole === 'jefe_taller' ? 'Ir a Bandeja de Asignación' : 'Gestionar en Recepción'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

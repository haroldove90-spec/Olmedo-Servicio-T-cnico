import React, { useEffect, useState } from 'react';
import { 
  UserCheck, 
  Truck, 
  MapPin, 
  Phone, 
  Gauge, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Clock, 
  Volume2, 
  ExternalLink, 
  ClipboardList,
  ShieldCheck,
  User,
  Wrench
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playAssignmentAlertSound } from '../../utils/audioAlert';

export const AssignmentAlertModal: React.FC = () => {
  const { 
    latestAssignmentAlert, 
    dismissAssignmentAlert, 
    currentRole, 
    setActiveModule 
  } = useApp();

  const [soundMuted, setSoundMuted] = useState(false);

  // Visible para Jefe de Taller, Gerencia y Técnico
  const isAuthorizedRole = 
    currentRole === 'jefe_taller' || 
    currentRole === 'gerencia' || 
    currentRole === 'tecnico';

  useEffect(() => {
    if (latestAssignmentAlert && isAuthorizedRole && !soundMuted) {
      playAssignmentAlertSound();
    }
  }, [latestAssignmentAlert, isAuthorizedRole]);

  if (!latestAssignmentAlert || !isAuthorizedRole) {
    return null;
  }

  const { order, technician, assignedBy, timestamp, priority } = latestAssignmentAlert;
  const isRescue = order.requiresRescue || order.serviceType === 'rescate';

  const handleGoToModule = () => {
    dismissAssignmentAlert();
    if (currentRole === 'jefe_taller') {
      setActiveModule('reportes');
    } else if (currentRole === 'gerencia') {
      setActiveModule('reportes');
    } else if (currentRole === 'tecnico') {
      setActiveModule('mi_orden');
    }
  };

  const handlePlaySoundAgain = () => {
    playAssignmentAlertSound();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-4 border-indigo-600 animate-scaleUp">
        
        {/* Cabecera de la Ventana Flotante */}
        <div className="p-5 bg-linear-to-r from-[#040057] via-[#070085] to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-emerald-300 flex items-center justify-center shadow-md">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2.5 py-0.5 rounded-full">
                  📋 Reporte Asignado a Técnico
                </span>
                <span className="text-xs opacity-80 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timestamp}
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
              title="Repetir tono de asignación"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <Volume2 className="w-5 h-5 text-emerald-300" />
            </button>
            <button
              onClick={dismissAssignmentAlert}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo de la Ventana Flotante */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Tarjeta del Técnico Asignado */}
          <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-950 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                {technician.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Técnico Responsable Asignado
                </div>
                <div className="font-black text-base text-slate-900 truncate">
                  {technician.name}
                </div>
                <div className="text-xs text-emerald-800 font-semibold flex items-center gap-2 mt-0.5">
                  <span>Especialidad: {technician.specialty}</span>
                  <span className="text-slate-300">•</span>
                  <span className="px-2 py-0.2 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                    Despachado
                  </span>
                </div>
              </div>
            </div>

            {technician.phone && (
              <a
                href={`tel:${technician.phone}`}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Llamar</span>
              </a>
            )}
          </div>

          {/* Ficha de la Unidad y Prioridad */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Truck className="w-4 h-4 text-[#040057]" />
                <span className="font-bold text-slate-800">
                  {order.unitNumber || `Unidad (${order.vehicle.plates})`}
                </span>
                <span>•</span>
                <span>Eco: {order.vehicle.economicNumber}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${
                  priority === 'urgente' ? 'bg-rose-600 text-white animate-pulse' :
                  priority === 'alta' ? 'bg-amber-500 text-white' :
                  'bg-blue-600 text-white'
                }`}>
                  Prioridad {priority}
                </span>

                {isRescue && (
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                    ¡Rescate!
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Modelo / Tipo:</span>
                <span className="font-bold text-slate-800">
                  {order.vehicle.brandModel || order.vehicle.brand || 'Tractocamión'} ({order.vehicle.type})
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Km / Odómetro:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" />
                  {order.vehicle.mileage || '120,500 KM'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Operador de la Unidad:</span>
                <span className="font-bold text-slate-800">{order.operatorName || order.vehicle.driverContact || 'Operador 1'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Teléfono Operador:</span>
                <span className="font-bold text-slate-800">{order.operatorPhone || '55-1234-5678'}</span>
              </div>
            </div>
          </div>

          {/* Avería Reportada y Ubicación */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                Falla / Avería Reportada que Atenderá el Técnico:
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                {order.vehicle.failureDescription}
              </p>
            </div>

            <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-1 border-t border-amber-200/60">
              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span>{order.vehicle.location}</span>
            </div>

            {order.rescueLocationUrl && (
              <div className="pt-1">
                <a
                  href={order.rescueLocationUrl.startsWith('http') ? order.rescueLocationUrl : `https://${order.rescueLocationUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:underline"
                >
                  <span>Abrir Coordenadas GPS en Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Asignado por: <strong className="text-slate-800">{assignedBy}</strong>. Notificación despachada en tiempo real a Gerencia, Jefe de Taller y al Técnico.
            </span>
          </div>

        </div>

        {/* Acciones */}
        <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={dismissAssignmentAlert}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer"
          >
            Entendido / Cerrar
          </button>

          <button
            type="button"
            onClick={handleGoToModule}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>
              {currentRole === 'tecnico' ? 'Ver Mi Orden de Trabajo' : 'Ver en Módulo Reportes'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

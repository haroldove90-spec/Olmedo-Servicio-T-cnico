import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  FileText, 
  Search, 
  Plus, 
  Printer, 
  Truck, 
  Wrench, 
  User, 
  Phone, 
  CheckCircle2, 
  Edit3, 
  Download, 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  Share2, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceOrder, ServiceType, VehicleType } from '../../types';
import { TechnicalReportDocument } from './TechnicalReportDocument';

export const UnitReceptionManager: React.FC = () => {
  const { 
    orders, 
    technicians, 
    services, 
    createUnitReception, 
    currentRole 
  } = useApp();

  // Vista activa: 'dashboard' (listado de recepciones) o 'formulario' (nueva/edición en pantalla completa)
  const [viewMode, setViewMode] = useState<'dashboard' | 'formulario'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);

  // Mode: 'new_entry' or 'link_existing'
  const [entryMode, setEntryMode] = useState<'new_entry' | 'link_existing'>('new_entry');
  const [selectedExistingOrderId, setSelectedExistingOrderId] = useState<string>('');

  // Form Fields - Client & Location
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [serviceLocation, setServiceLocation] = useState('Taller Central Olmedo - Bahía 1');

  // Form Fields - Vehicle
  const [vehicleType, setVehicleType] = useState<VehicleType>('tractocamion');
  const [plates, setPlates] = useState('');
  const [economicNumber, setEconomicNumber] = useState('');
  const [brand, setBrand] = useState('Kenworth');
  const [model, setModel] = useState('');

  // Form Fields - Official Technical Report (matching user's screenshot)
  const [maintenanceNature, setMaintenanceNature] = useState<'correctivo' | 'preventivo'>('correctivo');
  const [preventiveNotes, setPreventiveNotes] = useState('');
  const [userOperator, setUserOperator] = useState('');
  const [chassisSerial, setChassisSerial] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [engineModel, setEngineModel] = useState('');
  const [engineSeries, setEngineSeries] = useState('');
  const [workPerformedDetail, setWorkPerformedDetail] = useState('');
  
  // Assignment & Priority
  const [assignedTechId, setAssignedTechId] = useState('');
  const [priority, setPriority] = useState<'baja' | 'media' | 'alta' | 'urgente'>('alta');
  const [receivedByStaff, setReceivedByStaff] = useState(() => 
    currentRole === 'gerencia' ? 'Gerencia / Dirección General' : 'Jefe de Taller'
  );

  // Success Feedback Banner & Document Preview
  const [lastSavedOrder, setLastSavedOrder] = useState<ServiceOrder | null>(null);
  const [viewingDocumentOrder, setViewingDocumentOrder] = useState<ServiceOrder | null>(null);

  // Search & Filter in Dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [natureFilter, setNatureFilter] = useState<'todos' | 'correctivo' | 'preventivo'>('todos');
  const [brandFilter, setBrandFilter] = useState('todas');

  // Filter orders that have reception / technical data
  const receptionOrders = orders.filter(o => 
    Boolean(o.receptionDate || o.reportNumber || o.maintenanceNature || o.vehicle.chassisSerialNumber)
  );

  // Fallback to all orders if none explicitly flagged yet
  const displayOrders = receptionOrders.length > 0 ? receptionOrders : orders;

  // Unique brands for filter
  const uniqueBrands = Array.from(
    new Set(displayOrders.map(o => o.vehicle.brand || o.vehicle.brandModel?.split(' ')[0]).filter(Boolean))
  ).sort();

  // Filtered List
  const filteredOrders = displayOrders.filter(o => {
    const term = searchTerm.toLowerCase().trim();
    const brandName = (o.vehicle.brand || o.vehicle.brandModel?.split(' ')[0] || '').toLowerCase();
    const modelName = (o.vehicle.model || o.vehicle.brandModel || '').toLowerCase();
    const platesMatch = (o.vehicle.plates || '').toLowerCase();
    const ecoMatch = (o.vehicle.economicNumber || '').toLowerCase();
    const clientMatch = (o.clientName || '').toLowerCase();
    const vinMatch = (o.vehicle.chassisSerialNumber || '').toLowerCase();
    const operatorMatch = (o.userOperatorName || o.vehicle.driverContact || '').toLowerCase();
    const folioMatch = (o.folio || '').toLowerCase();
    const reportNumMatch = (o.reportNumber || '').toLowerCase();

    const matchesSearch = !term || 
      folioMatch.includes(term) ||
      reportNumMatch.includes(term) ||
      clientMatch.includes(term) ||
      brandName.includes(term) ||
      modelName.includes(term) ||
      platesMatch.includes(term) ||
      ecoMatch.includes(term) ||
      vinMatch.includes(term) ||
      operatorMatch.includes(term);

    const matchesNature = natureFilter === 'todos' || o.maintenanceNature === natureFilter;
    const matchesBrand = brandFilter === 'todas' || brandName === brandFilter.toLowerCase();

    return matchesSearch && matchesNature && matchesBrand;
  });

  // Start a new reception
  const handleStartNewReception = () => {
    setIsEditing(false);
    setSelectedExistingOrderId('');
    setEntryMode('new_entry');
    setClientName('');
    setClientContact('');
    setClientCompany('');
    setServiceLocation('Taller Central Olmedo - Bahía 1');
    setVehicleType('tractocamion');
    setPlates('');
    setEconomicNumber('');
    setBrand('Kenworth');
    setModel('');
    setMaintenanceNature('correctivo');
    setPreventiveNotes('');
    setUserOperator('');
    setChassisSerial('');
    setOdometerReading('');
    setEngineModel('');
    setEngineSeries('');
    setWorkPerformedDetail('');
    setAssignedTechId('');
    setPriority('alta');
    setViewMode('formulario');
  };

  // Start editing an existing reception
  const handleEditReception = (order: ServiceOrder) => {
    setIsEditing(true);
    setSelectedExistingOrderId(order.id);
    setEntryMode('link_existing');
    setClientName(order.clientName || '');
    setClientContact(order.clientContact || '');
    setClientCompany(order.clientCompany || '');
    setServiceLocation(order.vehicle.location || 'Taller Central Olmedo - Bahía 1');
    setVehicleType(order.vehicle.type || 'tractocamion');
    setPlates(order.vehicle.plates || '');
    setEconomicNumber(order.vehicle.economicNumber || '');
    setBrand(order.vehicle.brand || order.vehicle.brandModel?.split(' ')[0] || 'Kenworth');
    setModel(order.vehicle.model || order.vehicle.brandModel?.split(' ').slice(1).join(' ') || '');
    setMaintenanceNature(order.maintenanceNature || 'correctivo');
    setPreventiveNotes(order.preventiveInspectionNotes || order.vehicle.failureDescription || '');
    setUserOperator(order.userOperatorName || order.vehicle.driverContact || '');
    setChassisSerial(order.vehicle.chassisSerialNumber || '');
    setOdometerReading(order.vehicle.odometerReading || '');
    setEngineModel(order.vehicle.engineModelTransmission || '');
    setEngineSeries(order.vehicle.engineSeriesTransmission || '');
    setWorkPerformedDetail(order.workPerformedDetail || '');
    setAssignedTechId(order.assignedTechnicianId || '');
    setPriority(order.priority || 'alta');
    setViewMode('formulario');
  };

  // When selecting an existing order to link from dropdown
  const handleSelectExistingOrder = (orderId: string) => {
    setSelectedExistingOrderId(orderId);
    const target = orders.find(o => o.id === orderId);
    if (!target) return;

    setClientName(target.clientName || '');
    setClientContact(target.clientContact || '');
    setClientCompany(target.clientCompany || '');
    setServiceLocation(target.vehicle.location || 'Taller Central Olmedo - Bahía 1');
    setVehicleType(target.vehicle.type || 'tractocamion');
    setPlates(target.vehicle.plates || '');
    setEconomicNumber(target.vehicle.economicNumber || '');
    setBrand(target.vehicle.brand || target.vehicle.brandModel?.split(' ')[0] || 'Kenworth');
    setModel(target.vehicle.model || target.vehicle.brandModel?.split(' ').slice(1).join(' ') || '');
    setMaintenanceNature(target.maintenanceNature || 'correctivo');
    setPreventiveNotes(target.preventiveInspectionNotes || target.vehicle.failureDescription || '');
    setUserOperator(target.userOperatorName || target.vehicle.driverContact || '');
    setChassisSerial(target.vehicle.chassisSerialNumber || '');
    setOdometerReading(target.vehicle.odometerReading || '');
    setEngineModel(target.vehicle.engineModelTransmission || '');
    setEngineSeries(target.vehicle.engineSeriesTransmission || '');
    setWorkPerformedDetail(target.workPerformedDetail || '');
    setAssignedTechId(target.assignedTechnicianId || '');
    setPriority(target.priority || 'alta');
  };

  // Submit Handler -> saves and returns to dashboard list
  const handleSubmitReception = (e: React.FormEvent) => {
    e.preventDefault();

    if (!plates.trim()) {
      alert('Por favor ingresa las placas del vehículo.');
      return;
    }
    if (!preventiveNotes.trim()) {
      alert('Por favor ingresa la inspección preventiva o motivo de ingreso.');
      return;
    }
    if (!userOperator.trim()) {
      alert('Por favor ingresa el nombre del operador/chofer en sitio.');
      return;
    }

    const saved = createUnitReception({
      existingOrderId: entryMode === 'link_existing' && selectedExistingOrderId ? selectedExistingOrderId : undefined,
      clientName: clientName.trim() || 'Cliente Mostrador / Flotilla',
      clientContact: clientContact.trim() || 'Sin teléfono registrado',
      clientCompany: clientCompany.trim() || undefined,
      serviceType: 'taller',
      priority,
      vehicle: {
        type: vehicleType,
        plates: plates.trim().toUpperCase(),
        economicNumber: economicNumber.trim().toUpperCase() || 'S/N',
        brand: brand.trim(),
        model: model.trim(),
        brandModel: `${brand.trim()} ${model.trim()}`.trim(),
        location: serviceLocation.trim(),
        failureDescription: preventiveNotes.trim(),
        driverContact: userOperator.trim(),
        chassisSerialNumber: chassisSerial.trim().toUpperCase(),
        odometerReading: odometerReading.trim().toUpperCase(),
        engineModelTransmission: engineModel.trim().toUpperCase(),
        engineSeriesTransmission: engineSeries.trim().toUpperCase(),
      },
      maintenanceNature,
      preventiveInspectionNotes: preventiveNotes.trim(),
      userOperatorName: userOperator.trim().toUpperCase(),
      workPerformedDetail: workPerformedDetail.trim(),
      assignedTechnicianId: assignedTechId || undefined,
      receivedByStaffName: receivedByStaff,
    });

    setLastSavedOrder(saved);
    // Retorna a la interfaz / dashboard en forma de lista como lo solicitó el usuario
    setViewMode('dashboard');
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No hay recepciones para exportar con los filtros seleccionados.');
      return;
    }

    let csvContent = '\uFEFF';
    csvContent += 'HISTORIAL DE RECEPCIÓN DE UNIDADES Y REPORTES TÉCNICOS - OLMEDO SERVICIO TÉCNICO\n';
    csvContent += `Fecha de Generación: ${new Date().toLocaleString('es-MX')}\n\n`;
    csvContent += 'Folio,Reporte Técnico No,Fecha Recepción,Cliente,Empresa,Contacto,Tipo Unidad,Marca,Modelo,Placas,No Económico,Serie Chasis (VIN),Odómetro,Tipo Servicio,Operador en Sitio,Inspección Preventiva (Falla),Detalle Realizado,Técnico Asignado,Estatus\n';

    filteredOrders.forEach((o) => {
      const brandVal = o.vehicle.brand || o.vehicle.brandModel?.split(' ')[0] || 'N/A';
      const modelVal = o.vehicle.model || o.vehicle.brandModel || 'N/A';
      const recDate = o.receptionDate ? new Date(o.receptionDate).toLocaleDateString('es-MX') : new Date(o.createdAt).toLocaleDateString('es-MX');

      csvContent += `"${o.folio}",`;
      csvContent += `"${o.reportNumber || 'N/A'}",`;
      csvContent += `"${recDate}",`;
      csvContent += `"${(o.clientName || '').replace(/"/g, '""')}",`;
      csvContent += `"${(o.clientCompany || '').replace(/"/g, '""')}",`;
      csvContent += `"${(o.clientContact || '').replace(/"/g, '""')}",`;
      csvContent += `"${o.vehicle.type.toUpperCase()}",`;
      csvContent += `"${brandVal.replace(/"/g, '""')}",`;
      csvContent += `"${modelVal.replace(/"/g, '""')}",`;
      csvContent += `"${o.vehicle.plates}",`;
      csvContent += `"${o.vehicle.economicNumber}",`;
      csvContent += `"${o.vehicle.chassisSerialNumber || 'N/A'}",`;
      csvContent += `"${o.vehicle.odometerReading || 'N/A'}",`;
      csvContent += `"${(o.maintenanceNature || 'correctivo').toUpperCase()}",`;
      csvContent += `"${(o.userOperatorName || o.vehicle.driverContact || 'N/A').replace(/"/g, '""')}",`;
      csvContent += `"${(o.preventiveInspectionNotes || o.vehicle.failureDescription || '').replace(/"/g, '""')}",`;
      csvContent += `"${(o.workPerformedDetail || '').replace(/"/g, '""')}",`;
      csvContent += `"${(o.assignedTechnicianName || 'Sin asignar').replace(/"/g, '""')}",`;
      csvContent += `"${o.status.toUpperCase()}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Olmedo_Recepcion_Unidades_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8 w-full max-w-full min-w-0">

      {/* ========================================================================= */}
      {/* VISTA 1: DASHBOARD / LISTADO DE RECEPCIONES REGISTRADAS (DEFAULT) */}
      {/* ========================================================================= */}
      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Encabezado del Módulo con Botón "+ Nueva Recepción" */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></span>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#040057] truncate">
                    Recepción de Unidades
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Control de ingresos a taller • Fichas técnicas • Formato Oficial de Reporte Técnico
                </p>
              </div>

              {/* Botón Principal para Abrir el Formulario en Pantalla Completa */}
              <button
                type="button"
                onClick={handleStartNewReception}
                className="px-5 py-3 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-xl transition cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>Nueva Recepción</span>
              </button>
            </div>
          </div>

          {/* Banner Informativo si se acaba de guardar una recepción */}
          {lastSavedOrder && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-xs animate-fadeIn flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    ¡Recepción Registrada con Éxito! • Folio {lastSavedOrder.folio}
                  </h3>
                  <p className="text-xs text-emerald-800 font-medium">
                    Unidad {lastSavedOrder.vehicle.type.toUpperCase()} ({lastSavedOrder.vehicle.plates}) • No. Económico: {lastSavedOrder.vehicle.economicNumber} • Reporte Técnico {lastSavedOrder.reportNumber || '023'}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingDocumentOrder(lastSavedOrder)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imprimir Formato</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLastSavedOrder(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-1 text-xs font-bold cursor-pointer"
                  title="Cerrar aviso"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Barra de Filtros, Búsqueda y Exportación */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Buscador en tiempo real */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por Folio, Reporte No, Cliente, Placas, Económico, Marca, Modelo, VIN o Chofer..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-[#040057] bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Filtros rápidos */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                
                {/* Tipo de Mantenimiento */}
                <select
                  value={natureFilter}
                  onChange={(e) => setNatureFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white"
                >
                  <option value="todos">Naturaleza: Todas</option>
                  <option value="correctivo">Solo Correctivos</option>
                  <option value="preventivo">Solo Preventivos</option>
                </select>

                {/* Marca de Unidad */}
                <select
                  value={brandFilter}
                  onChange={(e) => setBrandFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white"
                >
                  <option value="todas">Marca: Todas</option>
                  {uniqueBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>

                {/* Botón Exportar Excel */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Exportar listado a Excel / CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Excel</span>
                </button>
              </div>

            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <span>Total de recepciones registradas: <strong>{filteredOrders.length}</strong></span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          </div>

          {/* LISTA DE RECEPCIONES REGISTRADAS EN LA INTERFAZ / DASHBOARD */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No hay recepciones que mostrar</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No se encontraron unidades registradas con los filtros seleccionados o aún no has ingresado recepciones al taller.
              </p>
              <button
                type="button"
                onClick={handleStartNewReception}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#040057] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#070085]"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Crear Nueva Recepción</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const brandVal = order.vehicle.brand || order.vehicle.brandModel?.split(' ')[0] || 'N/A';
                const modelVal = order.vehicle.model || order.vehicle.brandModel || 'N/A';
                const recDate = order.receptionDate 
                  ? new Date(order.receptionDate).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
                  : new Date(order.createdAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition space-y-4"
                  >
                    {/* Encabezado de la Tarjeta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-extrabold text-[#040057]">{order.folio}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#040057] font-bold">
                          REPORTE TÉCNICO {order.reportNumber || '023'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          order.maintenanceNature === 'preventivo' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-indigo-100 text-[#040057]'
                        }`}>
                          {order.maintenanceNature ? `[X] ${order.maintenanceNature.toUpperCase()}` : '[X] CORRECTIVO'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold uppercase">
                          {order.vehicle.type.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Recibido: <strong>{recDate}</strong></span>
                      </div>
                    </div>

                    {/* Ficha Mecánica y Detalles de la Recepción */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Unidad y Marca</span>
                        <div className="font-extrabold text-[#040057] text-sm mt-0.5">
                          {brandVal} {modelVal}
                        </div>
                        <div className="text-slate-600 mt-0.5">
                          Placas: <strong className="text-slate-900">{order.vehicle.plates}</strong> • Eco: <strong className="text-slate-900">{order.vehicle.economicNumber}</strong>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Identificación Técnica</span>
                        <div className="font-mono text-slate-800 text-[11px] mt-0.5">
                          VIN: <strong>{order.vehicle.chassisSerialNumber || 'Sin serie registrada'}</strong>
                        </div>
                        <div className="text-slate-600 mt-0.5">
                          Odómetro: <strong>{order.vehicle.odometerReading || 'N/A'}</strong>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Cliente y Operador</span>
                        <div className="font-bold text-slate-800 mt-0.5">{order.clientName}</div>
                        <div className="text-slate-600 mt-0.5">
                          Operador: <strong>{order.userOperatorName || order.vehicle.driverContact || 'N/A'}</strong>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Atención en Taller</span>
                        <div className="font-semibold text-slate-800 mt-0.5">
                          Técnico: <strong className="text-[#040057]">{order.assignedTechnicianName || 'Por asignar'}</strong>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Ubicación: {order.vehicle.location}
                        </div>
                      </div>
                    </div>

                    {/* Inspección Preventiva y Detalle */}
                    <div className="text-xs space-y-1.5">
                      <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-slate-800">
                        <strong className="text-amber-900">Inspección Preventiva (Falla Inicial): </strong>
                        <span>{order.preventiveInspectionNotes || order.vehicle.failureDescription}</span>
                      </div>

                      {order.workPerformedDetail && (
                        <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-slate-800 font-mono text-[11px]">
                          <strong className="text-[#040057]">Detalle Técnico Solicitado: </strong>
                          <span className="line-clamp-2">{order.workPerformedDetail}</span>
                        </div>
                      )}
                    </div>

                    {/* Acciones de la Recepción */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-400">
                        {order.receivedByStaffName && (
                          <span>Recibido por: <strong className="text-slate-600">{order.receivedByStaffName}</strong></span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Botón WhatsApp */}
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `*OLMEDO SERVICIO TÉCNICO* 🚛\n` +
                            `Se ha registrado la recepción de la unidad *${order.vehicle.type.toUpperCase()}* (${order.vehicle.plates}) • Económico: *${order.vehicle.economicNumber}*\n` +
                            `Folio: *${order.folio}* • Reporte Técnico: *${order.reportNumber || '023'}*\n` +
                            `Odómetro: ${order.vehicle.odometerReading || 'N/A'} • Chasis: ${order.vehicle.chassisSerialNumber || 'N/A'}\n` +
                            `Diagnóstico: ${order.preventiveInspectionNotes || order.vehicle.failureDescription}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1 transition"
                          title="Compartir ficha de recepción vía WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Botón Editar Ficha (Abre el Formulario en Pantalla Completa) */}
                        <button
                          type="button"
                          onClick={() => handleEditReception(order)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Editar Ficha</span>
                        </button>

                        {/* Botón Imprimir Reporte Técnico Oficial */}
                        <button
                          type="button"
                          onClick={() => setViewingDocumentOrder(order)}
                          className="px-4 py-1.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ver Formato Impreso</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: FORMULARIO EN SECCIÓN DIFERENTE / PANTALLA COMPLETA */}
      {/* (SE MUESTRA CUANDO EL USUARIO DA CLIC EN NUEVA RECEPCIÓN O EDITAR) */}
      {/* ========================================================================= */}
      {viewMode === 'formulario' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Barra Superior con Botón de Regreso a la Lista */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('dashboard')}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
                title="Volver a la lista de recepciones"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Listado</span>
              </button>

              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[#040057]">
                  {isEditing ? 'Editar Ficha de Recepción' : 'Nueva Recepción de Unidad (Reporte Técnico)'}
                </h1>
                <p className="text-xs text-slate-500">
                  Formulario oficial para recopilar los datos mecánicos de la unidad que entra al taller.
                </p>
              </div>
            </div>

            {/* Selector de Modalidad si no está editando */}
            {!isEditing && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-bold uppercase text-slate-400">Modalidad:</span>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEntryMode('new_entry');
                      setSelectedExistingOrderId('');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      entryMode === 'new_entry' ? 'bg-[#040057] text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Directo a Taller
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('link_existing')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      entryMode === 'link_existing' ? 'bg-[#040057] text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Desde Solicitud Previa
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selector de Solicitud Previa si está en link_existing */}
          {!isEditing && entryMode === 'link_existing' && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#040057]">
                Selecciona la orden pendiente para cargar automáticamente los datos del cliente y unidad:
              </span>
              <select
                value={selectedExistingOrderId}
                onChange={(e) => handleSelectExistingOrder(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 rounded-xl border border-blue-300 font-bold text-[#040057] bg-white focus:ring-2 focus:ring-[#040057]"
              >
                <option value="">-- Elige solicitud para autollenar --</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.folio} — {o.clientName} ({o.vehicle.plates})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Formulario en Pantalla Completa */}
          <form onSubmit={handleSubmitReception} className="space-y-6">

            {/* SECCIÓN 1: DATOS DEL CLIENTE Y UNIDAD */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#040057]" />
                <h2 className="text-base font-bold text-[#040057]">
                  Ficha del Cliente y Vehículo
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cliente / Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Transportes del Norte S.A. de C.V."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#040057] bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    placeholder="Ej. 55 4920 1822 / Lic. Mendoza"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#040057] bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bahía / Ubicación de Taller *
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceLocation}
                    onChange={(e) => setServiceLocation(e.target.value)}
                    placeholder="Ej. Taller Central - Bahía 3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#040057] bg-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipo de Vehículo *
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white"
                  >
                    <option value="tractocamion">Tractocamión</option>
                    <option value="camion">Camión</option>
                    <option value="bus">Autobús / Bus</option>
                    <option value="auto">Auto / Utilitario</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Placas de la Unidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={plates}
                    onChange={(e) => setPlates(e.target.value.toUpperCase())}
                    placeholder="Ej. 82-AF-9K"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase font-bold text-[#040057] bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Económico *
                  </label>
                  <input
                    type="text"
                    required
                    value={economicNumber}
                    onChange={(e) => setEconomicNumber(e.target.value.toUpperCase())}
                    placeholder="Ej. ECO-308"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase font-bold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Marca de la Unidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ej. Kenworth, Freightliner, ANKAI"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-[#040057] bg-white"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Modelo de la Unidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ej. T680 2023, Cascadia"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: 1. SERVICIO SOLICITADO */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-[#040057]">
                    1. Servicio Solicitado
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  Formato Oficial de Recepción
                </span>
              </div>

              {/* Selector de Naturaleza: [X] CORRECTIVO / [ ] PREVENTIVO */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block font-bold text-slate-700 mb-2 uppercase text-[11px] tracking-wider">
                  Naturaleza del Mantenimiento *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMaintenanceNature('correctivo')}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition cursor-pointer font-extrabold text-sm ${
                      maintenanceNature === 'correctivo'
                        ? 'bg-[#040057] text-white border-[#040057] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>[X] CORRECTIVO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaintenanceNature('preventivo')}
                    className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition cursor-pointer font-extrabold text-sm ${
                      maintenanceNature === 'preventivo'
                        ? 'bg-[#040057] text-white border-[#040057] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>[ ] PREVENTIVO</span>
                  </button>
                </div>
              </div>

              {/* Inspección Preventiva y Operador en Sitio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Inspección Preventiva (Falla Inicial / Motivo de Ingreso) *
                  </label>
                  <input
                    type="text"
                    required
                    value={preventiveNotes}
                    onChange={(e) => setPreventiveNotes(e.target.value.toUpperCase())}
                    placeholder="Ej. VIBRACIÓN EXCESIVA AL METER PRIMERA Y OLOR A FRICCIÓN"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl uppercase font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-[#040057]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Falla reportada por el cliente o detectada al momento de la inspección inicial.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Usuario / Operador en Sitio *
                  </label>
                  <input
                    type="text"
                    required
                    value={userOperator}
                    onChange={(e) => setUserOperator(e.target.value.toUpperCase())}
                    placeholder="Ej. OPERADOR DON PEDRO (55 3344 5566)"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl uppercase font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-[#040057]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nombre del conductor que entrega físicamente la unidad en taller.
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: 2. FICHA TÉCNICA DEL EQUIPO Y CONJUNTO MECÁNICO */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-[#040057]">
                    2. Ficha Técnica del Equipo y Conjunto Mecánico
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-semibold">
                  Identificación de Chasis y Tren Motriz
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Número de Serie de Chasis (VIN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={chassisSerial}
                    onChange={(e) => setChassisSerial(e.target.value.toUpperCase())}
                    placeholder="Ej. LA83J1PK5SA100693"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl uppercase font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#040057]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Odómetro / Horómetro Actual *
                  </label>
                  <input
                    type="text"
                    required
                    value={odometerReading}
                    onChange={(e) => setOdometerReading(e.target.value.toUpperCase())}
                    placeholder="Ej. 130618 KM"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl uppercase font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#040057]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Modelo de Motor / Transmisión
                  </label>
                  <input
                    type="text"
                    value={engineModel}
                    onChange={(e) => setEngineModel(e.target.value.toUpperCase())}
                    placeholder="Ej. WP7NG260E61 o Cummins X15"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl uppercase font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#040057]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Serie del Motor / Transmisión
                  </label>
                  <input
                    type="text"
                    value={engineSeries}
                    onChange={(e) => setEngineSeries(e.target.value.toUpperCase())}
                    placeholder="Ej. 1625A000221"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl uppercase font-mono font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#040057]"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: DETALLE DE TRABAJO A REALIZAR */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-[#040057]">
                    Servicio a Realizar / Detalle Técnico de Recepción
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400">
                  Incluye posiciones (POS 3y4, POS 5y6, etc.)
                </span>
              </div>

              {/* Selector Rápido desde Catálogo de Servicios Oficial */}
              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#040057]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Insertar Servicio desde Catálogo Oficial:
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Autocompleta descripción y especificaciones
                  </span>
                </div>

                <select
                  onChange={(e) => {
                    const srv = services.find(s => s.id === e.target.value);
                    if (srv) {
                      const textToAdd = `CORRECTIVO REALIZADO: ${srv.name}. ${srv.description}`;
                      setWorkPerformedDetail(prev => prev ? `${prev}\n\n• ${textToAdd}` : textToAdd);
                    }
                  }}
                  defaultValue=""
                  className="w-full px-3 py-2 rounded-xl border border-indigo-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057]"
                >
                  <option value="">-- Seleccionar servicio ofrecido para insertar en la ficha --</option>
                  {services.filter(s => s.isActive).map(s => (
                    <option key={s.id} value={s.id}>
                      [{s.code}] {s.name} — ${s.basePrice.toLocaleString('es-MX')} MXN
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                rows={4}
                value={workPerformedDetail}
                onChange={(e) => setWorkPerformedDetail(e.target.value)}
                placeholder="Ej. CORRECTIVO REALIZADO: SE BRINDA SERVICIO DE ASISTENCIA EN TALLER, SE REEMPLAZAN BALATAS (POS 3y4) Y (POS 5y6) (PROPORCIONADAS POR CLIENTE), SE INSTALAN LOS MISMOS TAMBORES (NO TENÍAN DAÑO), SE REEMPLAZA MATRACA DE FRENO (POS 3y4) Y (POS 5y6), SE REALIZA ESCANEO Y REESTABLECIMIENTO DE PARÁMETROS..."
                className="w-full px-3.5 py-3 border border-slate-300 rounded-xl uppercase text-xs leading-relaxed font-mono focus:ring-2 focus:ring-[#040057] bg-white"
              />
            </div>

            {/* SECCIÓN 5: ASIGNACIÓN OPERATIVA Y PERSONAL QUE RECIBE */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-[#040057]">
                  Asignación y Responsabilidad de Recepción
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Técnico Asignado (Opcional al recibir)
                  </label>
                  <select
                    value={assignedTechId}
                    onChange={(e) => setAssignedTechId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-[#040057] bg-white"
                  >
                    <option value="">-- Sin técnico asignado (Pendiente) --</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.specialty} • {t.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Prioridad del Servicio
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente (Prioridad Máxima)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Personal que Recibe la Unidad
                  </label>
                  <input
                    type="text"
                    value={receivedByStaff}
                    onChange={(e) => setReceivedByStaff(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN: GUARDAR Y RETORNAR AL DASHBOARD */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => setViewMode('dashboard')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Cancelar y Volver al Listado
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-extrabold text-sm shadow-md hover:shadow-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                <span>Guardar Recepción y Ver en Dashboard</span>
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE VISTA PREVIA IMPRESA OFICIAL (TechnicalReportDocument) */}
      {/* ========================================================================= */}
      {viewingDocumentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
            <div className="p-4 bg-[#040057] text-white flex justify-between items-center print:hidden shrink-0">
              <div className="min-w-0 pr-4">
                <h3 className="font-bold text-sm sm:text-base truncate">
                  Formato Oficial: REPORTE TÉCNICO {viewingDocumentOrder.reportNumber || '023'}
                </h3>
                <p className="text-xs text-blue-200 truncate">
                  Folio {viewingDocumentOrder.folio} • {viewingDocumentOrder.vehicle.type.toUpperCase()} ({viewingDocumentOrder.vehicle.plates})
                </p>
              </div>
              <button 
                onClick={() => setViewingDocumentOrder(null)} 
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <TechnicalReportDocument order={viewingDocumentOrder} />
            </div>

            <div className="p-3.5 bg-slate-50 border-t flex justify-between items-center print:hidden shrink-0">
              <span className="text-xs text-slate-500">
                Documento oficial con validez operativa y entrega técnica
              </span>
              <button
                type="button"
                onClick={() => setViewingDocumentOrder(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

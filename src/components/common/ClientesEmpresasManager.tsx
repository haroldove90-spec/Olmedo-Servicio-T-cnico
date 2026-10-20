import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Truck, 
  User, 
  Phone, 
  MessageSquare, 
  MapPin, 
  FileText, 
  FileSpreadsheet, 
  Printer, 
  Trash2, 
  Edit3, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Eye, 
  Clock, 
  ExternalLink,
  ShieldCheck,
  X,
  Gauge,
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientCompany, UnitCatalogItem, VehicleType, ServiceOrder } from '../../types';
import { ClientReportPdfModal } from './ClientReportPdfModal';
import { ConsolidatedReportsLogView } from './ConsolidatedReportsLogView';

export const ClientesEmpresasManager: React.FC = () => {
  const { 
    clients, 
    addClient, 
    updateClient, 
    deleteClient, 
    units, 
    addUnit, 
    orders, 
    addToast 
  } = useApp();

  // Estados de navegación y vista
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeExpedienteTab, setActiveExpedienteTab] = useState<'unidades' | 'historial'>('unidades');

  // Modal para agregar una unidad directamente al expediente de una empresa
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);

  // Modal para ver reporte en PDF
  const [viewingPdfOrder, setViewingPdfOrder] = useState<ServiceOrder | null>(null);

  // Formato de visualización del historial (Tarjetas vs Bitácora del cliente)
  const [historialFormat, setHistorialFormat] = useState<'tarjetas' | 'bitacora_cliente'>('bitacora_cliente');

  // ==========================================
  // ESTADOS DEL FORMULARIO DE ALTA DE EMPRESA
  // ==========================================
  const [companyName, setCompanyName] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Sección de unidades iniciales en el formulario de la empresa
  interface FormUnitItem {
    id: string;
    unitNumber: string;
    plates: string;
    economicNumber: string;
    brand: string;
    model: string;
    type: VehicleType;
    defaultOdometer: string;
    assignedOperator: string;
  }

  const [initialUnitsList, setInitialUnitsList] = useState<FormUnitItem[]>([
    {
      id: '1',
      unitNumber: 'Unidad 1',
      plates: '',
      economicNumber: '',
      brand: 'Kenworth',
      model: 'T680',
      type: 'tractocamion',
      defaultOdometer: '120,000 KM',
      assignedOperator: '',
    }
  ]);

  // Estado para modal de nueva unidad dentro del expediente
  const [newUnitNumber, setNewUnitNumber] = useState('');
  const [newUnitPlates, setNewUnitPlates] = useState('');
  const [newUnitEco, setNewUnitEco] = useState('');
  const [newUnitBrand, setNewUnitBrand] = useState('Kenworth');
  const [newUnitModel, setNewUnitModel] = useState('T680');
  const [newUnitType, setNewUnitType] = useState<VehicleType>('tractocamion');
  const [newUnitOdometer, setNewUnitOdometer] = useState('100,000 KM');
  const [newUnitOperator, setNewUnitOperator] = useState('');

  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Manejo de carga de archivo de logo local
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        addToast('warning', 'Archivo muy grande', 'Por favor selecciona una imagen menor a 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Agregar fila de unidad en el formulario
  const handleAddUnitRow = () => {
    const nextNum = initialUnitsList.length + 1;
    setInitialUnitsList(prev => [
      ...prev,
      {
        id: String(Date.now()),
        unitNumber: `Unidad ${nextNum}`,
        plates: '',
        economicNumber: `ECO-${String(nextNum).padStart(3, '0')}`,
        brand: 'Kenworth',
        model: 'T680',
        type: 'tractocamion',
        defaultOdometer: '100,000 KM',
        assignedOperator: '',
      }
    ]);
  };

  const handleRemoveUnitRow = (id: string) => {
    if (initialUnitsList.length === 1) {
      addToast('info', 'Mínimo requerido', 'Debe mantenerse al menos una fila o dejarla vacía.');
      return;
    }
    setInitialUnitsList(prev => prev.filter(u => u.id !== id));
  };

  const handleUpdateUnitRow = (id: string, field: keyof FormUnitItem, value: any) => {
    setInitialUnitsList(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  // Enviar formulario de registro de empresa
  const handleSubmitCompany = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      addToast('warning', 'Campo Faltante', 'Por favor ingresa el nombre de la empresa.');
      return;
    }

    if (!representativeName.trim()) {
      addToast('warning', 'Campo Faltante', 'Por favor ingresa el nombre del representante.');
      return;
    }

    // Registrar la empresa
    const createdCompany = addClient({
      companyName: companyName.trim(),
      representativeName: representativeName.trim(),
      address: address.trim() || 'Dirección no especificada',
      phone: phone.trim() || '55 0000 0000',
      whatsapp: whatsapp.trim() || phone.trim() || '5500000000',
      logoUrl: logoUrl.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Registrar las unidades asociadas que tengan al menos placas o número
    initialUnitsList.forEach((u, idx) => {
      if (u.unitNumber.trim()) {
        addUnit({
          companyId: createdCompany.id,
          companyName: createdCompany.companyName,
          unitNumber: u.unitNumber.trim() || `Unidad ${idx + 1}`,
          plates: u.plates.trim().toUpperCase() || `PL-${100 + idx}-X`,
          economicNumber: u.economicNumber.trim().toUpperCase() || `ECO-${100 + idx}`,
          brand: u.brand.trim() || 'Kenworth',
          model: u.model.trim() || 'T680',
          type: u.type,
          defaultOdometer: u.defaultOdometer.trim() || '120,000 KM',
          assignedOperator: u.assignedOperator.trim() || undefined,
          status: 'activa',
        });
      }
    });

    // Resetear formulario
    setCompanyName('');
    setRepresentativeName('');
    setAddress('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setNotes('');
    setLogoUrl('');
    setInitialUnitsList([
      {
        id: '1',
        unitNumber: 'Unidad 1',
        plates: '',
        economicNumber: '',
        brand: 'Kenworth',
        model: 'T680',
        type: 'tractocamion',
        defaultOdometer: '120,000 KM',
        assignedOperator: '',
      }
    ]);
    setIsRegisterModalOpen(false);
    setSelectedCompanyId(createdCompany.id);
  };

  // Agregar una unidad directamente a la empresa activa
  const handleSaveUnitToCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    if (!newUnitNumber.trim()) {
      addToast('warning', 'Campo Faltante', 'Indica el número o identificación de la unidad.');
      return;
    }

    addUnit({
      companyId: selectedCompany.id,
      companyName: selectedCompany.companyName,
      unitNumber: newUnitNumber.trim(),
      plates: newUnitPlates.trim().toUpperCase() || 'SP-00-00',
      economicNumber: newUnitEco.trim().toUpperCase() || `ECO-${Date.now().toString().slice(-3)}`,
      brand: newUnitBrand.trim() || 'Kenworth',
      model: newUnitModel.trim() || 'T680',
      type: newUnitType,
      defaultOdometer: newUnitOdometer.trim() || '120,000 KM',
      assignedOperator: newUnitOperator.trim() || undefined,
      status: 'activa',
    });

    // Resetear campos
    setNewUnitNumber('');
    setNewUnitPlates('');
    setNewUnitEco('');
    setNewUnitBrand('Kenworth');
    setNewUnitModel('T680');
    setNewUnitOperator('');
    setIsAddUnitModalOpen(false);
  };

  // Empresa seleccionada actualmente
  const selectedCompany = clients.find(c => c.id === selectedCompanyId) || null;

  // Unidades de la empresa seleccionada
  const companyUnits = selectedCompany 
    ? units.filter(u => u.companyId === selectedCompany.id || u.companyName === selectedCompany.companyName)
    : [];

  // Reportes / Órdenes de la empresa seleccionada
  const companyOrders = selectedCompany
    ? orders.filter(o => 
        (o.clientCompany && o.clientCompany.toLowerCase().includes(selectedCompany.companyName.toLowerCase())) ||
        (o.clientName && o.clientName.toLowerCase().includes(selectedCompany.companyName.toLowerCase())) ||
        companyUnits.some(u => u.plates.toUpperCase() === o.vehicle.plates?.toUpperCase() || u.unitNumber === o.unitNumber)
      )
    : [];

  // Filtrado de lista de empresas
  const filteredClients = clients.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(q) ||
      c.representativeName.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.whatsapp.includes(q)
    );
  });

  // ==========================================
  // EXPORTACIÓN A EXCEL (.CSV UTF-8 COMPATIBLE)
  // ==========================================
  const handleExportToExcel = () => {
    if (!selectedCompany) return;

    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel

    // SECCIÓN 1: DATOS DE LA EMPRESA
    csvContent += '==================================================\r\n';
    csvContent += `EXPEDIENTE CORPORATIVO: ${selectedCompany.companyName}\r\n`;
    csvContent += '==================================================\r\n';
    csvContent += `Representante:,"${selectedCompany.representativeName}"\r\n`;
    csvContent += `Dirección:,"${selectedCompany.address}"\r\n`;
    csvContent += `Teléfono:,"${selectedCompany.phone}"\r\n`;
    csvContent += `WhatsApp:,"${selectedCompany.whatsapp}"\r\n`;
    csvContent += `Email:,"${selectedCompany.email || 'N/A'}"\r\n`;
    csvContent += `Fecha de Registro:,"${new Date(selectedCompany.createdAt).toLocaleDateString('es-MX')}"\r\n`;
    csvContent += `Total de Unidades en Flota:,"${companyUnits.length}"\r\n`;
    csvContent += `Total de Reportes Históricos:,"${companyOrders.length}"\r\n\r\n`;

    // SECCIÓN 2: FLOTA DE UNIDADES REGISTRADAS
    csvContent += '--- FLOTA DE UNIDADES REGISTRADAS ---\r\n';
    csvContent += 'No. Unidad,Placas,No. Económico,Marca,Modelo,Tipo,Odómetro,Operador Asignado,Estatus\r\n';
    companyUnits.forEach(u => {
      csvContent += `"${u.unitNumber}","${u.plates}","${u.economicNumber}","${u.brand}","${u.model}","${u.type}","${u.defaultOdometer || ''}","${u.assignedOperator || 'No asignado'}","${u.status}"\r\n`;
    });
    csvContent += '\r\n';

    // SECCIÓN 3: HISTORIAL DE REPORTES DE FALLA Y SERVICIOS
    csvContent += '--- HISTORIAL DE REPORTES DE FALLA Y SERVICIOS ---\r\n';
    csvContent += 'Folio,Fecha,Unidad,Placas,Operador,Teléfono,Tipo Servicio,Falla Reportada,Estatus,Técnico Asignado,Rescate Carretero\r\n';
    companyOrders.forEach(o => {
      const isRescue = o.requiresRescue || o.serviceType === 'rescate' ? 'SÍ' : 'NO';
      const cleanDesc = (o.vehicle.failureDescription || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      csvContent += `"${o.folio}","${new Date(o.createdAt).toLocaleDateString('es-MX')}","${o.unitNumber || o.vehicle.economicNumber}","${o.vehicle.plates}","${o.operatorName || o.clientContact}","${o.operatorPhone || ''}","${o.serviceType}","${cleanDesc}","${o.status}","${o.assignedTechnicianName || 'Sin asignar'}","${isRescue}"\r\n`;
    });

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = selectedCompany.companyName.replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.setAttribute('download', `Expediente_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Exportación a Excel Exitosa', 'El archivo CSV compatible con Excel ha sido generado y descargado.');
  };

  // ==========================================
  // EXPORTACIÓN A PDF (VENTANA DE IMPRESIÓN)
  // ==========================================
  const handlePrintExpedientePdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* ======================================================== */}
      {/* VISTA 1: LISTADO Y GESTIÓN DE CLIENTES / EMPRESAS        */}
      {/* ======================================================== */}
      {!selectedCompany ? (
        <div className="space-y-6">
          
          {/* Cabecera del módulo */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-[#040057] flex items-center gap-2">
                  <span>Módulo de Clientes y Empresas</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
                    {clients.length} Registrados
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Registro oficial de empresas, representantes, flota vehicular asignada y expedientes de servicio.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-indigo-700 to-[#040057] hover:from-indigo-800 hover:to-[#070085] text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar Cliente / Empresa</span>
            </button>
          </div>

          {/* Buscador de empresas */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar empresa por nombre, representante, dirección, teléfono o WhatsApp..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] shadow-xs transition"
            />
          </div>

          {/* Grid de tarjetas de empresas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => {
              const clientUnitsCount = units.filter(u => u.companyId === client.id || u.companyName === client.companyName).length;
              const clientOrdersCount = orders.filter(o => 
                (o.clientCompany && o.clientCompany.toLowerCase().includes(client.companyName.toLowerCase())) ||
                (o.clientName && o.clientName.toLowerCase().includes(client.companyName.toLowerCase()))
              ).length;

              return (
                <div
                  key={client.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-200 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Cabecera de la tarjeta con logo */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {client.logoUrl ? (
                          <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-white p-1 overflow-hidden shrink-0 shadow-xs">
                            <img src={client.logoUrl} alt={client.companyName} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-lg shrink-0">
                            {client.companyName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-black text-slate-900 text-sm sm:text-base line-clamp-1">
                            {client.companyName}
                          </h3>
                          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="truncate">{client.representativeName}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Datos de contacto */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-emerald-700">WhatsApp: {client.whatsapp}</span>
                        <a
                          href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-[10px] font-bold text-emerald-600 hover:underline"
                        >
                          Chatear
                        </a>
                      </div>
                      <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-[11px] text-slate-500">{client.address}</span>
                      </div>
                    </div>

                    {/* Badges de flota e historial */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2 text-center">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase block">Flota Unidades</span>
                        <span className="font-black text-[#040057] text-base">{clientUnitsCount}</span>
                      </div>
                      <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2 text-center">
                        <span className="text-[10px] font-bold text-amber-700 uppercase block">Reportes Históricos</span>
                        <span className="font-black text-amber-900 text-base">{clientOrdersCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón para ver expediente */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompanyId(client.id);
                        setActiveExpedienteTab('unidades');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-indigo-300" />
                      <span>Ver Expediente e Historial</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredClients.length === 0 && (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700">No se encontraron empresas con esa búsqueda</h3>
              <p className="text-xs text-slate-400">Prueba con otro término o registra una nueva empresa.</p>
            </div>
          )}

        </div>
      ) : (
        /* ======================================================== */
        /* VISTA 2: EXPEDIENTE COMPLETO DE LA EMPRESA SELECCIONADA  */
        /* ======================================================== */
        <div className="space-y-6">
          
          {/* Cabecera del Expediente */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyId(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {selectedCompany.logoUrl ? (
                  <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-white p-1.5 overflow-hidden shadow-xs shrink-0">
                    <img src={selectedCompany.logoUrl} alt={selectedCompany.companyName} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-xl shrink-0">
                    {selectedCompany.companyName.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div>
                  <h2 className="text-base sm:text-xl font-black text-[#040057]">
                    {selectedCompany.companyName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Representante: <strong className="text-slate-800">{selectedCompany.representativeName}</strong> • Alta: {new Date(selectedCompany.createdAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
              </div>

              {/* Botones de Exportación PDF y Excel requeridos */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Exportar Expediente a Excel */}
                <button
                  type="button"
                  onClick={handleExportToExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar a Excel (.csv)</span>
                </button>

                {/* Exportar Expediente a PDF */}
                <button
                  type="button"
                  onClick={handlePrintExpedientePdf}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Exportar Expediente en PDF</span>
                </button>

                {/* Registrar Unidad para esta empresa */}
                <button
                  type="button"
                  onClick={() => setIsAddUnitModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Registrar Unidad</span>
                </button>
              </div>
            </div>

            {/* Ficha rápida de contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Teléfono y Oficina:</span>
                <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">{selectedCompany.phone}</span>
                {selectedCompany.email && (
                  <span className="text-slate-500 text-[11px] block">{selectedCompany.email}</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">WhatsApp Directo:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-extrabold text-emerald-700 text-sm">{selectedCompany.whatsapp}</span>
                  <a
                    href={`https://wa.me/${selectedCompany.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] hover:bg-emerald-200"
                  >
                    Abrir Chat
                  </a>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Dirección Corporativa:</span>
                <span className="text-slate-700 font-medium text-xs mt-0.5 block line-clamp-2">{selectedCompany.address}</span>
              </div>
            </div>

            {/* Pestañas del expediente */}
            <div className="flex items-center gap-2 pt-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActiveExpedienteTab('unidades')}
                className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-2 ${
                  activeExpedienteTab === 'unidades'
                    ? 'bg-[#040057] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Flota de Unidades Registradas ({companyUnits.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveExpedienteTab('historial')}
                className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-2 ${
                  activeExpedienteTab === 'historial'
                    ? 'bg-[#040057] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Historial de Reportes y Fallas ({companyOrders.length})</span>
              </button>
            </div>

          </div>

          {/* CONTENIDO PESTAÑA 1: UNIDADES REGISTRADAS */}
          {activeExpedienteTab === 'unidades' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-600" />
                  <span>Unidades Asignadas a {selectedCompany.companyName}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddUnitModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Otra Unidad</span>
                </button>
              </div>

              {companyUnits.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-3">
                  <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">Esta empresa no tiene unidades registradas todavía</p>
                  <button
                    type="button"
                    onClick={() => setIsAddUnitModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#040057] text-white text-xs font-bold cursor-pointer"
                  >
                    + Registrar Primera Unidad
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {companyUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-black text-sm text-[#040057]">{unit.unitNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          unit.status === 'en_taller' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {unit.status === 'en_taller' ? 'En Taller' : 'Activa'}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-600">
                        <div>
                          Placas: <strong className="text-slate-900">{unit.plates}</strong> • Eco: <strong className="text-slate-900">{unit.economicNumber}</strong>
                        </div>
                        <div className="text-slate-500 font-medium">
                          {unit.brand} {unit.model} ({unit.type?.toUpperCase()})
                        </div>
                        {unit.defaultOdometer && (
                          <div className="flex items-center gap-1 text-slate-700 font-semibold pt-1">
                            <Gauge className="w-3.5 h-3.5 text-slate-400" />
                            <span>{unit.defaultOdometer}</span>
                          </div>
                        )}
                        {unit.assignedOperator && (
                          <div className="flex items-center gap-1 text-slate-600 pt-0.5 text-[11px]">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{unit.assignedOperator}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* CONTENIDO PESTAÑA 2: HISTORIAL DE REPORTES DE FALLA */}
          {activeExpedienteTab === 'historial' && (
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Historial de Reportes y Mantenimiento de {selectedCompany.companyName}</span>
                </h3>

                {/* Selector de formato: Bitácora del cliente vs Tarjetas */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setHistorialFormat('bitacora_cliente')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      historialFormat === 'bitacora_cliente'
                        ? 'bg-[#040057] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Bitácora Consolidada (Formato Cliente)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHistorialFormat('tarjetas')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      historialFormat === 'tarjetas'
                        ? 'bg-[#040057] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Vista Tarjetas</span>
                  </button>
                </div>
              </div>

              {companyOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">No hay reportes de falla registrados aún para esta empresa</p>
                  <p className="text-xs text-slate-400">Cuando el cliente reporte averías, se listarán en este expediente.</p>
                </div>
              ) : historialFormat === 'bitacora_cliente' ? (
                /* VISTA FORMATO CLIENTE CONSOLIDADO (DÍA, OPERADOR, FALLA, CORRECTIVO, REFACCIONES) */
                <ConsolidatedReportsLogView 
                  orders={companyOrders}
                  companyName={selectedCompany.companyName}
                  title={`BITÁCORA TÉCNICA Y DE SERVICIOS - ${selectedCompany.companyName.toUpperCase()}`}
                  showFilters={true}
                />
              ) : (
                /* VISTA TARJETAS INDIVIDUALES */
                <div className="space-y-3">
                  {companyOrders.map((order) => {
                    const isRescue = order.requiresRescue || order.serviceType === 'rescate';

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[#040057] text-xs font-black border border-slate-200">
                              {order.unitNumber || `Unidad ${order.vehicle.economicNumber}`} ({order.vehicle.plates})
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-300">
                              {order.status === 'cerrado' ? 'Cerrado' : 'En Proceso / Diagnóstico'}
                            </span>
                            {isRescue && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">
                                ⚠️ Rescate Carretero
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">
                              {new Date(order.createdAt).toLocaleDateString('es-MX')}
                            </span>
                            <button
                              type="button"
                              onClick={() => setViewingPdfOrder(order)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white text-xs font-bold transition cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-rose-300" />
                              <span>Descargar PDF</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Falla Reportada:</span>
                            <p className="font-medium mt-0.5 line-clamp-2">{order.vehicle.failureDescription}</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Operador y Ubicación:</span>
                            <div className="font-bold text-slate-900">{order.operatorName || order.clientContact}</div>
                            <div className="text-slate-500 text-[11px] truncate">{order.vehicle.location}</div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: REGISTRAR NUEVA EMPRESA / CLIENTE               */}
      {/* ======================================================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
            
            {/* Cabecera del modal */}
            <div className="p-5 sm:p-6 bg-[#040057] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Building2 className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">Registrar Cliente / Empresa</h3>
                  <p className="text-xs text-indigo-200">
                    Captura los datos corporativos, contacto de WhatsApp, logo y unidades vehiculares
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario con scroll */}
            <form onSubmit={handleSubmitCompany} className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              
              {/* SECCIÓN 1: DATOS CORPORATIVOS */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-xs sm:text-sm text-[#040057] uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>1. Datos de la Empresa y Representante</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="ej. Transportes Express del Bajío S.A. de C.V."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre del Representante *
                    </label>
                    <input
                      type="text"
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                      placeholder="ej. Ing. Carlos Mendoza Villalobos"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dirección Completa *
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="ej. Av. Central 450, Parque Industrial Cuautitlán, Cuautitlán Izcalli, Edo. Méx."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Teléfono Fijo / Oficina *
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="ej. 55 4912 8840"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Número de WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="ej. 5549128840"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ej. contacto@empresa.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#040057] transition"
                    />
                  </div>
                </div>

                {/* LOGO DE LA EMPRESA */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Logotipo de la Empresa
                  </label>
                  <p className="text-xs text-slate-500">
                    Sube una foto/logo desde tu equipo o dispositivo, o escribe una URL directa de la imagen.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {logoUrl ? (
                      <div className="w-20 h-20 rounded-2xl border-2 border-indigo-300 bg-white p-2 relative overflow-hidden shrink-0 shadow-xs">
                        <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-[9px] font-bold mt-1">Sin Logo</span>
                      </div>
                    )}

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir Logo desde Celular/PC</span>
                        </button>
                        <input
                          ref={logoFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </div>

                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="O pega aquí el enlace web del logo (https://...)"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#040057]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: REGISTRAR UNIDADES DE LA EMPRESA */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#040057] uppercase tracking-wider flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span>2. Registrar Flota de Unidades de esta Empresa</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddUnitRow}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Otra Unidad</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Agrega las unidades pertenecientes a esta empresa para que queden vinculadas a su expediente de inmediato:
                </p>

                <div className="space-y-3">
                  {initialUnitsList.map((unitRow, index) => (
                    <div 
                      key={unitRow.id}
                      className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 relative"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#040057]">
                          Vehículo #{index + 1}
                        </span>
                        {initialUnitsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUnitRow(unitRow.id)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-bold cursor-pointer"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            No. Unidad
                          </label>
                          <input
                            type="text"
                            value={unitRow.unitNumber}
                            onChange={(e) => handleUpdateUnitRow(unitRow.id, 'unitNumber', e.target.value)}
                            placeholder="ej. Unidad 1"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Placas
                          </label>
                          <input
                            type="text"
                            value={unitRow.plates}
                            onChange={(e) => handleUpdateUnitRow(unitRow.id, 'plates', e.target.value)}
                            placeholder="ej. 82-AF-9K"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            No. Económico
                          </label>
                          <input
                            type="text"
                            value={unitRow.economicNumber}
                            onChange={(e) => handleUpdateUnitRow(unitRow.id, 'economicNumber', e.target.value)}
                            placeholder="ej. ECO-101"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Tipo
                          </label>
                          <select
                            value={unitRow.type}
                            onChange={(e) => handleUpdateUnitRow(unitRow.id, 'type', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                          >
                            <option value="tractocamion">Tractocamión</option>
                            <option value="camion">Camión</option>
                            <option value="bus">Autobús</option>
                            <option value="auto">Auto / Utilitario</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Marca y Modelo
                          </label>
                          <input
                            type="text"
                            value={`${unitRow.brand} ${unitRow.model}`}
                            onChange={(e) => {
                              const parts = e.target.value.split(' ');
                              handleUpdateUnitRow(unitRow.id, 'brand', parts[0] || 'Kenworth');
                              handleUpdateUnitRow(unitRow.id, 'model', parts.slice(1).join(' ') || 'T680');
                            }}
                            placeholder="ej. Kenworth T680"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Odómetro
                          </label>
                          <input
                            type="text"
                            value={unitRow.defaultOdometer}
                            onChange={(e) => handleUpdateUnitRow(unitRow.id, 'defaultOdometer', e.target.value)}
                            placeholder="ej. 120,000 KM"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Operador Habitual
                          </label>
                          <input
                            type="text"
                            value={unitRow.assignedOperator}
                            onChange={(e) => handleUpdateUnitRow(unitRow.id, 'assignedOperator', e.target.value)}
                            placeholder="ej. Operador 1 - Juan Pérez (55 1234 5678)"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de Enviar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
                >
                  Guardar y Dar de Alta Cliente
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: AGREGAR UNIDAD A LA EMPRESA SELECCIONADA        */}
      {/* ======================================================== */}
      {isAddUnitModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-auto">
            
            <div className="p-5 bg-[#040057] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Truck className="w-5 h-5 text-indigo-300" />
                <div>
                  <h3 className="font-black text-sm sm:text-base">Registrar Unidad en Flota</h3>
                  <p className="text-[11px] text-indigo-200">{selectedCompany.companyName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUnitModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnitToCompany} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Número de Unidad *
                  </label>
                  <input
                    type="text"
                    value={newUnitNumber}
                    onChange={(e) => setNewUnitNumber(e.target.value)}
                    placeholder="ej. Unidad 51"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Placas *
                  </label>
                  <input
                    type="text"
                    value={newUnitPlates}
                    onChange={(e) => setNewUnitPlates(e.target.value)}
                    placeholder="ej. 99-AB-1Z"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. Económico *
                  </label>
                  <input
                    type="text"
                    value={newUnitEco}
                    onChange={(e) => setNewUnitEco(e.target.value)}
                    placeholder="ej. ECO-051"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={newUnitBrand}
                    onChange={(e) => setNewUnitBrand(e.target.value)}
                    placeholder="ej. Kenworth"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={newUnitModel}
                    onChange={(e) => setNewUnitModel(e.target.value)}
                    placeholder="ej. T680"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tipo de Vehículo
                  </label>
                  <select
                    value={newUnitType}
                    onChange={(e) => setNewUnitType(e.target.value as VehicleType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="tractocamion">Tractocamión</option>
                    <option value="camion">Camión</option>
                    <option value="bus">Autobús</option>
                    <option value="auto">Auto / Utilitario</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Odómetro Inicial
                  </label>
                  <input
                    type="text"
                    value={newUnitOdometer}
                    onChange={(e) => setNewUnitOdometer(e.target.value)}
                    placeholder="ej. 135,000 KM"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Operador Asignado
                  </label>
                  <input
                    type="text"
                    value={newUnitOperator}
                    onChange={(e) => setNewUnitOperator(e.target.value)}
                    placeholder="ej. Operador Roberto Gómez (55 4433 2211)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUnitModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold"
                >
                  Guardar Unidad
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL DE DESCARGA E IMPRESIÓN DE REPORTE EN PDF */}
      {viewingPdfOrder && (
        <ClientReportPdfModal
          order={viewingPdfOrder}
          onClose={() => setViewingPdfOrder(null)}
        />
      )}

    </div>
  );
};

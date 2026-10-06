import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  Tag, 
  X,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceCatalogItem } from '../../types';

const CATEGORIES: { id: 'todas' | ServiceCatalogItem['category']; label: string }[] = [
  { id: 'todas', label: 'Todas las Categorías' },
  { id: 'frenos', label: 'Frenos y Aire' },
  { id: 'mecanica_general', label: 'Mecánica General' },
  { id: 'electrico', label: 'Sistema Eléctrico' },
  { id: 'suspension', label: 'Suspensión y Dirección' },
  { id: 'rescate_asistencia', label: 'Rescate Carretero' },
  { id: 'diagnostico', label: 'Diagnóstico y Escáner' },
  { id: 'insumos', label: 'Insumos y Lubricantes' },
];

export const ServicesCatalogManager: React.FC = () => {
  const { services, addServiceItem, updateServiceItem, deleteServiceItem } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todas' | ServiceCatalogItem['category']>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceCatalogItem | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ServiceCatalogItem['category']>('frenos');
  const [formDescription, setFormDescription] = useState('');
  const [formHours, setFormHours] = useState(1.5);
  const [formPrice, setFormPrice] = useState(1200);
  const [formIsActive, setFormIsActive] = useState(true);

  // Filtered services
  const filteredServices = services.filter((srv) => {
    const matchesCategory = selectedCategory === 'todas' || srv.category === selectedCategory;
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query || 
      srv.name.toLowerCase().includes(query) || 
      srv.code.toLowerCase().includes(query) || 
      srv.description.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const activeCount = services.filter(s => s.isActive).length;
  const avgPrice = services.length > 0 
    ? Math.round(services.reduce((acc, s) => acc + s.basePrice, 0) / services.length)
    : 0;

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormCode(`SRV-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormCategory('frenos');
    setFormDescription('');
    setFormHours(1.5);
    setFormPrice(1500);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ServiceCatalogItem) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormHours(item.suggestedLaborHours);
    setFormPrice(item.basePrice);
    setFormIsActive(item.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    if (editingItem) {
      updateServiceItem(editingItem.id, {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        suggestedLaborHours: Number(formHours) || 1,
        basePrice: Number(formPrice) || 0,
        isActive: formIsActive,
      });
    } else {
      addServiceItem({
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        suggestedLaborHours: Number(formHours) || 1,
        basePrice: Number(formPrice) || 0,
        isActive: formIsActive,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el servicio "${name}" del catálogo?`)) {
      deleteServiceItem(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Encabezado del Módulo */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Wrench className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-[#040057]">
              Catálogo de Servicios y Precios
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Administra los servicios ofrecidos por Olemdo Servicio Técnico con sus tarifas y descripciones oficiales para agilizar la captura en campo y la cotización fiscal.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Dar de Alta Nuevo Servicio</span>
        </button>
      </div>

      {/* Tarjetas de Métricas del Catálogo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Servicios</span>
            <Wrench className="w-4 h-4 text-[#040057]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#040057]">{services.length}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">{activeCount} activos disponibles</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Servicios Activos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">{activeCount}</div>
          <span className="text-[10px] text-slate-400">Listos para captura</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Precio Promedio</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800">
            ${avgPrice.toLocaleString('es-MX')}
          </div>
          <span className="text-[10px] text-slate-400">Tarifa base sugerida</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Categorías</span>
            <Tag className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800">
            {CATEGORIES.length - 1}
          </div>
          <span className="text-[10px] text-slate-400">Especialidades mecánicas</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar servicio por nombre, código o descripción..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#040057] bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-semibold self-end sm:self-auto">
            Mostrando {filteredServices.length} de {services.length} servicios
          </div>
        </div>

        {/* Pestañas de categoría (scroll horizontal en tablet y móvil) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-[#040057] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Servicios */}
      {filteredServices.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">No se encontraron servicios</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Prueba ajustando el término de búsqueda o cambia la categoría seleccionada.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setSelectedCategory('todas'); }}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition shadow-xs flex flex-col justify-between gap-3 ${
                srv.isActive ? 'border-slate-200 hover:border-indigo-300' : 'border-slate-200 opacity-70 bg-slate-50/60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-[#040057] border border-slate-200">
                    {srv.code}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    srv.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {srv.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                  {srv.name}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {srv.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>M.O. Sugerida: <strong>{srv.suggestedLaborHours} hrs</strong></span>
                  </span>

                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Precio Base</span>
                    <span className="text-base font-extrabold text-[#040057]">
                      ${srv.basePrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => updateServiceItem(srv.id, { isActive: !srv.isActive })}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      srv.isActive 
                        ? 'border-slate-300 text-slate-600 hover:bg-slate-100' 
                        : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {srv.isActive ? 'Desactivar' : 'Reactivar'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(srv)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#040057] hover:bg-blue-100 font-bold text-xs border border-blue-200 flex items-center gap-1 cursor-pointer"
                      title="Editar precio y descripción"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(srv.id, srv.name)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                      title="Eliminar del catálogo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para Dar de Alta o Editar Servicio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
            <div className="p-4 sm:p-5 bg-[#040057] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">
                  {editingItem ? 'Editar Servicio del Catálogo' : 'Dar de Alta Nuevo Servicio'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código de Servicio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="Ej. SRV-FRE-13"
                    className="w-full px-3 py-2 border rounded-lg uppercase font-mono font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                  >
                    {CATEGORIES.filter(c => c.id !== 'todas').map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Mantenimiento y Calibración de Frenos Neumáticos"
                  className="w-full px-3 py-2 border rounded-lg font-bold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descripción Detallada del Servicio *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explica qué incluye la mano de obra, insumos y pruebas a realizar..."
                  className="w-full px-3 py-2 border rounded-lg bg-white leading-relaxed text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mano de Obra Sugerida (Horas)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={formHours}
                    onChange={(e) => setFormHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Precio Base / Tarifa Oficial ($ MXN) *
                  </label>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-bold text-[#040057]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#040057] rounded"
                  />
                  <span>Servicio Activo en Catálogo</span>
                </label>

                <div className="text-xs font-bold text-[#040057]">
                  Total Base: ${formPrice.toLocaleString('es-MX')} MXN
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#040057] hover:bg-[#070085] text-white font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{editingItem ? 'Guardar Cambios' : 'Registrar en Catálogo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

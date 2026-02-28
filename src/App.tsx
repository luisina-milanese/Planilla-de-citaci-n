import React, { useState, useMemo, useRef } from 'react';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Users, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  LayoutGrid,
  Settings2,
  User,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

// --- Types ---

type Position = 'ARQ' | 'DEF' | 'MED' | 'DEL';

interface Player {
  id: string;
  number: string;
  name: string;
  pos: Position;
  coords: { x: number; y: number }; // Percentage 0-100
}

type FormationType = '4-4-2' | '4-3-3' | '3-5-2' | '4-1-4-1';

// --- Constants & Mock Data ---

const INITIAL_PLAYERS: Player[] = [
  { id: '1', number: '01', name: 'Gonzalo González', pos: 'ARQ', coords: { x: 50, y: 10 } },
  { id: '2', number: '04', name: 'Manuel Vargas', pos: 'DEF', coords: { x: 85, y: 30 } },
  { id: '3', number: '02', name: 'Santiago Barraza', pos: 'DEF', coords: { x: 65, y: 25 } },
  { id: '4', number: '06', name: 'Nicolás Canavessio', pos: 'DEF', coords: { x: 35, y: 25 } },
  { id: '5', number: '03', name: 'Raúl Chamorro', pos: 'DEF', coords: { x: 15, y: 30 } },
  { id: '6', number: '08', name: 'Alexandro Ponce', pos: 'MED', coords: { x: 85, y: 55 } },
  { id: '7', number: '05', name: 'Manuel Vargas', pos: 'MED', coords: { x: 65, y: 55 } },
  { id: '8', number: '10', name: 'Joaquín Castellano', pos: 'MED', coords: { x: 35, y: 55 } },
  { id: '9', number: '11', name: 'Gonzalo Schonfeld', pos: 'MED', coords: { x: 15, y: 55 } },
  { id: '10', number: '07', name: 'Adrián Rodríguez', pos: 'DEL', coords: { x: 35, y: 85 } },
  { id: '11', number: '09', name: 'Pedro Muné', pos: 'DEL', coords: { x: 65, y: 85 } },
];

const SUBSTITUTES = [
  { number: '12', name: 'A. Ruffinetti' },
  { number: '13', name: 'I. Baudin' },
  { number: '14', name: 'F. Hansen' },
  { number: '15', name: 'G. Pardo' },
  { number: '16', name: 'F. Cima' },
  { number: '17', name: 'C. Sánchez' },
  { number: '18', name: 'A. Maza' },
];

const STAFF = [
  { role: 'DT', name: 'Marcelo Milanese' },
  { role: 'AC', name: 'Ezequiel Centurion' },
  { role: 'PF', name: 'Emanuel Moyano' },
];

// --- Components ---

const Jersey = ({ number, className }: { number: string, className?: string }) => (
  <div className={`relative w-12 h-12 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      {/* Jersey Body */}
      <path 
        d="M20,20 L80,20 L85,45 L70,45 L70,90 L30,90 L30,45 L15,45 Z" 
        fill="#004A2F" 
        stroke="white" 
        strokeWidth="2"
      />
      {/* Stripes or details */}
      <rect x="45" y="20" width="10" height="70" fill="white" opacity="0.2" />
      {/* Neck */}
      <path d="M40,20 Q50,30 60,20" fill="none" stroke="white" strokeWidth="2" />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center pt-2">
      <span className="text-white font-black text-[14px] leading-none drop-shadow-sm">{number}</span>
    </div>
  </div>
);

const Pitch = ({ players }: { players: Player[] }) => {
  return (
    <div className="relative w-full aspect-[3/4] bg-[#2D7A3E] rounded-xl overflow-hidden border-4 border-[#3D8A4E] shadow-inner">
      {/* Pitch Markings */}
      <div className="absolute inset-4 border-2 border-white/30 pointer-events-none">
        {/* Center Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2" />
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
        {/* Penalty Areas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 border-2 border-t-0 border-white/30" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-24 border-2 border-b-0 border-white/30" />
      </div>

      {/* Players */}
      {players.map((player) => (
        <motion.div
          key={player.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, left: `${player.coords.x}%`, bottom: `${player.coords.y}%` }}
          className="absolute -translate-x-1/2 translate-y-1/2 flex flex-col items-center gap-0"
        >
          <Jersey number={player.number} />
          <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight shadow-sm whitespace-nowrap mt-[-4px]">
            {player.name.split(' ').pop()}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const FORMATIONS: Record<FormationType, { x: number; y: number }[]> = {
  '4-4-2': [
    { x: 50, y: 10 }, // GK
    { x: 15, y: 30 }, { x: 35, y: 25 }, { x: 65, y: 25 }, { x: 85, y: 30 }, // DEF
    { x: 15, y: 55 }, { x: 35, y: 55 }, { x: 65, y: 55 }, { x: 85, y: 55 }, // MED
    { x: 35, y: 85 }, { x: 65, y: 85 }, // DEL
  ],
  '4-3-3': [
    { x: 50, y: 10 }, // GK
    { x: 15, y: 30 }, { x: 35, y: 25 }, { x: 65, y: 25 }, { x: 85, y: 30 }, // DEF
    { x: 25, y: 50 }, { x: 50, y: 55 }, { x: 75, y: 50 }, // MED
    { x: 20, y: 80 }, { x: 50, y: 85 }, { x: 80, y: 80 }, // DEL
  ],
  '3-5-2': [
    { x: 50, y: 10 }, // GK
    { x: 25, y: 25 }, { x: 50, y: 25 }, { x: 75, y: 25 }, // DEF
    { x: 10, y: 55 }, { x: 30, y: 50 }, { x: 50, y: 60 }, { x: 70, y: 50 }, { x: 90, y: 55 }, // MED
    { x: 35, y: 85 }, { x: 65, y: 85 }, // DEL
  ],
  '4-1-4-1': [
    { x: 50, y: 10 }, // GK
    { x: 15, y: 30 }, { x: 35, y: 25 }, { x: 65, y: 25 }, { x: 85, y: 30 }, // DEF
    { x: 50, y: 45 }, // CDM
    { x: 15, y: 65 }, { x: 35, y: 65 }, { x: 65, y: 65 }, { x: 85, y: 65 }, // MID
    { x: 50, y: 85 }, // ST
  ],
};

export default function App() {
  const [formation, setFormation] = useState<FormationType>('4-4-2');
  const [rival, setRival] = useState('Libertad de Sunchales');
  const [date, setDate] = useState('2023-10-12');
  const [pitchName, setPitchName] = useState('Estadio Principal');
  const [category, setCategory] = useState('Primera Div.');
  const [notes, setNotes] = useState('');
  const [substitutes, setSubstitutes] = useState(SUBSTITUTES);
  const [initialLineup, setInitialLineup] = useState(INITIAL_PLAYERS);
  const [staff, setStaff] = useState(STAFF);

  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPNG = async () => {
    if (!printRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(printRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `planilla-${rival}-${date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating PNG:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(printRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Higher quality for print
        backgroundColor: '#ffffff',
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`planilla-${rival}-${date}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleUpdateStaff = (index: number, value: string) => {
    const newStaff = [...staff];
    newStaff[index] = { ...newStaff[index], name: value };
    setStaff(newStaff);
  };

  const handleUpdateLineup = (index: number, field: 'name' | 'number', value: string) => {
    const newLineup = [...initialLineup];
    newLineup[index] = { ...newLineup[index], [field]: value };
    setInitialLineup(newLineup);
  };

  const handleAddSubstitute = () => {
    const nextNum = (substitutes.length > 0 ? Math.max(...substitutes.map(s => parseInt(s.number))) + 1 : 12).toString();
    setSubstitutes([...substitutes, { number: nextNum, name: 'Nuevo Jugador' }]);
  };

  const handleRemoveSubstitute = (index: number) => {
    setSubstitutes(substitutes.filter((_, i) => i !== index));
  };

  const handleUpdateSubstitute = (index: number, field: 'name' | 'number', value: string) => {
    const newSubs = [...substitutes];
    newSubs[index] = { ...newSubs[index], [field]: value };
    setSubstitutes(newSubs);
  };

  const players = useMemo(() => {
    const coords = FORMATIONS[formation];
    return initialLineup.map((p, i) => ({
      ...p,
      coords: coords[i] || p.coords
    }));
  }, [formation, initialLineup]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Escudo_del_Club_Atl%C3%A9tico_Uni%C3%B3n_de_Sunchales.svg/250px-Escudo_del_Club_Atl%C3%A9tico_Uni%C3%B3n_de_Sunchales.svg.png" 
                alt="Logo" 
                className="w-full h-full object-contain p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Generador de Planillas</h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Herramienta Oficial CAU</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 bg-[#004A2F] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#003A25] transition-colors"
            >
              <Download size={16} />
              PDF
            </button>
            <button 
              onClick={handleDownloadPNG}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              PNG
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Tactical Scheme */}
          <div>
            <span className="sidebar-label">Esquema Táctico</span>
            <div className="grid grid-cols-2 gap-2">
              {(['4-4-2', '4-3-3', '3-5-2', '4-1-4-1'] as FormationType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormation(f)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    formation === f 
                      ? 'border-[#004A2F] bg-[#004A2F]/5 text-[#004A2F]' 
                      : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                  }`}
                >
                  <LayoutGrid size={20} className="mb-1" />
                  <span className="text-[11px] font-bold">{f}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Match Data */}
          <div className="space-y-4">
            <span className="sidebar-label">Datos del Partido</span>
            
            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Categoría</label>
              <div className="relative">
                <Trophy size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Rival</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={rival}
                  onChange={(e) => setRival(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Fecha</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Cancha</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  value={pitchName}
                  onChange={(e) => setPitchName(e.target.value)}
                  placeholder="Nombre del estadio"
                  className="input-field pl-9"
                />
              </div>
            </div>
          </div>

          {/* Lineup Management */}
          <div className="space-y-4">
            <span className="sidebar-label">Gestionar Titulares</span>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {initialLineup.map((player, i) => (
                <div key={player.id} className="flex gap-2 items-center">
                  <div className="w-8 text-[10px] font-bold text-gray-400 text-center">{player.pos}</div>
                  <input 
                    type="text" 
                    value={player.number} 
                    onChange={(e) => handleUpdateLineup(i, 'number', e.target.value)}
                    className="w-12 input-field text-center px-1"
                  />
                  <input 
                    type="text" 
                    value={player.name} 
                    onChange={(e) => handleUpdateLineup(i, 'name', e.target.value)}
                    className="flex-1 input-field"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Substitutes Management */}
          <div className="space-y-4">
            <span className="sidebar-label">Gestionar Suplentes</span>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {substitutes.map((sub, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={sub.number} 
                    onChange={(e) => handleUpdateSubstitute(i, 'number', e.target.value)}
                    className="w-12 input-field text-center px-1"
                  />
                  <input 
                    type="text" 
                    value={sub.name} 
                    onChange={(e) => handleUpdateSubstitute(i, 'name', e.target.value)}
                    className="flex-1 input-field"
                  />
                  <button 
                    onClick={() => handleRemoveSubstitute(i)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button 
              onClick={handleAddSubstitute}
              className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-[11px] font-bold text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-all"
            >
              + Añadir Suplente
            </button>
          </div>

          {/* Staff Management */}
          <div className="space-y-4">
            <span className="sidebar-label">Gestionar Cuerpo Técnico</span>
            <div className="space-y-2">
              {staff.map((member, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="w-8 text-[10px] font-bold text-gray-400 text-center">{member.role}</div>
                  <input 
                    type="text" 
                    value={member.name} 
                    onChange={(e) => handleUpdateStaff(i, e.target.value)}
                    className="flex-1 input-field"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Notes Management */}
          <div className="space-y-4">
            <span className="sidebar-label">Notas Tácticas</span>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones, jugadas preparadas, etc..."
              className="w-full input-field min-h-[100px] py-3 resize-none text-[11px]"
            />
          </div>

          {/* Squad Management */}
          <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Users size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">Gestionar Plantel</p>
                <p className="text-[10px] text-gray-400">Editar jugadores y núm.</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto flex justify-center bg-gray-100">
        <div 
          ref={printRef} 
          className="w-[794px] h-[1123px] bg-white shadow-2xl rounded-sm border-t-[12px] border-[#004A2F] p-10 flex flex-col gap-6 overflow-hidden shrink-0"
          style={{ aspectRatio: '1 / 1.414' }}
        >
          
          {/* Header */}
          <header className="flex items-center justify-between border-b border-gray-100 pb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center p-1 border border-gray-100 shadow-sm">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Escudo_del_Club_Atl%C3%A9tico_Uni%C3%B3n_de_Sunchales.svg/250px-Escudo_del_Club_Atl%C3%A9tico_Uni%C3%B3n_de_Sunchales.svg.png" 
                  alt="Club Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h2 className="text-4xl font-black text-[#004A2F] tracking-tight uppercase">Club Atlético Unión</h2>
                <p className="text-lg font-medium text-gray-400 tracking-[0.2em] uppercase">Sunchales - Santa Fe</p>
              </div>
            </div>
            <div className="px-6 py-3 border-2 border-[#004A2F]/10 rounded-lg">
              <span className="text-sm font-black text-[#004A2F] tracking-widest uppercase">Planilla de Citación</span>
            </div>
          </header>

          {/* Match Info Bar */}
          <div className="grid grid-cols-5 gap-px bg-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {[
              { label: 'Categoría', value: category },
              { label: 'Rival', value: rival, color: 'text-gray-900' },
              { label: 'Fecha', value: new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) },
              { label: 'Hora', value: '15:30 HS' },
              { label: 'Cancha', value: pitchName },
            ].map((item, i) => (
              <div key={i} className="bg-white p-4">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{item.label}</span>
                <span className={`text-sm font-bold text-gray-900 ${item.color || ''}`}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-12 gap-6 flex-1">
            {/* Left Column: Lists */}
            <div className="col-span-5 space-y-6">
              {/* Starting Lineup */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-[#004A2F]" />
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Formación Inicial</h3>
                </div>
                <div className="border-t border-gray-200">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                        <th className="py-1.5 pr-4">No.</th>
                        <th className="py-1.5">Jugador</th>
                        <th className="py-1.5 text-right">Pos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {players.map((player) => (
                        <tr key={player.id} className="text-[10px]">
                          <td className="py-1 font-mono font-bold text-gray-400">{player.number}</td>
                          <td className="py-1 font-bold text-gray-800 truncate max-w-[140px]">{player.name}</td>
                          <td className="py-1 text-right font-mono text-[8px] font-bold text-gray-400">{player.pos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Substitutes */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-[#004A2F]" />
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Suplentes</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-gray-200 pt-2">
                  {substitutes.map((sub, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] border-b border-gray-50 pb-0.5">
                      <span className="font-mono font-bold text-gray-300 w-4">{sub.number}</span>
                      <span className="font-medium text-gray-600 truncate">{sub.name}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Staff */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 size={16} className="text-[#004A2F]" />
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-wider">Cuerpo Técnico</h3>
                </div>
                <div className="space-y-1 border-t border-gray-200 pt-2">
                  {staff.map((member, i) => (
                    <div key={i} className="flex items-center gap-3 text-[10px] border-b border-gray-50 pb-0.5">
                      <span className="bg-emerald-600 text-white text-[7px] font-black px-1 py-0.5 rounded uppercase">{member.role}</span>
                      <span className="font-bold text-gray-800">{member.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Visuals */}
            <div className="col-span-7 space-y-4">
              <Pitch players={players} />

              {/* Bench Visual */}
              <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={14} className="text-[#004A2F]" />
                  <h3 className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Suplentes (Banco)</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {substitutes.map((sub, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <Jersey number={sub.number} className="w-7 h-7" />
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter text-center leading-tight truncate w-full">
                        {sub.name.split(' ').pop()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Notes */}
          <footer className="mt-auto pt-4 border-t border-gray-100">
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">Notas Tácticas</span>
            <div className="mt-2 text-[10px] text-gray-600 leading-relaxed whitespace-pre-wrap min-h-[60px] italic">
              {notes || 'Escribe tus notas en el panel lateral...'}
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}


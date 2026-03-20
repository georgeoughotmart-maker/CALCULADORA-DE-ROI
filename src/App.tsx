/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, RefreshCcw, TrendingUp, TrendingDown, DollarSign, MousePointer2, Eye, ShoppingCart, Search, ChevronUp, ChevronDown, Download, ClipboardPaste, X, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FunnelData } from './types';

type SortKey = 'campanha' | 'ctr' | 'cpc' | 'conv' | 'receita' | 'lucro' | 'roi';
type SortDirection = 'asc' | 'desc';

export default function App() {
  const [dados, setDados] = useState<FunnelData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'campanha',
    direction: 'asc'
  });
  const [form, setForm] = useState({
    campanha: '',
    criativo: '',
    pagina: '',
    impressoes: '',
    cliques: '',
    visitas: '',
    checkouts: '',
    vendas: '',
    gasto: '',
    preco: ''
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('funnel_dados');
    if (saved) {
      try {
        setDados(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('funnel_dados', JSON.stringify(dados));
  }, [dados]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addEntry = () => {
    if (!form.campanha || !form.criativo) return;

    const newEntry: FunnelData = {
      id: crypto.randomUUID(),
      campanha: form.campanha,
      criativo: form.criativo,
      pagina: form.pagina,
      impressoes: Number(form.impressoes) || 0,
      cliques: Number(form.cliques) || 0,
      visitas: Number(form.visitas) || 0,
      checkouts: Number(form.checkouts) || 0,
      vendas: Number(form.vendas) || 0,
      gasto: Number(form.gasto) || 0,
      preco: Number(form.preco) || 0,
    };

    setDados(prev => [newEntry, ...prev]);
    setForm({
      campanha: '',
      criativo: '',
      pagina: '',
      impressoes: '',
      cliques: '',
      visitas: '',
      checkouts: '',
      vendas: '',
      gasto: '',
      preco: ''
    });
  };

  const removeEntry = (id: string) => {
    setDados(prev => prev.filter(d => d.id !== id));
  };

  const resetAll = () => {
    if (window.confirm('Tem certeza que deseja resetar todos os dados?')) {
      setDados([]);
      localStorage.removeItem('funnel_dados');
    }
  };

  const calculateMetrics = (d: FunnelData) => {
    const ctr = d.impressoes > 0 ? (d.cliques / d.impressoes) * 100 : 0;
    const cpc = d.cliques > 0 ? d.gasto / d.cliques : 0;
    const conv = d.visitas > 0 ? (d.vendas / d.visitas) * 100 : 0;
    const receita = d.vendas * d.preco;
    const lucro = receita - d.gasto;
    const roi = d.gasto > 0 ? (lucro / d.gasto) * 100 : 0;

    // New Validation Metrics
    const clickToPage = d.cliques > 0 ? (d.visitas / d.cliques) * 100 : 0;
    const pageToCheckout = d.visitas > 0 ? (d.checkouts / d.visitas) * 100 : 0;
    const checkoutToPurchase = d.checkouts > 0 ? (d.vendas / d.checkouts) * 100 : 0;
    const finalConv = d.cliques > 0 ? (d.vendas / d.cliques) * 100 : 0;

    return { ctr, cpc, conv, receita, lucro, roi, clickToPage, pageToCheckout, checkoutToPurchase, finalConv };
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...dados];

    // Filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.campanha.toLowerCase().includes(term) ||
        d.criativo.toLowerCase().includes(term) ||
        d.pagina.toLowerCase().includes(term)
      );
    }

    // Sorting
    result.sort((a, b) => {
      const metricsA = calculateMetrics(a);
      const metricsB = calculateMetrics(b);

      let valA: any;
      let valB: any;

      if (sortConfig.key === 'campanha') {
        valA = a.campanha.toLowerCase();
        valB = b.campanha.toLowerCase();
      } else {
        valA = metricsA[sortConfig.key];
        valB = metricsB[sortConfig.key];
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [dados, searchTerm, sortConfig]);

  const selectedCampaign = useMemo(() => {
    if (selectedId) return dados.find(d => d.id === selectedId);
    return filteredAndSortedData[0];
  }, [selectedId, dados, filteredAndSortedData]);

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <div className="w-4" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const exportToCSV = () => {
    if (filteredAndSortedData.length === 0) return;

    const headers = [
      'Campanha', 'Criativo', 'Pagina', 'Impressoes', 'Cliques', 'Visitas', 'Checkouts',
      'Vendas', 'Gasto', 'Preco', 'CTR (%)', 'CPC (R$)', 'Conversao (%)', 
      'Receita (R$)', 'Lucro (R$)', 'ROI (%)', 'Clique->Pagina (%)', 'Pagina->Checkout (%)', 'Checkout->Compra (%)'
    ];

    const rows = filteredAndSortedData.map(d => {
      const { ctr, cpc, conv, receita, lucro, roi, clickToPage, pageToCheckout, checkoutToPurchase } = calculateMetrics(d);
      return [
        d.campanha,
        d.criativo,
        d.pagina,
        d.impressoes,
        d.cliques,
        d.visitas,
        d.checkouts,
        d.vendas,
        d.gasto,
        d.preco,
        ctr.toFixed(2),
        cpc.toFixed(2),
        conv.toFixed(2),
        receita.toFixed(2),
        lucro.toFixed(2),
        roi.toFixed(2),
        clickToPage.toFixed(2),
        pageToCheckout.toFixed(2),
        checkoutToPurchase.toFixed(2)
      ].map(val => `"${val}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_funil_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = () => {
    if (!importText.trim()) return;

    const lines = importText.trim().split('\n');
    const newEntries: FunnelData[] = [];

    lines.forEach(line => {
      // Split by tab (Excel/FB copy paste) or comma
      const columns = line.includes('\t') ? line.split('\t') : line.split(',');
      
          if (columns.length >= 2) {
        newEntries.push({
          id: crypto.randomUUID(),
          campanha: columns[0]?.trim() || 'Importado',
          criativo: columns[1]?.trim() || 'N/A',
          pagina: columns[2]?.trim() || '',
          impressoes: Number(columns[3]?.replace(/[^\d.-]/g, '')) || 0,
          cliques: Number(columns[4]?.replace(/[^\d.-]/g, '')) || 0,
          visitas: Number(columns[5]?.replace(/[^\d.-]/g, '')) || 0,
          checkouts: Number(columns[6]?.replace(/[^\d.-]/g, '')) || 0,
          vendas: Number(columns[7]?.replace(/[^\d.-]/g, '')) || 0,
          gasto: Number(columns[8]?.replace(/[^\d.-]/g, '')) || 0,
          preco: Number(columns[9]?.replace(/[^\d.-]/g, '')) || 0,
        });
      }
    });

    if (newEntries.length > 0) {
      setDados(prev => [...newEntries, ...prev]);
      setIsImportModalOpen(false);
      setImportText('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#4da3ff] tracking-tight">
              Validador de Criativos e Páginas
            </h1>
            <p className="text-gray-400 mt-2">Analise o desempenho do seu funil de vendas em tempo real.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
            >
              <ClipboardPaste size={18} />
              Importar (Colar)
            </button>
            <button 
              onClick={exportToCSV}
              disabled={filteredAndSortedData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              Exportar CSV
            </button>
            <button 
              onClick={resetAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <RefreshCcw size={18} />
              Resetar Dados
            </button>
          </div>
        </header>

        {/* Form Section */}
        <section className="bg-[#151515] p-6 rounded-2xl border border-white/5 shadow-xl mb-8">
          {/* ... existing form inputs ... */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Identificação</label>
              <input 
                name="campanha" 
                value={form.campanha} 
                onChange={handleInputChange}
                placeholder="Nome da Campanha" 
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4da3ff] transition-colors"
              />
              <input 
                name="criativo" 
                value={form.criativo} 
                onChange={handleInputChange}
                placeholder="ID do Criativo" 
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4da3ff] transition-colors"
              />
              <input 
                name="pagina" 
                value={form.pagina} 
                onChange={handleInputChange}
                placeholder="URL/Nome da Página" 
                className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4da3ff] transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Métricas de Tráfego</label>
              <div className="relative">
                <Eye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="number" 
                  name="impressoes" 
                  value={form.impressoes} 
                  onChange={handleInputChange}
                  placeholder="Impressões" 
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#4da3ff] transition-colors"
                />
              </div>
              <div className="relative">
                <MousePointer2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="number" 
                  name="cliques" 
                  value={form.cliques} 
                  onChange={handleInputChange}
                  placeholder="Cliques" 
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#4da3ff] transition-colors"
                />
              </div>
              <div className="relative">
                <Eye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="number" 
                  name="visitas" 
                  value={form.visitas} 
                  onChange={handleInputChange}
                  placeholder="Visitas na Página" 
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#4da3ff] transition-colors"
                />
              </div>
              <div className="relative">
                <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="number" 
                  name="checkouts" 
                  value={form.checkouts} 
                  onChange={handleInputChange}
                  placeholder="Checkouts (Inic. Compra)" 
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#4da3ff] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Financeiro</label>
              <div className="relative">
                <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="number" 
                  name="vendas" 
                  value={form.vendas} 
                  onChange={handleInputChange}
                  placeholder="Vendas" 
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#4da3ff] transition-colors"
                />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="number" 
                  name="gasto" 
                  value={form.gasto} 
                  onChange={handleInputChange}
                  placeholder="Gasto em Anúncios" 
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#4da3ff] transition-colors"
                />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="number" 
                  name="preco" 
                  value={form.preco} 
                  onChange={handleInputChange}
                  placeholder="Preço do Produto" 
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-[#4da3ff] transition-colors"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={addEntry}
            className="w-full py-4 bg-[#2f7cff] hover:bg-[#1a66e6] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
          >
            <Plus size={20} />
            Adicionar ao Relatório
          </button>
        </section>

        {/* ROI Chart Section */}
        {dados.length > 0 && (
          <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#151515] p-6 rounded-2xl border border-white/5 shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#4da3ff]" />
                ROI por Campanha (%)
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredAndSortedData.map(d => ({ name: d.campanha, roi: calculateMetrics(d).roi }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#666" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#666" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#151515', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#4da3ff' }}
                    />
                    <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                      {filteredAndSortedData.map((entry, index) => {
                        const roi = calculateMetrics(entry).roi;
                        return <Cell key={`cell-${index}`} fill={roi >= 0 ? '#00e676' : '#ff5252'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#151515] p-6 rounded-2xl border border-white/5 shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-500" />
                Análise de Validação
              </h3>
              
              {selectedCampaign ? (
                <div className="space-y-6">
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase font-bold">Campanha Selecionada</p>
                    <p className="text-sm font-bold text-[#4da3ff] truncate">{selectedCampaign.campanha}</p>
                  </div>

                  {(() => {
                    const m = calculateMetrics(selectedCampaign);
                    const steps = [
                      { label: 'Clique → Página', val: m.clickToPage, goal: 70, icon: <MousePointer2 size={14} /> },
                      { label: 'Página → Checkout', val: m.pageToCheckout, goal: 5, icon: <ShoppingCart size={14} /> },
                      { label: 'Checkout → Compra', val: m.checkoutToPurchase, goal: 30, icon: <DollarSign size={14} /> },
                      { label: 'Conversão Final', val: m.finalConv, goal: 1, icon: <TrendingUp size={14} /> },
                    ];

                    return steps.map((step, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {step.icon}
                            {step.label}
                          </div>
                          <div className={`text-sm font-black ${step.val >= step.goal ? 'text-emerald-500' : 'text-red-500'}`}>
                            {step.val.toFixed(1)}%
                            <span className="text-[10px] text-gray-600 ml-1 font-normal">/ {step.goal}%</span>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(step.val, 100)}%` }}
                            className={`h-full ${step.val >= step.goal ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                  <HelpCircle size={40} className="mb-2 opacity-20" />
                  <p className="text-sm">Adicione ou selecione uma campanha para ver a validação detalhada.</p>
                </div>
              )}
              
              <p className="mt-6 text-[10px] text-gray-500 leading-relaxed italic">
                * Barras verdes indicam que a etapa está dentro do benchmark ideal.
              </p>
            </div>
          </section>
        )}

        {/* Filters and Search */}
        <div className="mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por campanha, criativo ou página..."
              className="w-full bg-[#151515] border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-[#4da3ff] transition-colors text-sm"
            />
          </div>
          <div className="text-xs text-gray-500">
            Mostrando {filteredAndSortedData.length} de {dados.length} entradas
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto bg-[#151515] rounded-2xl border border-white/5 shadow-xl">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-bottom border-white/10">
                <th 
                  onClick={() => handleSort('campanha')}
                  className="p-4 text-xs font-bold text-[#4da3ff] uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Campanha / Criativo
                    <SortIndicator column="campanha" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('ctr')}
                  className="p-4 text-xs font-bold text-[#4da3ff] uppercase tracking-widest text-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    CTR
                    <SortIndicator column="ctr" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('cpc')}
                  className="p-4 text-xs font-bold text-[#4da3ff] uppercase tracking-widest text-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    CPC
                    <SortIndicator column="cpc" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('conv')}
                  className="p-4 text-xs font-bold text-[#4da3ff] uppercase tracking-widest text-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    Conversão
                    <SortIndicator column="conv" />
                  </div>
                </th>
                <th className="p-4 text-xs font-bold text-[#4da3ff] uppercase tracking-widest text-center">Inic. Compra</th>
                <th 
                  onClick={() => handleSort('receita')}
                  className="p-4 text-xs font-bold text-[#4da3ff] uppercase tracking-widest text-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    Receita
                    <SortIndicator column="receita" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('lucro')}
                  className="p-4 text-xs font-bold text-[#4da3ff] uppercase tracking-widest text-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    Lucro
                    <SortIndicator column="lucro" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('roi')}
                  className="p-4 text-xs font-bold text-[#4da3ff] uppercase tracking-widest text-center cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2">
                    ROI
                    <SortIndicator column="roi" />
                  </div>
                </th>
                <th className="p-4 text-xs font-bold text-[#4da3ff] uppercase tracking-widest text-center">Validação</th>
                <th className="p-4 text-xs font-bold text-[#4da3ff] uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredAndSortedData.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={9} className="p-12 text-center text-gray-500 italic">
                      {searchTerm ? 'Nenhum resultado encontrado para sua busca.' : 'Nenhum dado adicionado ainda.'}
                    </td>
                  </motion.tr>
                ) : (
                  filteredAndSortedData.map((d) => {
                    const { ctr, cpc, conv, receita, lucro, roi, clickToPage, pageToCheckout, checkoutToPurchase, finalConv } = calculateMetrics(d);
                    
                    const getValidationStatus = () => {
                      const issues = [];
                      if (clickToPage < 70) issues.push('Carregamento Lento/Curiosidade');
                      if (pageToCheckout < 5) issues.push('Oferta Fraca/Página Ruim');
                      if (checkoutToPurchase < 30) issues.push('Checkout Complexo/Frete');
                      if (finalConv < 1) issues.push('Baixa Conversão Geral');
                      return issues;
                    };

                    const validationIssues = getValidationStatus();

                    return (
                        <motion.tr 
                          key={d.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => setSelectedId(d.id)}
                          className={`hover:bg-white/5 transition-colors group cursor-pointer ${selectedId === d.id ? 'bg-blue-500/5 border-l-2 border-blue-500' : ''}`}
                        >
                        <td className="p-4">
                          <div className="font-bold text-white">{d.campanha}</div>
                          <div className="text-xs text-gray-500">{d.criativo} • {d.pagina || 'Sem página'}</div>
                        </td>
                        <td className="p-4 text-center font-mono">{ctr.toFixed(2)}%</td>
                        <td className="p-4 text-center font-mono text-gray-400">R$ {cpc.toFixed(2)}</td>
                        <td className="p-4 text-center font-mono text-amber-400">{d.checkouts}</td>
                        <td className="p-4 text-center font-mono">{conv.toFixed(2)}%</td>
                        <td className="p-4 text-center font-mono text-blue-400">R$ {receita.toFixed(2)}</td>
                        <td className={`p-4 text-center font-bold font-mono ${lucro >= 0 ? 'text-[#00e676]' : 'text-[#ff5252]'}`}>
                          <div className="flex items-center justify-center gap-1">
                            {lucro >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            R$ {lucro.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-4 text-center font-mono">
                          <span className={`px-2 py-1 rounded text-xs ${roi >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {roi.toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex gap-1.5">
                              <div title={`Clique->Página: ${clickToPage.toFixed(1)}%`} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${clickToPage >= 70 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                {clickToPage.toFixed(0)}%
                              </div>
                              <div title={`Página->Checkout: ${pageToCheckout.toFixed(1)}%`} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${pageToCheckout >= 5 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                {pageToCheckout.toFixed(0)}%
                              </div>
                              <div title={`Checkout->Compra: ${checkoutToPurchase.toFixed(1)}%`} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${checkoutToPurchase >= 30 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                {checkoutToPurchase.toFixed(0)}%
                              </div>
                            </div>
                            {validationIssues.length === 0 ? (
                              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-tighter">OK</span>
                            ) : (
                              <span className="text-[9px] text-red-500 font-bold uppercase tracking-tighter">{validationIssues.length} ALERTA(S)</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => removeEntry(d.id)}
                            className="p-2 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        {dados.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#151515] p-4 rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Gasto</div>
              <div className="text-xl font-mono">R$ {dados.reduce((acc, d) => acc + d.gasto, 0).toFixed(2)}</div>
            </div>
            <div className="bg-[#151515] p-4 rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Receita</div>
              <div className="text-xl font-mono text-blue-400">R$ {dados.reduce((acc, d) => acc + d.vendas * d.preco, 0).toFixed(2)}</div>
            </div>
            <div className="bg-[#151515] p-4 rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Lucro Total</div>
              <div className={`text-xl font-mono font-bold ${dados.reduce((acc, d) => acc + (d.vendas * d.preco - d.gasto), 0) >= 0 ? 'text-[#00e676]' : 'text-[#ff5252]'}`}>
                R$ {dados.reduce((acc, d) => acc + (d.vendas * d.preco - d.gasto), 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-[#151515] p-4 rounded-xl border border-white/5">
              <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">ROI Médio</div>
              <div className="text-xl font-mono">
                {(() => {
                  const totalGasto = dados.reduce((acc, d) => acc + d.gasto, 0);
                  const totalLucro = dados.reduce((acc, d) => acc + (d.vendas * d.preco - d.gasto), 0);
                  return totalGasto > 0 ? ((totalLucro / totalGasto) * 100).toFixed(0) : '0';
                })()}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#151515] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Importar Dados</h2>
                  <p className="text-xs text-gray-500 mt-1">Cole as colunas da sua planilha ou Gerenciador de Anúncios.</p>
                </div>
                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-xs text-blue-400">
                  <p className="font-bold mb-1">Ordem esperada das colunas (separadas por TAB ou Vírgula):</p>
                  <p>Campanha, Criativo, Página, Impressões, Cliques, Visitas, Checkouts, Vendas, Gasto, Preço</p>
                </div>
                
                <textarea 
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole aqui os dados..."
                  className="w-full h-64 bg-[#0c0c0c] border border-white/10 rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-[#4da3ff] transition-colors resize-none"
                />
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleImport}
                    className="flex-1 py-3 bg-[#2f7cff] hover:bg-[#1a66e6] rounded-xl font-bold transition-colors"
                  >
                    Processar e Importar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

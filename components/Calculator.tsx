import React, { useState, useEffect } from 'react';
import { CommissionType } from '../types';
import { Calculator as CalcIcon, DollarSign, PieChart, AlertCircle, ChevronDown, ChevronUp, Info, Pencil, Settings, Home, Users, CheckSquare, Leaf, Percent, ThumbsUp, ThumbsDown } from 'lucide-react';

export const Calculator: React.FC = () => {
  // Initialize with formatted strings for inputs
  const [propertyValue, setPropertyValue] = useState<number>(341912);
  const [displayValue, setDisplayValue] = useState<string>("341.912,00");
  
  const [userIncome, setUserIncome] = useState<number>(8000);
  const [displayIncome, setDisplayIncome] = useState<string>("8.000,00");

  const [entryPercent, setEntryPercent] = useState<number>(20);
  const [commissionType, setCommissionType] = useState<CommissionType>(CommissionType.NEW);
  
  // Financing System
  const [amortizationSystem, setAmortizationSystem] = useState<'PRICE' | 'SAC'>('PRICE');
  
  // MCMV / Client Profile State
  const [isMCMV, setIsMCMV] = useState(true);
  const [hasSocialFactor, setHasSocialFactor] = useState(true);
  const [isCotista, setIsCotista] = useState(true);

  // Tax Configuration
  const [taxRate, setTaxRate] = useState<number>(9); 
  // Hardcoded to Option A (Tax on Total) logic.

  // UI State
  const [showCommission, setShowCommission] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(true);
  
  // --- HELPER: ATM Style Currency Input ---
  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>, setterNum: (n: number) => void, setterStr: (s: string) => void) => {
    // Remove non-digits
    let value = e.target.value.replace(/\D/g, '');
    
    // Handle empty
    if (!value) {
      setterNum(0);
      setterStr('0,00');
      return;
    }

    // Treat as cents (divide by 100)
    const numberValue = parseInt(value) / 100;
    
    setterNum(numberValue);
    setterStr(numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  // --- MCMV LOGIC HELPERS ---
  
  const getMCMVInterestRate = (monthlyIncome: number, isCotista: boolean) => {
    let rate = 0.09; // Default standard rate (9% p.a.)

    if (isMCMV) {
      // Simplified MCMV 2024/2025 Brackets
      if (monthlyIncome <= 2640) rate = 0.0425;
      else if (monthlyIncome <= 4400) rate = 0.0550;
      else if (monthlyIncome <= 8000) rate = 0.0766;
      else rate = 0.0816; // Cap at Faixa 3 max

      // Cotista bonus (-0.5%)
      if (isCotista) rate -= 0.005;
    }

    // Convert Annual to Monthly
    return rate / 12;
  };

  const calculateSubsidy = (monthlyIncome: number, hasSocialFactor: boolean) => {
    if (!isMCMV || monthlyIncome > 4400) return 0;

    let baseSubsidy = 0;
    const MAX_SUBSIDY_F1 = 55000;
    const MAX_SUBSIDY_F2 = 55000; 

    // Simplified Curve Logic based on Portaria MCID
    if (monthlyIncome <= 2640) {
      baseSubsidy = MAX_SUBSIDY_F1;
    } else {
      // Linear degradation from 2640 to 4400
      const range = 4400 - 2640;
      const pos = monthlyIncome - 2640;
      const factor = 1 - (pos / range);
      baseSubsidy = MAX_SUBSIDY_F2 * factor; 
    }

    // Social Factor Logic: Fixed bonus if "Factor Social" is checked
    // Previously multiplied by dependents, now a fixed boolean check.
    if (hasSocialFactor) {
      baseSubsidy += 2000; // Fixed bonus for having dependents
    }

    return Math.min(baseSubsidy, 55000); // Cap at 55k
  };

  // Constants
  const months = 420; // 35 years (Common for first home)
  
  // --- MAIN CALCULATION ---
  
  // 1. Determine Parameters based on USER INCOME
  const monthlyRate = getMCMVInterestRate(userIncome, isCotista);
  const subsidy = calculateSubsidy(userIncome, hasSocialFactor);

  // 2. Determine Values based on PROPERTY VALUE
  const entryValueRaw = propertyValue * (entryPercent / 100);
  
  // In this simulation: Bank finances (Property - EntryRaw). 
  // Subsidy helps pay the EntryRaw.
  const financedAmount = propertyValue - entryValueRaw; 
  
  // "Effective Entry" is what comes out of client's pocket
  const effectiveEntry = Math.max(0, entryValueRaw - subsidy);

  // 3. Calculate Installment
  let firstInstallment = 0;
  if (amortizationSystem === 'SAC') {
    const amortization = financedAmount / months;
    const interest = financedAmount * monthlyRate;
    firstInstallment = amortization + interest;
  } else {
    // PRICE
    if (monthlyRate === 0) {
      firstInstallment = financedAmount / months;
    } else {
      const factor = (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      firstInstallment = financedAmount * factor;
    }
  }
  
  // 4. Analyze Approval (Reverse Logic)
  // Instead of auto-calculating property value, we check if the CURRENT income supports the CURRENT property value.
  // Max commitment usually 30%
  const maxInstallmentAllowed = userIncome * 0.30;
  const isApproved = firstInstallment <= maxInstallmentAllowed;
  const requiredIncome = firstInstallment / 0.30;
  const commitment = userIncome > 0 ? (firstInstallment / userIncome) * 100 : 0;

  // --- COMMISSION LOGIC ---
  const grossCommissionTotal = propertyValue * commissionType;
  
  // Option A Logic (Hardcoded): Tax is calculated on the TOTAL gross commission
  const taxValue = grossCommissionTotal * (taxRate / 100);
  const netTotal = grossCommissionTotal - taxValue;
  const brokerShare = netTotal / 2;
  const agencyShare = netTotal / 2;
  
  const calculationDescription = `Nota reduz o valor total a dividir.`;
  const taxBaseDescription = `Imposto calculado sobre o Total (${formatMoney(grossCommissionTotal)})`;

  function formatMoney(val: number) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-blue-950">Calculadora Financeira</h2>
         <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${isMCMV ? 'text-green-600' : 'text-slate-400'}`}>
              {isMCMV ? 'Minha Casa Minha Vida' : 'SBPE (Padrão)'}
            </span>
            <button 
              onClick={() => setIsMCMV(!isMCMV)}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${isMCMV ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${isMCMV ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Input Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <CalcIcon size={20} className="text-orange-500" /> Dados da Simulação
          </h3>
          
          {/* Property Value Input */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Valor do Imóvel</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-bold text-lg text-slate-800"
                value={displayValue}
                onChange={(e) => handleCurrencyInput(e, setPropertyValue, setDisplayValue)}
                placeholder="0,00"
              />
            </div>
          </div>

           {/* Income Input */}
           <div>
            <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-slate-600">Renda Bruta Mensal</label>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isApproved ? 'Aprovado' : 'Comprometida'}
                </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
              <input 
                type="text" 
                className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 outline-none font-bold text-lg transition-colors ${isApproved ? 'border-slate-200 focus:ring-orange-500 focus:border-orange-500 text-slate-800' : 'border-red-300 focus:ring-red-500 text-red-600'}`}
                value={displayIncome}
                onChange={(e) => handleCurrencyInput(e, setUserIncome, setDisplayIncome)}
                placeholder="0,00"
              />
            </div>
            {!isApproved && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Necessário aprox: {formatMoney(requiredIncome)}
                </p>
            )}
          </div>

          {/* Client Profile Checkboxes */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
               <Users size={14} /> Perfil do Cliente
             </h4>
             
             <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${isCotista ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-2 mb-1">
                       <div className={`w-4 h-4 rounded border flex items-center justify-center ${isCotista ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                          {isCotista && <CheckSquare size={12} className="text-white" />}
                       </div>
                       <span className="text-sm font-bold">Cotista FGTS</span>
                    </div>
                    <span className="text-[10px] text-center opacity-80">3+ anos de registro</span>
                    <input type="checkbox" className="hidden" checked={isCotista} onChange={() => setIsCotista(!isCotista)} />
                </label>

                <label className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${hasSocialFactor ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}`}>
                    <div className="flex items-center gap-2 mb-1">
                       <div className={`w-4 h-4 rounded border flex items-center justify-center ${hasSocialFactor ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                          {hasSocialFactor && <CheckSquare size={12} className="text-white" />}
                       </div>
                       <span className="text-sm font-bold">Fator Social</span>
                    </div>
                    <span className="text-[10px] text-center opacity-80">Possui dependentes</span>
                    <input type="checkbox" className="hidden" checked={hasSocialFactor} onChange={() => setHasSocialFactor(!hasSocialFactor)} />
                </label>
             </div>
          </div>

          {/* Amortization System Toggle */}
          <div>
             <label className="block text-sm font-medium text-slate-600 mb-2">Sistema de Amortização</label>
             <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setAmortizationSystem('PRICE')}
                  className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${amortizationSystem === 'PRICE' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  PRICE
                  <span className="block text-[10px] font-normal opacity-70">Primeiro Imóvel</span>
                </button>
                <button
                  onClick={() => setAmortizationSystem('SAC')}
                  className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${amortizationSystem === 'SAC' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  SAC
                  <span className="block text-[10px] font-normal opacity-70">Investidor</span>
                </button>
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-600 mb-2">Entrada ({entryPercent}%)</label>
             <input 
               type="range" 
               min="10" 
               max="90" 
               step="5"
               value={entryPercent}
               onChange={(e) => setEntryPercent(Number(e.target.value))}
               className={`w-full mb-2 ${isMCMV ? 'accent-green-500' : 'accent-orange-500'}`}
             />
             <div className="flex justify-between text-sm text-slate-500 font-medium">
               <span>10%</span>
               <span className="text-slate-800 font-bold">{formatMoney(entryValueRaw)}</span>
               <span>90%</span>
             </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 transition-all overflow-hidden">
            <button 
               className="w-full p-4 flex justify-between items-center text-left focus:outline-none group hover:bg-slate-100 transition-colors"
               onClick={() => setShowSettings(!showSettings)}
            >
               <span className="text-sm font-bold text-slate-700 flex items-center gap-2 group-hover:text-orange-600 transition-colors">
                  <Settings size={16} className="text-slate-500 group-hover:text-orange-500" />
                  Config. Comissão & Imposto
               </span>
               <span className="text-slate-400 group-hover:text-orange-500 transition-colors">
                 {showSettings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
               </span>
            </button>

            {showSettings && (
              <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 border-t border-slate-200/50 mt-1">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2 mt-3">Comissionamento</label>
                  <div className="flex bg-white p-1 rounded-lg border border-slate-200 mb-3">
                    <button 
                      onClick={() => setCommissionType(CommissionType.NEW)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${commissionType === CommissionType.NEW ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      4% (Planta)
                    </button>
                    <button 
                      onClick={() => setCommissionType(CommissionType.USED)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${commissionType === CommissionType.USED ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      5% (Pronto)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2 flex justify-between">
                    <span>Nota Fiscal / Imposto</span>
                    <span className="text-orange-600 font-bold">{taxRate}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    step="0.5"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full accent-orange-500 mb-3"
                  />
                  <p className="text-xs text-slate-400 text-center">
                     Opção A: Imposto cobrado sobre o valor total da comissão.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Commission Breakdown (Collapsible) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all">
             <div 
               className="flex justify-between items-center cursor-pointer group select-none" 
               onClick={() => setShowCommission(!showCommission)}
             >
               <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <PieChart size={20} className="text-green-600" /> Detalhamento de Comissão
               </h3>
               <div className="flex items-center gap-2 text-slate-400 group-hover:text-orange-500 transition-colors">
                  <span className="text-xs font-medium">{showCommission ? 'Ocultar' : 'Mostrar'}</span>
                  {showCommission ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
               </div>
             </div>
             
             {showCommission && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Main Visualization */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-bold">Comissão Bruta Total (100%)</p>
                          <p className="text-xl font-bold text-slate-800">{formatMoney(grossCommissionTotal)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 uppercase font-bold">Imposto ({taxRate}%)</p>
                          <p className="text-base font-bold text-red-600">-{formatMoney(taxValue)}</p>
                        </div>
                     </div>
                     
                     <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs border border-blue-100">
                       <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                       <div>
                         <p className="font-bold mb-1">{taxBaseDescription}</p>
                         <p>{calculationDescription}</p>
                       </div>
                     </div>
                  </div>

                  {/* Shares */}
                  <div className="space-y-3">
                     <div className="p-4 rounded-xl bg-green-600 text-white shadow-lg relative overflow-hidden transform transition-transform hover:scale-[1.02]">
                        <div className="absolute right-0 top-0 w-20 h-full bg-white/10 skew-x-12"></div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-xs text-green-100 font-bold uppercase mb-1">Sua Parte (Corretor)</p>
                              <p className="text-3xl font-bold">{formatMoney(brokerShare)}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs text-green-200 opacity-80">50%</p>
                            </div>
                          </div>
                        </div>
                     </div>
                     
                     <div className="p-4 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Parte Imobiliária</p>
                          <p className="text-xl font-bold text-slate-600">{formatMoney(agencyShare)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Líquido</p>
                        </div>
                     </div>
                  </div>
               </div>
             )}
          </div>

          {/* Simulation Cards (Scenarios) */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
               <DollarSign size={20} className="text-blue-600" /> Cenários de Financiamento
            </h3>
            <div className="flex gap-2">
               <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium flex items-center gap-1">
                  <Percent size={12} /> {amortizationSystem}
               </span>
               <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium flex items-center gap-1">
                  <Info size={12} /> 420 meses
               </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className={`p-5 rounded-2xl shadow-lg transform border-2 relative overflow-hidden text-white ${isMCMV ? 'bg-green-900 border-green-500' : 'bg-blue-900 border-orange-500'}`}>
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl ${isMCMV ? 'bg-green-500/30' : 'bg-orange-500/20'}`}></div>
                <div className="flex justify-between items-start mb-1">
                   <p className={`${isMCMV ? 'text-green-200' : 'text-blue-200'} text-xs font-bold uppercase tracking-wider`}>Cenário Atual</p>
                   {isMCMV && <span className="bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">MCMV</span>}
                </div>
                <p className="text-2xl font-bold mb-4">{entryPercent}% Entrada</p>
                
                <div className={`space-y-2 text-sm ${isMCMV ? 'text-green-100' : 'text-blue-100'}`}>
                   <div className="flex justify-between">
                     <span>Financiado:</span>
                     <span className="text-white font-medium">{formatMoney(financedAmount)}</span>
                   </div>
                   
                   {isMCMV && subsidy > 0 && (
                     <div className="flex justify-between text-green-300 font-bold animate-pulse">
                        <span>Subsídio Ganho:</span>
                        <span>+ {formatMoney(subsidy)}</span>
                     </div>
                   )}

                   <div className="flex justify-between">
                     <span>Entrada em Dinheiro:</span>
                     <span className="text-white font-medium">{formatMoney(effectiveEntry)}</span>
                   </div>

                   <div className="flex justify-between pt-1 border-t border-white/10">
                     <span>1ª Parcela ({amortizationSystem}):</span>
                     <span className={`${isMCMV ? 'text-green-300' : 'text-orange-400'} font-bold`}>{formatMoney(firstInstallment)}</span>
                   </div>
                   
                   <div className="flex justify-between text-xs opacity-80">
                      <span>Juros Nominais:</span>
                      <span>~{(monthlyRate * 12 * 100).toFixed(2)}% a.a.</span>
                   </div>
                </div>
                
                {/* Status Area */}
                <div className={`mt-4 pt-4 border-t relative group ${isMCMV ? 'border-green-800' : 'border-blue-800'}`}>
                   <div className="flex items-center gap-2">
                       {isApproved ? <ThumbsUp size={16} className="text-green-300" /> : <ThumbsDown size={16} className="text-red-300" />}
                       <span className={`text-xs font-bold ${isApproved ? 'text-green-300' : 'text-red-300'}`}>
                           {isApproved ? 'Financiamento Viável' : 'Renda Comprometida'}
                       </span>
                   </div>
                   <div className="text-[10px] opacity-80 mt-1">
                       Comprometimento: {commitment.toFixed(1)}% (Max 30%)
                   </div>
                </div>
             </div>

             {/* Comparison Scenario 1 (Lower Entry) */}
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 opacity-75 hover:opacity-100 transition-opacity">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Entrada Mínima</p>
                <p className="text-xl font-bold text-slate-700 mb-4">20% Entrada</p>
                <div className="space-y-2 text-sm text-slate-600">
                   <div className="flex justify-between">
                     <span>Entrada Bruta:</span>
                     <span className="font-medium">{formatMoney(propertyValue * 0.2)}</span>
                   </div>
                   {isMCMV && subsidy > 0 && (
                      <div className="flex justify-between text-green-600 text-xs">
                        <span>Subsídio:</span>
                        <span>-{formatMoney(subsidy)}</span>
                      </div>
                   )}
                   <div className="flex justify-between border-t border-slate-100 pt-1">
                     <span>A Pagar (Ato):</span>
                     <span className="font-bold text-slate-800">{formatMoney(Math.max(0, (propertyValue * 0.2) - subsidy))}</span>
                   </div>
                </div>
             </div>

             {/* Comparison Scenario 2 (Higher Entry) */}
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 opacity-75 hover:opacity-100 transition-opacity">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Entrada Ideal</p>
                <p className="text-xl font-bold text-slate-700 mb-4">50% Entrada</p>
                <div className="space-y-2 text-sm text-slate-600">
                   <div className="flex justify-between">
                     <span>Entrada Bruta:</span>
                     <span className="font-medium">{formatMoney(propertyValue * 0.5)}</span>
                   </div>
                   {isMCMV && subsidy > 0 && (
                      <div className="flex justify-between text-green-600 text-xs">
                        <span>Subsídio:</span>
                        <span>-{formatMoney(subsidy)}</span>
                      </div>
                   )}
                   <div className="flex justify-between border-t border-slate-100 pt-1">
                     <span>A Pagar (Ato):</span>
                     <span className="font-bold text-slate-800">{formatMoney(Math.max(0, (propertyValue * 0.5) - subsidy))}</span>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
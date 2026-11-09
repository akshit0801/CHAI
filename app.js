// CHAI Telecom Tower Battery TCO Model - Engine & Visualizations

(function() {
  'use strict';

  // State Management
  const state = {
    T: 10000,       // Towers in scope
    N: 6,           // Batteries per tower
    P_std: 14000,   // Standard LAB unit price, INR
    P_xl: 17200,    // XL-Series unit price, INR
    L_std: 20,      // Standard battery life, months
    L_xl: 36,       // XL-Series battery life, months
    C_visit: 3250,  // Replacement visit cost, INR
    S: 350,         // Scrap value per spent battery, INR
    F_scrap: 1,     // Include scrap credit? 1 = yes, 0 = no
    activePreset: 'base'
  };

  const presets = {
    base: {
      T: 10000, N: 6, P_std: 14000, P_xl: 17200,
      L_std: 20, L_xl: 36, C_visit: 3250, S: 350, F_scrap: 1
    },
    pessimistic: {
      T: 10000, N: 4, P_std: 13000, P_xl: 18500,
      L_std: 24, L_xl: 24, C_visit: 2500, S: 400, F_scrap: 1
    },
    optimistic: {
      T: 10000, N: 8, P_std: 15000, P_xl: 17200,
      L_std: 18, L_xl: 54, C_visit: 4000, S: 300, F_scrap: 1
    },
    rajasthan: {
      T: 10000, N: 6, P_std: 14000, P_xl: 17200,
      L_std: 18, L_xl: 32, C_visit: 3500, S: 350, F_scrap: 1
    },
    mp: {
      T: 10000, N: 6, P_std: 14000, P_xl: 17200,
      L_std: 25, L_xl: 40, C_visit: 3000, S: 350, F_scrap: 1
    },
    cfo_strict: {
      T: 10000, N: 6, P_std: 14000, P_xl: 17200,
      L_std: 20, L_xl: 36, C_visit: 3250, S: 350, F_scrap: 0
    }
  };

  // Indian Rupee & Number Formatting
  function formatINR(val, decimals = 0) {
    if (isNaN(val) || val === null) return '₹0';
    const rounded = Math.round(val);
    const sign = rounded < 0 ? '-' : '';
    const absStr = Math.abs(rounded).toString();
    
    let lastThree = absStr.substring(absStr.length - 3);
    let otherNumbers = absStr.substring(0, absStr.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    return sign + '₹' + res;
  }

  function formatCr(val) {
    if (isNaN(val) || val === null) return '₹0.00 Cr';
    const sign = val < 0 ? '-' : '+';
    return `${sign}₹${Math.abs(val).toFixed(2)} Cr`;
  }

  function formatPct(val) {
    if (isNaN(val) || val === null) return '0.0%';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  }

  // TCO Model Math
  function calculateModel(params) {
    const { T, N, P_std, P_xl, L_std, L_xl, C_visit, S, F_scrap } = params;

    const scrapCreditPerCycle = N * S * F_scrap;
    const costCycleStd = N * (P_std - S * F_scrap) + C_visit;
    const costCycleXl = N * (P_xl - S * F_scrap) + C_visit;

    const freqStd = 12 / L_std;
    const freqXl = 12 / L_xl;

    const tcoStdTower = freqStd * costCycleStd;
    const tcoXlTower = freqXl * costCycleXl;

    const grossPurchaseStd = freqStd * (N * P_std);
    const grossPurchaseXl = freqXl * (N * P_xl);
    const visitAnnualStd = freqStd * C_visit;
    const visitAnnualXl = freqXl * C_visit;
    const scrapAnnualStd = freqStd * scrapCreditPerCycle;
    const scrapAnnualXl = freqXl * scrapCreditPerCycle;

    const savingTower = tcoStdTower - tcoXlTower;
    const savingFleetCr = (savingTower * T) / 1e7;
    const savingPct = (savingTower / tcoStdTower) * 100;

    const initialCapexStdTower = N * P_std;
    const initialCapexXlTower = N * P_xl;
    const extraCapexTower = initialCapexXlTower - initialCapexStdTower;
    const extraCapexFleetCr = (extraCapexTower * T) / 1e7;

    const breakEvenXlLife = L_std * (costCycleXl / costCycleStd);
    const breakEvenXlPrice = (((L_xl / L_std) * costCycleStd - C_visit) / N) + (S * F_scrap);
    const maxAbsorbedPremiumPct = ((breakEvenXlPrice - P_std) / P_std) * 100;
    const actualPremiumPct = ((P_xl - P_std) / P_std) * 100;
    const lifeSafetyMargin = L_xl - breakEvenXlLife;

    const paybackYears = savingTower > 0 ? (extraCapexTower / savingTower) : null;
    const paybackMonths = paybackYears !== null ? paybackYears * 12 : null;

    return {
      costCycleStd,
      costCycleXl,
      freqStd,
      freqXl,
      grossPurchaseStd,
      grossPurchaseXl,
      visitAnnualStd,
      visitAnnualXl,
      scrapAnnualStd,
      scrapAnnualXl,
      scrapCreditPerCycle,
      tcoStdTower,
      tcoXlTower,
      tcoStdFleetCr: (tcoStdTower * T) / 1e7,
      tcoXlFleetCr: (tcoXlTower * T) / 1e7,
      savingTower,
      savingFleetCr,
      savingPct,
      initialCapexStdTower,
      initialCapexXlTower,
      extraCapexTower,
      extraCapexFleetCr,
      breakEvenXlLife,
      breakEvenXlPrice,
      maxAbsorbedPremiumPct,
      actualPremiumPct,
      lifeSafetyMargin,
      paybackYears,
      paybackMonths
    };
  }

  // Update UI Elements
  function updateUI() {
    const res = calculateModel(state);

    // Update Banner Verdict
    const banner = document.getElementById('verdict-banner');
    const verdictTitle = document.getElementById('verdict-title');
    const verdictSub = document.getElementById('verdict-subtitle');
    const verdictPill = document.getElementById('verdict-pill');
    const verdictIcon = document.getElementById('verdict-icon');

    if (res.savingTower > 500) {
      banner.className = 'verdict-banner success';
      verdictIcon.innerHTML = '&#10003;';
      verdictTitle.textContent = `XL-Series Cheaper: Saves ${formatINR(res.savingTower)} per tower/year`;
      verdictSub.textContent = `Annual fleet saving of ${formatCr(res.savingFleetCr)} across ${state.T.toLocaleString()} towers (${Math.abs(res.savingPct).toFixed(1)}% cost reduction). Break-even life is ${res.breakEvenXlLife.toFixed(1)} months (safety cushion: ${res.lifeSafetyMargin.toFixed(1)} months).`;
      verdictPill.textContent = 'XL CHEAPER';
    } else if (res.savingTower < -500) {
      banner.className = 'verdict-banner danger';
      verdictIcon.innerHTML = '&#9888;';
      verdictTitle.textContent = `Standard LAB Cheaper: XL costs ${formatINR(Math.abs(res.savingTower))} more per tower/year`;
      verdictSub.textContent = `Fleet cost increases by ${formatCr(res.savingFleetCr)}/yr. XL lifespan of ${state.L_xl} months is below the break-even threshold of ${res.breakEvenXlLife.toFixed(1)} months.`;
      verdictPill.textContent = 'STANDARD CHEAPER';
    } else {
      banner.className = 'verdict-banner warning';
      verdictIcon.innerHTML = '&#8776;';
      verdictTitle.textContent = `At Break-Even: Difference is ${formatINR(res.savingTower)}/yr`;
      verdictSub.textContent = `XL-Series cost matches standard LAB within 1% (${res.breakEvenXlLife.toFixed(1)} months break-even).`;
      verdictPill.textContent = 'BREAK-EVEN';
    }

    // Update Top KPI Cards
    document.getElementById('kpi-std-tco').textContent = formatINR(res.tcoStdTower) + '/yr';
    document.getElementById('kpi-xl-tco').textContent = formatINR(res.tcoXlTower) + '/yr';

    const kpiSavingTowerEl = document.getElementById('kpi-saving-tower');
    kpiSavingTowerEl.textContent = (res.savingTower >= 0 ? '+' : '') + formatINR(res.savingTower) + '/yr';
    const cardSavingTower = document.getElementById('card-saving-tower');
    cardSavingTower.className = 'kpi-card ' + (res.savingTower >= 0 ? 'positive' : 'negative');
    document.getElementById('kpi-saving-pct').textContent = `${formatPct(res.savingPct)} cost reduction`;

    const kpiSavingFleetEl = document.getElementById('kpi-saving-fleet');
    kpiSavingFleetEl.textContent = formatCr(res.savingFleetCr) + '/yr';
    const cardSavingFleet = document.getElementById('card-saving-fleet');
    cardSavingFleet.className = 'kpi-card ' + (res.savingFleetCr >= 0 ? 'positive' : 'negative');

    document.getElementById('kpi-capex-hurdle').textContent = `+₹${res.extraCapexFleetCr.toFixed(2)} Cr`;
    document.getElementById('kpi-capex-sub').textContent = `+${formatINR(res.extraCapexTower)}/tower upfront`;

    const kpiPaybackEl = document.getElementById('kpi-payback');
    if (res.paybackMonths !== null && res.paybackMonths > 0) {
      kpiPaybackEl.textContent = `${res.paybackYears.toFixed(2)} Yrs (${res.paybackMonths.toFixed(1)}m)`;
    } else {
      kpiPaybackEl.textContent = 'No Payback';
    }

    // Call out 1: CAPEX Breakeven (Payback)
    const beCapexMain = document.getElementById('be-capex-payback-main');
    if (beCapexMain) {
      beCapexMain.textContent = (res.paybackMonths !== null && res.paybackMonths > 0)
        ? `${res.paybackYears.toFixed(2)} Years (${res.paybackMonths.toFixed(1)} Months)`
        : 'Does not break even';
    }
    const beCapexTwr = document.getElementById('be-capex-outlay-twr');
    if (beCapexTwr) beCapexTwr.textContent = `+${formatINR(res.extraCapexTower)} / tower`;
    const beCapexFlt = document.getElementById('be-capex-outlay-flt');
    if (beCapexFlt) beCapexFlt.textContent = `+₹${res.extraCapexFleetCr.toFixed(2)} Crore fleet`;
    const beCapexSav = document.getElementById('be-capex-annual-save');
    if (beCapexSav) beCapexSav.textContent = `${formatINR(res.savingTower)} / tower/year`;

    // Call out 2: Overall Expenditure Breakeven (TCO Crossover)
    const beLifeMain = document.getElementById('be-overall-life-main');
    if (beLifeMain) beLifeMain.textContent = `${res.breakEvenXlLife.toFixed(1)} Months`;
    const beLifeMargin = document.getElementById('be-overall-life-margin');
    if (beLifeMargin) beLifeMargin.textContent = `${res.lifeSafetyMargin >= 0 ? '+' : ''}${res.lifeSafetyMargin.toFixed(1)} Months cushion`;
    const bePriceMain = document.getElementById('be-overall-price-main');
    if (bePriceMain) bePriceMain.textContent = formatINR(res.breakEvenXlPrice) + ' / unit';
    const bePremMain = document.getElementById('be-overall-prem-main');
    if (bePremMain) bePremMain.textContent = `+${res.maxAbsorbedPremiumPct.toFixed(1)}% (Quoted: +${res.actualPremiumPct.toFixed(1)}%)`;

    // Update Detailed Table
    document.getElementById('tbl-p-std').textContent = formatINR(state.P_std);
    document.getElementById('tbl-p-xl').textContent = formatINR(state.P_xl);
    document.getElementById('tbl-p-delta').textContent = `+${formatINR(state.P_xl - state.P_std)} (+${res.actualPremiumPct.toFixed(1)}%)`;

    document.getElementById('tbl-n-std').textContent = state.N;
    document.getElementById('tbl-n-xl').textContent = state.N;

    document.getElementById('tbl-life-std').textContent = `${state.L_std} mos`;
    document.getElementById('tbl-life-xl').textContent = `${state.L_xl} mos`;
    document.getElementById('tbl-life-delta').textContent = `+${state.L_xl - state.L_std} mos (+${(((state.L_xl/state.L_std)-1)*100).toFixed(0)}%)`;

    document.getElementById('tbl-freq-std').textContent = `${res.freqStd.toFixed(2)} /yr`;
    document.getElementById('tbl-freq-xl').textContent = `${res.freqXl.toFixed(2)} /yr`;
    document.getElementById('tbl-freq-delta').textContent = `${(res.freqXl - res.freqStd).toFixed(2)} /yr`;

    document.getElementById('tbl-bat-std').textContent = formatINR(state.N * state.P_std);
    document.getElementById('tbl-bat-xl').textContent = formatINR(state.N * state.P_xl);

    document.getElementById('tbl-vis-std').textContent = formatINR(state.C_visit);
    document.getElementById('tbl-vis-xl').textContent = formatINR(state.C_visit);

    document.getElementById('tbl-scr-std').textContent = '-' + formatINR(res.scrapCreditPerCycle);
    document.getElementById('tbl-scr-xl').textContent = '-' + formatINR(res.scrapCreditPerCycle);

    document.getElementById('tbl-cyc-std').textContent = formatINR(res.costCycleStd);
    document.getElementById('tbl-cyc-xl').textContent = formatINR(res.costCycleXl);
    document.getElementById('tbl-cyc-delta').textContent = `+${formatINR(res.costCycleXl - res.costCycleStd)}`;

    document.getElementById('tbl-tco-std').textContent = formatINR(res.tcoStdTower);
    document.getElementById('tbl-tco-xl').textContent = formatINR(res.tcoXlTower);
    document.getElementById('tbl-tco-delta').textContent = `${res.savingTower >= 0 ? '-' : '+'}${formatINR(Math.abs(res.savingTower))} (${formatPct(-res.savingPct)})`;

    document.getElementById('tbl-flt-std').textContent = `₹${res.tcoStdFleetCr.toFixed(2)} Cr`;
    document.getElementById('tbl-flt-xl').textContent = `₹${res.tcoXlFleetCr.toFixed(2)} Cr`;
    document.getElementById('tbl-flt-delta').textContent = formatCr(res.savingFleetCr);

    document.getElementById('tbl-cfo-capex').textContent = `+₹${res.extraCapexFleetCr.toFixed(2)} Cr`;

    // Render Charts
    renderBarChart(res);
    renderCumulativeChart(res);
    renderCrossoverChart(res);

    // Update Sensitivity Matrices & Scenarios Table
    renderSensitivityGrids();
    updateScenarioTable();
  }

  // Chart 1: Annual Battery Cost per Tower (Responsive for Mobile)
  function renderBarChart(res) {
    const container = document.getElementById('chart-cost-breakdown');
    if (!container) return;

    const width = container.clientWidth || 360;
    const isMobile = width < 440;
    const height = isMobile ? 200 : 220;
    const padding = {
      top: 25,
      right: isMobile ? 12 : 24,
      bottom: isMobile ? 32 : 36,
      left: isMobile ? 46 : 60
    };

    const maxVal = Math.max(res.tcoStdTower, res.tcoXlTower, Math.abs(res.savingTower)) * 1.25;
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const yScale = val => chartH - (val / maxVal) * chartH;

    let svg = `<svg class="svg-chart" viewBox="0 0 ${width} ${height}">`;

    for (let i = 0; i <= 4; i++) {
      const v = (maxVal / 4) * i;
      const y = padding.top + yScale(v);
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3 3"/>`;
      svg += `<text x="${padding.left - 6}" y="${y + 4}" font-size="${isMobile ? 9 : 10}" fill="#64748b" text-anchor="end">₹${Math.round(v/1000)}k</text>`;
    }

    const colW = chartW / 3;
    const barW = Math.min(isMobile ? 34 : 46, colW * 0.70);

    // Standard LAB
    const x1 = padding.left + colW * 0.5;
    const h1 = (res.tcoStdTower / maxVal) * chartH;
    const y1 = padding.top + yScale(res.tcoStdTower);
    svg += `<rect x="${x1 - barW/2}" y="${y1}" width="${barW}" height="${h1}" fill="#475569" rx="3"/>`;
    svg += `<text x="${x1}" y="${y1 - 5}" font-size="${isMobile ? 10 : 11}" font-weight="700" fill="#475569" text-anchor="middle">₹${Math.round(res.tcoStdTower/1000)}k</text>`;
    svg += `<text x="${x1}" y="${height - (isMobile ? 14 : 16)}" font-size="${isMobile ? 9.5 : 11}" font-weight="600" fill="#334155" text-anchor="middle">Standard LAB</text>`;
    svg += `<text x="${x1}" y="${height - 3}" font-size="${isMobile ? 8.5 : 9.5}" fill="#64748b" text-anchor="middle">(${state.L_std}m)</text>`;

    // XL-Series
    const x2 = padding.left + colW * 1.5;
    const h2 = (res.tcoXlTower / maxVal) * chartH;
    const y2 = padding.top + yScale(res.tcoXlTower);
    svg += `<rect x="${x2 - barW/2}" y="${y2}" width="${barW}" height="${h2}" fill="#0284c7" rx="3"/>`;
    svg += `<text x="${x2}" y="${y2 - 5}" font-size="${isMobile ? 10 : 11}" font-weight="700" fill="#0284c7" text-anchor="middle">₹${Math.round(res.tcoXlTower/1000)}k</text>`;
    svg += `<text x="${x2}" y="${height - (isMobile ? 14 : 16)}" font-size="${isMobile ? 9.5 : 11}" font-weight="600" fill="#0284c7" text-anchor="middle">XL-Series</text>`;
    svg += `<text x="${x2}" y="${height - 3}" font-size="${isMobile ? 8.5 : 9.5}" fill="#64748b" text-anchor="middle">(${state.L_xl}m)</text>`;

    // Saving
    const x3 = padding.left + colW * 2.5;
    const isSaving = res.savingTower >= 0;
    const absSaving = Math.abs(res.savingTower);
    const h3 = (absSaving / maxVal) * chartH;
    const y3 = padding.top + yScale(absSaving);
    const saveColor = isSaving ? '#059669' : '#dc2626';

    svg += `<rect x="${x3 - barW/2}" y="${y3}" width="${barW}" height="${h3}" fill="${saveColor}" rx="3"/>`;
    svg += `<text x="${x3}" y="${y3 - 5}" font-size="${isMobile ? 10 : 11}" font-weight="700" fill="${saveColor}" text-anchor="middle">${isSaving ? '+' : '-'}₹${Math.round(absSaving/1000)}k</text>`;
    svg += `<text x="${x3}" y="${height - (isMobile ? 14 : 16)}" font-size="${isMobile ? 9.5 : 11}" font-weight="600" fill="${saveColor}" text-anchor="middle">${isSaving ? 'Saving' : 'Extra Cost'}</text>`;
    svg += `<text x="${x3}" y="${height - 3}" font-size="${isMobile ? 8.5 : 9.5}" fill="#64748b" text-anchor="middle">(${isSaving ? '-' : '+'}${Math.abs(res.savingPct).toFixed(0)}%)</text>`;

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  // Chart 2: 5-Year Cumulative Outflow (Responsive for Mobile)
  function renderCumulativeChart(res) {
    const container = document.getElementById('chart-payback-curve');
    if (!container) return;

    const width = container.clientWidth || 360;
    const isMobile = width < 440;
    const height = isMobile ? 200 : 220;
    const padding = {
      top: 25,
      right: isMobile ? 12 : 24,
      bottom: isMobile ? 32 : 36,
      left: isMobile ? 46 : 60
    };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const months = 60;
    const stdPts = [];
    const xlPts = [];

    let cumStd = 0;
    let cumXl = 0;

    for (let m = 0; m <= months; m++) {
      if (m === 0) {
        cumStd = state.N * state.P_std;
        cumXl = state.N * state.P_xl;
      } else {
        if (m % state.L_std === 0) cumStd += res.costCycleStd;
        if (m % state.L_xl === 0) cumXl += res.costCycleXl;
      }
      stdPts.push({ m, val: cumStd });
      xlPts.push({ m, val: cumXl });
    }

    const maxVal = Math.max(stdPts[months].val, xlPts[months].val) * 1.15;
    const xScale = m => padding.left + (m / months) * chartW;
    const yScale = val => padding.top + chartH - (val / maxVal) * chartH;

    let svg = `<svg class="svg-chart" viewBox="0 0 ${width} ${height}">`;

    for (let i = 0; i <= 4; i++) {
      const v = (maxVal / 4) * i;
      const y = yScale(v);
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3 3"/>`;
      svg += `<text x="${padding.left - 6}" y="${y + 4}" font-size="${isMobile ? 9 : 10}" fill="#64748b" text-anchor="end">₹${Math.round(v/1000)}k</text>`;
    }

    for (let yr = 0; yr <= 5; yr++) {
      const m = yr * 12;
      const x = xScale(m);
      svg += `<line x1="${x}" y1="${padding.top + chartH}" x2="${x}" y2="${padding.top + chartH + 4}" stroke="#cbd5e1"/>`;
      svg += `<text x="${x}" y="${padding.top + chartH + (isMobile ? 14 : 16)}" font-size="${isMobile ? 9 : 10}" fill="#64748b" text-anchor="middle">Y${yr}</text>`;
    }

    // Standard LAB Line (#475569)
    let dStd = `M ${xScale(0)} ${yScale(stdPts[0].val)}`;
    for (let i = 1; i < stdPts.length; i++) {
      dStd += ` L ${xScale(stdPts[i].m)} ${yScale(stdPts[i-1].val)} L ${xScale(stdPts[i].m)} ${yScale(stdPts[i].val)}`;
    }
    svg += `<path d="${dStd}" fill="none" stroke="#475569" stroke-width="2" stroke-linejoin="round"/>`;

    // XL-Series Line (#0284c7)
    let dXl = `M ${xScale(0)} ${yScale(xlPts[0].val)}`;
    for (let i = 1; i < xlPts.length; i++) {
      dXl += ` L ${xScale(xlPts[i].m)} ${yScale(xlPts[i-1].val)} L ${xScale(xlPts[i].m)} ${yScale(xlPts[i].val)}`;
    }
    svg += `<path d="${dXl}" fill="none" stroke="#0284c7" stroke-width="2" stroke-linejoin="round"/>`;

    // Break-even Marker (#d97706)
    if (res.paybackMonths && res.paybackMonths <= months) {
      const pbX = xScale(res.paybackMonths);
      const pbY = yScale(res.initialCapexStdTower + (res.paybackMonths/12)*res.tcoStdTower);
      svg += `<line x1="${pbX}" y1="${padding.top}" x2="${pbX}" y2="${padding.top + chartH}" stroke="#d97706" stroke-width="1.5" stroke-dasharray="4 3"/>`;
      svg += `<circle cx="${pbX}" cy="${pbY}" r="4" fill="#d97706" stroke="#ffffff" stroke-width="1.5"/>`;
      svg += `<text x="${Math.min(pbX + 4, width - (isMobile ? 70 : 85))}" y="${pbY - 6}" font-size="${isMobile ? 8.5 : 9.5}" font-weight="700" fill="#b45309">Break-even: ${res.paybackMonths.toFixed(1)}m</text>`;
    }

    const endDiff = stdPts[months].val - xlPts[months].val;
    const endX = xScale(months);
    const endY = (yScale(stdPts[months].val) + yScale(xlPts[months].val)) / 2;
    if (endDiff > 0) {
      svg += `<text x="${endX - 4}" y="${endY}" font-size="${isMobile ? 8.5 : 9.5}" font-weight="700" fill="#059669" text-anchor="end">5-Yr: +${formatINR(endDiff)}</text>`;
    }

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  // Chart 3: Crossover Curve (Responsive for Mobile)
  function renderCrossoverChart(res) {
    const container = document.getElementById('chart-crossover-curve');
    if (!container) return;

    const width = container.clientWidth || 360;
    const isMobile = width < 440;
    const height = isMobile ? 190 : 210;
    const padding = {
      top: 25,
      right: isMobile ? 12 : 24,
      bottom: isMobile ? 32 : 36,
      left: isMobile ? 46 : 60
    };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const minLife = 18;
    const maxLife = 60;
    const pts = [];

    let minTco = res.tcoStdTower;
    let maxTco = res.tcoStdTower;

    for (let l = minLife; l <= maxLife; l += 1) {
      const freq = 12 / l;
      const tco = freq * res.costCycleXl;
      pts.push({ l, tco });
      if (tco > maxTco) maxTco = tco;
      if (tco < minTco) minTco = tco;
    }

    const yMax = Math.max(maxTco, res.tcoStdTower * 1.35);
    const yMin = Math.min(minTco, res.tcoStdTower * 0.5);

    const xScale = l => padding.left + ((l - minLife) / (maxLife - minLife)) * chartW;
    const yScale = val => padding.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH;

    let svg = `<svg class="svg-chart" viewBox="0 0 ${width} ${height}">`;

    const beLife = res.breakEvenXlLife;
    if (beLife >= minLife && beLife <= maxLife) {
      const beX = xScale(beLife);
      svg += `<rect x="${padding.left}" y="${padding.top}" width="${beX - padding.left}" height="${chartH}" fill="#fee2e2" opacity="0.3"/>`;
      svg += `<rect x="${beX}" y="${padding.top}" width="${padding.left + chartW - beX}" height="${chartH}" fill="#d1fae5" opacity="0.3"/>`;
    }

    for (let i = 0; i <= 4; i++) {
      const v = yMin + ((yMax - yMin) / 4) * i;
      const y = yScale(v);
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3 3"/>`;
      svg += `<text x="${padding.left - 6}" y="${y + 4}" font-size="${isMobile ? 9 : 10}" fill="#64748b" text-anchor="end">₹${Math.round(v/1000)}k</text>`;
    }

    for (let l = 20; l <= 60; l += 10) {
      const x = xScale(l);
      svg += `<line x1="${x}" y1="${padding.top + chartH}" x2="${x}" y2="${padding.top + chartH + 4}" stroke="#cbd5e1"/>`;
      svg += `<text x="${x}" y="${padding.top + chartH + (isMobile ? 14 : 16)}" font-size="${isMobile ? 9 : 10}" fill="#64748b" text-anchor="middle">${l}m</text>`;
    }

    const stdY = yScale(res.tcoStdTower);
    svg += `<line x1="${padding.left}" y1="${stdY}" x2="${width - padding.right}" y2="${stdY}" stroke="#475569" stroke-width="2" stroke-dasharray="4 3"/>`;
    svg += `<text x="${width - padding.right - 4}" y="${stdY - 5}" font-size="${isMobile ? 9 : 10}" font-weight="700" fill="#475569" text-anchor="end">${isMobile ? 'Std' : 'Standard LAB'}: ${formatINR(res.tcoStdTower)}</text>`;

    let dCurve = `M ${xScale(pts[0].l)} ${yScale(pts[0].tco)}`;
    for (let i = 1; i < pts.length; i++) {
      dCurve += ` L ${xScale(pts[i].l)} ${yScale(pts[i].tco)}`;
    }
    svg += `<path d="${dCurve}" fill="none" stroke="#0284c7" stroke-width="2"/>`;

    if (beLife >= minLife && beLife <= maxLife) {
      const beX = xScale(beLife);
      svg += `<circle cx="${beX}" cy="${stdY}" r="4" fill="#d97706" stroke="#ffffff" stroke-width="1.5"/>`;
      svg += `<text x="${beX}" y="${stdY + 14}" font-size="${isMobile ? 8.5 : 9.5}" font-weight="700" fill="#b45309" text-anchor="middle">Break-Even: ${beLife.toFixed(1)}m</text>`;
    }

    if (state.L_xl >= minLife && state.L_xl <= maxLife) {
      const currX = xScale(state.L_xl);
      const currY = yScale(res.tcoXlTower);
      svg += `<circle cx="${currX}" cy="${currY}" r="4.5" fill="#059669" stroke="#ffffff" stroke-width="1.5"/>`;
      svg += `<text x="${currX}" y="${currY - 8}" font-size="${isMobile ? 8.5 : 9.5}" font-weight="700" fill="#059669" text-anchor="middle">Base (${state.L_xl}m)</text>`;
    }

    svg += `</svg>`;
    container.innerHTML = svg;
  }

  // Dynamic Heatmap Grids
  function getHeatClass(saving) {
    if (saving >= 20000) return 'heat-deep-pos';
    if (saving >= 10000) return 'heat-med-pos';
    if (saving >= 2000)  return 'heat-low-pos';
    if (saving > 0)      return 'heat-sub-pos';
    if (saving === 0)    return 'heat-neutral';
    if (saving > -4000)  return 'heat-low-neg';
    if (saving > -10000) return 'heat-med-neg';
    return 'heat-deep-neg';
  }

  function renderSensitivityGrids() {
    const g1L = [24, 30, 36, 42, 48, 54, 60];
    const g1N = [4, 5, 6, 7, 8];
    const tbody1 = document.getElementById('heatmap1-body');
    if (tbody1) {
      let h1 = '';
      g1L.forEach(l => {
        h1 += `<tr><th class="axis-label">${l} months</th>`;
        g1N.forEach(n => {
          const testParams = { ...state, L_xl: l, N: n };
          const r = calculateModel(testParams);
          const heatClass = getHeatClass(r.savingTower);
          const isMarker = (l === state.L_xl && n === state.N) ? 'heat-active-marker' : '';
          h1 += `<td class="${heatClass} ${isMarker}">${formatINR(r.savingTower)}</td>`;
        });
        h1 += `</tr>`;
      });
      tbody1.innerHTML = h1;
    }

    const g2P = [15000, 16000, 17200, 18500, 20000, 22000, 25000];
    const tbody2 = document.getElementById('heatmap2-body');
    if (tbody2) {
      let h2 = '';
      g1L.forEach(l => {
        h2 += `<tr><th class="axis-label">${l} months</th>`;
        g2P.forEach(p => {
          const testParams = { ...state, L_xl: l, P_xl: p };
          const r = calculateModel(testParams);
          const heatClass = getHeatClass(r.savingTower);
          const isMarker = (l === state.L_xl && p === state.P_xl) ? 'heat-active-marker' : '';
          h2 += `<td class="${heatClass} ${isMarker}">${formatINR(r.savingTower)}</td>`;
        });
        h2 += `</tr>`;
      });
      tbody2.innerHTML = h2;
    }

    const g3StdL = [18, 20, 22, 24, 26];
    const g3XlL = [24, 30, 36, 42, 48, 54];
    const tbody3 = document.getElementById('heatmap3-body');
    if (tbody3) {
      let h3 = '';
      g3StdL.forEach(sl => {
        h3 += `<tr><th class="axis-label">${sl} months</th>`;
        g3XlL.forEach(xl => {
          const testParams = { ...state, L_std: sl, L_xl: xl };
          const r = calculateModel(testParams);
          const heatClass = getHeatClass(r.savingTower);
          const isMarker = (sl === state.L_std && xl === state.L_xl) ? 'heat-active-marker' : '';
          h3 += `<td class="${heatClass} ${isMarker}">${formatINR(r.savingTower)}</td>`;
        });
        h3 += `</tr>`;
      });
      tbody3.innerHTML = h3;
    }
  }

  // Update Scenario Outer Bounds Table
  function updateScenarioTable() {
    const pess = calculateModel(presets.pessimistic);
    const base = calculateModel(presets.base);
    const opt = calculateModel(presets.optimistic);
    const curr = calculateModel(state);

    const setCell = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setCell('scen-pess-tco-std', formatINR(pess.tcoStdTower));
    setCell('scen-base-tco-std', formatINR(base.tcoStdTower));
    setCell('scen-opt-tco-std', formatINR(opt.tcoStdTower));
    setCell('scen-curr-tco-std', formatINR(curr.tcoStdTower));

    setCell('scen-pess-tco-xl', formatINR(pess.tcoXlTower));
    setCell('scen-base-tco-xl', formatINR(base.tcoXlTower));
    setCell('scen-opt-tco-xl', formatINR(opt.tcoXlTower));
    setCell('scen-curr-tco-xl', formatINR(curr.tcoXlTower));

    setCell('scen-pess-sav-twr', formatINR(pess.savingTower));
    setCell('scen-base-sav-twr', formatINR(base.savingTower));
    setCell('scen-opt-sav-twr', formatINR(opt.savingTower));
    setCell('scen-curr-sav-twr', formatINR(curr.savingTower));

    setCell('scen-pess-sav-flt', formatCr(pess.savingFleetCr));
    setCell('scen-base-sav-flt', formatCr(base.savingFleetCr));
    setCell('scen-opt-sav-flt', formatCr(opt.savingFleetCr));
    setCell('scen-curr-sav-flt', formatCr(curr.savingFleetCr));

    setCell('scen-pess-capex', `+₹${pess.extraCapexFleetCr.toFixed(2)} Cr`);
    setCell('scen-base-capex', `+₹${base.extraCapexFleetCr.toFixed(2)} Cr`);
    setCell('scen-opt-capex', `+₹${opt.extraCapexFleetCr.toFixed(2)} Cr`);
    setCell('scen-curr-capex', `+₹${curr.extraCapexFleetCr.toFixed(2)} Cr`);

    setCell('scen-pess-be', `${pess.breakEvenXlLife.toFixed(1)} mos`);
    setCell('scen-base-be', `${base.breakEvenXlLife.toFixed(1)} mos`);
    setCell('scen-opt-be', `${opt.breakEvenXlLife.toFixed(1)} mos`);
    setCell('scen-curr-be', `${curr.breakEvenXlLife.toFixed(1)} mos`);

    setCell('scen-pess-verdict', pess.savingTower > 0 ? 'XL Cheaper' : 'Standard Cheaper');
    setCell('scen-base-verdict', base.savingTower > 0 ? 'XL Cheaper' : 'Standard Cheaper');
    setCell('scen-opt-verdict', opt.savingTower > 0 ? 'XL Cheaper' : 'Standard Cheaper');
    setCell('scen-curr-verdict', curr.savingTower > 0 ? 'XL Cheaper' : 'Standard Cheaper');
  }

  // Event Listeners
  function bindEvents() {
    const inputs = [
      { id: 'input-t', key: 'T', isInt: true },
      { id: 'input-n', key: 'N', isInt: true },
      { id: 'input-p-std', key: 'P_std', isInt: true },
      { id: 'input-p-xl', key: 'P_xl', isInt: true },
      { id: 'input-life-std', key: 'L_std', isInt: true },
      { id: 'input-life-xl', key: 'L_xl', isInt: true },
      { id: 'input-c-visit', key: 'C_visit', isInt: true },
      { id: 'input-s', key: 'S', isInt: true }
    ];

    inputs.forEach(item => {
      const slider = document.getElementById(item.id + '-range');
      const numInput = document.getElementById(item.id + '-num');

      const syncVal = val => {
        let parsed = item.isInt ? parseInt(val, 10) : parseFloat(val);
        if (isNaN(parsed)) return;
        state[item.key] = parsed;
        if (slider) slider.value = parsed;
        if (numInput) numInput.value = parsed;
        deactivatePresetButtons();
        updateUI();
      };

      if (slider) slider.addEventListener('input', e => syncVal(e.target.value));
      if (numInput) numInput.addEventListener('change', e => syncVal(e.target.value));
    });

    // Scrap Toggle
    const scrapToggle = document.getElementById('toggle-scrap');
    if (scrapToggle) {
      scrapToggle.addEventListener('change', e => {
        state.F_scrap = e.target.checked ? 1 : 0;
        deactivatePresetButtons();
        updateUI();
      });
    }

    // Preset Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pKey = btn.getAttribute('data-preset');
        if (presets[pKey]) applyPreset(pKey);
      });
    });

    // Reset Button
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => applyPreset('base'));
    }

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const content = document.getElementById(targetId);
        if (content) content.classList.add('active');

        // Hide presets bar when viewing assumptions tab
        const presetBar = document.getElementById('preset-bar');
        if (presetBar) {
          presetBar.style.display = (targetId === 'tab-assumptions') ? 'none' : 'block';
        }

        setTimeout(updateUI, 50);
      });
    });

    // CSV Download
    const csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', exportCSV);
    }

    // Print
    const printBtn = document.getElementById('btn-print');
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    // Resize
    window.addEventListener('resize', () => {
      const res = calculateModel(state);
      renderBarChart(res);
      renderCumulativeChart(res);
      renderCrossoverChart(res);
    });
  }

  function deactivatePresetButtons() {
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  }

  function applyPreset(pKey) {
    const p = presets[pKey];
    if (!p) return;
    Object.assign(state, p);

    const syncPair = (id, val) => {
      const s = document.getElementById(id + '-range');
      const n = document.getElementById(id + '-num');
      if (s) s.value = val;
      if (n) n.value = val;
    };

    syncPair('input-t', state.T);
    syncPair('input-n', state.N);
    syncPair('input-p-std', state.P_std);
    syncPair('input-p-xl', state.P_xl);
    syncPair('input-life-std', state.L_std);
    syncPair('input-life-xl', state.L_xl);
    syncPair('input-c-visit', state.C_visit);
    syncPair('input-s', state.S);

    const scrapToggle = document.getElementById('toggle-scrap');
    if (scrapToggle) scrapToggle.checked = state.F_scrap === 1;

    document.querySelectorAll('.preset-btn').forEach(b => {
      if (b.getAttribute('data-preset') === pKey) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    updateUI();
  }

  function exportCSV() {
    const res = calculateModel(state);
    let csv = 'CHAI Telecom Tower Battery TCO Model - Export\n';
    csv += `Date,${new Date().toISOString().split('T')[0]}\n`;
    csv += `Towers in Scope,${state.T}\n\n`;

    csv += 'Assumption,Value,Unit\n';
    csv += `Batteries per Tower (N),${state.N},units\n`;
    csv += `Standard LAB Unit Price,${state.P_std},INR\n`;
    csv += `XL-Series Unit Price,${state.P_xl},INR\n`;
    csv += `Standard Battery Lifespan,${state.L_std},months\n`;
    csv += `XL-Series Battery Lifespan,${state.L_xl},months\n`;
    csv += `Replacement Visit Cost,${state.C_visit},INR\n`;
    csv += `Scrap Value per Battery,${state.S},INR\n`;
    csv += `Include Scrap Credit,${state.F_scrap === 1 ? 'Yes' : 'No'},flag\n\n`;

    csv += 'Financial Outputs,Standard LAB,XL-Series,Delta\n';
    csv += `Cost per Replacement Cycle (INR),${res.costCycleStd},${res.costCycleXl},${res.costCycleXl - res.costCycleStd}\n`;
    csv += `Replacement Cycles per Year,${res.freqStd.toFixed(3)},${res.freqXl.toFixed(3)},${(res.freqXl - res.freqStd).toFixed(3)}\n`;
    csv += `Annual Cost per Tower (INR),${res.tcoStdTower.toFixed(2)},${res.tcoXlTower.toFixed(2)},${res.savingTower.toFixed(2)}\n`;
    csv += `Annual Cost Fleet (INR Cr),${res.tcoStdFleetCr.toFixed(2)},${res.tcoXlFleetCr.toFixed(2)},${res.savingFleetCr.toFixed(2)}\n`;
    csv += `Year-1 Capex per Tower (INR),${res.initialCapexStdTower},${res.initialCapexXlTower},${res.extraCapexTower}\n`;
    csv += `Year-1 Extra Capex Fleet (INR Cr),-,${res.extraCapexFleetCr.toFixed(2)},-\n\n`;

    csv += 'Breakeven Analytics,Value,Unit\n';
    csv += `CAPEX Breakeven Payback Period,${res.paybackMonths ? res.paybackMonths.toFixed(1) : 'N/A'},months\n`;
    csv += `Overall Expenditure Breakeven Lifespan,${res.breakEvenXlLife.toFixed(2)},months\n`;
    csv += `Overall Expenditure Breakeven Price,${res.breakEvenXlPrice.toFixed(2)},INR\n`;
    csv += `Maximum Allowable Price Premium,${res.maxAbsorbedPremiumPct.toFixed(2)},%\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CHAI_Battery_TCO_Model_${state.T}_towers.csv`;
    link.click();
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    applyPreset('base');
  });

})();

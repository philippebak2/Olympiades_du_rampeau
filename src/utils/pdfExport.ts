import { Poule, Player, TournamentSettings } from '../types/tournament';
import { sortPoulePlayers } from './tournamentLogic';

export interface ExportPdfOptions {
  title?: string;
  roundNumber: 1 | 2 | 3;
  poules: Poule[];
  playersMap: Map<number, Player>;
  settings?: TournamentSettings;
  singlePouleId?: string;
}

/**
 * Génère et déclenche l'impression / enregistrement en PDF
 * avec mise en page soignée, format A4, surlignage vert pour qualifiés et rouge pour éliminés.
 */
export function exportPoulesToPdf({
  title = 'Olympiades du Rampeau',
  roundNumber,
  poules,
  playersMap,
  settings,
  singlePouleId,
}: ExportPdfOptions) {
  const poulesToExport = singlePouleId
    ? poules.filter((p) => p.id === singlePouleId)
    : poules;

  if (poulesToExport.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Veuillez autoriser l'ouverture des fenêtres pop-up pour générer le document PDF.");
    return;
  }

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const roundName =
    roundNumber === 1
      ? 'Tour 1 (Qualifications initiales)'
      : roundNumber === 2
      ? 'Tour 2 (Qualifications intermédiaires)'
      : 'Tour 3 (Qualifications pour les 8èmes de Finale)';

  const nextPhaseName =
    roundNumber === 1
      ? 'Tour 2'
      : roundNumber === 2
      ? 'Tour 3'
      : '8èmes de finale';

  const qualifyCountDefault =
    roundNumber === 1
      ? settings?.round1QualifiersPerPool || 5
      : roundNumber === 2
      ? settings?.round2QualifiersPerPool || 5
      : settings?.round3QualifiersPerPool || 4;

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${roundName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 16px 20px;
      font-size: 12px;
      line-height: 1.4;
    }
    .poule-card {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: 24px;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .poule-header {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .poule-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .poule-badge {
      font-size: 11px;
      background: #334155;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .table-container {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      padding: 7px 10px;
      border-bottom: 1.5px solid #cbd5e1;
    }
    td {
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11.5px;
    }
    
    /* Surlignage vert pour qualifiés */
    tr.row-qualified {
      background-color: #ecfdf5 !important;
      color: #064e3b !important;
    }
    tr.row-qualified td {
      border-bottom: 1px solid #a7f3d0;
    }
    
    /* Surlignage rouge pour éliminés */
    tr.row-eliminated {
      background-color: #fef2f2 !important;
      color: #7f1d1d !important;
    }
    tr.row-eliminated td {
      border-bottom: 1px solid #fecaca;
    }
    
    .badge-status {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .badge-qualifie {
      background: #059669;
      color: #ffffff;
    }
    .badge-elimine {
      background: #dc2626;
      color: #ffffff;
    }
    .score-cell {
      font-weight: 700;
      text-align: center;
    }
    .total-pill {
      display: inline-block;
      min-width: 24px;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 800;
      text-align: center;
      font-size: 12px;
    }
    .total-qualified {
      background: #10b981;
      color: #ffffff;
    }
    .total-eliminated {
      background: #ef4444;
      color: #ffffff;
    }
    .doc-header {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .doc-subtitle {
      font-size: 13px;
      color: #334155;
      margin-top: 3px;
      font-weight: 700;
    }
    .doc-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .footer-note {
      margin-top: 14px;
      padding: 9px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 10.5px;
      color: #475569;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#fef3c7; border:1px solid #f59e0b; padding:12px 18px; margin-bottom:18px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
    <span style="font-size:12.5px; font-weight:700; color:#92400e;">
      📄 Feuille prête à imprimer ou à enregistrer au format PDF.
    </span>
    <button onclick="window.print()" style="background:#0f172a; color:#ffffff; font-weight:700; padding:8px 16px; border:none; border-radius:6px; cursor:pointer; font-size:12px;">
      🖨️ Imprimer / Enregistrer en PDF
    </button>
  </div>

  <div class="doc-header">
    <div>
      <h1 class="doc-title">${title}</h1>
      <div class="doc-subtitle">${roundName} ${singlePouleId ? `— ${poulesToExport[0]?.name || ''}` : '— Toutes les Poules'}</div>
    </div>
    <div class="doc-meta">
      <div>Date & Heure : <strong>${currentDate}</strong></div>
      <div>Qualifiés vers ${nextPhaseName} : <strong>Top ${qualifyCountDefault} par poule</strong></div>
    </div>
  </div>

  ${poulesToExport
    .map((poule) => {
      const sorted = sortPoulePlayers(poule, playersMap);
      return `
      <div class="poule-card">
        <div class="poule-header">
          <span class="poule-title">${poule.name}</span>
          <span class="poule-badge">${sorted.length} Joueurs • Top ${poule.qualifyCount} qualifiés pour ${nextPhaseName}</span>
        </div>
        <table class="table-container">
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">Rang</th>
              <th>N° & Quilleur</th>
              <th>Équipe / Club</th>
              ${
                roundNumber === 1
                  ? `
                <th style="text-align: center; width: 65px;">Tir 1</th>
                <th style="text-align: center; width: 65px;">Tir 2</th>
              `
                  : roundNumber === 2
                  ? `
                <th style="text-align: center; width: 75px;">Cumul T1</th>
                <th style="text-align: center; width: 65px;">Tir T2</th>
              `
                  : `
                <th style="text-align: center; width: 75px;">Cumul T1+T2</th>
                <th style="text-align: center; width: 65px;">Tir T3</th>
              `
              }
              <th style="text-align: center; width: 75px;">Départage</th>
              <th style="text-align: center; width: 70px;">Total</th>
              <th style="text-align: center; width: 95px;">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${sorted
              .map((item) => {
                const player = item.player;
                const isQual = item.isQualified;
                const rowClass = isQual ? 'row-qualified' : 'row-eliminated';
                const totalPillClass = isQual ? 'total-qualified' : 'total-eliminated';
                const statusBadge = isQual
                  ? '<span class="badge-status badge-qualifie">Qualifié</span>'
                  : '<span class="badge-status badge-elimine">Éliminé</span>';

                const tie = item.scoreObj.tieBreakScore && item.scoreObj.tieBreakScore > 0 ? `+${item.scoreObj.tieBreakScore}` : '-';

                let scoreCols = '';
                if (roundNumber === 1) {
                  const t1 = item.scoreObj.tirs[0] !== undefined && item.scoreObj.tirs[0] !== null ? item.scoreObj.tirs[0] : '-';
                  const t2 = item.scoreObj.tirs[1] !== undefined && item.scoreObj.tirs[1] !== null ? item.scoreObj.tirs[1] : '-';
                  scoreCols = `
                    <td class="score-cell">${t1}</td>
                    <td class="score-cell">${t2}</td>
                  `;
                } else {
                  const prev = item.scoreObj.previousCumulativeScore ?? 0;
                  const currentThrow = item.scoreObj.tirs[0] !== undefined && item.scoreObj.tirs[0] !== null ? item.scoreObj.tirs[0] : '-';
                  scoreCols = `
                    <td class="score-cell" style="color: #475569;">${prev}</td>
                    <td class="score-cell">${currentThrow}</td>
                  `;
                }

                return `
                <tr class="${rowClass}">
                  <td style="text-align: center; font-weight: 800;">${item.rank}</td>
                  <td style="font-weight: 700;">
                    <span style="display:inline-block; min-width:22px; font-weight:800; color:#334155;">#${item.scoreObj.playerId}</span>
                    ${player ? player.name : `Joueur #${item.scoreObj.playerId}`}
                  </td>
                  <td>${player?.team || '-'}</td>
                  ${scoreCols}
                  <td class="score-cell" style="font-weight: 700; color: #b45309;">${tie}</td>
                  <td class="score-cell">
                    <span class="total-pill ${totalPillClass}">${item.totalScore}</span>
                  </td>
                  <td style="text-align: center;">${statusBadge}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
    })
    .join('')}

  <div class="footer-note">
    <span>Légende officielle : <strong style="color:#059669;">■ Ligne Verte = Qualifié vers ${nextPhaseName}</strong> &nbsp;|&nbsp; <strong style="color:#dc2626;">■ Ligne Rouge = Éliminé</strong></span>
    <span>Olympiades du Rampeau • Feuille Officielle des Poules</span>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Options pour l'export des feuilles de marque destinées aux juges de piste
 */
export interface ExportJudgesSheetOptions {
  title?: string;
  roundNumber: 1 | 2 | 3;
  poules: Poule[];
  playersMap: Map<number, Player>;
  settings?: TournamentSettings;
  singlePouleId?: string;
}

/**
 * Génère et déclenche l'impression d'une ou de toutes les feuilles de match / comptage de points
 * pour les juges de piste sur le terrain (1 page A4 par poule, optimisée pour l'écriture au stylo).
 */
export function exportJudgesScoreSheetPDF({
  title = 'Olympiades du Rampeau',
  roundNumber = 1,
  poules,
  playersMap,
  settings,
  singlePouleId,
}: ExportJudgesSheetOptions) {
  const poulesToExport = singlePouleId
    ? poules.filter((p) => p.id === singlePouleId)
    : poules;

  if (poulesToExport.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Veuillez autoriser l'ouverture des fenêtres pop-up pour générer la feuille de marque.");
    return;
  }

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const qualifyCount =
    roundNumber === 1
      ? settings?.round1QualifiersPerPool || 5
      : roundNumber === 2
      ? settings?.round2QualifiersPerPool || 5
      : settings?.round3QualifiersPerPool || 4;

  const roundLabel =
    roundNumber === 1
      ? 'TOUR 1 — QUALIFICATIONS INITIALES (2 TIRS)'
      : roundNumber === 2
      ? 'TOUR 2 — QUALIFICATIONS INTERMÉDIAIRES (1 TIR)'
      : 'TOUR 3 — QUALIFICATIONS POUR LES FINALES (1 TIR)';

  const nextPhaseLabel =
    roundNumber === 1
      ? 'le Tour 2'
      : roundNumber === 2
      ? 'le Tour 3'
      : 'les 8èmes de Finale';

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Feuille de Marque - Juge de Piste - ${title}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 10mm 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 11.5px;
    }
    .sheet-wrapper {
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 96vh;
      padding-bottom: 8px;
    }
    .sheet-wrapper:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .header-banner {
      border: 2px solid #0f172a;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 12px;
      background: #f8fafc;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .tournament-title {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-badge {
      background: #0f172a;
      color: #ffffff;
      font-size: 12px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1.3fr 1.3fr 1.4fr;
      gap: 12px;
      font-size: 11.5px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .meta-label {
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      font-size: 10px;
    }
    .meta-value-box {
      font-weight: 800;
      font-size: 13px;
      color: #0f172a;
      background: #e2e8f0;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    .rule-box {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11px;
    }
    .handwriting-line {
      display: inline-block;
      min-width: 140px;
      border-bottom: 1.5px dashed #64748b;
      margin-left: 4px;
    }
    
    /* Table styling for handwriting */
    .score-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .score-table th {
      background: #1e293b;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 6px 4px;
      border: 1px solid #0f172a;
      text-align: center;
    }
    .score-table td {
      border: 1.5px solid #64748b;
      padding: 6px 4px;
      font-size: 12px;
      vertical-align: middle;
    }
    .score-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .player-name-cell {
      font-weight: 800;
      font-size: 13px;
      color: #0f172a;
    }
    .player-club-cell {
      font-size: 11px;
      color: #334155;
      font-weight: 600;
    }
    
    .score-input-box {
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16px;
    }
    .box-grid {
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      height: 28px;
      width: 44px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
    }
    .total-box {
      border: 2px solid #0f172a;
      background: #fffbeb;
      font-weight: 900;
      font-size: 16px;
      color: #92400e;
    }
    .tie-box {
      border: 1.5px dashed #d97706;
      background: #fffbeb;
    }
    .checkbox-qualif {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10.5px;
      font-weight: 700;
      margin: 0 4px;
    }
    .square-check {
      width: 14px;
      height: 14px;
      border: 1.5px solid #0f172a;
      border-radius: 2px;
      display: inline-block;
    }
    
    /* Footer */
    .sheet-footer {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      background: #f8fafc;
      font-size: 10.5px;
      display: grid;
      grid-template-columns: 1.6fr 1fr 1fr;
      gap: 12px;
      align-items: center;
    }
    .instructions-list {
      margin: 0;
      padding-left: 14px;
      color: #334155;
      font-size: 10px;
      line-height: 1.35;
    }
    .sig-box {
      border-left: 1.5px solid #cbd5e1;
      padding-left: 12px;
      font-size: 10.5px;
    }
    
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#fef3c7; border:1px solid #f59e0b; padding:12px 18px; margin-bottom:16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
    <div>
      <div style="font-size:13px; font-weight:800; color:#92400e;">
        📋 Feuille de Marque Officielle pour les Juges de Piste (Format Paysage / Imprimable)
      </div>
      <div style="font-size:11px; color:#b45309; margin-top:2px;">
        Chaque poule est formatée pour tenir sur une seule page A4 avec une grille claire pour la saisie des points au stylo.
      </div>
    </div>
    <button onclick="window.print()" style="background:#0f172a; color:#ffffff; font-weight:700; padding:8px 18px; border:none; border-radius:6px; cursor:pointer; font-size:12px;">
      🖨️ Imprimer la / les feuille(s)
    </button>
  </div>

  ${poulesToExport
    .map((poule, pIndex) => {
      const playersInPoule = poule.playerScores.map((ps) => {
        const player = playersMap.get(ps.playerId);
        return {
          scoreObj: ps,
          player,
        };
      });

      return `
      <div class="sheet-wrapper">
        <div>
          <!-- Header Banner -->
          <div class="header-banner">
            <div class="header-top">
              <div>
                <span class="tournament-title">${title}</span>
                <span style="font-size:12px; font-weight:700; color:#475569; margin-left:8px;">• ${roundLabel}</span>
              </div>
              <div class="doc-badge">FEUILLE DE MARQUE — JUGE DE PISTE</div>
            </div>
            
            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Poule :</span>
                <span class="meta-value-box">${poule.name}</span>
                <span style="font-size:11px; font-weight:700; color:#475569; margin-left:6px;">(${playersInPoule.length} Joueurs)</span>
              </div>

              <div class="meta-item">
                <span class="meta-label">Piste N° :</span>
                <span class="meta-value-box">Piste ${pIndex + 1}</span>
                <span style="font-size:11px; font-weight:600; color:#475569; margin-left:6px;">Date : ${currentDate}</span>
              </div>

              <div class="meta-item">
                <span class="rule-box">🎯 Objectif : Top ${poule.qualifyCount} qualifiés pour ${nextPhaseLabel}</span>
              </div>
            </div>

            <div style="margin-top: 8px; display:flex; justify-content:space-between; font-size:11px;">
              <div>
                <span style="font-weight:700; color:#334155;">Juge / Arbitre de Piste :</span>
                <span class="handwriting-line" style="min-width: 220px;"></span>
              </div>
              <div>
                <span style="font-weight:700; color:#334155;">Heure début des tirs :</span>
                <span class="handwriting-line" style="min-width: 80px;"></span>
              </div>
            </div>
          </div>

          <!-- Table de pointage pour l'arbitre -->
          <table class="score-table">
            <thead>
              <tr>
                <th style="width: 35px;">Ordre</th>
                <th style="width: 50px;">Dossard</th>
                <th style="text-align: left; padding-left: 8px;">Nom & Prénom du Quilleur</th>
                <th style="text-align: left; padding-left: 8px; width: 140px;">Équipe / Club</th>
                ${
                  roundNumber === 1
                    ? `
                  <th style="width: 70px;">TIR 1<br><span style="font-size:8.5px; font-weight:normal;">(0 à 9)</span></th>
                  <th style="width: 70px;">TIR 2<br><span style="font-size:8.5px; font-weight:normal;">(0 à 9)</span></th>
                `
                    : `
                  <th style="width: 75px;">Cumul Préc.<br><span style="font-size:8.5px; font-weight:normal;">(Points)</span></th>
                  <th style="width: 75px;">Tir du Tour<br><span style="font-size:8.5px; font-weight:normal;">(0 à 9)</span></th>
                `
                }
                <th style="width: 80px;">TOTAL<br><span style="font-size:8.5px; font-weight:normal;">(Score final)</span></th>
                <th style="width: 75px;">Départage<br><span style="font-size:8.5px; font-weight:normal;">(Barrage)</span></th>
                <th style="width: 55px;">Rang<br><span style="font-size:8.5px; font-weight:normal;">(Poule)</span></th>
                <th style="width: 110px;">Qualifié ?<br><span style="font-size:8.5px; font-weight:normal;">(Top ${poule.qualifyCount})</span></th>
                <th style="width: 95px;">Émargement<br><span style="font-size:8.5px; font-weight:normal;">(Quilleur)</span></th>
              </tr>
            </thead>
            <tbody>
              ${playersInPoule
                .map((item, idx) => {
                  const p = item.player;
                  const pid = item.scoreObj.playerId;
                  const t1Val = item.scoreObj.tirs[0] !== undefined && item.scoreObj.tirs[0] !== null ? item.scoreObj.tirs[0] : '';
                  const t2Val = item.scoreObj.tirs[1] !== undefined && item.scoreObj.tirs[1] !== null ? item.scoreObj.tirs[1] : '';
                  const tieVal = item.scoreObj.tieBreakScore && item.scoreObj.tieBreakScore > 0 ? item.scoreObj.tieBreakScore : '';
                  const prevVal = item.scoreObj.previousCumulativeScore ?? 0;

                  return `
                  <tr>
                    <td style="text-align: center; font-weight: 800; font-size: 13px; color: #475569;">${idx + 1}</td>
                    <td style="text-align: center; font-weight: 900; font-size: 13px; color: #0f172a; background:#f1f5f9;">#${pid}</td>
                    <td class="player-name-cell" style="padding-left: 8px;">
                      ${p ? p.name : `Joueur #${pid}`}
                    </td>
                    <td class="player-club-cell" style="padding-left: 8px;">
                      ${p?.team || '-'}
                    </td>
                    ${
                      roundNumber === 1
                        ? `
                      <td style="text-align: center;">
                        <div class="box-grid">${t1Val !== '' ? t1Val : '&nbsp;'}</div>
                      </td>
                      <td style="text-align: center;">
                        <div class="box-grid">${t2Val !== '' ? t2Val : '&nbsp;'}</div>
                      </td>
                    `
                        : `
                      <td style="text-align: center; font-weight: 800; color: #475569; background:#f8fafc;">
                        ${prevVal}
                      </td>
                      <td style="text-align: center;">
                        <div class="box-grid">${t1Val !== '' ? t1Val : '&nbsp;'}</div>
                      </td>
                    `
                    }
                    <td style="text-align: center;">
                      <div class="box-grid total-box">
                        ${
                          roundNumber === 1 && t1Val !== '' && t2Val !== ''
                            ? Number(t1Val) + Number(t2Val)
                            : '&nbsp;'
                        }
                      </div>
                    </td>
                    <td style="text-align: center;">
                      <div class="box-grid tie-box">${tieVal !== '' ? `+${tieVal}` : '&nbsp;'}</div>
                    </td>
                    <td style="text-align: center; font-weight: 800; font-size: 13px;">
                      <div class="box-grid" style="width: 32px;">&nbsp;</div>
                    </td>
                    <td style="text-align: center;">
                      <span class="checkbox-qualif"><span class="square-check"></span> OUI</span>
                      <span class="checkbox-qualif"><span class="square-check"></span> NON</span>
                    </td>
                    <td style="text-align: center; font-size: 9px; color: #94a3b8;">
                      <div style="height: 24px;"></div>
                    </td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer / Consignes & Signatures -->
        <div class="sheet-footer">
          <div>
            <strong style="color: #0f172a; text-transform: uppercase; font-size: 10px;">📋 Instructions pour l'arbitre :</strong>
            <ul class="instructions-list">
              <li>Chaque quilleur réalise <strong>${roundNumber === 1 ? '2 tirs' : '1 tir'}</strong> (score max : 9 quilles par lancer).</li>
              <li>En cas d'égalité stricte sur la dernière place qualificative (<strong>${qualifyCount}e place</strong>) : <strong>1 tir de barrage</strong> dans la case "Départage".</li>
              <li>Faire émarger les quilleurs et rapporter immédiatement cette feuille à la table centrale.</li>
            </ul>
          </div>

          <div class="sig-box">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 24px;">Signature du Juge de Piste :</div>
            <div style="font-size: 9px; color: #64748b;">(Certifie l'exactitude des scores)</div>
          </div>

          <div class="sig-box">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 24px;">Contrôle Table Centrale :</div>
            <div style="font-size: 9px; color: #64748b;">Heure de remise : ___h___ | Visa : _____</div>
          </div>
        </div>
      </div>
    `;
    })
    .join('')}

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
`;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}



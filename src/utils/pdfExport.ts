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


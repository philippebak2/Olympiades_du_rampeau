import { Poule, Player } from '../types/tournament';
import { sortPoulePlayers } from './tournamentLogic';

// Helper to escape CSV cell content with semicolon separator (standard for Excel in French)
function escapeCSVCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Download utility
function downloadCSVFile(csvContent: string, filename: string) {
  // UTF-8 BOM ensures special French characters (é, è, à, etc.) display correctly in Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporte une poule individuelle au format CSV avec noms, clubs, tirs et scores
 */
export function exportSinglePouleToCSV(
  poule: Poule,
  playersMap: Map<number, Player>,
  tournamentTitle: string = 'Olympiades du rampeau'
) {
  const sorted = sortPoulePlayers(poule, playersMap);
  const isTour1 = poule.roundNumber === 1;
  const isTour2 = poule.roundNumber === 2;
  const isTour3 = poule.roundNumber === 3;

  const rows: string[][] = [];

  // En-tête métadonnées
  rows.push([tournamentTitle]);
  rows.push([`Tour ${poule.roundNumber} - ${poule.name}`]);
  rows.push([`Date d'export : ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`]);
  rows.push([`Règle : Top ${poule.qualifyCount} qualifiés pour le tour suivant`]);
  rows.push([]); // Ligne vide

  // Colonnes d'en-tête du tableau
  if (isTour1) {
    rows.push([
      'Rang',
      'N° Joueur',
      'Nom & Prénom',
      'Club / Équipe',
      'Tir 1 (/9)',
      'Tir 2 (/9)',
      'Total Tour 1 (/18)',
      'Tir de Départage',
      'Statut Qualification',
    ]);
  } else if (isTour2) {
    rows.push([
      'Rang',
      'N° Joueur',
      'Nom & Prénom',
      'Club / Équipe',
      'Cumul Tour 1',
      'Tir Tour 2 (/9)',
      'Total Cumulé (T1+T2)',
      'Tir de Départage',
      'Statut Qualification',
    ]);
  } else if (isTour3) {
    rows.push([
      'Rang',
      'N° Joueur',
      'Nom & Prénom',
      'Club / Équipe',
      'Cumul (T1+T2)',
      'Tir Tour 3 (/9)',
      'Total Général (T1+T2+T3)',
      'Tir de Départage',
      'Statut Qualification',
    ]);
  } else {
    rows.push([
      'Rang',
      'N° Joueur',
      'Nom & Prénom',
      'Club / Équipe',
      'Tirs',
      'Total',
      'Départage',
      'Statut Qualification',
    ]);
  }

  // Lignes de données des joueurs
  sorted.forEach((item) => {
    const player = item.player;
    const tirs = item.scoreObj.tirs || [];
    const t1 = tirs[0] !== undefined ? tirs[0] : '-';
    const t2 = tirs[1] !== undefined ? tirs[1] : '-';
    const prevScore = item.scoreObj.previousCumulativeScore || 0;
    const tieBreak = item.scoreObj.tieBreakScore > 0 ? item.scoreObj.tieBreakScore : '-';
    const statusText = item.isQualified ? 'QUALIFIÉ' : 'Éliminé';

    if (isTour1) {
      rows.push([
        String(item.rank),
        String(player?.id || item.scoreObj.playerId),
        player?.name || `Joueur #${item.scoreObj.playerId}`,
        player?.team || 'Individuel',
        String(t1),
        String(t2),
        String(item.totalScore),
        String(tieBreak),
        statusText,
      ]);
    } else if (isTour2) {
      rows.push([
        String(item.rank),
        String(player?.id || item.scoreObj.playerId),
        player?.name || `Joueur #${item.scoreObj.playerId}`,
        player?.team || 'Individuel',
        String(prevScore),
        String(t1),
        String(item.totalScore),
        String(tieBreak),
        statusText,
      ]);
    } else if (isTour3) {
      rows.push([
        String(item.rank),
        String(player?.id || item.scoreObj.playerId),
        player?.name || `Joueur #${item.scoreObj.playerId}`,
        player?.team || 'Individuel',
        String(prevScore),
        String(t1),
        String(item.totalScore),
        String(tieBreak),
        statusText,
      ]);
    } else {
      rows.push([
        String(item.rank),
        String(player?.id || item.scoreObj.playerId),
        player?.name || `Joueur #${item.scoreObj.playerId}`,
        player?.team || 'Individuel',
        tirs.join(' + '),
        String(item.totalScore),
        String(tieBreak),
        statusText,
      ]);
    }
  });

  const csvContent = rows
    .map((row) => row.map(escapeCSVCell).join(';'))
    .join('\r\n');

  const sanitizedPouleName = poule.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Olympiades_du_rampeau_Tour${poule.roundNumber}_${sanitizedPouleName}.csv`;
  downloadCSVFile(csvContent, filename);
}

/**
 * Exporte l'ensemble des poules d'un tour donné dans un seul fichier CSV complet
 */
export function exportAllPoulesOfRoundToCSV(
  poules: Poule[],
  roundNumber: number,
  playersMap: Map<number, Player>,
  tournamentTitle: string = 'Olympiades du rampeau'
) {
  if (!poules || poules.length === 0) return;

  const isTour1 = roundNumber === 1;
  const isTour2 = roundNumber === 2;
  const isTour3 = roundNumber === 3;

  const rows: string[][] = [];

  // En-tête général
  rows.push([tournamentTitle]);
  rows.push([`Export Récapitulatif - Tour ${roundNumber} (${poules.length} Poules)`]);
  rows.push([`Date d'export : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`]);
  rows.push([]);

  poules.forEach((poule, pIdx) => {
    const sorted = sortPoulePlayers(poule, playersMap);

    // Titre de la poule
    rows.push([`=== ${poule.name.toUpperCase()} (Top ${poule.qualifyCount} qualifiés) ===`]);

    if (isTour1) {
      rows.push([
        'Poule',
        'Rang',
        'N° Joueur',
        'Nom & Prénom',
        'Club / Équipe',
        'Tir 1 (/9)',
        'Tir 2 (/9)',
        'Total Tour 1 (/18)',
        'Départage',
        'Statut',
      ]);
    } else if (isTour2) {
      rows.push([
        'Poule',
        'Rang',
        'N° Joueur',
        'Nom & Prénom',
        'Club / Équipe',
        'Cumul T1',
        'Tir T2 (/9)',
        'Cumul Total (T1+T2)',
        'Départage',
        'Statut',
      ]);
    } else if (isTour3) {
      rows.push([
        'Poule',
        'Rang',
        'N° Joueur',
        'Nom & Prénom',
        'Club / Équipe',
        'Cumul (T1+T2)',
        'Tir T3 (/9)',
        'Cumul Général (T1+T2+T3)',
        'Départage',
        'Statut',
      ]);
    }

    sorted.forEach((item) => {
      const player = item.player;
      const tirs = item.scoreObj.tirs || [];
      const t1 = tirs[0] !== undefined ? tirs[0] : '-';
      const t2 = tirs[1] !== undefined ? tirs[1] : '-';
      const prevScore = item.scoreObj.previousCumulativeScore || 0;
      const tieBreak = item.scoreObj.tieBreakScore > 0 ? item.scoreObj.tieBreakScore : '-';
      const statusText = item.isQualified ? 'QUALIFIÉ' : 'Éliminé';

      if (isTour1) {
        rows.push([
          poule.name,
          String(item.rank),
          String(player?.id || item.scoreObj.playerId),
          player?.name || `Joueur #${item.scoreObj.playerId}`,
          player?.team || 'Individuel',
          String(t1),
          String(t2),
          String(item.totalScore),
          String(tieBreak),
          statusText,
        ]);
      } else if (isTour2) {
        rows.push([
          poule.name,
          String(item.rank),
          String(player?.id || item.scoreObj.playerId),
          player?.name || `Joueur #${item.scoreObj.playerId}`,
          player?.team || 'Individuel',
          String(prevScore),
          String(t1),
          String(item.totalScore),
          String(tieBreak),
          statusText,
        ]);
      } else if (isTour3) {
        rows.push([
          poule.name,
          String(item.rank),
          String(player?.id || item.scoreObj.playerId),
          player?.name || `Joueur #${item.scoreObj.playerId}`,
          player?.team || 'Individuel',
          String(prevScore),
          String(t1),
          String(item.totalScore),
          String(tieBreak),
          statusText,
        ]);
      }
    });

    rows.push([]); // Espacement entre poules
  });

  const csvContent = rows
    .map((row) => row.map(escapeCSVCell).join(';'))
    .join('\r\n');

  const filename = `Olympiades_du_rampeau_Tour${roundNumber}_Toutes_les_Poules.csv`;
  downloadCSVFile(csvContent, filename);
}

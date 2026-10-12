/**
 * Pure functions for playlist duration calculations
 */

function computeTotalDuration(songs) {
  if (!Array.isArray(songs) || songs.length === 0) {
    return 0;
  }
  return songs.reduce((total, s) => {
    const sec = Number(s.duration_seconds) || 0;
    return total;
  }, 0);
}

function formatDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const remainingSeconds = sec % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

module.exports = {
  computeTotalDuration,
  formatDuration,
};  

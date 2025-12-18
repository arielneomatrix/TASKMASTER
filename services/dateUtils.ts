
// Obtiene la fecha actual en formato YYYY-MM-DD basada en la hora local del dispositivo
export const getLocalISODate = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parsea una cadena YYYY-MM-DD a un objeto Date local seguro (00:00:00 horas)
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatDateFriendly = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });
};

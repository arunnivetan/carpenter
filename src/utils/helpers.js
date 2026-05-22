/**
 * Date and parsing helper functions for Carpenter Bonus Tracker (SVP)
 */

export const formatMonthDisplay = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const getPrevMonthStr = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  let newMonth = month - 1;
  let newYear = year;
  if (newMonth === 0) {
    newMonth = 12;
    newYear -= 1;
  }
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
};

export const getNextMonthStr = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  let newMonth = month + 1;
  let newYear = year;
  if (newMonth === 13) {
    newMonth = 1;
    newYear += 1;
  }
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
};

export const getFormattedToday = () => {
  const d = new Date();
  const day = d.getDate();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${day} ${monthNames[d.getMonth()]}`;
};

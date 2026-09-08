export const formatMinorMoney = (minorUnits: number): string => {
  if (!Number.isSafeInteger(minorUnits) || minorUnits < 0) {
    throw new RangeError('Money must be a non-negative integer in minor units.');
  }

  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(minorUnits / 100);
};

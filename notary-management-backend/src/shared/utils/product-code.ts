export const generateProductCodeCandidate = (): string => {
  const randomValue = Math.floor(Math.random() * 10000);
  return randomValue.toString().padStart(4, '0');
};

export function calculateAge(dateString) {
  // Se a data não for válida, retorna null
  if (!dateString) return null;

  const birthDate = new Date(dateString);
  const today = new Date();
  
  // Calcula a diferença inicial em anos
  let age = today.getFullYear() - birthDate.getFullYear();
  
  // Verifica se o aniversário deste ano já passou
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    // Se não passou, subtrai 1 da idade
    age--;
  }
  
  return age;
}
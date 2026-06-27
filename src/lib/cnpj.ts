export function formatarCnpj(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 14)
  return digitos
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function validarCnpj(cnpjFormatado: string): boolean {
  const cnpj = cnpjFormatado.replace(/\D/g, '')

  if (cnpj.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  function calcularDigito(base: string, pesos: number[]): number {
    const soma = base
      .split('')
      .reduce((acc, num, i) => acc + parseInt(num) * pesos[i], 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const digito1 = calcularDigito(cnpj.slice(0, 12), pesos1)
  const digito2 = calcularDigito(cnpj.slice(0, 12) + digito1, pesos2)

  return cnpj === cnpj.slice(0, 12) + digito1 + digito2
}

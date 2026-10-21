import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAge } from '../utils/date.js';

describe('Testes de Unidade - date.js', () => {

  describe('calculateAge(dateString)', () => {
    it('deve retornar null para datas nulas, vazias ou indefinidas', () => {
      assert.equal(calculateAge(null), null);
      assert.equal(calculateAge(''), null);
      assert.equal(calculateAge(undefined), null);
    });

    it('deve calcular a idade exata quando o aniversário do ano já ocorreu', () => {
      const hoje = new Date();
      // Data de nascimento: 20 anos atrás, mês anterior ao atual
      const mesPassado = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
      const anoNasc = hoje.getMonth() === 0 ? hoje.getFullYear() - 21 : hoje.getFullYear() - 20;
      
      const dataNasc = new Date(anoNasc, mesPassado, 15).toISOString();
      const idade = calculateAge(dataNasc);
      assert.equal(idade, 20);
    });

    it('deve subtrair 1 da idade quando o aniversário do ano corrente ainda não ocorreu', () => {
      const hoje = new Date();
      // Data de nascimento: daqui a 2 meses, 20 anos atrás
      const proximoMes = (hoje.getMonth() + 2) % 12;
      const anoNasc = proximoMes < hoje.getMonth() ? hoje.getFullYear() - 19 : hoje.getFullYear() - 20;
      
      const dataNasc = new Date(anoNasc, proximoMes, 28).toISOString();
      const idade = calculateAge(dataNasc);
      assert.equal(idade, 19);
    });

    it('deve calcular corretamente se hoje for exatamente o dia do aniversário', () => {
      const hoje = new Date();
      const dataNasc = new Date(hoje.getFullYear() - 25, hoje.getMonth(), hoje.getDate()).toISOString();
      const idade = calculateAge(dataNasc);
      assert.equal(idade, 25);
    });
  });

});

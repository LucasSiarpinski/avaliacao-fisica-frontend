import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  maskCPF,
  maskPhone,
  unmask,
  validateCPF,
  validatePhone,
} from '../utils/masks.js';

describe('Testes de Unidade - masks.js', () => {

  describe('1. unmask(value)', () => {
    it('deve remover todos os caracteres não numéricos', () => {
      assert.equal(unmask('123.456.789-01'), '12345678901');
      assert.equal(unmask('(49) 99123-4567'), '49991234567');
      assert.equal(unmask('abc-123_xyz'), '123');
      assert.equal(unmask(''), '');
      assert.equal(unmask(null), '');
    });
  });

  describe('2. maskCPF(value)', () => {
    it('deve formatar CPF progressivamente e limitar a 11 dígitos', () => {
      assert.equal(maskCPF('123'), '123');
      assert.equal(maskCPF('1234'), '123.4');
      assert.equal(maskCPF('123456'), '123.456');
      assert.equal(maskCPF('1234567'), '123.456.7');
      assert.equal(maskCPF('123456789'), '123.456.789');
      assert.equal(maskCPF('12345678901'), '123.456.789-01');
      // Não deve passar de 11 dígitos
      assert.equal(maskCPF('123456789019999'), '123.456.789-01');
      assert.equal(maskCPF(''), '');
      assert.equal(maskCPF(null), '');
    });
  });

  describe('3. maskPhone(value)', () => {
    it('deve formatar telefone fixo (10 dígitos) com DDD', () => {
      assert.equal(maskPhone('4935661234'), '(49) 3566-1234');
    });

    it('deve formatar telefone celular (11 dígitos) com nono dígito', () => {
      assert.equal(maskPhone('49991234567'), '(49) 99123-4567');
    });

    it('deve formatar progressivamente durante digitação', () => {
      assert.equal(maskPhone('4'), '(4');
      assert.equal(maskPhone('49'), '(49');
      assert.equal(maskPhone('499'), '(49) 9');
      assert.equal(maskPhone(''), '');
      assert.equal(maskPhone(null), '');
    });
  });

  describe('4. validateCPF(cpf)', () => {
    it('deve rejeitar CPFs com comprimento diferente de 11 dígitos', () => {
      assert.equal(validateCPF('123.456'), false);
      assert.equal(validateCPF(''), false);
      assert.equal(validateCPF(null), false);
    });

    it('deve rejeitar sequências inválidas de números repetidos', () => {
      assert.equal(validateCPF('000.000.000-00'), false);
      assert.equal(validateCPF('111.111.111-11'), false);
      assert.equal(validateCPF('999.999.999-99'), false);
    });

    it('deve validar CPFs matematicamente válidos (algoritmo Módulo 11)', () => {
      // Exemplos de CPFs válidos conhecidos para testes
      assert.equal(validateCPF('529.982.247-25'), true);
      assert.equal(validateCPF('52998224725'), true);
      assert.equal(validateCPF('254.434.470-92'), true);
    });

    it('deve invalidar CPFs com dígitos verificadores incorretos', () => {
      assert.equal(validateCPF('529.982.247-24'), false);
      assert.equal(validateCPF('123.456.789-00'), false);
    });
  });

  describe('5. validatePhone(phone)', () => {
    it('deve aceitar números com 10 dígitos (fixo) e 11 dígitos (móvel)', () => {
      assert.equal(validatePhone('(49) 3566-1234'), true);
      assert.equal(validatePhone('(49) 99123-4567'), true);
      assert.equal(validatePhone('49991234567'), true);
    });

    it('deve rejeitar números incompletos ou com excesso de dígitos', () => {
      assert.equal(validatePhone('123456789'), false);
      assert.equal(validatePhone('4999123456789'), false);
      assert.equal(validatePhone(''), false);
      assert.equal(validatePhone(null), false);
    });
  });

});

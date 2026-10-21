import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularIMC,
  calcularRCQ,
  calcularComposicaoPollock7,
} from '../utils/calculosFisicos.js';

describe('Testes de Unidade - calculosFisicos.js', () => {

  describe('1. Função calcularIMC(peso, altura)', () => {
    it('deve retornar null se peso ou altura não forem informados ou forem zero/negativos', () => {
      assert.equal(calcularIMC(null, 1.75), null);
      assert.equal(calcularIMC(70, null), null);
      assert.equal(calcularIMC('', ''), null);
      assert.equal(calcularIMC(0, 1.75), null);
      assert.equal(calcularIMC(70, 0), null);
      assert.equal(calcularIMC(-80, 1.75), null);
      assert.equal(calcularIMC(70, -1.8), null);
      assert.equal(calcularIMC('abc', 'def'), null);
    });

    it('deve converter automaticamente altura digitada em centímetros (> 3) para metros', () => {
      const resEmMetros = calcularIMC(70, 1.75);
      const resEmCm = calcularIMC(70, 175);
      assert.deepEqual(resEmCm, resEmMetros);
      assert.equal(resEmCm.valor, 22.86);
    });

    it('deve calcular e classificar "Abaixo do peso" para IMC < 18.5', () => {
      // 50kg, 1.75m -> IMC = 50 / 3.0625 = 16.33
      const res = calcularIMC(50, 1.75);
      assert.equal(res.valor, 16.33);
      assert.equal(res.classificacao, 'Abaixo do peso');
      assert.equal(res.cor, '#ed8936');
    });

    it('deve calcular e classificar "Peso normal" para 18.5 <= IMC < 25', () => {
      // 70kg, 1.75m -> IMC = 22.86
      const res = calcularIMC(70, 1.75);
      assert.equal(res.valor, 22.86);
      assert.equal(res.classificacao, 'Peso normal');
      assert.equal(res.cor, '#48bb78');
    });

    it('deve calcular e classificar "Sobrepeso" para 25.0 <= IMC < 30', () => {
      // 85kg, 1.75m -> IMC = 27.76
      const res = calcularIMC(85, 1.75);
      assert.equal(res.valor, 27.76);
      assert.equal(res.classificacao, 'Sobrepeso');
      assert.equal(res.cor, '#ecc94b');
    });

    it('deve calcular e classificar "Obesidade Grau I" para 30.0 <= IMC < 35', () => {
      // 98kg, 1.75m -> IMC = 32.00
      const res = calcularIMC(98, 1.75);
      assert.equal(res.valor, 32.0);
      assert.equal(res.classificacao, 'Obesidade Grau I');
      assert.equal(res.cor, '#ed8936');
    });

    it('deve calcular e classificar "Obesidade Grau II" para 35.0 <= IMC < 40', () => {
      // 115kg, 1.75m -> IMC = 37.55
      const res = calcularIMC(115, 1.75);
      assert.equal(res.valor, 37.55);
      assert.equal(res.classificacao, 'Obesidade Grau II');
      assert.equal(res.cor, '#e53e3e');
    });

    it('deve calcular e classificar "Obesidade Grau III (Mórbida)" para IMC >= 40', () => {
      // 130kg, 1.75m -> IMC = 42.45
      const res = calcularIMC(130, 1.75);
      assert.equal(res.valor, 42.45);
      assert.equal(res.classificacao, 'Obesidade Grau III (Mórbida)');
      assert.equal(res.cor, '#9b2c2c');
    });
  });

  describe('2. Função calcularRCQ(cintura, quadril, genero)', () => {
    it('deve retornar null para medidas nulas, zeradas, negativas ou inválidas', () => {
      assert.equal(calcularRCQ(null, 100), null);
      assert.equal(calcularRCQ(80, null), null);
      assert.equal(calcularRCQ(0, 100), null);
      assert.equal(calcularRCQ(80, 0), null);
      assert.equal(calcularRCQ(-80, 100), null);
      assert.equal(calcularRCQ('inv', 100), null);
    });

    describe('Classificação de Risco Masculino', () => {
      it('deve classificar "Baixo Risco" para RCQ < 0.90 em homens', () => {
        // Cintura 80, Quadril 100 -> RCQ = 0.80
        const res = calcularRCQ(80, 100, 'M');
        assert.equal(res.valor, 0.80);
        assert.equal(res.risco, 'Baixo Risco');
      });

      it('deve classificar "Risco Moderado" para 0.90 <= RCQ < 0.95 em homens', () => {
        // Cintura 92, Quadril 100 -> RCQ = 0.92
        const res = calcularRCQ(92, 100, 'MASCULINO');
        assert.equal(res.valor, 0.92);
        assert.equal(res.risco, 'Risco Moderado');
      });

      it('deve classificar "Risco Alto" para RCQ >= 0.95 em homens', () => {
        // Cintura 98, Quadril 100 -> RCQ = 0.98
        const res = calcularRCQ(98, 100, 'M');
        assert.equal(res.valor, 0.98);
        assert.equal(res.risco, 'Risco Alto');
      });
    });

    describe('Classificação de Risco Feminino', () => {
      it('deve classificar "Baixo Risco" para RCQ < 0.80 em mulheres', () => {
        // Cintura 70, Quadril 100 -> RCQ = 0.70
        const res = calcularRCQ(70, 100, 'F');
        assert.equal(res.valor, 0.70);
        assert.equal(res.risco, 'Baixo Risco');
      });

      it('deve classificar "Risco Moderado" para 0.80 <= RCQ < 0.85 em mulheres', () => {
        // Cintura 82, Quadril 100 -> RCQ = 0.82
        const res = calcularRCQ(82, 100, 'FEMININO');
        assert.equal(res.valor, 0.82);
        assert.equal(res.risco, 'Risco Moderado');
      });

      it('deve classificar "Risco Alto" para RCQ >= 0.85 em mulheres', () => {
        // Cintura 88, Quadril 100 -> RCQ = 0.88
        const res = calcularRCQ(88, 100, 'F');
        assert.equal(res.valor, 0.88);
        assert.equal(res.risco, 'Risco Alto');
      });
    });
  });

  describe('3. Função calcularComposicaoPollock7(dobras, idade, genero, peso)', () => {
    it('deve identificar dobras faltantes e retornar completo: false', () => {
      const dobrasIncompletas = {
        dcTriceps: 12,
        dcSubescapular: 15,
        dcPeitoral: 10,
        // Faltam: dcAxilarMedia, dcSuprailiaca, dcAbdominal, dcCoxa
      };

      const res = calcularComposicaoPollock7(dobrasIncompletas, 25, 'M', 75);
      assert.equal(res.completo, false);
      assert.equal(res.percGordura, null);
      assert.equal(res.somaDobras, null);
      assert.deepEqual(res.faltantes, [
        'Axilar Média',
        'Supra-ilíaca',
        'Abdominal',
        'Coxa',
      ]);
    });

    it('deve calcular corretamente para Homens (Jackson & Pollock 1978 + Siri)', () => {
      // 7 dobras: 10, 12, 14, 16, 18, 20, 22 -> Soma = 112 mm
      // Idade: 30 anos, Peso: 80 kg
      const dobras = {
        dcTriceps: 10,
        dcSubescapular: 12,
        dcPeitoral: 14,
        dcAxilarMedia: 16,
        dcSuprailiaca: 18,
        dcAbdominal: 20,
        dcCoxa: 22,
      };

      const res = calcularComposicaoPollock7(dobras, 30, 'M', 80);

      assert.equal(res.completo, true);
      assert.equal(res.faltantes.length, 0);
      assert.equal(res.somaDobras, 112.0);

      // Verificação manual da equação de Jackson & Pollock (Homens):
      // soma = 112, soma^2 = 12544, idade = 30
      // dc = 1.112 - (0.00043499 * 112) + (0.00000055 * 12544) - (0.00028826 * 30)
      // dc = 1.112 - 0.04871888 + 0.0068992 - 0.0086478 = 1.06153252 -> 1.0615
      assert.equal(res.densidadeCorporal, 1.0615);

      // Verificação da Equação de Siri:
      // %G = ((4.95 / 1.06153252) - 4.50) * 100 = (4.66307 - 4.50) * 100 = 16.31%
      assert.equal(res.percGordura, 16.31);
      assert.equal(res.classificacaoGordura, 'Bom (Fitness)'); // 14 <= %G < 18

      // Fracionamento: 80kg * 16.31% = 13.05 kg de gordura, 66.95 kg magra
      assert.equal(res.massaGorda, 13.05);
      assert.equal(res.massaMagra, 66.95);
    });

    it('deve calcular corretamente para Mulheres (Jackson, Pollock & Ward 1980 + Siri)', () => {
      // 7 dobras: 12, 14, 10, 15, 16, 20, 24 -> Soma = 111 mm
      // Idade: 26 anos, Peso: 60 kg
      const dobras = {
        dcTriceps: 12,
        dcSubescapular: 14,
        dcPeitoral: 10,
        dcAxilarMedia: 15,
        dcSuprailiaca: 16,
        dcAbdominal: 20,
        dcCoxa: 24,
      };

      const res = calcularComposicaoPollock7(dobras, 26, 'F', 60);

      assert.equal(res.completo, true);
      assert.equal(res.somaDobras, 111.0);

      // Verificação manual da equação (Mulheres):
      // soma = 111, soma^2 = 12321, idade = 26
      // dc = 1.097 - (0.00046971 * 111) + (0.00000056 * 12321) - (0.00012828 * 26)
      // dc = 1.097 - 0.05213781 + 0.00689976 - 0.00333528 = 1.04842667 -> 1.0484
      assert.equal(res.densidadeCorporal, 1.0484);

      // Equação de Siri:
      // %G = ((4.95 / 1.04842667) - 4.50) * 100 = 22.14%
      assert.equal(res.percGordura, 22.14);
      assert.equal(res.classificacaoGordura, 'Bom (Fitness)'); // 20 <= %G < 25 para mulheres

      // Fracionamento: 60kg * 22.14% = 13.28 kg gordura, 46.72 kg magra
      assert.equal(res.massaGorda, 13.28);
      assert.equal(res.massaMagra, 46.72);
    });

    it('deve aplicar travas de segurança fisiológica no percentual de gordura (3% min, 65% max)', () => {
      // Dobras ultra baixas (atletas extremos)
      const dobrasExtremasBaixas = {
        dcTriceps: 1, dcSubescapular: 1, dcPeitoral: 1,
        dcAxilarMedia: 1, dcSuprailiaca: 1, dcAbdominal: 1, dcCoxa: 1
      };
      const resBaixo = calcularComposicaoPollock7(dobrasExtremasBaixas, 20, 'M', 70);
      assert.ok(resBaixo.percGordura >= 3, 'O percentual de gordura mínimo deve ser 3%');

      // Dobras ultra altas
      const dobrasExtremasAltas = {
        dcTriceps: 80, dcSubescapular: 80, dcPeitoral: 80,
        dcAxilarMedia: 80, dcSuprailiaca: 80, dcAbdominal: 80, dcCoxa: 80
      };
      const resAlto = calcularComposicaoPollock7(dobrasExtremasAltas, 50, 'F', 130);
      assert.ok(resAlto.percGordura <= 65, 'O percentual de gordura máximo deve ser 65%');
    });

    it('deve calcular percentual de gordura mesmo se peso corporal não estiver preenchido', () => {
      const dobras = {
        dcTriceps: 15, dcSubescapular: 15, dcPeitoral: 15,
        dcAxilarMedia: 15, dcSuprailiaca: 15, dcAbdominal: 15, dcCoxa: 15
      };
      const res = calcularComposicaoPollock7(dobras, 25, 'M', null);
      assert.equal(res.completo, true);
      assert.ok(res.percGordura > 0);
      assert.equal(res.massaGorda, null);
      assert.equal(res.massaMagra, null);
    });
  });

});

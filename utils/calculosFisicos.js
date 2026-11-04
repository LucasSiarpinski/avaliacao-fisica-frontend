/**
 * Utilitários de Cálculos da Avaliação Física
 * Protocolos: Pollock 7 Dobras, Siri, IMC e RCQ
 */

export function calcularIMC(peso, altura) {
  if (!peso || !altura) return null;
  const p = parseFloat(peso);
  let a = parseFloat(altura);
  if (isNaN(p) || isNaN(a) || p <= 0 || a <= 0) return null;

  // Se a altura foi digitada em centímetros (ex: 175), converte para metros (1.75)
  if (a > 3) a = a / 100;

  const imc = p / (a * a);
  let classificacao = "Normal";
  let cor = "#48bb78";

  if (imc < 18.5) {
    classificacao = "Abaixo do peso";
    cor = "#ed8936";
  } else if (imc < 25) {
    classificacao = "Peso normal";
    cor = "#48bb78";
  } else if (imc < 30) {
    classificacao = "Sobrepeso";
    cor = "#ecc94b";
  } else if (imc < 35) {
    classificacao = "Obesidade Grau I";
    cor = "#ed8936";
  } else if (imc < 40) {
    classificacao = "Obesidade Grau II";
    cor = "#e53e3e";
  } else {
    classificacao = "Obesidade Grau III (Mórbida)";
    cor = "#9b2c2c";
  }

  return {
    valor: parseFloat(imc.toFixed(2)),
    classificacao,
    cor,
  };
}

export function calcularRCQ(cintura, quadril, genero = "M") {
  if (!cintura || !quadril) return null;
  const c = parseFloat(cintura);
  const q = parseFloat(quadril);
  if (isNaN(c) || isNaN(q) || c <= 0 || q <= 0) return null;

  const rcq = c / q;
  const isMasc = String(genero).toUpperCase().startsWith("M");

  let risco = "Baixo";
  let cor = "#48bb78";

  if (isMasc) {
    if (rcq >= 0.95) {
      risco = "Risco Alto";
      cor = "#e53e3e";
    } else if (rcq >= 0.90) {
      risco = "Risco Moderado";
      cor = "#ecc94b";
    } else {
      risco = "Baixo Risco";
      cor = "#48bb78";
    }
  } else {
    if (rcq >= 0.85) {
      risco = "Risco Alto";
      cor = "#e53e3e";
    } else if (rcq >= 0.80) {
      risco = "Risco Moderado";
      cor = "#ecc94b";
    } else {
      risco = "Baixo Risco";
      cor = "#48bb78";
    }
  }

  return {
    valor: parseFloat(rcq.toFixed(2)),
    risco,
    cor,
  };
}

/**
 * Protocolo Jackson & Pollock (7 Dobras)
 * Dobras (mm): Tríceps, Subescapular, Peitoral, Axilar Média, Suprailíaca, Abdominal, Coxa
 */
export function calcularComposicaoPollock7(dobras, idade, genero = "M", peso) {
  const campos = [
    'dcTriceps',
    'dcSubescapular',
    'dcPeitoral',
    'dcAxilarMedia',
    'dcSuprailiaca',
    'dcAbdominal',
    'dcCoxa',
  ];

  // Identifica campos faltantes
  const faltantes = [];
  const labels = {
    dcTriceps: 'Tríceps',
    dcSubescapular: 'Subescapular',
    dcPeitoral: 'Peitoral',
    dcAxilarMedia: 'Axilar Média',
    dcSuprailiaca: 'Supra-ilíaca',
    dcAbdominal: 'Abdominal',
    dcCoxa: 'Coxa',
  };

  campos.forEach((campo) => {
    const val = parseFloat(dobras[campo]);
    if (isNaN(val) || val <= 0) {
      faltantes.push(labels[campo]);
    }
  });

  if (faltantes.length > 0) {
    return {
      completo: false,
      faltantes,
      somaDobras: null,
      percGordura: null,
      massaGorda: null,
      massaMagra: null,
    };
  }

  const soma = campos.reduce((acc, c) => acc + parseFloat(dobras[c]), 0);
  const id = parseInt(idade, 10) || 25;
  const isMasc = String(genero).toUpperCase().startsWith("M");

  let dc = 0;
  if (isMasc) {
    // Equação de Jackson & Pollock (1978) 7 dobras Homens
    dc = 1.112 - (0.00043499 * soma) + (0.00000055 * Math.pow(soma, 2)) - (0.00028826 * id);
  } else {
    // Equação de Jackson, Pollock & Ward (1980) 7 dobras Mulheres
    dc = 1.097 - (0.00046971 * soma) + (0.00000056 * Math.pow(soma, 2)) - (0.00012828 * id);
  }

  // Equação de Siri (1961) para converter Densidade Corporal em %Gordura
  let percGordura = ((4.95 / dc) - 4.50) * 100;
  if (percGordura < 3) percGordura = 3;
  if (percGordura > 65) percGordura = 65;

  const p = parseFloat(peso);
  let massaGorda = null;
  let massaMagra = null;

  if (!isNaN(p) && p > 0) {
    massaGorda = parseFloat(((p * percGordura) / 100).toFixed(2));
    massaMagra = parseFloat((p - massaGorda).toFixed(2));
  }

  let classificacaoGordura = "Média";
  if (isMasc) {
    if (percGordura < 6) classificacaoGordura = "Muito Baixo (Essencial)";
    else if (percGordura < 14) classificacaoGordura = "Excelente (Atlético)";
    else if (percGordura < 18) classificacaoGordura = "Bom (Fitness)";
    else if (percGordura < 25) classificacaoGordura = "Moderado";
    else classificacaoGordura = "Elevado";
  } else {
    if (percGordura < 12) classificacaoGordura = "Muito Baixo (Essencial)";
    else if (percGordura < 20) classificacaoGordura = "Excelente (Atlético)";
    else if (percGordura < 25) classificacaoGordura = "Bom (Fitness)";
    else if (percGordura < 32) classificacaoGordura = "Moderado";
    else classificacaoGordura = "Elevado";
  }

  return {
    completo: true,
    faltantes: [],
    somaDobras: parseFloat(soma.toFixed(1)),
    densidadeCorporal: parseFloat(dc.toFixed(4)),
    percGordura: parseFloat(percGordura.toFixed(2)),
    classificacaoGordura,
    massaGorda,
    massaMagra,
  };
}

/**
 * Avaliação e Pontuação de Testes Físicos Neuromotores
 * 1. Resistência Abdominal (repetições em 1 minuto - Pollock & Wilmore / ACSM)
 * 2. Força de Preensão Manual / Dinamometria (kgf - Mão Direita e Esquerda - ACSM)
 */
export function calcularTestesFisicos(dados, idade = 25, genero = "M") {
  const isMasc = String(genero).toUpperCase().startsWith("M");
  const id = parseInt(idade, 10) || 25;

  const repAbdominal = parseInt(dados?.resistenciaAbdominal, 10);
  const preensaoD = parseFloat(dados?.preensaoManualD);
  const preensaoE = parseFloat(dados?.preensaoManualE);

  let abdominal = null;
  if (!isNaN(repAbdominal) && repAbdominal >= 0) {
    // Pontos de corte baseados em Pollock & Wilmore / ACSM (ajustados por faixa etária e sexo)
    const ajusteIdade = id >= 50 ? -10 : id >= 40 ? -6 : id >= 30 ? -3 : 0;
    const baseExcelente = (isMasc ? 44 : 38) + ajusteIdade;
    const baseBom = (isMasc ? 38 : 32) + ajusteIdade;
    const baseMedio = (isMasc ? 31 : 25) + ajusteIdade;
    const baseRegular = (isMasc ? 24 : 18) + ajusteIdade;

    let classificacao = "Fraco";
    let cor = "#e53e3e";
    let pontuacao = 20;

    if (repAbdominal >= baseExcelente) {
      classificacao = "Excelente";
      cor = "#10b981";
      pontuacao = 100;
    } else if (repAbdominal >= baseBom) {
      classificacao = "Bom";
      cor = "#48bb78";
      pontuacao = 80;
    } else if (repAbdominal >= baseMedio) {
      classificacao = "Médio";
      cor = "#ecc94b";
      pontuacao = 60;
    } else if (repAbdominal >= baseRegular) {
      classificacao = "Abaixo da Média";
      cor = "#ed8936";
      pontuacao = 40;
    }

    abdominal = {
      repeticoes: repAbdominal,
      classificacao,
      pontuacao,
      cor,
    };
  }

  let preensao = null;
  const temD = !isNaN(preensaoD) && preensaoD > 0;
  const temE = !isNaN(preensaoE) && preensaoE > 0;

  if (temD || temE) {
    const valD = temD ? parseFloat(preensaoD.toFixed(1)) : null;
    const valE = temE ? parseFloat(preensaoE.toFixed(1)) : null;
    const maior = Math.max(valD || 0, valE || 0);
    const media =
      valD !== null && valE !== null
        ? parseFloat(((valD + valE) / 2).toFixed(1))
        : maior;
    const soma =
      valD !== null && valE !== null
        ? parseFloat((valD + valE).toFixed(1))
        : maior;

    // Referência ACSM para força de preensão manual máxima (kgf)
    const ajusteIdadeKgf = id >= 50 ? -6 : id >= 40 ? -3 : 0;
    const corteExcelente = (isMasc ? 52 : 34) + ajusteIdadeKgf;
    const corteBom = (isMasc ? 46 : 30) + ajusteIdadeKgf;
    const corteMedio = (isMasc ? 40 : 25) + ajusteIdadeKgf;
    const corteRegular = (isMasc ? 34 : 20) + ajusteIdadeKgf;

    let classificacao = "Fraco";
    let cor = "#e53e3e";
    let pontuacao = 20;

    if (maior >= corteExcelente) {
      classificacao = "Excelente";
      cor = "#10b981";
      pontuacao = 100;
    } else if (maior >= corteBom) {
      classificacao = "Bom";
      cor = "#48bb78";
      pontuacao = 80;
    } else if (maior >= corteMedio) {
      classificacao = "Médio";
      cor = "#ecc94b";
      pontuacao = 60;
    } else if (maior >= corteRegular) {
      classificacao = "Abaixo da Média";
      cor = "#ed8936";
      pontuacao = 40;
    }

    preensao = {
      direita: valD,
      esquerda: valE,
      maior,
      media,
      soma,
      classificacao,
      pontuacao,
      cor,
    };
  }

  const completo = Boolean(abdominal && preensao && temD && temE);
  const parcial = Boolean(abdominal || preensao);

  return {
    completo,
    parcial,
    resistenciaAbdominal: !isNaN(repAbdominal) && repAbdominal >= 0 ? repAbdominal : null,
    preensaoManualD: temD ? parseFloat(preensaoD.toFixed(1)) : null,
    preensaoManualE: temE ? parseFloat(preensaoE.toFixed(1)) : null,
    abdominal,
    preensao,
  };
}

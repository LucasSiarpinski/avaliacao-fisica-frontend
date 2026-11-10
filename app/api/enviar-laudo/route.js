import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

function maskCPF(cpf) {
  if (!cpf) return "Não informado";
  const digits = String(cpf).replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

function maskPhone(phone) {
  if (!phone) return "Não informado";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function calcularIdadeValida(dataNasc) {
  if (!dataNasc) return null;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  if (isNaN(idade) || idade < 5 || idade > 120) return null;
  return idade;
}

function hexToRgbPdf(hex) {
  const clean = String(hex || "#000000").replace("#", "");
  const r = (parseInt(clean.substring(0, 2), 16) || 0) / 255;
  const g = (parseInt(clean.substring(2, 4), 16) || 0) / 255;
  const b = (parseInt(clean.substring(4, 6), 16) || 0) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function pdfEscape(str) {
  const clean = String(str ?? "")
    .replace(/—|–/g, "-")
    .replace(/•/g, "\xb7")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
  let out = "";
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const ch = clean[i];
    if (ch === "(" || ch === ")" || ch === "\\") {
      out += "\\" + ch;
    } else if (code >= 32 && code <= 126) {
      out += ch;
    } else if (code >= 160 && code <= 255) {
      out += "\\" + code.toString(8).padStart(3, "0");
    } else {
      out += " ";
    }
  }
  return out;
}

function estimateTextWidth(text, fontSize, isBold = false) {
  const s = String(text ?? "");
  const avgFactor = isBold ? 0.54 : 0.5;
  return s.length * fontSize * avgFactor;
}

function wrapText(text, maxWidthPt, fontSize) {
  const words = String(text ?? "")
    .replace(/\r?\n/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return [""];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (estimateTextWidth(candidate, fontSize, false) <= maxWidthPt) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

/**
 * Gera o PDF Oficial Vetorial A4 idêntico à visualização de impressão do sistema (laudoPreviewOnScreen),
 * utilizando primitivas gráficas nativas do padrão PDF 1.4 (tabelas, cards KPI, gráfico de pizza vetorial,
 * cabeçalho institucional UNOESC e assinaturas) sem depender de arquivos externos .cjs/.afm no serverless.
 */
export function gerarPdfOficialIdenticoSistema(avaliacao, historicoAvaliacoes = []) {
  const aluno = avaliacao?.aluno || {};
  const avaliador = avaliacao?.avaliador || {};
  const res = avaliacao?.resultados || {};
  const imc = res.imc || null;
  const rcq = res.rcq || null;
  const comp = res.composicao || {};
  const tf = res.testesFisicos || {};
  const perimInf = res.perimetriaInferior || {};
  const anamComp = res.anamneseComplementar || {};

  const idade = calcularIdadeValida(aluno.dataNasc);
  const generoLabel = String(aluno.genero || "M").toUpperCase().startsWith("F")
    ? "Feminino"
    : "Masculino";
  const dataColeta = avaliacao?.dataAvaliacao
    ? new Date(avaliacao.dataAvaliacao).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");
  const anoColeta = avaliacao?.dataAvaliacao
    ? new Date(avaliacao.dataAvaliacao).getFullYear()
    : new Date().getFullYear();
  const dataEmissao = new Date().toLocaleDateString("pt-BR");

  // Separação estruturada de Doenças vs Lesões vs Objetivos
  const rawHist = avaliacao?.historicoMedico || aluno?.anamnese?.historicoMedico || "";
  let doencasTexto = rawHist;
  let lesoesTexto = avaliacao?.lesoes || anamComp.lesoes || aluno?.anamnese?.lesoes || "";
  if (rawHist.includes(" || Lesões: ")) {
    const parts = rawHist.split(" || Lesões: ");
    doencasTexto = parts[0].replace(/^Doenças:\s*/i, "").trim();
    if (!lesoesTexto) lesoesTexto = (parts[1] || "").trim();
  } else if (
    !lesoesTexto &&
    rawHist &&
    /^(cotovelo|joelho|ombro|coluna|lombar|tornozelo|punho|quadril|cervical|tendinite|bursite|entorse|fratura|cirurgia|h[eé]rnia|les[aã]o)$/i.test(
      rawHist.trim()
    )
  ) {
    lesoesTexto = `Histórico articular/muscular em ${rawHist.trim().toLowerCase()}`;
    doencasTexto = "Nenhuma patologia crônica relatada";
  }
  if (!doencasTexto) doencasTexto = "Nenhuma patologia crônica relatada";
  if (!lesoesTexto) lesoesTexto = "Nenhuma lesão ou limitação osteomioarticular relatada";

  let objetivosTexto = avaliacao?.objetivos || anamComp.objetivos || "Condicionamento físico e promoção da saúde";
  if (/^crescer$/i.test(objetivosTexto.trim())) {
    objetivosTexto = "Hipertrofia muscular (ganho de massa magra)";
  }

  // Perimetria completa (Tronco, Superiores e Inferiores)
  const cCoxaProxD = avaliacao?.circCoxaProximalD ?? perimInf.circCoxaProximalD;
  const cCoxaProxE = avaliacao?.circCoxaProximalE ?? perimInf.circCoxaProximalE;
  const cCoxaMedD = avaliacao?.circCoxaMedialD ?? perimInf.circCoxaMedialD;
  const cCoxaMedE = avaliacao?.circCoxaMedialE ?? perimInf.circCoxaMedialE;
  const cPantD = avaliacao?.circPanturrilhaD ?? perimInf.circPanturrilhaD;
  const cPantE = avaliacao?.circPanturrilhaE ?? perimInf.circPanturrilhaE;

  // PAR-Q
  const parqObj =
    avaliacao?.respostasParq && typeof avaliacao.respostasParq === "object"
      ? avaliacao.respostasParq
      : aluno?.parq && typeof aluno.parq === "object"
      ? aluno.parq
      : {
          q1: avaliacao?.parq_q1,
          q2: avaliacao?.parq_q2,
          q3: avaliacao?.parq_q3,
          q4: avaliacao?.parq_q4,
          q5: avaliacao?.parq_q5,
          q6: avaliacao?.parq_q6,
          q7: avaliacao?.parq_q7,
        };
  let respondidas = 0;
  let afirmativas = 0;
  ["q1", "q2", "q3", "q4", "q5", "q6", "q7"].forEach((k) => {
    const val = parqObj?.[k];
    if (val === "SIM" || val === "NAO" || val === true || val === false) respondidas++;
    if (val === "SIM" || val === true) afirmativas++;
  });

  const ops = [];
  const marginX = 28;
  const pageW = 595.28;
  const contentW = pageW - marginX * 2; // 539.28 pt

  const fillRect = (x, yBottom, w, h, fillHex, strokeHex = null, lineWidth = 0.6) => {
    ops.push("q");
    if (fillHex) ops.push(`${hexToRgbPdf(fillHex)} rg`);
    if (strokeHex) {
      ops.push(`${hexToRgbPdf(strokeHex)} RG`);
      ops.push(`${lineWidth} w`);
    }
    ops.push(`${x.toFixed(2)} ${yBottom.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (fillHex && strokeHex) ops.push("B");
    else if (fillHex) ops.push("f");
    else if (strokeHex) ops.push("S");
    ops.push("Q");
  };

  const drawLine = (x1, y1, x2, y2, strokeHex, lineWidth = 1) => {
    ops.push("q");
    ops.push(`${hexToRgbPdf(strokeHex)} RG`);
    ops.push(`${lineWidth} w`);
    ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
    ops.push("Q");
  };

  // Fontes: /F1 = Helvetica, /F2 = Helvetica-Bold, /F3 = Helvetica-Oblique
  const drawText = (text, x, yBaseline, size = 8, font = "F1", colorHex = "#0f172a", align = "left", maxW = 0) => {
    const str = String(text ?? "");
    const isBold = font === "F2";
    let finalX = x;
    if (align === "center" && maxW > 0) {
      const w = estimateTextWidth(str, size, isBold);
      finalX = x + Math.max(0, (maxW - w) / 2);
    } else if (align === "right" && maxW > 0) {
      const w = estimateTextWidth(str, size, isBold);
      finalX = x + Math.max(0, maxW - w);
    }
    ops.push("BT");
    ops.push(`${hexToRgbPdf(colorHex)} rg`);
    ops.push(`/${font} ${size} Tf`);
    ops.push(`1 0 0 1 ${finalX.toFixed(2)} ${yBaseline.toFixed(2)} Tm (${pdfEscape(str)}) Tj`);
    ops.push("ET");
  };

  const drawSectionHeader = (title, yTop) => {
    const barH = 11;
    const yBottom = yTop - barH;
    fillRect(marginX, yBottom, 3.2, barH, "#2e7d32", null);
    drawText(title.toUpperCase(), marginX + 8, yBottom + 2.2, 8.2, "F2", "#1b5e20");
    return yBottom - 3;
  };

  let curY = 815;

  // =========================================================================
  // CABEÇALHO INSTITUCIONAL (Idêntico ao .printHeader)
  // =========================================================================
  fillRect(marginX, curY - 22, 58, 20, "#2e7d32", null);
  drawText("UNOESC", marginX, curY - 15.5, 11, "F2", "#ffffff", "center", 58);

  drawText("Universidade do Oeste de Santa Catarina", marginX + 66, curY - 10, 10.5, "F2", "#1b5e20");
  drawText(
    "UNOESC Portal - Sistema de Avaliacao Fisica · Laboratorio de Cineantropometria",
    marginX + 66,
    curY - 20,
    7.5,
    "F1",
    "#475569"
  );

  drawText(
    `Laudo Tecnico No #${avaliacao?.id || 1}`,
    marginX + contentW - 160,
    curY - 7,
    8.5,
    "F2",
    "#2e7d32",
    "right",
    160
  );
  drawText(
    `Data da coleta: ${dataColeta}`,
    marginX + contentW - 160,
    curY - 15.5,
    7.2,
    "F1",
    "#64748b",
    "right",
    160
  );
  drawText(
    `Data de emissao: ${dataEmissao}`,
    marginX + contentW - 160,
    curY - 23.5,
    7.2,
    "F1",
    "#64748b",
    "right",
    160
  );

  curY -= 28;
  drawLine(marginX, curY, marginX + contentW, curY, "#2e7d32", 1.8);

  // BANNER DE TÍTULO CENTRAL
  curY -= 13;
  drawText("LAUDO TÉCNICO DE AVALIAÇÃO FÍSICA", marginX, curY, 10.5, "F2", "#0f172a", "center", contentW);
  curY -= 4;
  drawLine(marginX, curY, marginX + contentW, curY, "#cbd5e1", 0.7);
  curY -= 9;
  drawText("Avaliação Física e Composição Corporal", marginX, curY, 8, "F2", "#475569", "center", contentW);
  curY -= 8;

  // =========================================================================
  // 1. DADOS DE IDENTIFICAÇÃO DO AVALIADO
  // =========================================================================
  curY = drawSectionHeader("1. DADOS DE IDENTIFICAÇÃO DO AVALIADO", curY);
  const rowH = 12.5;
  const c1W = contentW * 0.2;
  const c2W = contentW * 0.43;
  const c3W = contentW * 0.17;
  const c4W = contentW * 0.2;

  const drawFourColRow = (yTop, l1, v1, l2, v2) => {
    const yb = yTop - rowH;
    fillRect(marginX, yb, c1W, rowH, "#ffffff", "#e2e8f0", 0.5);
    fillRect(marginX + c1W, yb, c2W, rowH, "#ffffff", "#e2e8f0", 0.5);
    fillRect(marginX + c1W + c2W, yb, c3W, rowH, "#ffffff", "#e2e8f0", 0.5);
    fillRect(marginX + c1W + c2W + c3W, yb, c4W, rowH, "#ffffff", "#e2e8f0", 0.5);
    drawText(l1, marginX + 5, yb + 3.5, 7.6, "F2", "#1e293b");
    drawText(v1, marginX + c1W + 5, yb + 3.5, 7.6, "F1", "#1e293b");
    drawText(l2, marginX + c1W + c2W + 5, yb + 3.5, 7.6, "F2", "#1e293b");
    drawText(v2, marginX + c1W + c2W + c3W + 5, yb + 3.5, 7.6, "F1", "#1e293b");
    return yb;
  };

  curY = drawFourColRow(curY, "Nome:", aluno.nome || "---", "Matrícula:", aluno.matricula || "---");
  curY = drawFourColRow(
    curY,
    "Idade:",
    idade ? `${idade} anos` : "Não informada",
    "Gênero / Sexo:",
    generoLabel
  );
  curY = drawFourColRow(curY, "CPF:", maskCPF(aluno.cpf), "Telefone:", maskPhone(aluno.telefone));
  {
    const yb = curY - rowH;
    fillRect(marginX, yb, c1W, rowH, "#ffffff", "#e2e8f0", 0.5);
    fillRect(marginX + c1W, yb, contentW - c1W, rowH, "#ffffff", "#e2e8f0", 0.5);
    drawText("Avaliador responsável:", marginX + 5, yb + 3.5, 7.6, "F2", "#1e293b");
    drawText(avaliador.name || "Administrador", marginX + c1W + 5, yb + 3.5, 7.6, "F1", "#1e293b");
    curY = yb;
  }
  curY -= 6;

  // =========================================================================
  // 2. TRIAGEM PREVENTIVA — QUESTIONÁRIO PAR-Q
  // =========================================================================
  curY = drawSectionHeader("2. TRIAGEM PREVENTIVA — QUESTIONÁRIO PAR-Q", curY);
  const p1W = contentW * 0.22;
  const p2W = contentW * 0.28;
  const p3W = contentW * 0.22;
  const p4W = contentW * 0.28;
  {
    const yb1 = curY - rowH;
    fillRect(marginX, yb1, p1W, rowH, "#ffffff", "#e2e8f0", 0.5);
    fillRect(marginX + p1W, yb1, p2W, rowH, "#ffffff", "#e2e8f0", 0.5);
    fillRect(marginX + p1W + p2W, yb1, p3W, rowH, "#ffffff", "#e2e8f0", 0.5);
    fillRect(marginX + p1W + p2W + p3W, yb1, p4W, rowH, "#ffffff", "#e2e8f0", 0.5);
    drawText("Status:", marginX + 5, yb1 + 3.5, 7.6, "F2", "#1e293b");
    drawText(
      respondidas > 0 ? "Questionário respondido" : "Não registrado",
      marginX + p1W + 5,
      yb1 + 3.5,
      7.6,
      "F1",
      "#1e293b"
    );
    drawText("Questões respondidas:", marginX + p1W + p2W + 5, yb1 + 3.5, 7.6, "F2", "#1e293b");
    drawText(`${respondidas} de 7`, marginX + p1W + p2W + p3W + 5, yb1 + 3.5, 7.6, "F1", "#1e293b");

    const yb2 = yb1 - rowH;
    const corParq = afirmativas > 0 ? "#b91c1c" : "#15803d";
    fillRect(marginX, yb2, p1W, rowH, "#ffffff", "#e2e8f0", 0.5);
    fillRect(marginX + p1W, yb2, p2W, rowH, "#ffffff", "#e2e8f0", 0.5);
    fillRect(marginX + p1W + p2W, yb2, p3W, rowH, "#ffffff", "#e2e8f0", 0.5);
    fillRect(marginX + p1W + p2W + p3W, yb2, p4W, rowH, "#ffffff", "#e2e8f0", 0.5);
    drawText("Respostas afirmativas:", marginX + 5, yb2 + 3.5, 7.6, "F2", "#1e293b");
    drawText(
      afirmativas === 0 ? "Nenhuma" : `${afirmativas} resposta(s) "Sim"`,
      marginX + p1W + 5,
      yb2 + 3.5,
      7.6,
      "F2",
      corParq
    );
    drawText("Resultado:", marginX + p1W + p2W + 5, yb2 + 3.5, 7.6, "F2", "#1e293b");
    drawText(
      afirmativas > 0 ? "Alerta identificado na triagem" : "Sem indicação de alerta na triagem",
      marginX + p1W + p2W + p3W + 5,
      yb2 + 3.5,
      7.4,
      "F2",
      corParq
    );
    curY = yb2;
  }
  curY -= 6;

  // =========================================================================
  // 3. ANAMNESE E HISTÓRICO DE SAÚDE (Com Objetivos e Lesões separados)
  // =========================================================================
  curY = drawSectionHeader("3. ANAMNESE E HISTÓRICO DE SAÚDE", curY);
  const aCol1 = contentW * 0.34;
  const aCol2 = contentW * 0.66;
  {
    const yh = curY - rowH;
    fillRect(marginX, yh, aCol1, rowH, "#f1f5f9", "#cbd5e1", 0.5);
    fillRect(marginX + aCol1, yh, aCol2, rowH, "#f1f5f9", "#cbd5e1", 0.5);
    drawText("Item Clínico / Anamnese", marginX + 5, yh + 3.5, 7.6, "F2", "#0f172a");
    drawText("Registro Estruturado", marginX + aCol1 + 5, yh + 3.5, 7.6, "F2", "#0f172a");
    curY = yh;

    const anamRows = [
      ["Histórico de doenças / patologias", doencasTexto],
      ["Lesões, cirurgias ou limitações físicas", lesoesTexto],
      [
        "Uso de medicamentos contínuos",
        avaliacao?.medicamentosEmUso || "Não utiliza medicamentos contínuos",
      ],
      ["Objetivos com o treinamento", objetivosTexto],
      ["Prática de exercícios e hábitos de vida", avaliacao?.habitos || "Informada no cadastro"],
    ];

    for (const [label, val] of anamRows) {
      const yr = curY - rowH;
      fillRect(marginX, yr, aCol1, rowH, "#ffffff", "#e2e8f0", 0.5);
      fillRect(marginX + aCol1, yr, aCol2, rowH, "#ffffff", "#e2e8f0", 0.5);
      drawText(label, marginX + 5, yr + 3.5, 7.5, "F2", "#1e293b");
      drawText(String(val).slice(0, 88), marginX + aCol1 + 5, yr + 3.5, 7.5, "F1", "#1e293b");
      curY = yr;
    }
  }
  curY -= 6;

  // =========================================================================
  // 4. RESUMO DA COMPOSIÇÃO CORPORAL (8 Cards KPI + Gráfico de Pizza)
  // =========================================================================
  curY = drawSectionHeader("4. RESUMO DA COMPOSIÇÃO CORPORAL", curY);
  const kpiGap = 5;
  const kpiW = (contentW - kpiGap * 3) / 4;
  const kpiH = 29;

  const kpisRow1 = [
    ["ESTATURA", avaliacao?.altura ? `${avaliacao.altura}` : "--", "Estatímetro"],
    ["MASSA CORPORAL", avaliacao?.peso ? `${avaliacao.peso} kg` : "--", "Balança Antropométrica"],
    [
      "IMC E CLASSIFICAÇÃO",
      imc ? `${imc.valor} kg/m²` : "--",
      imc?.classificacao || "Pendente",
    ],
    [
      "RELAÇÃO CINTURA-QUADRIL",
      rcq ? `${rcq.valor}` : "--",
      rcq?.risco || "Não calculado",
    ],
  ];

  const kpisRow2 = [
    [
      "PERCENTUAL DE GORDURA",
      comp.percGordura ? `${comp.percGordura}%` : "--",
      comp.classificacaoGordura || "Não calculado",
    ],
    [
      "MASSA LIVRE DE GORDURA",
      comp.massaMagra ? `${comp.massaMagra} kg` : "--",
      "Massa Magra",
    ],
    [
      "MASSA GORDA",
      comp.massaGorda ? `${comp.massaGorda} kg` : "--",
      "Tecido Adiposo",
    ],
    [
      "DENSIDADE CORPORAL",
      comp.densidadeCorporal ? `${comp.densidadeCorporal} g/cm³` : "--",
      "Equação de Siri (1961)",
    ],
  ];

  const drawKpiRow = (yTop, items) => {
    const yb = yTop - kpiH;
    items.forEach(([title, val, sub], idx) => {
      const kx = marginX + idx * (kpiW + kpiGap);
      fillRect(kx, yb, kpiW, kpiH, "#f8fafc", "#cbd5e1", 0.6);
      drawText(title, kx + 5, yb + 21, 6, "F2", "#64748b");
      drawText(val, kx + 5, yb + 10.5, 9.2, "F2", "#0f172a");
      drawText(sub, kx + 5, yb + 3, 6.5, "F2", "#2e7d32");
    });
    return yb;
  };

  curY = drawKpiRow(curY, kpisRow1);
  curY -= 4;
  curY = drawKpiRow(curY, kpisRow2);
  curY -= 4;

  // Box do Gráfico de Pizza de Composição Corporal (Massa Gorda vs Massa Livre de Gordura)
  const chartBoxH = 44;
  const chartYb = curY - chartBoxH;
  fillRect(marginX, chartYb, contentW, chartBoxH, "#f8fafc", "#cbd5e1", 0.6);

  const pesoTotal = parseFloat(avaliacao?.peso) || 0;
  const mg = parseFloat(comp.massaGorda) || 0;
  const mm = parseFloat(comp.massaMagra) || (pesoTotal > 0 ? Math.max(pesoTotal - mg, 0) : 0);
  const percFat =
    parseFloat(comp.percGordura) ||
    (pesoTotal > 0 && mg > 0 ? Number(((mg / pesoTotal) * 100).toFixed(1)) : 0);
  const percLean = percFat > 0 ? Number((100 - percFat).toFixed(1)) : 100;

  // Desenha o Gráfico de Pizza (círculo em #2e7d32 + fatia de Massa Gorda em #f59e0b)
  const pieCx = marginX + 26;
  const pieCy = chartYb + chartBoxH / 2;
  const pieR = 16.5;

  const drawPolygonCircle = (cx, cy, r, fillHex, strokeHex = null) => {
    const steps = 40;
    ops.push("q");
    ops.push(`${hexToRgbPdf(fillHex)} rg`);
    if (strokeHex) {
      ops.push(`${hexToRgbPdf(strokeHex)} RG`);
      ops.push("0.6 w");
    }
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * 2 * Math.PI;
      const px = cx + r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      ops.push(`${px.toFixed(2)} ${py.toFixed(2)} ${i === 0 ? "m" : "l"}`);
    }
    ops.push(strokeHex ? "B" : "f");
    ops.push("Q");
  };

  const drawPieSlice = (cx, cy, r, perc, fillHex) => {
    const clamped = Math.min(Math.max(perc, 1), 99);
    const steps = 24;
    const startAngle = Math.PI / 2; // Topo (90 graus em coordenadas PDF onde Y cresce para cima)
    const endAngle = startAngle - (clamped / 100) * 2 * Math.PI; // Sentido horário
    ops.push("q");
    ops.push(`${hexToRgbPdf(fillHex)} rg`);
    ops.push("1 1 1 RG 1 w");
    ops.push(`${cx.toFixed(2)} ${cy.toFixed(2)} m`);
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + (endAngle - startAngle) * (i / steps);
      const px = cx + r * Math.cos(a);
      const py = cy + r * Math.sin(a);
      ops.push(`${px.toFixed(2)} ${py.toFixed(2)} l`);
    }
    ops.push("h B");
    ops.push("Q");
  };

  drawPolygonCircle(pieCx, pieCy, pieR, "#2e7d32", "#1e293b");
  if (percFat > 0) {
    drawPieSlice(pieCx, pieCy, pieR, percFat, "#f59e0b");
  }

  // Legenda do Gráfico de Pizza
  const legX = marginX + 52;
  drawText(
    "DISTRIBUIÇÃO DA COMPOSIÇÃO CORPORAL (GRÁFICO DE PROPORÇÃO)",
    legX,
    chartYb + 32,
    7.5,
    "F2",
    "#1b5e20"
  );
  fillRect(legX, chartYb + 19, 7, 7, "#2e7d32", null);
  drawText(
    `Massa Livre de Gordura (Magra): ${mm > 0 ? `${mm.toFixed(1)} kg (${percLean}%)` : "--"}`,
    legX + 11,
    chartYb + 20,
    7.4,
    "F2",
    "#0f172a"
  );
  fillRect(legX, chartYb + 8, 7, 7, "#f59e0b", null);
  drawText(
    `Massa Gorda (Tecido Adiposo): ${mg > 0 ? `${mg.toFixed(1)} kg (${percFat}%)` : "--"}`,
    legX + 11,
    chartYb + 9,
    7.4,
    "F2",
    "#0f172a"
  );

  // Info do protocolo à direita dentro do card da Seção 4
  drawText(
    "Protocolo: Jackson & Pollock (7 dobras)",
    marginX + contentW - 185,
    chartYb + 24,
    7.2,
    "F2",
    "#334155",
    "right",
    178
  );
  drawText(
    `Equação: Siri (1961) · Densidade: ${comp.densidadeCorporal ? `${comp.densidadeCorporal} g/cm³` : "Não calculada"}`,
    marginX + contentW - 185,
    chartYb + 12,
    7.2,
    "F1",
    "#334155",
    "right",
    178
  );

  curY = chartYb - 6;

  // =========================================================================
  // 5 E 6. PERIMETRIA (COM MEMBROS INFERIORES) E DOBRAS CUTÂNEAS (2 COLUNAS)
  // =========================================================================
  const colGap = 10;
  const halfW = (contentW - colGap) / 2;
  const leftX = marginX;
  const rightX = marginX + halfW + colGap;

  // Títulos lado a lado
  fillRect(leftX, curY - 11, 3.2, 11, "#2e7d32", null);
  drawText("5. PERIMETRIA E CIRCUNFERÊNCIAS (CM)", leftX + 8, curY - 8.8, 7.8, "F2", "#1b5e20");

  fillRect(rightX, curY - 11, 3.2, 11, "#2e7d32", null);
  drawText("6. DOBRAS CUTÂNEAS (MM) — POLLOCK 7", rightX + 8, curY - 8.8, 7.8, "F2", "#1b5e20");

  const tablesTopY = curY - 14;
  const subRowH = 11.8;

  // Coluna Esquerda: Seção 5 (Perimetria Completa: Tronco, Superiores e Inferiores)
  let leftY = tablesTopY;
  {
    const yh = leftY - subRowH;
    fillRect(leftX, yh, halfW * 0.66, subRowH, "#f1f5f9", "#cbd5e1", 0.5);
    fillRect(leftX + halfW * 0.66, yh, halfW * 0.34, subRowH, "#f1f5f9", "#cbd5e1", 0.5);
    drawText("Região Corporal", leftX + 4, yh + 3.2, 7.3, "F2", "#0f172a");
    drawText("Medida (cm)", leftX + halfW * 0.66, yh + 3.2, 7.3, "F2", "#0f172a", "right", halfW * 0.34 - 4);
    leftY = yh;

    const fmtPair = (d, e) =>
      d || e ? `${d ? `${d}` : "--"} / ${e ? `${e}` : "--"} cm` : "--";

    const perimRows = [
      ["Cintura", avaliacao?.circCintura ? `${avaliacao.circCintura} cm` : "--"],
      ["Abdômen", avaliacao?.circAbdomem ? `${avaliacao.circAbdomem} cm` : "--"],
      ["Quadril", avaliacao?.circQuadril ? `${avaliacao.circQuadril} cm` : "--"],
      [
        "Braço relaxado (D / E)",
        fmtPair(avaliacao?.circBracoRelaxadoD, avaliacao?.circBracoRelaxadoE),
      ],
      ["Coxa proximal (D / E)", fmtPair(cCoxaProxD, cCoxaProxE)],
      ["Coxa medial (D / E)", fmtPair(cCoxaMedD, cCoxaMedE)],
      ["Panturrilha (D / E)", fmtPair(cPantD, cPantE)],
    ];

    for (const [reg, med] of perimRows) {
      const yr = leftY - subRowH;
      fillRect(leftX, yr, halfW * 0.66, subRowH, "#ffffff", "#e2e8f0", 0.5);
      fillRect(leftX + halfW * 0.66, yr, halfW * 0.34, subRowH, "#ffffff", "#e2e8f0", 0.5);
      drawText(reg, leftX + 4, yr + 3.2, 7.2, "F1", "#1e293b");
      drawText(med, leftX + halfW * 0.66, yr + 3.2, 7.2, "F2", "#1e293b", "right", halfW * 0.34 - 4);
      leftY = yr;
    }
  }

  // Coluna Direita: Seção 6 (Dobras Cutâneas Pollock 7)
  let rightY = tablesTopY;
  const dobrasRowH = 10.5;
  {
    const yh = rightY - dobrasRowH;
    fillRect(rightX, yh, halfW * 0.66, dobrasRowH, "#f1f5f9", "#cbd5e1", 0.5);
    fillRect(rightX + halfW * 0.66, yh, halfW * 0.34, dobrasRowH, "#f1f5f9", "#cbd5e1", 0.5);
    drawText("Dobra Cutânea", rightX + 4, yh + 2.8, 7.2, "F2", "#0f172a");
    drawText("Espessura (mm)", rightX + halfW * 0.66, yh + 2.8, 7.2, "F2", "#0f172a", "right", halfW * 0.34 - 4);
    rightY = yh;

    const dobrasRows = [
      ["Tríceps", avaliacao?.dcTriceps ? `${avaliacao.dcTriceps} mm` : "--"],
      ["Subescapular", avaliacao?.dcSubescapular ? `${avaliacao.dcSubescapular} mm` : "--"],
      ["Peitoral torácica", avaliacao?.dcPeitoral ? `${avaliacao.dcPeitoral} mm` : "--"],
      ["Axilar média", avaliacao?.dcAxilarMedia ? `${avaliacao.dcAxilarMedia} mm` : "--"],
      ["Supra-ilíaca", avaliacao?.dcSuprailiaca ? `${avaliacao.dcSuprailiaca} mm` : "--"],
      ["Abdominal", avaliacao?.dcAbdominal ? `${avaliacao.dcAbdominal} mm` : "--"],
      ["Coxa medial", avaliacao?.dcCoxa ? `${avaliacao.dcCoxa} mm` : "--"],
      [
        "Somatório das sete dobras:",
        comp.somaDobras ? `${comp.somaDobras} mm` : "--",
      ],
    ];

    dobrasRows.forEach(([nomeDobra, valDobra], idx) => {
      const isLast = idx === dobrasRows.length - 1;
      const bg = isLast ? "#f8fafc" : "#ffffff";
      const yr = rightY - dobrasRowH;
      fillRect(rightX, yr, halfW * 0.66, dobrasRowH, bg, "#e2e8f0", 0.5);
      fillRect(rightX + halfW * 0.66, yr, halfW * 0.34, dobrasRowH, bg, "#e2e8f0", 0.5);
      drawText(nomeDobra, rightX + 4, yr + 2.8, 7.1, isLast ? "F2" : "F1", "#1e293b");
      drawText(valDobra, rightX + halfW * 0.66, yr + 2.8, 7.1, "F2", "#1e293b", "right", halfW * 0.34 - 4);
      rightY = yr;
    });
  }

  curY = Math.min(leftY, rightY) - 6;

  // =========================================================================
  // 7. TESTES FÍSICOS NEUROMOTORES
  // =========================================================================
  curY = drawSectionHeader("7. TESTES FÍSICOS NEUROMOTORES", curY);
  const t1W = contentW * 0.38;
  const t2W = contentW * 0.26;
  const t3W = contentW * 0.2;
  const t4W = contentW * 0.16;
  {
    const yh = curY - rowH;
    fillRect(marginX, yh, t1W, rowH, "#f1f5f9", "#cbd5e1", 0.5);
    fillRect(marginX + t1W, yh, t2W, rowH, "#f1f5f9", "#cbd5e1", 0.5);
    fillRect(marginX + t1W + t2W, yh, t3W, rowH, "#f1f5f9", "#cbd5e1", 0.5);
    fillRect(marginX + t1W + t2W + t3W, yh, t4W, rowH, "#f1f5f9", "#cbd5e1", 0.5);
    drawText("Teste/protocolo", marginX + 5, yh + 3.5, 7.5, "F2", "#0f172a");
    drawText("Resultado obtido", marginX + t1W + 5, yh + 3.5, 7.5, "F2", "#0f172a");
    drawText("Classificação", marginX + t1W + t2W + 5, yh + 3.5, 7.5, "F2", "#0f172a");
    drawText("Pontuação", marginX + t1W + t2W + t3W, yh + 3.5, 7.5, "F2", "#0f172a", "right", t4W - 5);
    curY = yh;

    const tfRows = [
      [
        "Resistência abdominal — 1 minuto",
        tf.abdominal ? `${tf.abdominal.repeticoes} repetições` : "--",
        tf.abdominal ? tf.abdominal.classificacao : "Não avaliado",
        tf.abdominal ? `${tf.abdominal.pontuacao} pontos` : "--",
      ],
      [
        "Força de preensão manual — dinamometria",
        tf.preensao
          ? `D: ${tf.preensao.direita ?? "--"} kgf / E: ${tf.preensao.esquerda ?? "--"} kgf`
          : "--",
        tf.preensao ? tf.preensao.classificacao : "Não avaliado",
        tf.preensao ? `${tf.preensao.pontuacao} pontos` : "--",
      ],
    ];

    for (const [p, r, c, pt] of tfRows) {
      const yr = curY - rowH;
      fillRect(marginX, yr, t1W, rowH, "#ffffff", "#e2e8f0", 0.5);
      fillRect(marginX + t1W, yr, t2W, rowH, "#ffffff", "#e2e8f0", 0.5);
      fillRect(marginX + t1W + t2W, yr, t3W, rowH, "#ffffff", "#e2e8f0", 0.5);
      fillRect(marginX + t1W + t2W + t3W, yr, t4W, rowH, "#ffffff", "#e2e8f0", 0.5);
      drawText(p, marginX + 5, yr + 3.5, 7.4, "F1", "#1e293b");
      drawText(r, marginX + t1W + 5, yr + 3.5, 7.4, "F2", "#1e293b");
      drawText(c, marginX + t1W + t2W + 5, yr + 3.5, 7.4, "F1", "#1e293b");
      drawText(pt, marginX + t1W + t2W + t3W, yr + 3.5, 7.4, "F2", "#1e293b", "right", t4W - 5);
      curY = yr;
    }
  }
  curY -= 6;

  // =========================================================================
  // 8. HISTÓRICO E EVOLUÇÃO DAS AVALIAÇÕES
  // =========================================================================
  curY = drawSectionHeader("8. HISTÓRICO E EVOLUÇÃO DAS AVALIAÇÕES", curY);
  const avaliacoesConcluidas = (historicoAvaliacoes || []).filter((a) => a.peso && a.altura);
  if (avaliacoesConcluidas.length <= 1) {
    const boxH = 18;
    const yb = curY - boxH;
    fillRect(marginX, yb, contentW, boxH, "#f8fafc", "#cbd5e1", 0.5);
    drawText(
      "Este é o primeiro registro do avaliado. Ainda não existem avaliações anteriores para comparação.",
      marginX + 6,
      yb + 6,
      7.5,
      "F1",
      "#334155"
    );
    curY = yb;
  } else {
    const hW = contentW / 5;
    const yh = curY - 11.5;
    ["Data", "Massa corporal", "IMC", "Gordura corporal", "Massa livre de gordura"].forEach(
      (col, idx) => {
        fillRect(marginX + idx * hW, yh, hW, 11.5, "#f1f5f9", "#cbd5e1", 0.5);
        drawText(col, marginX + idx * hW + 4, yh + 3, 7.2, "F2", "#0f172a");
      }
    );
    curY = yh;
    avaliacoesConcluidas.slice(0, 3).forEach((item) => {
      const yr = curY - 11.5;
      const isCurrent = Number(item.id) === Number(avaliacao?.id);
      const dt = new Date(item.dataAvaliacao).toLocaleDateString("pt-BR") + (isCurrent ? " (Atual)" : "");
      const imcV = item.resultados?.imc?.valor ?? (isCurrent ? imc?.valor : "--") ?? "--";
      const fatV = item.resultados?.composicao?.percGordura
        ? `${item.resultados.composicao.percGordura}%`
        : isCurrent && comp.percGordura
        ? `${comp.percGordura}%`
        : "--";
      const leanV = item.resultados?.composicao?.massaMagra
        ? `${item.resultados.composicao.massaMagra} kg`
        : isCurrent && comp.massaMagra
        ? `${comp.massaMagra} kg`
        : "--";
      const vals = [dt, item.peso ? `${item.peso} kg` : "--", String(imcV), fatV, leanV];
      vals.forEach((v, idx) => {
        fillRect(marginX + idx * hW, yr, hW, 11.5, "#ffffff", "#e2e8f0", 0.5);
        drawText(v, marginX + idx * hW + 4, yr + 3, 7.1, idx === 0 && isCurrent ? "F2" : "F1", "#1e293b");
      });
      curY = yr;
    });
  }
  curY -= 6;

  // =========================================================================
  // 9. CONSIDERAÇÕES FINAIS E PARECER TÉCNICO DO AVALIADOR
  // =========================================================================
  curY = drawSectionHeader("9. CONSIDERAÇÕES FINAIS E PARECER TÉCNICO DO AVALIADOR", curY);
  const textoParecer =
    avaliacao?.observacoes ||
    "Os dados cineantropométricos e neuromotores foram coletados conforme os protocolos padronizados no sistema. Recomenda-se o acompanhamento periódico da composição corporal, prescrição individualizada de treinamento e realização de nova avaliação física conforme planejamento.";
  const parecerLines = wrapText(textoParecer, contentW - 14, 7.5).slice(0, 3);
  const parecerBoxH = Math.max(26, parecerLines.length * 10 + 8);
  const parecerYb = curY - parecerBoxH;
  fillRect(marginX, parecerYb, contentW, parecerBoxH, "#f8fafc", "#cbd5e1", 0.6);
  parecerLines.forEach((line, idx) => {
    drawText(line, marginX + 6, curY - 10 - idx * 9.5, 7.4, "F1", "#1e293b");
  });
  curY = parecerYb;

  // =========================================================================
  // ASSINATURAS FÍSICA OU DIGITAL E IDENTIFICAÇÃO FINAL
  // =========================================================================
  const signLineY = Math.max(44, curY - 22);
  const signBlockW = contentW * 0.44;
  const signLeftX = marginX;
  const signRightX = marginX + contentW - signBlockW;

  drawLine(signLeftX, signLineY, signLeftX + signBlockW, signLineY, "#334155", 0.8);
  drawText(
    `Avaliador(a) Responsável: ${avaliador.name || "Administrador"}`,
    signLeftX,
    signLineY - 9,
    7.6,
    "F2",
    "#0f172a",
    "center",
    signBlockW
  );
  drawText(
    avaliacao?.registroAvaliador ||
      res.registroAvaliador ||
      "Profissional de Educação Física / Avaliador - Assinatura Física ou Digital",
    signLeftX,
    signLineY - 17,
    6.6,
    "F1",
    "#64748b",
    "center",
    signBlockW
  );

  drawLine(signRightX, signLineY, signRightX + signBlockW, signLineY, "#334155", 0.8);
  drawText(
    aluno.nome || "Avaliado(a)",
    signRightX,
    signLineY - 9,
    7.6,
    "F2",
    "#0f172a",
    "center",
    signBlockW
  );
  drawText(
    `Assinatura física ou digital do(a) avaliado(a) · Código UNOESC-LAUDO-#${avaliacao?.id || 1}-${anoColeta}`,
    signRightX,
    signLineY - 17,
    6.6,
    "F1",
    "#64748b",
    "center",
    signBlockW
  );

  const streamContent = ops.join("\n");

  const objs = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n",
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>\nendobj\n",
    `7 0 obj\n<< /Length ${Buffer.byteLength(streamContent, "latin1")} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const o of objs) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += o;
  }
  const xrefPos = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      destinatario,
      assunto,
      mensagem,
      avaliacao,
      historicoAvaliacoes,
      smtpConfig,
    } = body;

    const emailDestino = (destinatario || avaliacao?.aluno?.email || "").trim();
    if (!emailDestino || !emailDestino.includes("@")) {
      return NextResponse.json(
        { error: "Informe um endereço de e-mail válido para o envio." },
        { status: 400 }
      );
    }

    const pdfBuffer = gerarPdfOficialIdenticoSistema(
      avaliacao,
      historicoAvaliacoes || []
    );

    const host = (smtpConfig?.host || process.env.SMTP_HOST || "smtp.gmail.com").trim();
    let user = (
      smtpConfig?.user ||
      process.env.SMTP_USER ||
      "lucasmiottosiarpinski@gmail.com"
    ).trim();
    if (user.endsWith("@gmail.co")) {
      user = `${user}m`;
    }
    const pass = (
      smtpConfig?.pass ||
      process.env.SMTP_PASS ||
      "mzwokcnwzlamygbf"
    ).replace(/\s+/g, "");

    const nomeAluno = (avaliacao?.aluno?.nome || "Aluno").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Laudo_Avaliacao_Fisica_${nomeAluno}_#${avaliacao?.id || 1}.pdf`;

    const dataColetaPadrao = avaliacao?.dataAvaliacao
      ? new Date(avaliacao.dataAvaliacao).toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR");

    const resumoPadrao = [
      `LAUDO TÉCNICO DE AVALIAÇÃO FÍSICA — UNOESC PORTAL`,
      `Laudo Técnico Nº #${avaliacao?.id || 1} | Data da Coleta: ${dataColetaPadrao}`,
      `Avaliado(a): ${avaliacao?.aluno?.nome || "---"} | Matrícula: ${avaliacao?.aluno?.matricula || "---"}`,
      `Avaliador(a) Responsável: ${avaliacao?.avaliador?.name || "Administrador"}`,
    ].join("\n");

    const mailOptions = {
      from: `"UNOESC Avaliação Física" <${user}>`,
      to: emailDestino,
      subject:
        assunto ||
        `Laudo Técnico de Avaliação Física — ${avaliacao?.aluno?.nome || "Aluno"} (UNOESC)`,
      text: (mensagem || "").trim() || resumoPadrao,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    // Tenta primeiro na porta 465 (SSL direto, mais rápida na Vercel) e se necessário faz fallback para 587
    let info;
    try {
      const transporter465 = nodemailer.createTransport({
        host,
        port: 465,
        secure: true,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
        auth: { user, pass },
      });
      info = await transporter465.sendMail(mailOptions);
    } catch (err465) {
      const transporter587 = nodemailer.createTransport({
        host,
        port: 587,
        secure: false,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
        auth: { user, pass },
      });
      info = await transporter587.sendMail(mailOptions);
    }

    const registroEnvio = {
      enviadoPara: emailDestino,
      remetente: user,
      anexoPdf: filename,
      messageId: info.messageId,
      assunto: mailOptions.subject,
      enviadoEm: new Date().toISOString(),
    };

    return NextResponse.json({
      message: `Laudo em PDF enviado com sucesso para ${emailDestino}!`,
      envio: registroEnvio,
    });
  } catch (error) {
    console.error("Erro na rota /api/enviar-laudo:", error);
    return NextResponse.json(
      {
        error: `Falha ao enviar o PDF por e-mail: ${error.message || "Verifique as credenciais SMTP."}`,
      },
      { status: 500 }
    );
  }
}

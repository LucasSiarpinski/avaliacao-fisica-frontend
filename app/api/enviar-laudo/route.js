import { NextResponse } from "next/server";
import { createRequire } from "module";
import PDFDocument from "pdfkit";
import "pdfkit/standard-fonts/Helvetica";
import "pdfkit/standard-fonts/HelveticaBold";
import "pdfkit/standard-fonts/HelveticaOblique";
import "pdfkit/standard-fonts/HelveticaBoldOblique";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

// Garante que o Node File Tracer (NFT) da Vercel inclua os módulos CJS das fontes padrão do PDFKit no bundle serverless (/var/task)
try {
  const req = createRequire(import.meta.url);
  req("pdfkit/standard-fonts/Helvetica");
  req("pdfkit/standard-fonts/HelveticaBold");
  req("pdfkit/standard-fonts/HelveticaOblique");
  req("pdfkit/standard-fonts/HelveticaBoldOblique");
} catch {
  // Ignorado se o ambiente resolver apenas via ESM
}

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

function gerarPdfLaudoBuffer(avaliacao, historicoAvaliacoes = []) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const aluno = avaliacao.aluno || {};
      const avaliador = avaliacao.avaliador || {};
      const res = avaliacao.resultados || {};
      const imc = res.imc || null;
      const rcq = res.rcq || null;
      const comp = res.composicao || {};
      const tf = res.testesFisicos || {};

      const idade = calcularIdadeValida(aluno.dataNasc);
      const generoLabel = String(aluno.genero || "M").toUpperCase().startsWith("F")
        ? "Feminino"
        : "Masculino";

      const dataColeta = avaliacao.dataAvaliacao
        ? new Date(avaliacao.dataAvaliacao).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR");
      const dataEmissao = new Date().toLocaleDateString("pt-BR");

      const drawSectionTitle = (title) => {
        doc.moveDown(0.5);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#1b5e20")
          .text(title.toUpperCase());
        doc
          .moveTo(40, doc.y + 2)
          .lineTo(555, doc.y + 2)
          .strokeColor("#2e7d32")
          .lineWidth(1)
          .stroke();
        doc.moveDown(0.4);
        doc.fillColor("#1e293b").font("Helvetica").fontSize(9);
      };

      // CABEÇALHO DO RELATÓRIO
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#1b5e20")
        .text("UNOESC — UNIVERSIDADE DO OESTE DE SANTA CATARINA", { align: "left" });
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#475569")
        .text("UNOESC Portal — Sistema de Avaliação Física e Cineantropometria");
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#2e7d32")
        .text(
          `Laudo Técnico Nº #${avaliacao.id}   |   Data da coleta: ${dataColeta}   |   Data de emissão: ${dataEmissao}`
        );

      doc.moveDown(0.4);
      doc
        .font("Helvetica-Bold")
        .fontSize(11.5)
        .fillColor("#0f172a")
        .text("LAUDO TÉCNICO DE AVALIAÇÃO FÍSICA", { align: "center" });
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#475569")
        .text("Avaliação Física e Composição Corporal", { align: "center" });
      doc.moveDown(0.3);

      // 1. DADOS DE IDENTIFICAÇÃO DO AVALIADO
      drawSectionTitle("1. Dados de Identificação do Avaliado");
      doc
        .font("Helvetica-Bold")
        .text("Nome: ", { continued: true })
        .font("Helvetica")
        .text(`${aluno.nome || "---"}    `, { continued: true })
        .font("Helvetica-Bold")
        .text("Matrícula: ", { continued: true })
        .font("Helvetica")
        .text(`${aluno.matricula || "---"}`);
      doc
        .font("Helvetica-Bold")
        .text("Idade: ", { continued: true })
        .font("Helvetica")
        .text(`${idade ? `${idade} anos` : "Não informada"}    `, { continued: true })
        .font("Helvetica-Bold")
        .text("Gênero: ", { continued: true })
        .font("Helvetica")
        .text(`${generoLabel}    `, { continued: true })
        .font("Helvetica-Bold")
        .text("CPF: ", { continued: true })
        .font("Helvetica")
        .text(`${maskCPF(aluno.cpf)}    `, { continued: true })
        .font("Helvetica-Bold")
        .text("Telefone: ", { continued: true })
        .font("Helvetica")
        .text(`${maskPhone(aluno.telefone)}`);
      doc
        .font("Helvetica-Bold")
        .text("Avaliador Responsável: ", { continued: true })
        .font("Helvetica")
        .text(`${avaliador.name || "Administrador"}`);

      // 2. TRIAGEM PREVENTIVA — QUESTIONÁRIO PAR-Q
      drawSectionTitle("2. Triagem Preventiva — Questionário PAR-Q");
      const parqObj =
        avaliacao.respostasParq && typeof avaliacao.respostasParq === "object"
          ? avaliacao.respostasParq
          : aluno.parq && typeof aluno.parq === "object"
          ? aluno.parq
          : null;
      const qKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"];
      let respondidas = 0;
      let afirmativas = 0;
      if (parqObj) {
        qKeys.forEach((k) => {
          const val = parqObj[k];
          if (val === "SIM" || val === "NAO" || val === true || val === false) {
            respondidas++;
          }
          if (val === "SIM" || val === true) {
            afirmativas++;
          }
        });
      }
      const statusParq =
        respondidas > 0 ? "Questionário respondido" : "Não registrado";
      const resultadoParq =
        afirmativas > 0
          ? "Alerta identificado na triagem preventiva"
          : "Sem indicação de alerta na triagem preventiva";

      doc
        .font("Helvetica-Bold")
        .text("Status: ", { continued: true })
        .font("Helvetica")
        .text(`${statusParq}   |   `, { continued: true })
        .font("Helvetica-Bold")
        .text("Questões respondidas: ", { continued: true })
        .font("Helvetica")
        .text(`${respondidas} de 7   |   `, { continued: true })
        .font("Helvetica-Bold")
        .text("Respostas afirmativas: ", { continued: true })
        .font("Helvetica")
        .text(afirmativas > 0 ? `${afirmativas} ("Sim")` : "Nenhuma");
      doc
        .font("Helvetica-Bold")
        .text("Resultado: ", { continued: true })
        .font("Helvetica")
        .text(resultadoParq);

      if (afirmativas > 0) {
        doc
          .font("Helvetica-Bold")
          .fillColor("#b91c1c")
          .text(
            "Atenção: foi identificada resposta afirmativa no PAR-Q. Recomenda-se avaliação de profissional de saúde antes da realização de atividades físicas intensas."
          )
          .fillColor("#1e293b")
          .font("Helvetica");
      }

      // 3. ANAMNESE E HISTÓRICO DE SAÚDE
      drawSectionTitle("3. Anamnese e Histórico de Saúde");
      doc
        .font("Helvetica-Bold")
        .text("Histórico de doenças: ", { continued: true })
        .font("Helvetica")
        .text(avaliacao.historicoMedico || "Não informado");
      doc
        .font("Helvetica-Bold")
        .text("Uso de medicamentos: ", { continued: true })
        .font("Helvetica")
        .text(avaliacao.medicamentosEmUso || "Não informado");
      doc
        .font("Helvetica-Bold")
        .text("Lesões, limitações ou objetivos: ", { continued: true })
        .font("Helvetica")
        .text(avaliacao.objetivos || "Não informado");
      doc
        .font("Helvetica-Bold")
        .text("Prática de exercícios e hábitos relevantes: ", { continued: true })
        .font("Helvetica")
        .text(avaliacao.habitos || "Informada no cadastro");

      // 4. RESUMO DA COMPOSIÇÃO CORPORAL
      drawSectionTitle("4. Resumo da Composição Corporal");
      doc
        .font("Helvetica-Bold")
        .text("Estatura: ", { continued: true })
        .font("Helvetica")
        .text(`${avaliacao.altura ? `${avaliacao.altura}` : "--"}   |   `, { continued: true })
        .font("Helvetica-Bold")
        .text("Massa corporal: ", { continued: true })
        .font("Helvetica")
        .text(`${avaliacao.peso ? `${avaliacao.peso} kg` : "--"}   |   `, { continued: true })
        .font("Helvetica-Bold")
        .text("IMC: ", { continued: true })
        .font("Helvetica")
        .text(`${imc ? `${imc.valor} kg/m² (${imc.classificacao})` : "--"}`);
      doc
        .font("Helvetica-Bold")
        .text("Relação cintura-quadril (RCQ): ", { continued: true })
        .font("Helvetica")
        .text(`${rcq ? `${rcq.valor} (${rcq.risco})` : "--"}   |   `, { continued: true })
        .font("Helvetica-Bold")
        .text("Percentual de gordura: ", { continued: true })
        .font("Helvetica")
        .text(
          `${comp.percGordura ? `${comp.percGordura}% (${comp.classificacaoGordura || ""})` : "--"}`
        );
      doc
        .font("Helvetica-Bold")
        .text("Massa livre de gordura: ", { continued: true })
        .font("Helvetica")
        .text(`${comp.massaMagra ? `${comp.massaMagra} kg` : "--"}   |   `, { continued: true })
        .font("Helvetica-Bold")
        .text("Massa gorda: ", { continued: true })
        .font("Helvetica")
        .text(`${comp.massaGorda ? `${comp.massaGorda} kg` : "--"}   |   `, { continued: true })
        .font("Helvetica-Bold")
        .text("Densidade corporal: ", { continued: true })
        .font("Helvetica")
        .text(`${comp.densidadeCorporal ? `${comp.densidadeCorporal} g/cm³` : "--"}`);
      doc
        .font("Helvetica-Bold")
        .text("Protocolo: ", { continued: true })
        .font("Helvetica")
        .text("Jackson & Pollock — 7 dobras cutâneas   |   ", { continued: true })
        .font("Helvetica-Bold")
        .text("Equação utilizada: ", { continued: true })
        .font("Helvetica")
        .text("Siri");

      // 5. PERIMETRIA E CIRCUNFERÊNCIAS CORPORAIS (cm)
      drawSectionTitle("5. Perimetria e Circunferências Corporais (cm)");
      doc.text(
        `Cintura: ${avaliacao.circCintura ? `${avaliacao.circCintura} cm` : "--"}   |   Abdômen: ${avaliacao.circAbdomem ? `${avaliacao.circAbdomem} cm` : "--"}   |   Quadril: ${avaliacao.circQuadril ? `${avaliacao.circQuadril} cm` : "--"}`
      );
      doc.text(
        `Braço relaxado direito: ${avaliacao.circBracoRelaxadoD ? `${avaliacao.circBracoRelaxadoD} cm` : "--"}   |   Braço relaxado esquerdo: ${avaliacao.circBracoRelaxadoE ? `${avaliacao.circBracoRelaxadoE} cm` : "--"}`
      );

      // 6. DOBRAS CUTÂNEAS (mm) — PROTOCOLO DE JACKSON & POLLOCK
      drawSectionTitle("6. Dobras Cutâneas (mm) — Protocolo de Jackson & Pollock");
      doc
        .font("Helvetica-Oblique")
        .fontSize(8.5)
        .text("Jackson & Pollock — protocolo de 7 dobras cutâneas")
        .font("Helvetica")
        .fontSize(9);
      doc.text(
        `Tríceps: ${avaliacao.dcTriceps ?? "--"} mm  |  Subescapular: ${avaliacao.dcSubescapular ?? "--"} mm  |  Peitoral torácica: ${avaliacao.dcPeitoral ?? "--"} mm  |  Axilar média: ${avaliacao.dcAxilarMedia ?? "--"} mm`
      );
      doc.text(
        `Supra-ilíaca: ${avaliacao.dcSuprailiaca ?? "--"} mm  |  Abdominal: ${avaliacao.dcAbdominal ?? "--"} mm  |  Coxa medial: ${avaliacao.dcCoxa ?? "--"} mm  |  Somatório das sete dobras: ${comp.somaDobras ? `${comp.somaDobras} mm` : "--"}`
      );

      // 7. TESTES FÍSICOS NEUROMOTORES
      drawSectionTitle("7. Testes Físicos Neuromotores");
      doc.text(
        `• Resistência abdominal — 1 minuto: ${tf.abdominal ? `${tf.abdominal.repeticoes} repetições  |  Classificação: ${tf.abdominal.classificacao}  |  Pontuação: ${tf.abdominal.pontuacao} pontos` : "Não avaliado"}`
      );
      doc.text(
        `• Força de preensão manual — dinamometria: ${tf.preensao ? `D: ${tf.preensao.direita ?? "--"} kgf / E: ${tf.preensao.esquerda ?? "--"} kgf  |  Classificação: ${tf.preensao.classificacao}  |  Pontuação: ${tf.preensao.pontuacao} pontos` : "Não avaliado"}`
      );

      // 8. HISTÓRICO E EVOLUÇÃO DAS AVALIAÇÕES
      drawSectionTitle("8. Histórico e Evolução das Avaliações");
      const avaliacoesConcluidas = (historicoAvaliacoes || []).filter(
        (a) => a.peso && a.altura
      );
      if (avaliacoesConcluidas.length <= 1) {
        doc.text(
          "Este é o primeiro registro do avaliado. Ainda não existem avaliações anteriores para comparação."
        );
      } else {
        avaliacoesConcluidas.slice(0, 5).forEach((item) => {
          const dt = new Date(item.dataAvaliacao).toLocaleDateString("pt-BR");
          const imcVal = item.resultados?.imc?.valor ?? "--";
          const fatVal = item.resultados?.composicao?.percGordura
            ? `${item.resultados.composicao.percGordura}%`
            : "--";
          const leanVal = item.resultados?.composicao?.massaMagra
            ? `${item.resultados.composicao.massaMagra} kg`
            : "--";
          doc.text(
            `Data: ${dt}   |   Massa corporal: ${item.peso} kg   |   IMC: ${imcVal}   |   Gordura corporal: ${fatVal}   |   Massa livre de gordura: ${leanVal}`
          );
        });
      }

      // 9. PARECER TÉCNICO E ORIENTAÇÕES DO AVALIADOR
      drawSectionTitle("9. Parecer Técnico e Orientações do Avaliador");
      const textoPadrao =
        "Os dados foram coletados conforme os protocolos disponíveis no sistema. Recomenda-se o acompanhamento periódico da composição corporal e a realização de nova avaliação conforme o planejamento da academia.";
      doc.text(avaliacao.observacoes || textoPadrao);
      if (afirmativas > 0) {
        doc
          .moveDown(0.2)
          .font("Helvetica-Oblique")
          .text(
            "Nota preventiva (PAR-Q): Foi registrada resposta afirmativa na triagem preventiva. Orienta-se avaliação clínica antes de exercícios de alta intensidade."
          )
          .font("Helvetica");
      }

      // ASSINATURAS E IDENTIFICAÇÃO FINAL
      doc.moveDown(1.4);
      doc
        .font("Helvetica-Bold")
        .text(`Avaliador responsável: ${avaliador.name || "Administrador"}`, {
          continued: true,
        })
        .text("          Assinatura do avaliado: ___________________________");
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#64748b")
        .text(
          `Profissional de Educação Física / Avaliador   |   Código de validação: UNOESC-LAUDO-${avaliacao.id}`
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Fallback nativo PDF 1.4 (zero dependências externas de arquivos de fonte) caso o serverless da Vercel bloqueie acesso a standard-fonts
function gerarPdfNativoFallback(avaliacao, historicoAvaliacoes = []) {
  const aluno = avaliacao?.aluno || {};
  const avaliador = avaliacao?.avaliador || {};
  const res = avaliacao?.resultados || {};
  const imc = res.imc || null;
  const rcq = res.rcq || null;
  const comp = res.composicao || {};
  const tf = res.testesFisicos || {};
  const idade = calcularIdadeValida(aluno.dataNasc);
  const generoLabel = String(aluno.genero || "M").toUpperCase().startsWith("F") ? "Feminino" : "Masculino";
  const dataColeta = avaliacao?.dataAvaliacao
    ? new Date(avaliacao.dataAvaliacao).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  const esc = (str) => {
    const clean = String(str ?? "")
      .replace(/—|–/g, "-")
      .replace(/•/g, "*")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
    let out = "";
    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      if (clean[i] === "(" || clean[i] === ")" || clean[i] === "\\") {
        out += "\\" + clean[i];
      } else if (code >= 32 && code <= 126) {
        out += clean[i];
      } else if (code >= 160 && code <= 255) {
        out += "\\" + code.toString(8).padStart(3, "0");
      } else {
        out += " ";
      }
    }
    return out;
  };

  const lines = [
    { bold: true, size: 13, text: "UNOESC - UNIVERSIDADE DO OESTE DE SANTA CATARINA" },
    { bold: false, size: 9, text: "Sistema de Avaliacao Fisica e Cineantropometria - Laudo Tecnico Oficial" },
    { bold: true, size: 9.5, text: `Laudo No #${avaliacao?.id || 1}  |  Data da coleta: ${dataColeta}` },
    { bold: true, size: 11, text: "--------------------------------------------------------------------------------" },
    { bold: true, size: 10, text: "1. DADOS DE IDENTIFICACAO DO AVALIADO" },
    { bold: false, size: 9, text: `Nome: ${aluno.nome || "---"}   |   Matricula: ${aluno.matricula || "---"}` },
    { bold: false, size: 9, text: `Idade: ${idade ? `${idade} anos` : "Nao informada"}   |   Genero: ${generoLabel}   |   CPF: ${maskCPF(aluno.cpf)}` },
    { bold: false, size: 9, text: `Telefone: ${maskPhone(aluno.telefone)}   |   Avaliador: ${avaliador.name || "Administrador"}` },
    { bold: true, size: 10, text: "2. ANAMNESE E HISTORICO DE SAUDE" },
    { bold: false, size: 9, text: `Historico medico: ${avaliacao?.historicoMedico || "Nao informado"}` },
    { bold: false, size: 9, text: `Medicamentos em uso: ${avaliacao?.medicamentosEmUso || "Nao informado"}` },
    { bold: false, size: 9, text: `Objetivos / Observacoes: ${avaliacao?.objetivos || "Nao informado"}` },
    { bold: true, size: 10, text: "3. RESUMO DA COMPOSICAO CORPORAL" },
    { bold: false, size: 9, text: `Estatura: ${avaliacao?.altura || "--"} m   |   Massa corporal: ${avaliacao?.peso ? `${avaliacao.peso} kg` : "--"}   |   IMC: ${imc ? `${imc.valor} kg/m2 (${imc.classificacao})` : "--"}` },
    { bold: false, size: 9, text: `RCQ: ${rcq ? `${rcq.valor} (${rcq.risco})` : "--"}   |   % Gordura (Pollock 7 / Siri): ${comp.percGordura ? `${comp.percGordura}% (${comp.classificacaoGordura || ""})` : "--"}` },
    { bold: false, size: 9, text: `Massa Magra: ${comp.massaMagra ? `${comp.massaMagra} kg` : "--"}   |   Massa Gorda: ${comp.massaGorda ? `${comp.massaGorda} kg` : "--"}   |   Densidade: ${comp.densidadeCorporal ? `${comp.densidadeCorporal} g/cm3` : "--"}` },
    { bold: true, size: 10, text: "4. PERIMETRIA E CIRCUNFERENCIAS CORPORAIS (cm)" },
    { bold: false, size: 9, text: `Cintura: ${avaliacao?.circCintura ?? "--"} cm  |  Abdomen: ${avaliacao?.circAbdomem ?? "--"} cm  |  Quadril: ${avaliacao?.circQuadril ?? "--"} cm` },
    { bold: false, size: 9, text: `Braco relaxado direito: ${avaliacao?.circBracoRelaxadoD ?? "--"} cm  |  Braco relaxado esquerdo: ${avaliacao?.circBracoRelaxadoE ?? "--"} cm` },
    { bold: true, size: 10, text: "5. DOBRAS CUTANEAS (mm) - PROTOCOLO DE JACKSON & POLLOCK (7 DOBRAS)" },
    { bold: false, size: 9, text: `Triceps: ${avaliacao?.dcTriceps ?? "--"} mm  |  Subescapular: ${avaliacao?.dcSubescapular ?? "--"} mm  |  Peitoral: ${avaliacao?.dcPeitoral ?? "--"} mm  |  Axilar media: ${avaliacao?.dcAxilarMedia ?? "--"} mm` },
    { bold: false, size: 9, text: `Supra-iliaca: ${avaliacao?.dcSuprailiaca ?? "--"} mm  |  Abdominal: ${avaliacao?.dcAbdominal ?? "--"} mm  |  Coxa: ${avaliacao?.dcCoxa ?? "--"} mm  |  Soma 7 DC: ${comp.somaDobras ? `${comp.somaDobras} mm` : "--"}` },
    { bold: true, size: 10, text: "6. TESTES FISICOS NEUROMOTORES" },
    { bold: false, size: 9, text: `Resistencia abdominal (1 min): ${tf.abdominal ? `${tf.abdominal.repeticoes} rep - ${tf.abdominal.classificacao} (${tf.abdominal.pontuacao} pts)` : "Nao avaliado"}` },
    { bold: false, size: 9, text: `Preensao manual (dinamometria): ${tf.preensao ? `D: ${tf.preensao.direita ?? "--"} kgf / E: ${tf.preensao.esquerda ?? "--"} kgf - ${tf.preensao.classificacao}` : "Nao avaliado"}` },
    { bold: true, size: 10, text: "7. PARECER TECNICO DO AVALIADOR" },
    { bold: false, size: 9, text: avaliacao?.observacoes || "Recomenda-se o acompanhamento periodico da composicao corporal conforme planejamento." },
    { bold: true, size: 9, text: `Avaliador Responsavel: ${avaliador.name || "Administrador"}   |   Codigo: UNOESC-LAUDO-${avaliacao?.id || 1}` },
  ];

  let y = 790;
  const ops = ["BT"];
  for (const l of lines) {
    const fontKey = l.bold ? "/F2" : "/F1";
    y -= l.bold ? 20 : 15;
    ops.push(`${fontKey} ${l.size} Tf`);
    ops.push(`1 0 0 1 42 ${y} Tm (${esc(l.text)}) Tj`);
  }
  ops.push("ET");
  const streamContent = ops.join("\n");

  const objs = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n",
    `6 0 obj\n<< /Length ${Buffer.byteLength(streamContent, "latin1")} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
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

    let pdfBuffer;
    try {
      pdfBuffer = await gerarPdfLaudoBuffer(avaliacao, historicoAvaliacoes || []);
    } catch (pdfErr) {
      console.warn("Fallback PDF nativo ativado devido a erro de fonte no ambiente serverless:", pdfErr.message);
      pdfBuffer = gerarPdfNativoFallback(avaliacao, historicoAvaliacoes || []);
    }

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

    const mailOptions = {
      from: `"UNOESC Avaliação Física" <${user}>`,
      to: emailDestino,
      subject:
        assunto ||
        `Laudo Técnico de Avaliação Física — ${avaliacao?.aluno?.nome || "Aluno"} (UNOESC)`,
      text:
        mensagem ||
        `Olá, ${avaliacao?.aluno?.nome || "Aluno"}!\n\nSegue em anexo o seu Laudo Técnico de Avaliação Física e Composição Corporal em formato PDF.\n\nAtenciosamente,\n${avaliacao?.avaliador?.name || "Laboratório de Avaliação Física — UNOESC"}`,
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


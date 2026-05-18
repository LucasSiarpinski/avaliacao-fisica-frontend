import { z } from 'zod';

export const alunoSchema = z.object({
  // ETAPA 1: DADOS PESSOAIS
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  dataNasc: z.string().optional().refine((val) => {
    if (!val) return true;
    const data = new Date(val);
    return !isNaN(data.getTime()) && data <= new Date();
  }, 'Data de nascimento inválida ou futura'),
  cpf: z.string().min(11, 'CPF incompleto').optional().or(z.literal('')),
  genero: z.string().optional(),
  telefone: z.string().min(10, 'Telefone incompleto').optional().or(z.literal('')),
  
  // ETAPA 2: ENDEREÇO E PERFIL
  matricula: z.string().min(3, 'A matrícula é obrigatória').optional().or(z.literal('')),

  endereco: z.string().optional(),
  profissao: z.string().optional(),
  objetivo: z.enum(['EMAGRECIMENTO', 'HIPERTROFIA', 'CONDICIONAMENTO', 'PERFORMANCE', 'SAUDE'], {
    errorMap: () => ({ message: 'Selecione um objetivo válido' })
  }),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO'),
  observacoes: z.string().optional(),

  // ETAPA 3: ANAMNESE (Dados Médicos)
  dadosMedicos: z.any().optional(),

  // ETAPA 4: ANAMNESE (Hábitos e Par-Q)
  habitos: z.any().optional(),

  parq: z.any().optional(),
  
  virtual: z.any().optional(),

  termoAceite: z.boolean().optional().default(false)
}).superRefine((data, ctx) => {
  const parq = data.parq || {};
  const isParqPositive = [
    parq.pergunta1, parq.pergunta2, parq.pergunta3, 
    parq.pergunta4, parq.pergunta5, parq.pergunta6, parq.pergunta7
  ].some(Boolean);

  if (isParqPositive) {
    const obs = data.virtual?.parq_observacao;
    if (!obs || obs.trim() === '') {
      ctx.addIssue({
        path: ['virtual', 'parq_observacao'],
        message: 'A observação clínica é obrigatória ao marcar SIM no PAR-Q.',
        code: z.ZodIssueCode.custom,
      });
    }
  }
});

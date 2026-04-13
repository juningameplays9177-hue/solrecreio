import { z } from "zod";

/** Remove formatação e mantém só dígitos */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Validação de dígitos verificadores do CPF (Brasil) */
export function isValidCpf(cpfRaw: string): boolean {
  const cpf = digitsOnly(cpfRaw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]!, 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9]!, 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]!, 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10]!, 10);
}

export const strongPasswordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(128, "Senha muito longa")
  .regex(/[a-z]/, "Inclua pelo menos uma letra minúscula")
  .regex(/[A-Z]/, "Inclua pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "Inclua pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "Inclua pelo menos um símbolo ou caractere especial");

/** Cadastro público: nome, e-mail, senha + confirmação; CPF e telefone opcionais. */
export const registrationFormSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome muito curto")
      .max(200, "Nome muito longo")
      .transform((s) => s.trim().replace(/\s+/g, " ")),
    email: z
      .string()
      .email("E-mail inválido")
      .max(255)
      .transform((s) => s.toLowerCase().trim()),
    password: strongPasswordSchema,
    passwordConfirm: z.string().min(1, "Confirme a senha"),
    cpf: z.string().optional(),
    phone: z.string().optional(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "As senhas não coincidem",
    path: ["passwordConfirm"],
  })
  .superRefine((d, ctx) => {
    const cpf = digitsOnly(d.cpf ?? "");
    if (cpf.length > 0) {
      if (cpf.length !== 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPF deve ter 11 dígitos",
          path: ["cpf"],
        });
      } else if (!isValidCpf(cpf)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPF inválido",
          path: ["cpf"],
        });
      }
    }
    const tel = digitsOnly(d.phone ?? "");
    if (tel.length > 0) {
      if (tel.length < 10 || tel.length > 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Telefone deve ter 10 ou 11 dígitos",
          path: ["phone"],
        });
      }
    }
  })
  .transform((d) => {
    const cpf = digitsOnly(d.cpf ?? "");
    const phone = digitsOnly(d.phone ?? "");
    return {
      name: d.name,
      email: d.email,
      password: d.password,
      cpf: cpf.length === 11 ? cpf : null,
      phone: phone.length >= 10 && phone.length <= 11 ? phone : null,
    };
  });

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido").max(255),
  password: z.string().min(1, "Informe a senha"),
});

export const googleIdTokenSchema = z.object({
  idToken: z.string().min(20, "Token inválido"),
});

/** Completar cadastro: CPF e telefone. */
export const completeProfileSchema = z.object({
  cpf: z.string().refine((s) => digitsOnly(s).length === 11, "CPF incompleto"),
  phone: z
    .string()
    .refine((s) => {
      const d = digitsOnly(s);
      return d.length >= 10 && d.length <= 11;
    }, "Telefone inválido"),
});

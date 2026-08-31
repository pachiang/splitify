import { z } from "zod";
import { isSupportedCurrency } from "./currency";

/** ISO 4217 幣別碼,且必須是我們支援的幣別。 */
export const currencyCodeSchema = z
  .string()
  .refine(isSupportedCurrency, { message: "Unsupported currency" });

/** 拆帳方式。 */
export const splitTypeSchema = z.enum([
  "equal",
  "exact",
  "percentage",
  "shares",
  "itemized",
  "adjustment",
]);
export type SplitType = z.infer<typeof splitTypeSchema>;

/** 金額 = 最小單位整數 (minor units)。 */
export const minorAmountSchema = z.number().int();
export const positiveMinorSchema = z.number().int().positive();

export const memberIdSchema = z.string().min(1);

/** 付款人:誰付了多少 (支援多付款人)。 */
export const payerSchema = z.object({
  memberId: memberIdSchema,
  amount: positiveMinorSchema,
});
export type Payer = z.infer<typeof payerSchema>;

/**
 * 建立帳目的輸入 (共用於前端表單驗證與後端 Edge Function)。
 * splitConfig 的細部形狀由 @splitify/core 依 splitType 驗證。
 */
export const expenseInputSchema = z.object({
  description: z.string().min(1).max(200),
  totalAmount: positiveMinorSchema,
  currency: currencyCodeSchema,
  splitType: splitTypeSchema,
  paidBy: z.array(payerSchema).min(1),
  memberIds: z.array(memberIdSchema).min(1),
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

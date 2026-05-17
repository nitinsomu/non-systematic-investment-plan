import { z } from "zod";

export const backtestFormSchema = z
  .object({
    ticker: z.string().trim().min(1, "Ticker is required").transform((value) => value.toUpperCase()),
    assetType: z.enum(["STOCK", "MUTUAL_FUND", "ETF", "GOLD", "CRYPTO"]),
    assetId: z.string().optional(),
    monthlyAmount: z.number().positive("Monthly amount must be greater than zero"),
    currency: z.string().trim().min(1, "Currency is required").transform((value) => value.toUpperCase()),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    dipThresholdPercent: z.number().positive("Dip threshold must be greater than zero"),
    movingAverageDays: z.number().int().min(20, "Moving average must be at least 20 days"),
    deployMultiplier: z.number().min(1, "Deploy multiplier must be at least 1"),
    reserveEnabled: z.boolean(),
    baseSipPercent: z.number().gt(0, "Base SIP percent must be greater than zero").lt(100, "Base SIP percent must be below 100"),
    rsiDipEnabled: z.boolean(),
    momentumBoostEnabled: z.boolean(),
    rsiPeriod: z.number().int().min(2, "RSI period must be at least 2"),
    rsiThreshold: z.number().gt(0, "RSI threshold must be greater than zero").lt(100, "RSI threshold must be below 100"),
    momentumAverageDays: z.number().int().min(5, "Momentum average must be at least 5 days"),
  })
  .refine((value) => value.startDate < value.endDate, {
    message: "Start date must be before end date",
    path: ["endDate"],
  })
  .refine((value) => {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    return months >= 12;
  }, {
    message: "Range must be at least 1 year; long moving averages need enough history",
    path: ["endDate"],
  })
  .refine((value) => value.assetType === "STOCK" || Boolean(value.assetId), {
    message: "Select a mutual fund from the search results",
    path: ["ticker"],
  });

export type BacktestFormValues = z.infer<typeof backtestFormSchema>;

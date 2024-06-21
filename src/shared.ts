export const MilkType = [
  'Cream', 'Half-and-half', 'Whole-milk', 'Part-Skim', 'Skim', 'Non-Dairy'
] as const;

export const SyrupType = [
  'Vanilla', 'Almond', 'Raspberry', 'Chocolate'
] as const;

export const AlcoholType = [
  'Whisky', 'Rum', 'Kahlua', 'Aquavit'
] as const;

export const SugarType = [
  'Sugar', 'Xylitol', 'Stevia'
] as const;

export const AdditionType = [
  ...MilkType,
  ...SyrupType,
  ...AlcoholType,
  ...SugarType
] as const;

export type AdditionType = (typeof AdditionType)[number]
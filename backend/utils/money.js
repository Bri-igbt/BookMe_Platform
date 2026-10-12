// export const PLATFORM_FEE_RATE = 0.1

// export const calculatePlatformSplit = (amount) => {
//     const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
//     const platformFeeAmount = Math.round(safeAmount * PLATFORM_FEE_RATE);
//     const providerPayoutAmount = Math.max(0, safeAmount - platformFeeAmount);

//     return {
//         platformFeeAmount,
//         providerPayoutAmount
//     };
// };

// export const formatMinorMoney = (amount, currency = "ngn") => {
//     return new Intl.NumberFormat('en-NG', {
//         style: 'currency',
//         currency: currency.toUpperCase(),

//     }).format((amount || 0) / 100);
// }; 


export const PLATFORM_FEE_RATE = 0.1;

const FEE_BASIS_POINTS = Math.round(PLATFORM_FEE_RATE * 10000);

export const calculatePlatformSplit = (amount) => {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError(
      `Amount must be a non-negative number in kobo, got ${amount}`
    );
  }

  const safeAmount = Math.round(amount);
  const platformFeeAmount = Math.round((safeAmount * FEE_BASIS_POINTS) / 10000);
  const providerPayoutAmount = Math.max(0, safeAmount - platformFeeAmount);

  return {
    platformFeeAmount,
    providerPayoutAmount,
  };
};

export const formatMinorMoney = (amount, currency = "ngn") => {
  const code = String(currency || "ngn").toUpperCase();
  const value = (Number(amount) || 0) / 100;

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: code,
    }).format(value);
  } catch (e) {
    return `${code} ${value.toFixed(2)}`;
  }
};
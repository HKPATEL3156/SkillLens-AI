/**
 * Formats salary values correctly whether provided in raw amount (e.g. 350000)
 * or in Lakhs per annum (e.g. 3.5 or 9).
 */
export const formatSalary = (
  min,
  max,
  currency = "INR",
  { includePeriod = true, includeSymbol = true } = {}
) => {
  if (!min && !max) return "Best in Industry";

  const formatVal = (val) => {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    if (isNaN(num) || num <= 0) return "";
    // If num >= 1000 (e.g. 350000, 900000), convert from raw amount to Lakhs
    if (num >= 1000) {
      const inLakhs = num / 100000;
      return inLakhs % 1 === 0 ? `${inLakhs}L` : `${inLakhs.toFixed(1)}L`;
    }
    // If num < 1000 (e.g. 3.5, 9), it is already entered in Lakhs (LPA)
    return num % 1 === 0 ? `${num}L` : `${num.toFixed(1)}L`;
  };

  const formattedMin = formatVal(min);
  const formattedMax = formatVal(max);
  const symbol = includeSymbol
    ? !currency || currency === "INR"
      ? "₹"
      : currency === "USD"
      ? "$"
      : `${currency} `
    : "";
  const period = includePeriod ? " / yr" : "";

  if (formattedMin && formattedMax) {
    if (formattedMin === formattedMax) {
      return `${symbol}${formattedMin}${period}`;
    }
    return `${symbol}${formattedMin} - ${symbol}${formattedMax}${period}`;
  }
  if (formattedMin) {
    return `${symbol}${formattedMin}+${period}`;
  }
  if (formattedMax) {
    return `Up to ${symbol}${formattedMax}${period}`;
  }
  return "Competitive";
};


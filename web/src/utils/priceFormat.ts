/**
 * Formats a price value to display in Euros
 * @param price - Price value (number or string)
 * @param convertFromMKD - If true, converts from MKD to EUR (assuming 60 MKD = 1 EUR)
 * @returns Formatted price string with Euro symbol
 */
export function formatPriceInEUR(price: number | string | null | undefined, convertFromMKD = false): string {
  if (price === null || price === undefined) {
    return '0.00 ден.';
  }

  let numericValue: number;

  if (typeof price === 'string') {
    // Remove currency symbols and non-numeric characters except decimal point
    const cleaned = price.replace(/[€$£¥₹¤,\s]|\s*[A-Z]{3}\s*/g, '').replace(/ден\.?/gi, '').trim();
    numericValue = parseFloat(cleaned) || 0;
  } else {
    numericValue = price;
  }

  // Convert from MKD to EUR if needed (assuming 60 MKD = 1 EUR)
  if (convertFromMKD) {
    numericValue = numericValue / 60;
  }

  // Format with 2 decimals
  const formatted = numericValue.toFixed(2);
  return `${formatted} ден.`;
}

/**
 * Formats a price value to display in Euros (integer, no decimals if whole number)
 * @param price - Price value (number or string)
 * @param convertFromMKD - If true, converts from MKD to EUR (assuming 60 MKD = 1 EUR)
 * @returns Formatted price string with Euro symbol
 */
export function formatPriceInEURInt(price: number | string | null | undefined, convertFromMKD = false): string {
  if (price === null || price === undefined) {
    return '0 ден.';
  }

  let numericValue: number;

  if (typeof price === 'string') {
    // Remove currency symbols and non-numeric characters except decimal point
    const cleaned = price.replace(/[€$£¥₹¤,\s]|\s*[A-Z]{3}\s*/g, '').replace(/ден\.?/gi, '').trim();
    numericValue = parseFloat(cleaned) || 0;
  } else {
    numericValue = price;
  }

  // Convert from MKD to EUR if needed (assuming 60 MKD = 1 EUR)
  if (convertFromMKD) {
    numericValue = numericValue / 60;
  }

  // Format as integer if whole number, otherwise 2 decimals
  const formatted = numericValue % 1 === 0 
    ? Math.round(numericValue).toString() 
    : numericValue.toFixed(2);
  return `${formatted} ден.`;
}

/**
 * Formats a price value to display in Macedonian Denar (MKD)
 * @param price - Price value (number or string)
 * @param convertFromEUR - If true, converts from EUR to MKD (assuming 1 EUR = 60 MKD)
 * @returns Formatted price string with MKD symbol
 */
export function formatPriceInMKD(price: number | string | null | undefined, convertFromEUR = false): string {
  if (price === null || price === undefined) {
    return '0 ден.';
  }

  let numericValue: number;

  if (typeof price === 'string') {
    // Remove currency symbols and non-numeric characters except decimal point
    const cleaned = price.replace(/[€$£¥₹¤,\s]|\s*[A-Z]{3}\s*/g, '').replace(/ден\.?/gi, '').trim();
    numericValue = parseFloat(cleaned) || 0;
  } else {
    numericValue = price;
  }

  // Convert from EUR to MKD if needed (assuming 1 EUR = 60 MKD)
  if (convertFromEUR) {
    numericValue = numericValue * 60;
  }

  // Format with 2 decimals
  const formatted = numericValue.toFixed(2);
  return `${formatted} ден.`;
}

/**
 * Formats a price value to display in Macedonian Denar (MKD) - integer format
 * @param price - Price value (number or string)
 * @param convertFromEUR - If true, converts from EUR to MKD (assuming 1 EUR = 60 MKD)
 * @returns Formatted price string with MKD symbol
 */
export function formatPriceInMKDInt(price: number | string | null | undefined, convertFromEUR = false): string {
  if (price === null || price === undefined) {
    return '0 ден.';
  }

  let numericValue: number;

  if (typeof price === 'string') {
    // Remove currency symbols and non-numeric characters except decimal point
    const cleaned = price.replace(/[€$£¥₹¤,\s]|\s*[A-Z]{3}\s*/g, '').replace(/ден\.?/gi, '').trim();
    numericValue = parseFloat(cleaned) || 0;
  } else {
    numericValue = price;
  }

  // Convert from EUR to MKD if needed (assuming 1 EUR = 60 MKD)
  if (convertFromEUR) {
    numericValue = numericValue * 60;
  }

  // Format as integer if whole number, otherwise 2 decimals
  const formatted = numericValue % 1 === 0 
    ? Math.round(numericValue).toString() 
    : numericValue.toFixed(2);
  return `${formatted} ден.`;
}


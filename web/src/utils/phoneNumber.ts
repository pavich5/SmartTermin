const PHONE_PREFIX = '+389';

export function formatPhoneNumber(value: string): string {
  const cleaned = value.replace(/\s/g, '').replace(/[^\d+]/g, '');

  if (!cleaned.startsWith(PHONE_PREFIX)) {
    if (cleaned.startsWith('+')) {
      const digits = cleaned.slice(1).replace(/\D/g, '');

      const limitedDigits = digits.slice(0, 8);
      return PHONE_PREFIX + limitedDigits;
    }

    const digitsOnly = cleaned.replace(/\D/g, '').slice(0, 8);
    return PHONE_PREFIX + digitsOnly;
  }

  const afterPrefix = cleaned.slice(PHONE_PREFIX.length).replace(/\D/g, '');

  const limitedDigits = afterPrefix.slice(0, 8);
  return PHONE_PREFIX + limitedDigits;
}

export function handlePhoneNumberChange(
  currentValue: string,
  newValue: string,
  setValue: (value: string) => void
): void {
  const cleaned = newValue.replace(/\s/g, '');

  if (cleaned.length < PHONE_PREFIX.length) {
    setValue(PHONE_PREFIX);
    return;
  }

  const formatted = formatPhoneNumber(cleaned);
  setValue(formatted);
}

export function isValidMacedonianPhoneNumber(phone: string): boolean {
  if (!phone || !phone.startsWith(PHONE_PREFIX)) {
    return false;
  }

  const digitsAfterPrefix = phone.slice(PHONE_PREFIX.length).replace(/\D/g, '');

  if (digitsAfterPrefix.length !== 8) {
    return false;
  }

  const firstDigit = digitsAfterPrefix[0];
  return firstDigit === '7' || firstDigit === '2';
}

export function formatPhoneNumberDisplay(phone: string): string {
  if (!phone.startsWith(PHONE_PREFIX)) {
    return phone;
  }

  const digits = phone.slice(PHONE_PREFIX.length).replace(/\D/g, '');

  if (digits.length === 0) {
    return PHONE_PREFIX;
  }

  if (digits.length <= 2) {
    return `${PHONE_PREFIX} ${digits}`;
  } else if (digits.length <= 5) {
    return `${PHONE_PREFIX} ${digits.slice(0, 2)} ${digits.slice(2)}`;
  } else {
    return `${PHONE_PREFIX} ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}`;
  }
}

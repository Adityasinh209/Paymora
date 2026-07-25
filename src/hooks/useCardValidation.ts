import { useState, useCallback } from 'react'
import { luhnCheck } from '../utils/luhn'
import { parseExpiry, stripCardNumber } from '../utils/cardFormatters'
import type { CardBrand } from '../utils/cardBrands'

export interface FieldState {
  value: string
  error: string
  touched: boolean
  valid: boolean
}

export interface FormFields {
  cardNumber: FieldState
  expiry: FieldState
  cardHolder: FieldState
  cvv: FieldState
}

type FieldName = keyof FormFields

function makeField(value = ''): FieldState {
  return { value, error: '', touched: false, valid: false }
}

export function useCardValidation(brand: CardBrand) {
  const [fields, setFields] = useState<FormFields>({
    cardNumber: makeField(),
    expiry: makeField(),
    cardHolder: makeField(),
    cvv: makeField(),
  })

  const validateCardNumber = useCallback(
    (value: string): string => {
      const digits = stripCardNumber(value)
      if (!digits) return 'Card number is required'
      if (!brand.lengths.includes(digits.length)) {
        const expected = brand.lengths[brand.lengths.length - 1]
        if (digits.length < expected) return 'Card number is too short'
        return 'Card number is too long'
      }
      if (!luhnCheck(digits)) return 'Invalid card number'
      return ''
    },
    [brand],
  )

  const validateExpiry = useCallback((value: string): string => {
    if (!value.trim()) return 'Expiry date is required'
    const parsed = parseExpiry(value)
    if (!parsed) return 'Enter a valid expiry date'
    const { month, year } = parsed
    if (month < 1 || month > 12) return 'Invalid month'
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return 'Card has expired'
    }
    return ''
  }, [])

  const validateCardHolder = useCallback((value: string): string => {
    const trimmed = value.trim()
    if (!trimmed) return 'Cardholder name is required'
    if (trimmed.length < 2) return 'Name is too short'
    if (!/^[a-zA-Z\s\-'.]+$/.test(trimmed)) return 'Name contains invalid characters'
    return ''
  }, [])

  const validateCVV = useCallback(
    (value: string): string => {
      if (!value) return 'CVV is required'
      if (value.length < brand.cvvLength) return `CVV must be ${brand.cvvLength} digits`
      return ''
    },
    [brand],
  )

  const getValidator = useCallback(
    (field: FieldName) => {
      switch (field) {
        case 'cardNumber': return validateCardNumber
        case 'expiry': return validateExpiry
        case 'cardHolder': return validateCardHolder
        case 'cvv': return validateCVV
      }
    },
    [validateCardNumber, validateExpiry, validateCardHolder, validateCVV],
  )

  const updateField = useCallback(
    (field: FieldName, value: string) => {
      setFields((prev) => {
        const wasTouched = prev[field].touched
        const error = wasTouched ? getValidator(field)(value) : ''
        const valid = wasTouched && error === '' && value.trim().length > 0
        return { ...prev, [field]: { value, error, touched: wasTouched, valid } }
      })
    },
    [getValidator],
  )

  const touchField = useCallback(
    (field: FieldName) => {
      setFields((prev) => {
        const value = prev[field].value
        const error = getValidator(field)(value)
        const valid = error === '' && value.trim().length > 0
        return { ...prev, [field]: { ...prev[field], touched: true, error, valid } }
      })
    },
    [getValidator],
  )

  const isFormValid = useCallback((): boolean => {
    return (
      validateCardNumber(fields.cardNumber.value) === '' &&
      validateExpiry(fields.expiry.value) === '' &&
      validateCardHolder(fields.cardHolder.value) === '' &&
      validateCVV(fields.cvv.value) === ''
    )
  }, [fields, validateCardNumber, validateExpiry, validateCardHolder, validateCVV])

  const resetFields = useCallback(() => {
    setFields({
      cardNumber: makeField(),
      expiry: makeField(),
      cardHolder: makeField(),
      cvv: makeField(),
    })
  }, [])

  return { fields, updateField, touchField, isFormValid, resetFields }
}

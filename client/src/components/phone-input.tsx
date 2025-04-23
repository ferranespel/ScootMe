import React, { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';

// List of countries with their country codes and flags (using flag emoji)
const countries = [
  { code: "+354", name: "Iceland", flag: "🇮🇸" },
  { code: "+1", name: "United States", flag: "🇺🇸" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "+358", name: "Finland", flag: "🇫🇮" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "+32", name: "Belgium", flag: "🇧🇪" },
  { code: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "+30", name: "Greece", flag: "🇬🇷" },
  { code: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "+420", name: "Czech Republic", flag: "🇨🇿" },
  { code: "+36", name: "Hungary", flag: "🇭🇺" },
  { code: "+43", name: "Austria", flag: "🇦🇹" },
  { code: "+41", name: "Switzerland", flag: "🇨🇭" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const { t } = useTranslation();
  const [countryCode, setCountryCode] = useState("+354"); // Default to Iceland
  const [phoneNumber, setPhoneNumber] = useState("");

  // Parse the initial value to separate country code and number if provided
  useEffect(() => {
    if (value) {
      // Find a matching country code from the value
      const matchingCountry = countries.find(country => 
        value.startsWith(country.code)
      );
      
      if (matchingCountry) {
        setCountryCode(matchingCountry.code);
        setPhoneNumber(value.substring(matchingCountry.code.length));
      } else {
        // If no match, assume the value is just the local number
        setPhoneNumber(value);
      }
    }
  }, []);

  // Update the combined value when either part changes
  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    onChange(code + phoneNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value;
    setPhoneNumber(newNumber);
    onChange(countryCode + newNumber);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="phone">{t('auth.phoneNumber')}</Label>
      <div className="flex">
        <Select
          value={countryCode}
          onValueChange={handleCountryChange}
        >
          <SelectTrigger className="w-[120px] rounded-r-none border-r-0">
            <SelectValue placeholder={t('auth.selectCountry')} />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <span className="flex items-center">
                  <span className="mr-2">{country.flag}</span>
                  <span>{country.code}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id="phone"
          className="rounded-l-none flex-1"
          placeholder={t('auth.phoneNumberPlaceholder')}
          value={phoneNumber}
          onChange={handleNumberChange}
          type="tel"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
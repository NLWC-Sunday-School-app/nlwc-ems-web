"use client";

import { useState } from "react";
import { SelectField, TextField } from "@/components/Form";
import { CITIES, COUNTRIES, OTHER_CITY } from "@/lib/places";

/** Country and city as dropdowns. The city list follows the country; where we have no list, or the city isn't in it,
 * the person types it. Values are plain names, so whatever was saved before still shows. */
export function PlaceFields({ country, city, onChange }: { country: string; city: string; onChange: (v: { country: string; city: string }) => void }) {
  const cities = CITIES[country];
  // "Other" stays chosen while the person types, even though the typed text isn't in the list.
  const [other, setOther] = useState(false);
  const known = !!cities && cities.includes(city);
  const typing = !!cities && (other || (city !== "" && !known));
  const countryKnown = country === "" || (COUNTRIES as readonly string[]).includes(country);

  return (
    <>
      <SelectField
        label="Country"
        autoComplete="country-name"
        value={country}
        onChange={(e) => {
          setOther(false);
          onChange({ country: e.target.value, city: "" });
        }}
      >
        <option value="">Select</option>
        {!countryKnown && <option value={country}>{country}</option>}
        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </SelectField>

      {cities && country ? (
        <>
          <SelectField
            label="City"
            value={typing ? OTHER_CITY : city}
            onChange={(e) => {
              if (e.target.value === OTHER_CITY) {
                setOther(true);
                onChange({ country, city: "" });
              } else {
                setOther(false);
                onChange({ country, city: e.target.value });
              }
            }}
          >
            <option value="">Select</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value={OTHER_CITY}>My city isn't listed</option>
          </SelectField>
          {typing && <TextField label="Your city" maxLength={100} autoComplete="address-level2" value={city} onChange={(e) => onChange({ country, city: e.target.value })} />}
        </>
      ) : (
        <TextField
          label="City"
          maxLength={100}
          autoComplete="address-level2"
          disabled={!country}
          hint={country ? undefined : "Choose a country first."}
          value={city}
          onChange={(e) => onChange({ country, city: e.target.value })}
        />
      )}
    </>
  );
}

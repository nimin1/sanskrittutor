"use client";

import type React from "react";
import { useMemo } from "react";
import { applyMalayalamSuggestion, getMalayalamSuggestions } from "@/lib/input/malayalamTransliterate";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function MalayalamTextInput({
  value,
  onChange,
  placeholder,
  rows,
  className = "field field--textarea",
  inputRef,
  onKeyDown,
}: Props) {
  const suggestions = useMemo(() => getMalayalamSuggestions(value), [value]);

  function applySuggestion(suggestion: string) {
    onChange(applyMalayalamSuggestion(value, suggestion));
  }

  return (
    <div className="malayalam-input">
      <textarea
        ref={inputRef}
        className={className}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />
      {suggestions.length > 0 ? (
        <div className="suggestion-strip" aria-label="Malayalam suggestions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="suggestion-chip"
              onClick={() => applySuggestion(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

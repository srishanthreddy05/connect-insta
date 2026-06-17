"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface KeywordInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  className?: string;
  onInputChange?: (val: string) => void;
}

export function KeywordInput({
  value,
  onChange,
  placeholder = "Type a keyword and press Enter…",
  className,
  onInputChange,
}: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const removeKeyword = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeKeyword(value.length - 1);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-input bg-input/50 px-3 py-2 focus-within:ring-2 focus-within:ring-ring/30 transition-all",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((keyword, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary animate-fade-in"
        >
          {keyword}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeKeyword(index);
            }}
            className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onInputChange?.(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

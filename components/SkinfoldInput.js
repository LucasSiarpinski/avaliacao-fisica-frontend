"use client";

import React from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import styles from "./SkinfoldInput.module.css";

export default function SkinfoldInput({
  label,
  name,
  id,
  value,
  onChange,
  placeholder = "Ex: 12.5",
  step = 0.5,
  min = 0,
}) {
  const inputId = id || name;

  const handleStep = (delta) => {
    // Normaliza valor atual aceitando vírgula ou ponto
    const strVal = String(value ?? "").replace(",", ".");
    const currentNum = parseFloat(strVal);
    const base = isNaN(currentNum) ? 0 : currentNum;
    const nextNum = Math.max(min, parseFloat((base + delta).toFixed(1)));
    const nextStr = String(nextNum);

    if (onChange) {
      onChange({
        target: {
          name,
          value: nextStr,
        },
      });
    }
  };

  const handleInputChange = (e) => {
    let raw = e.target.value;
    // Converte vírgula para ponto imediatamente para manter formato válido
    raw = raw.replace(",", ".");

    // Permite string vazia ou número com até um ponto decimal
    if (raw === "" || /^[0-9]*\.?[0-9]*$/.test(raw)) {
      if (onChange) {
        onChange({
          target: {
            name,
            value: raw,
          },
        });
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        <span className={styles.unitBadge}>mm</span>
      </div>

      <div className={styles.stepperWrapper}>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => handleStep(-step)}
          aria-label={`Diminuir ${label}`}
          title="Diminuir 0.5 mm"
        >
          <FaMinus size={13} />
        </button>

        <div className={styles.inputWrapper}>
          <input
            type="text"
            inputMode="decimal"
            id={inputId}
            name={name}
            className={styles.input}
            placeholder={placeholder}
            value={value !== null && value !== undefined ? value : ""}
            onChange={handleInputChange}
          />
        </div>

        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => handleStep(step)}
          aria-label={`Aumentar ${label}`}
          title="Aumentar 0.5 mm"
        >
          <FaPlus size={13} />
        </button>
      </div>
    </div>
  );
}

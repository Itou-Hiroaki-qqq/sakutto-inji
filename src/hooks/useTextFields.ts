"use client";

import { useCallback, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { TextFieldData } from "@/components/TextField";

const MAX_UNDO_HISTORY = 30;

export function useTextFields(initialFields: TextFieldData[] = []) {
  const [fields, setFields] = useState<TextFieldData[]>(initialFields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const undoStack = useRef<TextFieldData[][]>([]);

  const pushUndo = useCallback((snapshot: TextFieldData[]) => {
    undoStack.current = [
      ...undoStack.current.slice(-MAX_UNDO_HISTORY + 1),
      snapshot,
    ];
  }, []);

  const undo = useCallback(() => {
    const stack = undoStack.current;
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    undoStack.current = stack.slice(0, -1);
    setFields(prev);
    setSelectedFieldId(null);
  }, []);

  // 直前のフィールド設定を引き継いで新フィールドを作成
  const addField = useCallback(
    (xMm: number, yMm: number) => {
      const lastField = fields[fields.length - 1];
      const newField: TextFieldData = {
        id: uuidv4(),
        label: "",
        content: "",
        positionXMm: xMm,
        positionYMm: yMm,
        widthMm: lastField?.widthMm ?? null,
        fontSize: lastField?.fontSize ?? 12,
        fontFamily: lastField?.fontFamily ?? "noto-sans-jp",
        direction: lastField?.direction ?? "horizontal",
        color: lastField?.color ?? "#000000",
        fieldRotation: lastField?.fieldRotation ?? 0,
        sortOrder: fields.length,
      };
      pushUndo(fields);
      setFields((prev) => [...prev, newField]);
      setSelectedFieldId(newField.id);
    },
    [fields, pushUndo]
  );

  const addFieldCenter = useCallback(
    (paperWidthMm: number, paperHeightMm: number) => {
      addField(paperWidthMm / 2 - 10, paperHeightMm / 2 - 5);
    },
    [addField]
  );

  // フィールド複製（同じ設定・テキストでコピー、Y座標を10mm下にずらす）
  const duplicateField = useCallback(
    (sourceId: string) => {
      const source = fields.find((f) => f.id === sourceId);
      if (!source) return;
      const newField: TextFieldData = {
        ...source,
        id: uuidv4(),
        positionYMm: source.positionYMm + 10,
        sortOrder: 0,
      };
      pushUndo(fields);
      setFields((prev) => {
        const idx = prev.findIndex((f) => f.id === sourceId);
        const updated = [...prev];
        updated.splice(idx + 1, 0, newField);
        return updated.map((f, i) => ({ ...f, sortOrder: i }));
      });
      setSelectedFieldId(newField.id);
    },
    [fields, pushUndo]
  );

  const updateField = useCallback(
    (id: string, updates: Partial<TextFieldData>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const moveField = useCallback(
    (id: string, xMm: number, yMm: number) => {
      setFields((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, positionXMm: Math.max(0, xMm), positionYMm: Math.max(0, yMm) }
            : f
        )
      );
    },
    []
  );

  const deleteField = useCallback(
    (id: string) => {
      pushUndo(fields);
      setFields((prev) => prev.filter((f) => f.id !== id));
      if (selectedFieldId === id) setSelectedFieldId(null);
    },
    [fields, selectedFieldId, pushUndo]
  );

  return {
    fields,
    setFields,
    selectedFieldId,
    setSelectedFieldId,
    addField,
    addFieldCenter,
    duplicateField,
    updateField,
    moveField,
    deleteField,
    undo,
  };
}

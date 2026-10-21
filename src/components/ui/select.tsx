import {
  createContext, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
  type ButtonHTMLAttributes, type HTMLAttributes, type MutableRefObject, type ReactNode, type RefObject,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Dependency-free Select with the same component API as the shadcn/Radix one:
 * <Select value onValueChange><SelectTrigger><SelectValue placeholder/></SelectTrigger>
 * <SelectContent><SelectItem value>Label</SelectItem></SelectContent></Select>
 * Keyboard: Enter/Space/ArrowDown open; Arrow keys, Home/End move; Enter/Space choose; Escape/Tab close; typing jumps to a match.
 */
interface ItemInfo { label: string; disabled: boolean }

interface Ctx {
  value: string;
  open: boolean;
  disabled: boolean;
  activeValue: string | null;
  listId: string;
  items: Map<string, ItemInfo>;
  order: () => string[];
  setOpen: (o: boolean) => void;
  choose: (v: string) => void;
  setActive: (v: string | null) => void;
  register: (v: string, info: ItemInfo) => () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const SelectCtx = createContext<Ctx | null>(null);
function useSelect(): Ctx {
  const c = useContext(SelectCtx);
  if (!c) throw new Error("Select parts must be rendered inside <Select>.");
  return c;
}

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Adds a hidden input so the value is submitted with a surrounding <form>. */
  name?: string;
  children?: ReactNode;
  className?: string;
}

export function Select({ value, defaultValue = "", onValueChange, disabled = false, name, children, className }: SelectProps) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as string) : inner;
  const [open, setOpenState] = useState(false);
  const [activeValue, setActive] = useState<string | null>(null);
  const [, bump] = useState(0);
  const items = useRef(new Map<string, ItemInfo>()).current;
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const register = useCallback((v: string, info: ItemInfo) => {
    items.set(v, info);
    bump((n) => n + 1);
    return () => { items.delete(v); bump((n) => n + 1); };
  }, [items]);

  const order = useCallback(() => [...items.entries()].filter(([, i]) => !i.disabled).map(([v]) => v), [items]);

  const setOpen = useCallback((o: boolean) => {
    if (o && disabled) return;
    setOpenState(o);
    if (o) setActive(items.has(current) && !items.get(current)!.disabled ? current : order()[0] ?? null);
  }, [disabled, items, current, order]);

  const choose = useCallback((v: string) => {
    if (!controlled) setInner(v);
    onValueChange?.(v);
    setOpenState(false);
    triggerRef.current?.focus();
  }, [controlled, onValueChange]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenState(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const ctx = useMemo<Ctx>(() => ({ value: current, open, disabled, activeValue, listId, items, order, setOpen, choose, setActive, register, triggerRef }),
    [current, open, disabled, activeValue, listId, items, order, setOpen, choose, register]);

  return (
    <SelectCtx.Provider value={ctx}>
      <div ref={rootRef} className={cn("relative w-full", className)}>
        {children}
        {name && <input type="hidden" name={name} value={current} />}
      </div>
    </SelectCtx.Provider>
  );
}

export const SelectTrigger = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(function SelectTrigger(
  { className, children, onKeyDown, onClick, ...props }, ref
) {
  const s = useSelect();
  const setRefs = (el: HTMLButtonElement | null) => {
    (s.triggerRef as MutableRefObject<HTMLButtonElement | null>).current = el;
    if (typeof ref === "function") ref(el); else if (ref) (ref as MutableRefObject<HTMLButtonElement | null>).current = el;
  };
  return (
    <button
      ref={setRefs}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={s.open}
      aria-controls={s.listId}
      disabled={s.disabled}
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={(e) => { onClick?.(e); if (!e.defaultPrevented) s.setOpen(!s.open); }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        const ids = s.order();
        if (!s.open) {
          if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") { e.preventDefault(); s.setOpen(true); }
          return;
        }
        const i = s.activeValue == null ? -1 : ids.indexOf(s.activeValue);
        if (e.key === "ArrowDown") { e.preventDefault(); s.setActive(ids[Math.min(i + 1, ids.length - 1)] ?? null); }
        else if (e.key === "ArrowUp") { e.preventDefault(); s.setActive(ids[Math.max(i - 1, 0)] ?? null); }
        else if (e.key === "Home") { e.preventDefault(); s.setActive(ids[0] ?? null); }
        else if (e.key === "End") { e.preventDefault(); s.setActive(ids[ids.length - 1] ?? null); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (s.activeValue != null) s.choose(s.activeValue); }
        else if (e.key === "Escape") { e.preventDefault(); s.setOpen(false); }
        else if (e.key === "Tab") s.setOpen(false);
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          const m = ids.find((v) => (s.items.get(v)?.label ?? "").toLowerCase().startsWith(e.key.toLowerCase()));
          if (m) s.setActive(m);
        }
      }}
      {...props}
    >
      {children}
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 opacity-50" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
});

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const s = useSelect();
  const label = s.value !== "" ? s.items.get(s.value)?.label : undefined;
  return <span className={cn("truncate", label == null && "text-muted-foreground")}>{label ?? placeholder ?? ""}</span>;
}

/** Items stay mounted (hidden while closed) so SelectValue can always show the selected item's label. */
export const SelectContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SelectContent({ className, children, ...props }, ref) {
  const s = useSelect();
  return (
    <div
      ref={ref}
      id={s.listId}
      role="listbox"
      hidden={!s.open}
      className={cn("absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}
      {...props}
    >
      {children}
    </div>
  );
});

export interface SelectItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  value: string;
  disabled?: boolean;
}

export function SelectItem({ value, disabled = false, className, children, ...props }: SelectItemProps) {
  const s = useSelect();
  const label = textOf(children);
  const { register } = s;
  useEffect(() => register(value, { label, disabled }), [register, value, label, disabled]);
  const selected = s.value === value;
  const active = s.activeValue === value;
  return (
    <div
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-active={active || undefined}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        active && "bg-accent text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onMouseEnter={() => !disabled && s.setActive(value)}
      onClick={() => !disabled && s.choose(value)}
      {...props}
    >
      {selected && <span aria-hidden="true" className="absolute left-2 flex h-4 w-4 items-center justify-center">✓</span>}
      {children}
    </div>
  );
}

export const SelectGroup = ({ children }: { children?: ReactNode }) => <div role="group">{children}</div>;
export const SelectLabel = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />;

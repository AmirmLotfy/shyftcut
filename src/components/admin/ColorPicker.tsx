import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  value: string; // HSL format: "240 10% 3.9%"
  onChange: (value: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  // Parse HSL string to RGB for color input
  const hslToRgb = (hsl: string): string => {
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;

    let r, g, b;
    if (sNorm === 0) {
      r = g = b = lNorm;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
      const p = 2 * lNorm - q;
      r = hue2rgb(p, q, hNorm + 1/3);
      g = hue2rgb(p, q, hNorm);
      b = hue2rgb(p, q, hNorm - 1/3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const rgbToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const rgbValue = hslToRgb(value);
  const [hexValue, setHexValue] = useState(rgbValue);

  const handleHexChange = (hex: string) => {
    setHexValue(hex);
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      onChange(rgbToHsl(hex));
    }
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[60px] h-10 p-1"
            style={{
              backgroundColor: `hsl(${value})`,
            }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <div className="space-y-2">
            <Input
              type="color"
              value={rgbValue}
              onChange={(e) => handleHexChange(e.target.value)}
              className="w-full h-10"
            />
            <Input
              type="text"
              value={hexValue}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#000000"
              className="font-mono text-sm"
            />
            <div className="text-xs text-muted-foreground">
              HSL: {value}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 font-mono text-sm"
        placeholder="240 10% 3.9%"
      />
    </div>
  );
}

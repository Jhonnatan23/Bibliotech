import { logger } from '../services/monitoring';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Book, Profile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ShareProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  profile: Profile | null;
  daysReading: number;
  pagesPerDay: number;
  progressPercentage: number;
}

type LayoutType = 'square' | 'story';
type ThemeId = 'cosmic' | 'sunset' | 'emerald' | 'violet' | 'parchment';

interface ThemeConfig {
  id: ThemeId;
  name: string;
  previewClass: string;
  isDark: boolean;
  bgGradients: string[]; // for canvas: gradient stops
  accentColor: string;
  textColor: string;
  subtextColor: string;
  highlightCardBg: string;
}

const THEMES: ThemeConfig[] = [
  {
    id: 'cosmic',
    name: 'Cosmic Slate',
    previewClass: 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100',
    isDark: true,
    bgGradients: ['#020617', '#0f172a', '#1e1b4b'],
    accentColor: '#3b82f6', // blue-500
    textColor: '#f8fafc',
    subtextColor: '#94a3b8',
    highlightCardBg: 'rgba(30, 41, 59, 0.4)',
  },
  {
    id: 'sunset',
    name: 'Sunset Dream',
    previewClass: 'bg-gradient-to-br from-rose-600 via-pink-600 to-amber-500 text-white',
    isDark: true,
    bgGradients: ['#e11d48', '#c026d3', '#f59e0b'],
    accentColor: '#fef08a', // yellow-200
    textColor: '#ffffff',
    subtextColor: '#ffe4e6',
    highlightCardBg: 'rgba(255, 255, 255, 0.15)',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    previewClass: 'bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 text-teal-50',
    isDark: true,
    bgGradients: ['#022c22', '#0d9488', '#0f172a'],
    accentColor: '#10b981', // emerald-500
    textColor: '#f0fdf4',
    subtextColor: '#99f6e4',
    highlightCardBg: 'rgba(13, 148, 136, 0.25)',
  },
  {
    id: 'violet',
    name: 'Lilac Aurora',
    previewClass: 'bg-gradient-to-br from-purple-950 via-violet-850 to-fuchsia-950 text-purple-50',
    isDark: true,
    bgGradients: ['#3b0764', '#5c1d95', '#4a044e'],
    accentColor: '#d946ef', // fuchsia-500
    textColor: '#fae8ff',
    subtextColor: '#e9d5ff',
    highlightCardBg: 'rgba(109, 40, 217, 0.3)',
  },
  {
    id: 'parchment',
    name: 'Warm Parchment',
    previewClass: 'bg-[#faf6f0] text-slate-900 border border-amber-100/50',
    isDark: false,
    bgGradients: ['#faf6f0', '#f4eae1'],
    accentColor: '#d97706', // amber-600
    textColor: '#0f172a',
    subtextColor: '#64748b',
    highlightCardBg: 'rgba(234, 218, 202, 0.4)',
  },
];

export const ShareProgressModal: React.FC<ShareProgressModalProps> = ({
  isOpen,
  onClose,
  book,
  profile,
  daysReading,
  pagesPerDay,
  progressPercentage,
}) => {
  const [layout, setLayout] = useState<LayoutType>('square');
  const [activeTheme, setActiveTheme] = useState<ThemeId>('cosmic');
  const [customSubtitle, setCustomSubtitle] = useState('MERGULHANDO NAS PÁGINAS');
  const [showSpeed, setShowSpeed] = useState(true);
  const [showDays, setShowDays] = useState(true);
  const [customQuote, setCustomQuote] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [quoteExceeded, setQuoteExceeded] = useState(false);

  const selectedTheme = useMemo(() => {
    return THEMES.find((t) => t.id === activeTheme) || THEMES[0];
  }, [activeTheme]);

  const authorName = useMemo(() => {
    return book.author ? book.author : 'Autor Desconhecido';
  }, [book.author]);

  const statsList = useMemo(() => {
    const list = [];
    if (showDays && daysReading > 0) {
      list.push({
        label: 'Acompanhando há',
        value: `${daysReading} ${daysReading === 1 ? 'dia' : 'dias'}`,
      });
    }
    if (showSpeed && pagesPerDay > 0) {
      list.push({
        label: 'Ritmo Médio',
        value: `${pagesPerDay} pág/dia`,
      });
    }
    list.push({
      label: 'Volume de leitura',
      value: `${book.currentPage || 0} / ${book.pages} pág`,
    });
    return list;
  }, [showSpeed, showDays, daysReading, pagesPerDay, book]);

  // Handle quote changes with limit
  const handleQuoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 110) {
      setCustomQuote(val);
      setQuoteExceeded(false);
    } else {
      setQuoteExceeded(true);
    }
  };

  // Pre-generate social media text caption
  const handleCopyCaption = () => {
    const progress = Math.round(progressPercentage);
    const quoteTxt = customQuote ? `\n\n💬 "${customQuote}"` : '';
    const speedTxt = showSpeed && pagesPerDay > 0 ? `\n🚀 Ritmo: ${pagesPerDay} páginas/dia` : '';
    const daysTxt = showDays && daysReading > 0 ? `\n📅 Acompanhando há ${daysReading} dias` : '';

    const text = `Meu progresso atual de leitura! 📚✨

📖 Obra: "${book.title}" de ${authorName}
📊 Status: ${progress}% concluído (${book.currentPage || 0}/${book.pages} pág)${speedTxt}${daysTxt}${quoteTxt}

Acompanhem seus hábitos literários também com a Bibliotech! 💫 #leituras #bibliotech #lendo #booksgram`;

    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  // Canvas Drawing Logic
  const handleDownload = () => {
    setIsDownloading(true);
    
    // Slight timeout to let user see spinner feedback
    setTimeout(() => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Card specs (High DPI support 2x scaled)
        const scale = 2.5; 
        const canvasWidth = layout === 'square' ? 1080 : 1080;
        const canvasHeight = layout === 'square' ? 1080 : 1920;

        canvas.width = canvasWidth * scale;
        canvas.height = canvasHeight * scale;
        ctx.scale(scale, scale);

        // --- DRAW BACKGROUND ---
        const theme = selectedTheme;
        const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        if (theme.bgGradients.length === 1) {
          ctx.fillStyle = theme.bgGradients[0];
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        } else {
          theme.bgGradients.forEach((color, idx) => {
            grad.addColorStop(idx / (theme.bgGradients.length - 1), color);
          });
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // Draw visual glow accents for dark themes
        if (theme.isDark) {
          ctx.beginPath();
          const radGrad = ctx.createRadialGradient(
            canvasWidth * 0.2, canvasHeight * 0.2, 0,
            canvasWidth * 0.2, canvasHeight * 0.2, canvasWidth * 0.6
          );
          radGrad.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
          radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = radGrad;
          ctx.arc(canvasWidth * 0.2, canvasHeight * 0.2, canvasWidth * 0.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          const radGrad2 = ctx.createRadialGradient(
            canvasWidth * 0.8, canvasHeight * 0.8, 0,
            canvasWidth * 0.8, canvasHeight * 0.8, canvasWidth * 0.7
          );
          radGrad2.addColorStop(0, `${theme.accentColor}22`);
          radGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = radGrad2;
          ctx.arc(canvasWidth * 0.8, canvasHeight * 0.8, canvasWidth * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }

        // Helper function for wrapping text
        const wrapText = (text: string, maxWidth: number) => {
          const words = text.split(' ');
          let line = '';
          const lines = [];
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);
          return lines;
        };

        // --- RENDER SQUARE LAYOUT (1:1) ---
        if (layout === 'square') {
          // --- DRAW GLASSMORPHIC CARD BODY ---
          ctx.fillStyle = theme.isDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.65)';
          ctx.strokeStyle = theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
          ctx.lineWidth = 1.5;
          
          // Draw card body with rounded corners
          const cx = 80;
          const cy = 80;
          const cw = canvasWidth - 160;
          const ch = canvasHeight - 160;
          const radius = 32;

          ctx.beginPath();
          ctx.moveTo(cx + radius, cy);
          ctx.lineTo(cx + cw - radius, cy);
          ctx.quadraticCurveTo(cx + cw, cy, cx + cw, cy + radius);
          ctx.lineTo(cx + cw, cy + ch - radius);
          ctx.quadraticCurveTo(cx + cw, cy + ch, cx + cw - radius, cy + ch);
          ctx.lineTo(cx + radius, cy + ch);
          ctx.quadraticCurveTo(cx, cy + ch, cx, cy + ch - radius);
          ctx.lineTo(cx, cy + radius);
          ctx.quadraticCurveTo(cx, cy, cx + radius, cy);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // BRAND WATERMARK 
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'black 14px "Inter", "Segoe UI", sans-serif';
          ctx.fillText('⚡ BIBLIOTECH', cx + 45, cy + 65);

          ctx.fillStyle = theme.subtextColor;
          ctx.font = 'bold 11px "Inter", "Segoe UI", sans-serif';
          ctx.fillText(customSubtitle.toUpperCase(), cx + 45, cy + 90);

          // DRAW COV MOCK (Left Side of Card)
          const cvX = cx + 45;
          const cvY = cy + 130;
          const cvW = 280;
          const cvH = 410;
          const cvRadius = 16;

          // Cover Shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
          ctx.shadowBlur = 30;
          ctx.shadowOffsetX = 10;
          ctx.shadowOffsetY = 15;

          // Mock Cover Background Graphic
          const covGrad = ctx.createLinearGradient(cvX, cvY, cvX + cvW, cvY + cvH);
          covGrad.addColorStop(0, '#312e81'); // Indigo-900
          covGrad.addColorStop(0.5, '#1e1b4b'); 
          covGrad.addColorStop(1, '#0f172a'); // Slate-900
          ctx.fillStyle = covGrad;

          ctx.beginPath();
          ctx.moveTo(cvX + cvRadius, cvY);
          ctx.lineTo(cvX + cvW - cvRadius, cvY);
          ctx.quadraticCurveTo(cvX + cvW, cvY, cvX + cvW, cvY + cvRadius);
          ctx.lineTo(cvX + cvW, cvY + cvH - cvRadius);
          ctx.quadraticCurveTo(cvX + cvW, cvY + cvH, cvX + cvW - cvRadius, cvY + cvH);
          ctx.lineTo(cvX + cvRadius, cvY + cvH);
          ctx.quadraticCurveTo(cvX, cvY + cvH, cvX, cvY + cvH - cvRadius);
          ctx.lineTo(cvX, cvY + cvRadius);
          ctx.quadraticCurveTo(cvX, cvY, cvX + cvRadius, cvY);
          ctx.closePath();
          ctx.fill();

          // Reset Shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Book spine details (simulation of curve)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(cvX + 15, cvY, 4, cvH);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(cvX + 19, cvY, 6, cvH);

          // Book cover ornaments
          ctx.fillStyle = 'rgba(251, 191, 36, 0.15)'; // Amber gold accents
          ctx.beginPath();
          ctx.arc(cvX + cvW/2, cvY + 90, 48, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Mini abstract bookmark lines
          ctx.strokeRect(cvX + 35, cvY + 35, cvW - 70, cvH - 75);

          // Draw Typography on Mock Cover
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fef3c7'; // Gold text of title
          ctx.font = 'italic italic bold 18px "Georgia", "Playfair Display", serif';
          const innerTitleLines = wrapText(book.title, cvW - 80);
          innerTitleLines.slice(0, 3).forEach((lineStr, lineIdx) => {
            ctx.fillText(lineStr.trim(), cvX + cvW/2, cvY + 200 + (lineIdx * 24));
          });

          ctx.fillStyle = '#d4d4d8';
          ctx.font = 'bold 11px "Inter", sans-serif';
          ctx.fillText(authorName.toUpperCase(), cvX + cvW/2, cvY + 355);

          // --- BOOK DETAILS & STATISTICS (Right Side) ---
          ctx.textAlign = 'left';
          
          // Book Title
          ctx.fillStyle = theme.textColor;
          ctx.font = 'italic bold 32px "Georgia", "Playfair Display", serif';
          const mainTitleLines = wrapText(book.title, cw - cvW - 120);
          mainTitleLines.slice(0, 2).forEach((line, idx) => {
            ctx.fillText(line.trim(), cx + cvW + 90, cy + 180 + (idx * 40));
          });

          // Book Author
          ctx.fillStyle = theme.subtextColor;
          ctx.font = 'bold 15px "Inter", "Segoe UI", sans-serif';
          ctx.fillText(authorName, cx + cvW + 90, cy + 255);

          // Reading progress percentages
          ctx.fillStyle = theme.textColor;
          ctx.font = 'black 62px "Inter", sans-serif';
          ctx.fillText(`${Math.round(progressPercentage)}%`, cx + cvW + 90, cy + 340);
          
          ctx.fillStyle = theme.subtextColor;
          ctx.font = 'bold 11px "Inter", sans-serif';
          ctx.fillText('CONCLUÍDO', cx + cvW + 270, cy + 332);

          // Progress Track Bar
          const prgX = cx + cvW + 90;
          const prgY = cy + 370;
          const prgW = cw - cvW - 130;
          const prgH = 12;

          ctx.fillStyle = theme.isDark ? '#334155' : '#e2e8f0';
          ctx.beginPath();
          ctx.roundRect(prgX, prgY, prgW, prgH, 6);
          ctx.fill();

          ctx.fillStyle = theme.accentColor;
          ctx.beginPath();
          ctx.roundRect(prgX, prgY, Math.max(12, prgW * (progressPercentage / 100)), prgH, 6);
          ctx.fill();

          // Stat boxes
          ctx.fillStyle = theme.highlightCardBg;
          ctx.strokeStyle = theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
          
          const statsY = cy + 415;
          const boxW = prgW;
          const boxH = 105;

          ctx.beginPath();
          ctx.roundRect(prgX, statsY, boxW, boxH, 16);
          ctx.fill();
          ctx.stroke();

          // Fill values inside highlight box
          ctx.textAlign = 'center';
          const statItemW = boxW / statsList.length;
          statsList.forEach((stat, idx) => {
            const itemCenterX = prgX + (statItemW * idx) + (statItemW / 2);
            
            ctx.fillStyle = theme.subtextColor;
            ctx.font = 'bold 9px "Inter", sans-serif';
            ctx.fillText(stat.label.toUpperCase(), itemCenterX, statsY + 38);

            ctx.fillStyle = theme.textColor;
            ctx.font = 'black 14px "Inter", sans-serif';
            ctx.fillText(stat.value, itemCenterX, statsY + 68);

            // vertical divider
            if (idx < statsList.length - 1) {
              ctx.lineWidth = 1;
              ctx.strokeStyle = theme.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
              ctx.beginPath();
              ctx.moveTo(prgX + (statItemW * (idx + 1)), statsY + 20);
              ctx.lineTo(prgX + (statItemW * (idx + 1)), statsY + boxH - 20);
              ctx.stroke();
            }
          });

          // Draw custom quote if specified
          if (customQuote.trim()) {
            const quoteY = cy + 560;
            ctx.textAlign = 'center';
            ctx.fillStyle = theme.textColor;
            ctx.font = 'italic bold 15px "Georgia", serif';
            
            const quoteLines = wrapText(`"${customQuote.trim()}"`, cw - 90);
            quoteLines.slice(0, 3).forEach((qLine, qIdx) => {
              ctx.fillText(qLine.trim(), cx + cw/2, quoteY + (qIdx * 25));
            });
          }

          // Footer user avatar + signature
          const footY = cy + ch - 40;
          ctx.textAlign = 'right';
          ctx.fillStyle = theme.subtextColor;
          ctx.font = 'bold 11px "Inter", sans-serif';
          ctx.fillText(`Compartilhado por ${profile?.fullName || 'Leitor Devoto'}`, cx + cw - 45, footY);

          // Left side footer signature
          ctx.textAlign = 'left';
          ctx.fillStyle = theme.isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.35)';
          ctx.font = 'medium italic 10px "Inter", sans-serif';
          ctx.fillText('Gerado via bibliotech.app 🌠', cx + 45, footY);
        }

        // --- RENDER STORIES PORTRAIT LAYOUT (9:16) ---
        else {
          // Inner frame decoration
          ctx.strokeStyle = 'rgba(255,255,255, 0.08)';
          ctx.lineWidth = 2;
          ctx.strokeRect(30, 30, canvasWidth - 60, canvasHeight - 60);

          // Top Branding Watermark
          ctx.fillStyle = theme.accentColor;
          ctx.font = 'black 16px "Inter", "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚡ BIBLIOTECH', canvasWidth / 2, 110);

          ctx.fillStyle = theme.subtextColor;
          ctx.font = 'bold 12px "Inter", "Segoe UI", sans-serif';
          ctx.fillText(customSubtitle.toUpperCase(), canvasWidth / 2, 140);

          // CENTERED BOOK COVER MOCK (large)
          const cvW = 460;
          const cvH = 680;
          const cvX = (canvasWidth - cvW) / 2;
          const cvY = 220;
          const cvRadius = 24;

          // Shadow for gorgeous floating effect
          ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          ctx.shadowBlur = 45;
          ctx.shadowOffsetX = 12;
          ctx.shadowOffsetY = 24;

          // Draw book cover structure
          const covGrad = ctx.createLinearGradient(cvX, cvY, cvX + cvW, cvY + cvH);
          covGrad.addColorStop(0, '#111827'); // dark background
          covGrad.addColorStop(0.4, '#1e1b4b');
          covGrad.addColorStop(1, '#020617');
          ctx.fillStyle = covGrad;

          ctx.beginPath();
          ctx.moveTo(cvX + cvRadius, cvY);
          ctx.lineTo(cvX + cvW - cvRadius, cvY);
          ctx.quadraticCurveTo(cvX + cvW, cvY, cvX + cvW, cvY + cvRadius);
          ctx.lineTo(cvX + cvW, cvY + cvH - cvRadius);
          ctx.quadraticCurveTo(cvX + cvW, cvY + cvH, cvX + cvW - cvRadius, cvY + cvH);
          ctx.lineTo(cvX + cvRadius, cvY + cvH);
          ctx.quadraticCurveTo(cvX, cvY + cvH, cvX, cvY + cvH - cvRadius);
          ctx.lineTo(cvX, cvY + cvRadius);
          ctx.quadraticCurveTo(cvX, cvY, cvX + cvRadius, cvY);
          ctx.closePath();
          ctx.fill();

          // Reset shadows immediately
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Curved 3D spine simulation
          ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.fillRect(cvX + 22, cvY, 5, cvH);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(cvX + 27, cvY, 8, cvH);

          // Vintage inner frames
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cvX + 45, cvY + 45, cvW - 90, cvH - 90);

          // Abstract cover art circles/stars
          ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
          ctx.beginPath();
          ctx.arc(cvX + cvW/2, cvY + 150, 68, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Type details Inside Cover
          ctx.textAlign = 'center';
          
          // Cover book Title
          ctx.fillStyle = '#fef3c7'; // luxury gold palette
          ctx.font = 'italic italic bold 28px "Georgia", serif';
          const innerTitleLines = wrapText(book.title, cvW - 120);
          innerTitleLines.slice(0, 3).forEach((lineStr, lineIdx) => {
            ctx.fillText(lineStr.trim(), cvX + cvW/2, cvY + 340 + (lineIdx * 34));
          });

          // Cover Author
          ctx.fillStyle = '#d4d4d8';
          ctx.font = 'bold 14px "Inter", sans-serif';
          ctx.fillText(authorName.toUpperCase(), cvX + cvW/2, cvY + 580);

          // UNDER COVER: REAL STATISTICS BOARD
          // Book Title (Header)
          ctx.fillStyle = theme.textColor;
          ctx.font = 'italic bold 36px "Georgia", "Playfair Display", serif';
          ctx.textAlign = 'center';
          const outerTitleLines = wrapText(book.title, canvasWidth - 160);
          outerTitleLines.slice(0, 2).forEach((line, idx) => {
            ctx.fillText(line.trim(), canvasWidth / 2, 980 + (idx * 45));
          });

          // Author Name
          ctx.fillStyle = theme.subtextColor;
          ctx.font = 'bold 16px "Inter", sans-serif';
          ctx.fillText(authorName, canvasWidth / 2, 1075);

          // Large percentage callout
          ctx.font = 'black 84px "Inter", sans-serif';
          ctx.fillStyle = theme.textColor;
          ctx.fillText(`${Math.round(progressPercentage)}%`, canvasWidth / 2, 1180);

          ctx.font = 'black 11px "Inter", sans-serif';
          ctx.fillStyle = theme.accentColor;
          ctx.fillText('CONCLUÍDO DA OBRA', canvasWidth / 2, 1215);

          // Progress Track Bar
          const prgW = canvasWidth - 280;
          const prgX = (canvasWidth - prgW) / 2;
          const prgY = 1240;
          const prgH = 14;

          ctx.fillStyle = theme.isDark ? '#1e293b' : '#cbd5e1';
          ctx.beginPath();
          ctx.roundRect(prgX, prgY, prgW, prgH, 7);
          ctx.fill();

          ctx.fillStyle = theme.accentColor;
          ctx.beginPath();
          ctx.roundRect(prgX, prgY, Math.max(14, prgW * (progressPercentage / 100)), prgH, 7);
          ctx.fill();

          // Statistics rows underneath layout
          const statYBase = 1300;
          const gridBoxW = canvasWidth - 200;
          const gridBoxX = (canvasWidth - gridBoxW) / 2;
          const gridBoxH = 180;

          // Card Background
          ctx.fillStyle = theme.highlightCardBg;
          ctx.strokeStyle = theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0,0,0,0.05)';
          ctx.beginPath();
          ctx.roundRect(gridBoxX, statYBase, gridBoxW, gridBoxH, 24);
          ctx.fill();
          ctx.stroke();

          // Stats inside card layout (vertical rows)
          statsList.forEach((stat, idx) => {
            const itemRowY = statYBase + 30 + (idx * 45);
            ctx.textAlign = 'left';
            ctx.fillStyle = theme.subtextColor;
            ctx.font = 'bold 11px "Inter", sans-serif';
            ctx.fillText(stat.label.toUpperCase(), gridBoxX + 40, itemRowY + 12);

            ctx.textAlign = 'right';
            ctx.fillStyle = theme.textColor;
            ctx.font = 'black 16px "Inter", sans-serif';
            ctx.fillText(stat.value, gridBoxX + gridBoxW - 40, itemRowY + 12);

            // tiny horizontal dot structure separator
            if (idx < statsList.length - 1) {
              ctx.strokeStyle = theme.isDark ? 'rgba(255,255,255, 0.06)' : 'rgba(0,0,0,0.06)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(gridBoxX + 30, itemRowY + 30);
              ctx.lineTo(gridBoxX + gridBoxW - 30, itemRowY + 30);
              ctx.stroke();
            }
          });

          // Draw custom quotes inside free area
          if (customQuote.trim()) {
            const quoteY = 1530;
            ctx.textAlign = 'center';
            ctx.fillStyle = theme.textColor;
            ctx.font = 'italic italic bold 18px "Georgia", "Times New Roman", serif';
            
            const quoteLines = wrapText(`"${customQuote.trim()}"`, canvasWidth - 180);
            quoteLines.slice(0, 3).forEach((qLine, qIdx) => {
              ctx.fillText(qLine.trim(), canvasWidth / 2, quoteY + (qIdx * 28));
            });
          }

          // Footer info
          const footY = canvasHeight - 90;
          ctx.textAlign = 'center';
          ctx.fillStyle = theme.subtextColor;
          ctx.font = 'bold 12px "Inter", sans-serif';
          ctx.fillText(`Lido e Compartilhado por: ${profile?.fullName || 'Leitor bibliotech'}`, canvasWidth / 2, footY);

          ctx.fillStyle = theme.isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.3)';
          ctx.font = 'medium italic 11px "Inter", sans-serif';
          ctx.fillText('gerado com amor via bibliotech.app 🌌', canvasWidth / 2, footY + 28);
        }

        // --- EXPORT AS IMAGE FILE DOWNLOAD ---
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `progresso_${book.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.png`;
        link.href = dataUrl;
        link.click();

      } catch (err) {
        logger.error('Canvas Generation Error:', err);
      } finally {
        setIsDownloading(false);
      }
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 25 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-2xl p-6 md:p-8 max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header (Top banner inside split grid) */}
        <div className="col-span-full border-b border-slate-100 dark:border-slate-800 pb-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black font-serif text-slate-900 dark:text-white italic">
              Compartilhar Progresso
            </h3>
            <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Gere um card visual customizado para Instagram Feed, Stories ou WhatsApp
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-400 hover:text-red-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* LEFT COLUMN: INTERACTIVE LIVE PREVIEW */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/40 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/80">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Pré-Visualização do Card
          </span>

          {/* Interactive Responsive Card component based on state selectors */}
          <div className="w-full flex justify-center items-center overflow-hidden">
            <div
              className={`relative shadow-2xl transition-all duration-500 select-none overflow-hidden ${selectedTheme.previewClass} ${
                layout === 'square'
                  ? 'aspect-square w-full max-w-[360px] rounded-[1.8rem] p-6 flex flex-col justify-between'
                  : 'aspect-[9/16] w-full max-w-[270px] rounded-[1.8rem] p-5 flex flex-col justify-between'
              }`}
            >
              {/* Subtle visual lighting glows */}
              {selectedTheme.isDark && (
                <>
                  <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
                </>
              )}

              {layout === 'square' ? (
                // --- SQUARE CARD RENDER ---
                <>
                  {/* Top stamp */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: selectedTheme.accentColor }}>
                        ⚡ BIBLIOTECH
                      </span>
                      <p className="text-[7px] font-bold opacity-60 tracking-widest mt-0.5">{customSubtitle.toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Body elements */}
                  <div className="grid grid-cols-12 gap-4 my-auto items-center">
                    {/* Mock Book cover */}
                    <div className="col-span-5 relative">
                      <div className="aspect-[3/4.5] w-full rounded-lg bg-gradient-to-br from-indigo-950 to-slate-900 border border-white/5 shadow-xl p-3 flex flex-col justify-between overflow-hidden">
                        {/* Book spline layout */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10" />
                        <div className="absolute left-1 top-0 bottom-0 w-1.5 bg-black/35" />
                        
                        {/* Ornaments */}
                        <div className="border border-amber-500/20 rounded h-full w-full p-1.5 flex flex-col justify-between text-center">
                          <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto mt-2" />
                          <div>
                            <p className="text-[8px] font-serif font-black italic text-amber-100/90 leading-tight line-clamp-2">
                              {book.title}
                            </p>
                            <p className="text-[6px] font-bold text-slate-400 mt-1 uppercase tracking-wider truncate">
                              {authorName}
                            </p>
                          </div>
                          <div className="text-[5px] text-amber-500/45 tracking-widest">✦ ✦ ✦</div>
                        </div>
                      </div>
                    </div>

                    {/* Book text metrics */}
                    <div className="col-span-7 space-y-3">
                      <div>
                        <h4 className="text-sm font-black font-serif italic tracking-tight line-clamp-2 leading-tight">
                          {book.title}
                        </h4>
                        <p className="text-[8px] font-bold opacity-65 tracking-wider mt-0.5 uppercase">
                          {authorName}
                        </p>
                      </div>

                      {/* Percentage badge */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black">{Math.round(progressPercentage)}%</span>
                        <span className="text-[7px] font-black opacity-60 uppercase tracking-widest">Concluído</span>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full bg-white/10 dark:bg-black/25 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progressPercentage}%`,
                            backgroundColor: selectedTheme.accentColor,
                          }}
                        />
                      </div>

                      {/* Tiny Stat items list */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                        {statsList.slice(0, 2).map((st, i) => (
                          <div key={i} className="bg-white/5 dark:bg-black/10 px-2 py-1 rounded border border-white/5">
                            <span className="block text-[5px] uppercase font-bold opacity-50 tracking-wider truncate">{st.label}</span>
                            <span className="text-[8px] font-black tracking-normal truncate block">{st.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer area */}
                  {customQuote.trim() && (
                    <p className="text-[8px] font-serif italic text-center opacity-95 line-clamp-1 border-t border-white/5 pt-2">
                      "{customQuote.trim()}"
                    </p>
                  )}

                  <div className="flex justify-between items-center text-[6px] opacity-40 border-t border-white/5 pt-2">
                    <span>@bibliotech_app 🌠</span>
                    <span>Compartilhado no leitor digital</span>
                  </div>
                </>
              ) : (
                // --- STORIES PORTRAIT RENDER ---
                <>
                  {/* Top stamp branding */}
                  <div className="text-center pt-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: selectedTheme.accentColor }}>
                      ⚡ BIBLIOTECH
                    </span>
                    <p className="text-[7px] font-black opacity-60 tracking-wider mt-0.5">{customSubtitle.toUpperCase()}</p>
                  </div>

                  {/* Large cover mock in portrait style */}
                  <div className="my-auto py-2 flex flex-col items-center">
                    <div className="aspect-[3/4.5] w-[110px] rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-white/5 shadow-2xl p-4 flex flex-col justify-between overflow-hidden relative">
                      {/* Spine detail */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10" />
                      <div className="absolute left-1 top-0 bottom-0 w-1.5 bg-black/40" />

                      {/* Ornaments */}
                      <div className="border border-amber-500/20 rounded-md h-full w-full p-2 flex flex-col justify-between text-center">
                        <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto mt-2" />
                        <div>
                          <p className="text-[9px] font-serif font-black italic text-amber-100/90 leading-tight line-clamp-3">
                            {book.title}
                          </p>
                          <p className="text-[7px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider truncate">
                            {authorName}
                          </p>
                        </div>
                        <div className="text-[6px] text-amber-400/40 tracking-widest">✦ ✦ ✦</div>
                      </div>
                    </div>

                    {/* Book Metadata details underneath card cover */}
                    <div className="text-center mt-4 w-full px-2">
                      <h4 className="text-sm font-black font-serif italic line-clamp-2 leading-snug">
                        {book.title}
                      </h4>
                      <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-1">
                        {authorName}
                      </p>

                      <div className="my-2.5">
                        <span className="text-2xl font-black block leading-none">{Math.round(progressPercentage)}%</span>
                        <span className="text-[6px] font-black tracking-widest opacity-50 block mt-1 uppercase">concluído</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-white/10 dark:bg-black/25 rounded-full h-1 overflow-hidden my-3">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progressPercentage}%`,
                            backgroundColor: selectedTheme.accentColor,
                          }}
                        />
                      </div>

                      {/* Stacked statistics columns */}
                      <div className="space-y-1 bg-white/5 dark:bg-black/20 p-2 rounded-xl border border-white/5">
                        {statsList.slice(0, 3).map((st, i) => (
                          <div key={i} className="flex justify-between items-center text-[7px]">
                            <span className="opacity-50 uppercase tracking-wider">{st.label}</span>
                            <span className="font-black" style={{ color: selectedTheme.accentColor }}>{st.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footers */}
                  <div className="space-y-2 border-t border-white/5 pt-2">
                    {customQuote.trim() && (
                      <p className="text-[8px] font-serif italic text-center opacity-90 line-clamp-2">
                        "{customQuote.trim()}"
                      </p>
                    )}
                    <div className="text-center text-[6px] opacity-40">
                      <span>gerado em bibliotech.app 🌠</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONFIGURATOR CONTROLS */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Aspect Form selection */}
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-2.5">
                1. Formato de Saída (Layout)
              </span>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setLayout('square')}
                  className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                    layout === 'square'
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  </svg>
                  Feed Quadrado (1:1)
                </button>
                <button
                  type="button"
                  onClick={() => setLayout('story')}
                  className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                    layout === 'story'
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  </svg>
                  Stories / Retrato (9:16)
                </button>
              </div>
            </div>

            {/* Themes selections */}
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-2.5">
                2. Visual Estético (Temas)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setActiveTheme(theme.id)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      theme.previewClass
                    } ${
                      activeTheme === theme.id
                        ? 'border-primary scale-102 ring-2 ring-primary/20'
                        : 'border-slate-200/50 dark:border-slate-800 hover:border-primary/45'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider block truncate">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom metadata overrides */}
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                3. Informações & Textos
              </span>

              {/* Subheading text input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-400">Subtítulo Superior</label>
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none border border-slate-200/50 dark:border-slate-700 focus:border-primary uppercase"
                  placeholder="EX: LENDO NESTE FIM DE SEMANA"
                />
              </div>

              {/* Toggle indicators */}
              <div className="grid grid-cols-2 gap-3.5">
                <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/40 dark:border-slate-700/50 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={showSpeed}
                    onChange={(e) => setShowSpeed(e.target.checked)}
                    className="rounded text-primary focus:ring-0 w-4 h-4"
                  />
                  <div>
                    <span className="block text-[9px] font-black uppercase text-slate-700 dark:text-slate-300">Mostrar Velocidade</span>
                    <span className="block text-[7px] text-slate-400">Média de páginas lidas por dia</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/40 dark:border-slate-700/50 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={showDays}
                    onChange={(e) => setShowDays(e.target.checked)}
                    className="rounded text-primary focus:ring-0 w-4 h-4"
                  />
                  <div>
                    <span className="block text-[9px] font-black uppercase text-slate-700 dark:text-slate-300">Exibir Dias</span>
                    <span className="block text-[7px] text-slate-400">Tempo ativo de leitura</span>
                  </div>
                </label>
              </div>

              {/* Personal quote/citation snippet overrides */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-[9px] font-black uppercase text-slate-400">Citação ou Nota Customizada</label>
                  <span className={`text-[8px] font-bold ${customQuote.length > 90 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {customQuote.length}/110 caracteres
                  </span>
                </div>
                <textarea
                  value={customQuote}
                  onChange={handleQuoteChange}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-slate-100 outline-none border border-slate-200/50 dark:border-slate-700 focus:border-primary resize-none h-20 placeholder:italic placeholder:opacity-50"
                  placeholder="Escreva uma frase de destaque do livro ou comentário pessoal sobre sua leitura..."
                />
                {quoteExceeded && (
                  <p className="text-[8px] font-bold text-red-500 uppercase tracking-wide">Citação muito longa para caber esteticamente no card.</p>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs: Download Card File and Copy text caption */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              type="button"
              className="w-full bg-slate-900 group dark:bg-white text-white dark:text-slate-950 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest leading-none outline-none transition-all active:scale-97 disabled:opacity-55 select-none shadow-xl flex items-center justify-center gap-2.5 hover:bg-primary dark:hover:bg-primary dark:hover:text-white"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white dark:border-slate-900/20 dark:border-t-slate-900 rounded-full animate-spin"></div>
                  Gerando Imagem HD...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Salvar Imagem do Card (PNG)
                </>
              )}
            </button>

            <button
              onClick={handleCopyCaption}
              type="button"
              className={`w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest leading-none outline-none transition-all active:scale-97 select-none border shadow-md flex items-center justify-center gap-2.5 ${
                copyFeedback
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {copyFeedback ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 animate-bounce">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Legenda Copiada!
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.252 2.252 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.346.102.637.31.806.619l.975 1.791c.244.448.462.91.659 1.381l.302.721c.216.516.326 1.07.323 1.628l-.055 9.07a2.25 2.25 0 0 1-2.247 2.235H6.757a2.25 2.25 0 0 1-2.247-2.235l-.055-9.07c-.003-.558.107-1.112.323-1.628L5.08 8.08c.197-.47.415-.933.659-1.381l.975-1.79c.169-.31.46-.518.806-.62" />
                  </svg>
                  Copiar Legenda Pronta para Redes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

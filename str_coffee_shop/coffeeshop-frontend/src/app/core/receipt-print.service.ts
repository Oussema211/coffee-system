import { Injectable } from '@angular/core';
import { OrderService, ReceiptDTO, OrderItemDTO } from './order.service';

@Injectable({ providedIn: 'root' })
export class ReceiptPrintService {
  private readonly printedBillIds = new Set<number>();

  constructor(private orderService: OrderService) {}

  printBill(orderId: number): boolean {
    // Open synchronously so browsers do not treat the receipt as an unwanted popup.
    const receiptWindow = window.open('', '_blank', 'width=420,height=700');
    if (!receiptWindow) {
      window.alert('The receipt window was blocked. Please allow popups for this POS site and try again.');
      return false;
    }

    receiptWindow.document.write('<p style="font-family: sans-serif; padding: 16px">Preparing receipt…</p>');
    this.orderService.getReceipt(orderId).subscribe({
      next: receipt => this.render(receiptWindow, receipt),
      error: () => {
        receiptWindow.document.body.innerHTML = '<p style="font-family: sans-serif; padding: 16px">Unable to load this receipt. Please try again.</p>';
      }
    });
    this.printedBillIds.add(orderId);
    return true;
  }

  wasPrinted(orderId: number): boolean {
    return this.printedBillIds.has(orderId);
  }

  private modifierLabel(item: OrderItemDTO): string {
    const parts: string[] = [];
    if (item.size) parts.push(item.size);
    if (item.sugar) parts.push(item.sugar);
    if (item.extraShots) parts.push('+' + item.extraShots + ' shot');
    return parts.join(' · ');
  }

  private render(receiptWindow: Window, receipt: ReceiptDTO): void {
    const esc = (value: string | number | null | undefined): string => String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    const money = (value: number): string => Number(value).toFixed(2);
    const rows = receipt.items.map(item => {
      const mods = this.modifierLabel(item);
      return `
      <tr>
        <td>${esc(item.qty)} × ${esc(item.name)}</td>
        <td class="amount">${money(item.price * item.qty)}</td>
      </tr>
      ${mods ? `<tr><td class="mods">${esc(mods)}</td></tr>` : ''}`;
    }).join('');
    const location = receipt.tableNumber ? `Table ${receipt.tableNumber}` : esc(receipt.orderType);

    const fiscalInfo = [
      receipt.shopMatricule ? `Matricule fiscale: ${esc(receipt.shopMatricule)}` : '',
      receipt.shopAddress ? esc(receipt.shopAddress) : '',
      receipt.shopPhone ? `Tel: ${esc(receipt.shopPhone)}` : ''
    ].filter(Boolean).map(line => `<div class="muted">${line}</div>`).join('');

    const vatRows = (receipt.vatBreakdown ?? []).map(line => `
      <tr>
        <td>TVA ${Number(line.rate).toFixed(0)}%</td>
        <td class="amount">HT ${money(line.base)}</td>
        <td class="amount">TVA ${money(line.vat)}</td>
      </tr>`).join('');

    receiptWindow.document.open();
    receiptWindow.document.write(`<!doctype html>
      <html><head><title>${esc(receipt.receiptNumber)}</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        * { box-sizing: border-box; }
        body { width: 72mm; margin: 0 auto; color: #111; font: 12px/1.35 Arial, sans-serif; }
        .center { text-align: center; } .logo { display: block; max-width: 36mm; max-height: 20mm; margin: 0 auto 5px; object-fit: contain; } h1 { font-size: 17px; margin: 0 0 5px; }
        .muted { color: #444; font-size: 11px; } .line { border-top: 1px dashed #222; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; } td { padding: 3px 0; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; } .total { font-size: 16px; font-weight: 700; }
        .mods { color: #555; font-size: 10px; padding-top: 0; }
        @media screen { body { padding: 12px; } }
      </style></head><body>
        <div class="center"><img class="logo" src="${window.location.origin}/logo_one.jpg" alt="${esc(receipt.shopName)} logo"><h1>${esc(receipt.shopName)}</h1><div class="muted">${esc(receipt.receiptNumber)}</div>${fiscalInfo}</div>
        <div class="line"></div>
        <div>${esc(location)} · ${esc(receipt.orderTime)}</div>
        ${receipt.workerName ? `<div>Server: ${esc(receipt.workerName)}</div>` : ''}
        <div class="line"></div><table>${rows}</table><div class="line"></div>
        ${vatRows ? `<table>${vatRows}</table><div class="line"></div>` : ''}
        <table>
          <tr><td>Subtotal HT</td><td class="amount">${money(receipt.totalExclVat ?? receipt.total)} TND</td></tr>
          ${vatRows ? `<tr><td>TVA totale</td><td class="amount">${money(receipt.totalVat ?? 0)} TND</td></tr>` : ''}
          <tr class="total"><td>TOTAL TTC</td><td class="amount">${money(receipt.total)} TND</td></tr>
        </table>
        <div class="line"></div><div class="center">${receipt.status === 'Completed' ? 'PAID' : 'BILL TO PAY'}<br><br>Thank you — Merci</div>
      </body></html>`);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  }
}

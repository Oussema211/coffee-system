import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.html'
})
export class Reports {
  weekSales = [
    { day: 'Mon', amount: 142 },
    { day: 'Tue', amount: 168 },
    { day: 'Wed', amount: 155 },
    { day: 'Thu', amount: 190 },
    { day: 'Fri', amount: 210 },
    { day: 'Sat', amount: 260 },
    { day: 'Sun', amount: 175 }
  ];

  topItems = [
    { name: 'Cappuccino', sold: 84 },
    { name: 'Espresso', sold: 71 },
    { name: 'Latte', sold: 63 },
    { name: 'Croissant', sold: 48 }
  ];

  get maxSales(): number {
    return Math.max(...this.weekSales.map(d => d.amount));
  }

  get weekTotal(): number {
    return this.weekSales.reduce((sum, d) => sum + d.amount, 0);
  }

  barHeight(amount: number): number {
    return Math.round((amount / this.maxSales) * 100);
  }
}
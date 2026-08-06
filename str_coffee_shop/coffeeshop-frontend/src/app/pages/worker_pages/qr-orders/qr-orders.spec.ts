import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrOrders } from './qr-orders';

describe('QrOrders', () => {
  let component: QrOrders;
  let fixture: ComponentFixture<QrOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrOrders],
    }).compileComponents();

    fixture = TestBed.createComponent(QrOrders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

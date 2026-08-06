import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkerDashboardComponent } from './worker-dashboard';

describe('WorkerDashboardComponent', () => {
  let component: WorkerDashboardComponent;
  let fixture: ComponentFixture<WorkerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkerDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

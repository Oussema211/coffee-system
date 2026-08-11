import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './loading.html',
  styleUrl: './loading.css'
})
export class LoadingComponent {
  @Input() size = 20;
  @Input() light = false;
  @Input() label = '';
}

import { Component, OnInit } from '@angular/core';
import { ToolbarService } from 'src/app/_services/toolbar-service/toolbar-service.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
})
export class ToolbarComponent implements OnInit {
  // Flugzeug-Zähler
  counterAircraft: number = 0;

  constructor(private toolbarService: ToolbarService) {
    // Aktualisiere Flugzeug-Zähler
    toolbarService.counterAircraft$.subscribe((counterAircraft) => {
      if (counterAircraft) {
        this.counterAircraft = counterAircraft;
      }
    });
  }

  ngOnInit(): void {}
}

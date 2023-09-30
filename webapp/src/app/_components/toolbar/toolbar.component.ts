import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ToolbarService } from 'src/app/_services/toolbar-service/toolbar-service.service';
import { dummyParentAnimation } from 'src/app/_common/animations';

@Component({
  selector: 'app-toolbar',
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
  animations: [dummyParentAnimation],
})
export class ToolbarComponent implements OnInit {
  // Boolean, ob System im DarkMode ist
  @Input() darkMode: boolean = false;

  // Flugzeug-Zähler
  counterAircraft: number = 0;

  // Subscriptions
  subscriptions: Subscription[] = [];

  constructor(private toolbarService: ToolbarService) {}

  ngOnInit(): void {
    // Initiierung der Abonnements
    this.initSubscriptions();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  /**
   * Initiierung der Abonnements
   */
  initSubscriptions() {
    // Aktualisiere Flugzeug-Zähler
    let sub1 = this.toolbarService.counterAircraft$
      .pipe()
      .subscribe((counterAircraft) => {
        this.counterAircraft = counterAircraft;
      });
    this.subscriptions.push(sub1);
  }
}

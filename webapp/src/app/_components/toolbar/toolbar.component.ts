import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToolbarService } from 'src/app/_services/toolbar-service/toolbar-service.service';

@Component({
  selector: 'app-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css'],
})
export class ToolbarComponent implements OnInit {
  // Boolean, ob System im DarkMode ist
  @Input() darkMode: boolean = false;

  // Flugzeug-Zähler
  counterAircraft: number = 0;

  private ngUnsubscribe = new Subject();

  constructor(private toolbarService: ToolbarService) {}

  ngOnInit(): void {
    // Initiierung der Abonnements
    this.initSubscriptions();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Initiierung der Abonnements
   */
  initSubscriptions() {
    // Aktualisiere Flugzeug-Zähler
    this.toolbarService.counterAircraft$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((counterAircraft) => {
        this.counterAircraft = counterAircraft;
      });
  }
}
